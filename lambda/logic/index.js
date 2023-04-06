const async = require('async')
const AWSXRay = require('aws-xray-sdk')
const AWS = AWSXRay.captureAWS(require('aws-sdk'))
const {
  ApiGatewayManagementApiClient,
  PostToConnectionCommand
} = require('@aws-sdk/client-apigatewaymanagementapi')

// const fifoQueueUrl = process.env.FIFO_QUEUE_URL
const delayedQueueUrl = process.env.DELAYED_QUEUE_URL
// const fifoQueueGroupId = process.env.FIFO_QUEUE_GROUP_ID
const playerTableName = process.env.PLAYER_TABLE_NAME
const gameSessionTableName = process.env.GAME_SESSION_TABLE_NAME
const defaultRegion = process.env.DEFAULT_REGION
const targets = randomTargets(2)
console.log(targets)
const sqs = initSqs()
const ddb = initDynamoDB()

exports.handler = function (event) {
  console.log(event)
  records = event['Records']
  for (let i = 0; i < records.length; i++) {
    record = records[i]
    handleEvent(record)
  }

  const response = {
    statusCode: 200,
    body: JSON.stringify('Hello from Logic!')
  }
  return response
}

function handleEvent (record) {
  console.log('record:', record)
  body = JSON.parse(record.body)
  switch (body.action) {
    case 'start':
      console.log('action start')
      startGame(body)
      break
    case 'newtargets':
      console.log('action newtargets')
      handleNewTargets(body)
      break
    case 'stop':
      console.log('action stop')
      stopGame(body)
      break
    case 'shoot':
      console.log('action shoot')
      handleShoot(body)
      break
    default:
      break
  }
}

function handleNewTargets (body) {
  console.log('body', body)
  let request = body.data
  updatedTargets = null
  //body.data.targets = { S: JSON.stringify() }
  async.waterfall(
    [
      function (callback) {
        console.log('read targets')
        readRecord(
          ddb,
          gameSessionTableName,
          {
            roomId: { S: request.roomId }
          },
          function (err, data) {
            if (err) {
              console.log(err)
              callback(err, null)
            } else {
              console.log(data)
              callback(null, data.Item)
            }
          }
        )
      },
      function (data, callback) {
        if (data.running.S == 'false') {
          callback(new Error('already stopped'), null)
        }
        console.log('update targets')
        updatedTargets = JSON.parse(data.targets.S).concat(
          JSON.parse(request.targets)
        )
        data.targets.S = JSON.stringify(updatedTargets)
        updateRecord(ddb, gameSessionTableName, data, function (err, data) {
          if (err) {
            console.log(err)
            callback(err, null)
          } else {
            console.log(data)
            callback(null, data)
          }
        })
      },
      function (data, callback) {
        sendDelayedNewTargets(
          {
            targets: JSON.stringify(randomTargets(2)),
            domain: request.domain,
            stage: request.stage,
            ids: request.ids,
            roomId: request.roomId
          },
          function (err, data) {
            if (err) {
              console.log(err)
              callback(err, null)
            } else {
              console.log(data)
              callback(null, data)
            }
          }
        )
      },
      function (data, callback) {
        sendTargetUpdate(request, function (err, data) {
          if (err) {
            console.log(err)
            callback(err, null)
          } else {
            console.log(data)
            callback(null, data)
          }
        })
      }
    ],
    function (err, result) {
      console.log(err, result)
      if (!err) {
        console.log('create ok')
      }
    }
  )
}

function handleShoot (body) {
  shootItem = body
  async.waterfall(
    [
      function (callback) {
        console.log('get targets')
        readRecord(
          ddb,
          playerTableName,
          {
            connectionId: { S: shootItem.connectionId }
          },
          function (err, data) {
            if (err) {
              console.log(err)
              callback(err, null)
            } else {
              console.log(data)
              shootItem.player = data.Item.host.N
              callback(null, data.Item)
            }
          }
        )
      },
      function (data, callback) {
        console.log(data)
        readRecord(
          ddb,
          gameSessionTableName,
          {
            roomId: { S: data.roomId.S }
          },
          function (err, data) {
            if (err) {
              console.log(err)
              callback(err, null)
            } else {
              console.log(data)
              callback(null, data.Item)
            }
          }
        )
      },
      function (data, callback) {
        result = filterHit(JSON.parse(data.targets.S), shootItem)
        existingTargets = result.targets
        shootItem.hit = result.hit
        if (result.hit.length > 0) {
          playerStatus = JSON.parse(data.status.S)
          playerStatus[shootItem.player] += result.hit.length
          data.status.S = JSON.stringify(playerStatus)
        }
        data.targets.S = JSON.stringify(existingTargets)
        dataRecord = data
        updateRecord(ddb, gameSessionTableName, data, function (err, data) {
          if (err) {
            console.log(err)
            callback(err, null)
          } else {
            console.log(dataRecord)
            callback(null, dataRecord)
          }
        })
      },
      function (data, callback) {
        shootInfo = shootItem
        shootInfo.connectionIds = JSON.parse(data.connectionIds.S)
        shootInfo.stage = shootItem.stage
        shootInfo.domain = shootItem.domain
        shootInfo.hit = shootItem.hit
        console.log('shootInfo', shootInfo)
        updateShoot(shootInfo, function (err, data) {
          if (err) {
            console.log(err)
            callback(err, null)
          } else {
            console.log(data)
            callback(null, data.Item)
          }
        })
      }
    ],
    function (err, result) {
      console.log(err, result)
      if (!err) {
        console.log('create ok')
      }
    }
  )
}

function filterHit (targets, shootInfo) {
  possibleHit = []
  ret = {
    targets: targets,
    hit: []
  }
  for (let i = 0; i < targets.length; i++) {
    if (
      canHitTarget(
        shootInfo.origin.x,
        shootInfo.origin.y,
        shootInfo.angle,
        targets[i].x,
        targets[i].y
      )
    ) {
      possibleHit.push(targets[i])
    }
  }
  console.log('possibleHit', possibleHit)
  if (possibleHit.length > 0) {
    pointToRemove = getNearestPoint(
      shootInfo.origin.x,
      shootInfo.origin.y,
      targets
    )
    console.log(pointToRemove)
    console.log(targets.filter(obj => obj.id !== pointToRemove.id))
    ret.hit.push(pointToRemove.id)
    ret.targets = targets.filter(obj => obj.id !== pointToRemove.id)
  }
  return ret
}

function canHitTarget (originX, originY, angle, targetX, targetY) {
  const slope = Math.tan(angle)
  const y_intercept = originY - slope * originX
  const distance =
    Math.abs(slope * targetX - targetY + y_intercept) /
    Math.sqrt(slope * slope + 1)
  return distance <= 2
}

function getNearestPoint (x, y, pointList) {
  let nearestPoint = null
  let minDistance = Number.MAX_VALUE
  for (let i = 0; i < pointList.length; i++) {
    const point = pointList[i]
    const distance = Math.sqrt((x - point.x) ** 2 + (y - point.y) ** 2)
    if (distance < minDistance) {
      minDistance = distance
      nearestPoint = point
    }
  }
  return nearestPoint
}

function startGame (body) {
  body.data.targets = { S: JSON.stringify(targets) }
  body.data.status = {
    S: JSON.stringify({
      0: 0,
      1: 0
    })
  }
  body.data.running = {
    S: 'true'
  }
  async.waterfall(
    [
      function (callback) {
        console.log('update targets')
        updateRecord(
          ddb,
          gameSessionTableName,
          body.data,
          function (err, data) {
            if (err) {
              console.log(err)
              callback(err, null)
            } else {
              console.log(data)
              callback(null, data)
            }
          }
        )
      },
      function (data, callback) {
        sendDelayedNewTargets(
          {
            targets: JSON.stringify(randomTargets(2)),
            domain: body.domain,
            stage: body.stage,
            ids: body.data.connectionIds.S,
            roomId: body.data.roomId.S
          },
          function (err, data) {
            if (err) {
              console.log(err)
              callback(err, null)
            } else {
              console.log(data)
              callback(null, data)
            }
          }
        )
      },
      function (data, callback) {
        console.log('send delayed stop', data)
        sendDelayedMessage(
          sqs,
          delayedQueueUrl,
          JSON.stringify({
            action: 'stop',
            data: {
              domain: body.domain,
              stage: body.stage,
              ids: body.data.connectionIds.S,
              roomId: body.data.roomId.S
            }
          }),
          65,
          function (err, data) {
            if (err) {
              callback(err, null)
            } else {
              callback(null, data)
            }
          }
        )
      },
      function (data, callback) {
        sendStart(body, function (err, data) {
          if (err) {
            console.log(err)
            callback(err, null)
          } else {
            console.log(data)
            callback(null, data)
          }
        })
      }
    ],
    function (err, result) {
      console.log(err, result)
      if (!err) {
        console.log('create ok')
      }
    }
  )
}

function stopGame (body) {
  async.waterfall(
    [
      function (callback) {
        console.log('get player status', body)
        readRecord(
          ddb,
          gameSessionTableName,
          {
            roomId: { S: body.data.roomId }
          },
          function (err, data) {
            if (err) {
              console.log(err)
              callback(err, null)
            } else {
              console.log(data)
              callback(null, data.Item)
            }
          }
        )
      },
      function (data, callback) {
        record = data
        record.running.S = 'false'
        updateRecord(ddb, gameSessionTableName, record, function (err, data) {
          if (err) {
            callback(err, null)
          } else {
            callback(null, record)
          }
        })
      },
      function (data, callback) {
        playerStatus = JSON.parse(data.status.S)
        body.data.winner = playerStatus['0'] >= playerStatus['1'] ? 0 : 1
        sendStop(body, function (err, data) {
          if (err) {
            console.log(err)
            callback(err, null)
          } else {
            console.log(data)
            callback(null, data)
          }
        })
      }
    ],
    function (err, result) {
      console.log(err, result)
      if (!err) {
        console.log('create ok')
      }
    }
  )
}

function sendDelayedNewTargets (data, callback) {
  console.log('send delayed new targets', data)
  sendDelayedMessage(
    sqs,
    delayedQueueUrl,
    JSON.stringify({
      action: 'newtargets',
      data: data
    }),
    10,
    callback
  )
}

function sendStart (body, callback) {
  const domain = body.domain
  const stage = body.stage
  console.log(domain, stage, body)

  const callbackUrl = `https://${domain}/${stage}`
  const client = new ApiGatewayManagementApiClient({ endpoint: callbackUrl })
  ids = JSON.parse(body.data.connectionIds.S)
  console.log(ids)
  items = enhanceTargets(ids, JSON.parse(body.data.targets.S), client)
  async.each(items, notifyStart, function (err) {
    if (err) {
      console.log(err)
      callback(err, null)
    } else {
      console.log('sendStart done')
      callback(null, 'done')
    }
  })
}

function sendTargetUpdate (request, callback) {
  const domain = request.domain
  const stage = request.stage
  console.log(domain, stage, request)

  const callbackUrl = `https://${domain}/${stage}`
  const client = new ApiGatewayManagementApiClient({ endpoint: callbackUrl })
  ids = JSON.parse(request.ids)
  console.log(ids)
  items = enhanceTargets(ids, JSON.parse(request.targets), client)
  async.each(items, notifyNewTargets, function (err) {
    if (err) {
      console.log(err)
      callback(err, null)
    } else {
      console.log('sendTargetUpdate done')
      callback(null, 'done')
    }
  })
}

function enhanceTargets (ids, targets, client) {
  items = []
  for (let i = 0; i < ids.length; i++) {
    items.push({
      id: ids[i],
      client: client,
      targets: targets
    })
  }
  return items
}

function sendStop (body, callback) {
  data = body.data
  const domain = data.domain
  const stage = data.stage
  console.log(domain, stage, data)

  const callbackUrl = `https://${domain}/${stage}`
  const client = new ApiGatewayManagementApiClient({ endpoint: callbackUrl })
  ids = JSON.parse(data.ids)
  console.log(ids)
  items = enhanceStop(ids, data, client)
  async.each(items, notifyStop, function (err) {
    if (err) {
      console.log(err)
      callback(err, null)
    } else {
      console.log('sendStop done')
      callback(null, 'done')
    }
  })
}

function enhanceStop (ids, data, client) {
  items = []
  for (let i = 0; i < ids.length; i++) {
    items.push({
      id: ids[i],
      client: client,
      winner: data.winner
    })
  }
  return items
}

function updateShoot (data, callback) {
  console.log('updateShoot data', data)
  const domain = data.domain
  const stage = data.stage
  console.log(domain, stage, data)

  const callbackUrl = `https://${domain}/${stage}`
  const client = new ApiGatewayManagementApiClient({ endpoint: callbackUrl })
  ids = data.connectionIds
  console.log(ids)
  items = enhanceShootInfo(ids, client, data)
  async.each(items, notifyShoot, function (err) {
    if (err) {
      console.log(err)
      callback(err, null)
    } else {
      console.log('updateShoot done')
      callback(null, 'done')
    }
  })
}

function enhanceIds (ids, client) {
  items = []
  for (let i = 0; i < ids.length; i++) {
    items.push({
      id: ids[i],
      client: client
    })
  }
  return items
}

function enhanceShootInfo (ids, client, data) {
  items = []
  for (let i = 0; i < ids.length; i++) {
    items.push({
      id: ids[i],
      client: client,
      player: data.player,
      hit: data.hit,
      origin: {
        x: data.origin.x,
        y: data.origin.y
      },
      angle: data.angle
    })
  }
  return items
}

function notifyStart (item, cb) {
  console.log('notify start', item.targets)
  const requestParams = {
    ConnectionId: item.id,
    Data: JSON.stringify({
      type: 'game start',
      msg: JSON.stringify({ targets: item.targets })
    })
  }
  const command = new PostToConnectionCommand(requestParams)
  item.client.send(command, function (err, data) {
    console.log(err, data)
    if (err) {
      return cb(err, null)
    }
    cb(null, data)
  })
}

function notifyNewTargets (item, cb) {
  console.log(item)
  const requestParams = {
    ConnectionId: item.id,
    Data: JSON.stringify({
      type: 'new target',
      msg: JSON.stringify({ targets: item.targets })
    })
  }
  const command = new PostToConnectionCommand(requestParams)
  item.client.send(command, function (err, data) {
    console.log(err, data)
    if (err) {
      return cb(err, null)
    }
    cb(err, data)
  })
}

function notifyStop (item, cb) {
  console.log(item)
  winner = { winner: item.winner }
  const requestParams = {
    ConnectionId: item.id,
    Data: JSON.stringify({
      type: 'game over',
      msg: JSON.stringify(winner)
    })
  }
  const command = new PostToConnectionCommand(requestParams)
  item.client.send(command, function (err, data) {
    console.log(err, data)
    if (err) {
      return cb(err, null)
    }
    cb(err, data)
  })
}

function notifyShoot (item, cb) {
  console.log(item)
  const requestParams = {
    ConnectionId: item.id,
    Data: JSON.stringify({
      type: 'player shoot',
      msg: JSON.stringify({
        hit: item.hit,
        player: item.player,
        origin: {
          x: item.origin.x,
          y: item.origin.y
        },
        angle: item.angle
      })
    })
  }
  const command = new PostToConnectionCommand(requestParams)
  item.client.send(command, function (err, data) {
    console.log(err, data)
    if (err) {
      return cb(err, null)
    }
    cb(err, data)
  })
}

function getRandomInt (size) {
  return Math.floor(Math.random() * (size * 2 + 1)) - size
}

function randomTargets (number) {
  ret = []
  for (let i = 0; i < number; i++) {
    x = getRandomInt(5)
    y = getRandomInt(5)
    ret.push({ x: x, y: y, id: Math.abs(getRandomInt(5000)) })
  }
  return ret
}

function initSqs () {
  // Set the region
  AWS.config.update({ region: defaultRegion })

  // Create an SQS service object
  return new AWS.SQS({ apiVersion: '2012-11-05' })
}

function initDynamoDB () {
  // Set the region
  AWS.config.update({ region: defaultRegion })

  // Create an DynamoDB service object
  return new AWS.DynamoDB({ apiVersion: '2012-08-10' })
}

function updateRecord (ddb, tableName, content, callback) {
  var params = {
    TableName: tableName,
    Item: content
  }

  ddb.putItem(params, function (err, data) {
    callback(err, data)
  })
}

function isNull (value) {
  return value == null
}

function readRecord (ddb, tableName, keys, callback) {
  var params = {
    TableName: tableName,
    Key: keys
  }

  ddb.getItem(params, function (err, data) {
    callback(err, data)
  })
}

function sendDelayedMessage (sqs, queueUrl, message, delay, callback) {
  var params = {
    DelaySeconds: delay,
    MessageAttributes: {},
    MessageBody: message,
    QueueUrl: queueUrl
  }

  sqs.sendMessage(params, function (err, data) {
    callback(err, data)
  })
}
