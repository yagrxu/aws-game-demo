const async = require('async')
var MongoClient = require('mongodb').MongoClient
const AWSXRay = require('aws-xray-sdk')
const AWS = AWSXRay.captureAWS(require('aws-sdk'))
const {
  ApiGatewayManagementApiClient,
  PostToConnectionCommand
} = require('@aws-sdk/client-apigatewaymanagementapi')
const process = require('process')

var mongodbUri = process.env.MONGODB_ATLAS_URI

const delayedQueueUrl = process.env.DELAYED_QUEUE_URL
const playerTableName = process.env.PLAYER_TABLE_NAME
const gameSessionTableName = process.env.GAME_SESSION_TABLE_NAME
const defaultRegion = process.env.DEFAULT_REGION
const targets = randomTargets(2)
console.log(targets)
const sqs = initSqs()

exports.handler = function (event, context, callback) {
  context.callbackWaitsForEmptyEventLoop = false
  console.log(event)
  records = event['Records']
  handleEvents(records, callback)
}

function handleEvents (records, callback) {
  // event number is controlled in sqs by setting the batch size to 1.
  // Only 1 event will be triggered at a time
  if (records.length != 1) {
    return lambdaResponse(callback)
  }
  handleEvent(records[0], callback)
}
function lambdaResponse (callback) {
  const response = {
    statusCode: 200,
    body: JSON.stringify('Hello from Logic!')
  }
  console.log('response', response)
  callback(null, response)
}

function handleEvent (record, callback) {
  console.log('record:', record)
  body = JSON.parse(record.body)
  switch (body.action) {
    case 'start':
      console.log('action start')
      startGame(body, callback)
      break
    case 'newtargets':
      console.log('action newtargets')
      handleNewTargets(body, callback)
      break
    case 'stop':
      console.log('action stop')
      stopGame(body, callback)
      break
    case 'shoot':
      console.log('action shoot')
      handleShoot(body, callback)
      break
    default:
      return lambdaResponse(callback)
  }
}

function handleNewTargets (body, lambdaCallback) {
  console.log('body', body)
  let request = body.data
  updatedTargets = null
  MongoClient.connect(mongodbUri, function (connErr, client) {
    if (connErr) return lambdaResponse(lambdaCallback)
    let db = client.db('devax')
    async.waterfall(
      [
        function (callback) {
          console.log('read targets')
          readRecord(
            db,
            gameSessionTableName,
            [
              {
                name: 'roomId',
                value: request.roomId
              }
            ],
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
          if (data.running == 'false') {
            callback(new Error('already stopped'), null)
            return
          }
          console.log('update targets')
          updatedTargets = data.targets.concat(request.targets)
          updateRecord(
            db,
            gameSessionTableName,
            {
              $set: {
                targets: updatedTargets
              }
            },
            [
              {
                name: 'roomId',
                value: request.roomId
              }
            ],
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
              targets: randomTargets(2),
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
        lambdaResponse(lambdaCallback)
      }
    )
  })
}

function handleShoot (body, lambdaCallback) {
  shootItem = body
  MongoClient.connect(mongodbUri, function (connErr, client) {
    if (connErr) return lambdaResponse(lambdaCallback)
    let db = client.db('devax')
    async.waterfall(
      [
        function (callback) {
          console.log('get targets')
          readRecord(
            db,
            playerTableName,
            [
              {
                name: 'connectionId',
                value: shootItem.connectionId
              }
            ],
            function (err, data) {
              if (err) {
                console.log(err)
                callback(err, null)
              } else {
                console.log(data)
                shootItem.player = data.host
                callback(null, data)
              }
            }
          )
        },
        function (data, callback) {
          console.log(data)
          readRecord(
            db,
            gameSessionTableName,
            [
              {
                name: 'roomId',
                value: data.roomId
              }
            ],
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
          result = filterHit(data.targets, shootItem)
          existingTargets = result.targets
          shootItem.hit = result.hit
          if (result.hit.length > 0) {
            playerStatus = data.status
            playerStatus[shootItem.player] += result.hit.length
            data.status = playerStatus
          }
          data.targets = existingTargets
          let dataRecord = data
          updateRecord(
            db,
            gameSessionTableName,
            {
              $set: {
                status: data.status,
                targets: existingTargets
              }
            },
            [{ name: 'roomId', value: data.roomId }],
            function (err, data) {
              if (err) {
                console.log(err)
                callback(err, null)
              } else {
                console.log(dataRecord)
                callback(null, dataRecord)
              }
            }
          )
        },
        function (data, callback) {
          shootInfo = shootItem
          shootInfo.connectionIds = data.connectionIds
          shootInfo.stage = shootItem.stage
          shootInfo.domain = shootItem.domain
          shootInfo.hit = shootItem.hit
          console.log('shootInfo', shootInfo)
          updateShoot(shootInfo, function (err, data) {
            callback(err, data)
          })
        }
      ],
      function (err, result) {
        console.log(err, result)
        if (!err) {
          console.log('create ok')
        }
        lambdaResponse(lambdaCallback)
      }
    )
  })
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

function startGame (body, lambdaCallback) {
  let status = {
    0: 0,
    1: 0
  }
  MongoClient.connect(mongodbUri, function (connErr, client) {
    if (connErr) return lambdaResponse(lambdaCallback)
    let db = client.db('devax')
    async.waterfall(
      [
        function (callback) {
          console.log('update targets')
          updateRecord(
            db,
            gameSessionTableName,
            {
              $set: {
                targets: targets,
                status: status,
                running: 'true'
              }
            },
            [{ name: 'roomId', value: body.data.roomId }],
            callback
          )
        },
        function (data, callback) {
          sendDelayedNewTargets(
            {
              targets: randomTargets(2),
              domain: body.domain,
              stage: body.stage,
              ids: body.data.connectionIds,
              roomId: body.data.roomId
            },
            callback
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
                ids: body.data.connectionIds,
                roomId: body.data.roomId
              }
            }),
            63,
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
        lambdaResponse(lambdaCallback)
      }
    )
  })
}

function stopGame (body, lambdaCallback) {
  MongoClient.connect(mongodbUri, function (connErr, client) {
    if (connErr) return lambdaResponse(lambdaCallback)
    let db = client.db('devax')
    async.waterfall(
      [
        function (callback) {
          console.log('get player status', body)
          readRecord(
            db,
            gameSessionTableName,
            [
              {
                name: 'roomId',
                value: body.data.roomId
              }
            ],
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
          let record = data
          updateRecord(
            db,
            gameSessionTableName,
            {
              $set: {
                running: 'false'
              }
            },
            [
              {
                name: 'roomId',
                value: data.roomId
              }
            ],
            function (err, data) {
              if (err) {
                callback(err, null)
              } else {
                callback(null, record)
              }
            }
          )
        },
        function (data, callback) {
          playerStatus = data.status
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
        lambdaResponse(lambdaCallback)
      }
    )
  })
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
  ids = body.data.connectionIds
  console.log(ids)
  items = enhanceTargets(ids, targets, client)
  async.each(items, notifyStart, function (err) {
    handleResult(err, 'sendStart all', callback)
  })
}

function sendTargetUpdate (request, callback) {
  const domain = request.domain
  const stage = request.stage
  console.log(domain, stage, request)

  const callbackUrl = `https://${domain}/${stage}`
  const client = new ApiGatewayManagementApiClient({ endpoint: callbackUrl })
  let ids = request.ids
  console.log(ids)
  items = enhanceTargets(ids, request.targets, client)
  async.each(items, notifyNewTargets, function (err) {
    handleResult(err, 'sendTargetUpdate all', callback)
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
  ids = data.ids
  console.log(ids)
  items = enhanceStop(ids, data, client)
  async.each(items, notifyStop, function (err) {
    handleResult(err, 'sendStop all', callback)
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
    handleResult(err, 'notifyShoot all', callback)
  })
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

function notifyStart (item, callback) {
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
    handleResult(err, data, callback)
  })
}

function notifyNewTargets (item, callback) {
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
      return callback(err, null)
    }
    callback(err, data)
  })
}

function notifyStop (item, callback) {
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
      return callback(err, null)
    }
    callback(err, data)
  })
}

function notifyShoot (item, callback) {
  console.log('notifyShoot', item)
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
    handleResult(err, data, callback)
  })
}

function getRandomInt (size) {
  return Math.floor(Math.random() * (size * 2 + 1)) - size
}

function randomTargets (number) {
  ret = []
  for (let i = 0; i < number; i++) {
    x = getRandomInt(5)
    y = getRandomInt(3) + 1
    ret.push({ x: x, y: y, id: Math.abs(getRandomInt(5000)) })
  }
  return ret
}

function updateRecord (db, collectionName, content, keys, callback) {
  db.collection(collectionName).updateOne(
    formQuery(keys),
    content,
    function (err, result) {
      handleResult(err, content, callback)
    }
  )
}

function insertRecord (db, collectionName, content, callback) {
  db.collection(collectionName).insertOne(content, function (err, result) {
    handleResult(err, content, callback)
  })
}

function readRecord (db, collectionName, keys, callback) {
  // Call DynamoDB to add the item to the table
  db.collection(collectionName)
    .find(formQuery(keys))
    .toArray(function (err, result) {
      handleResult(err, result[0], callback)
    })
}

function formQuery (keys) {
  var query = {}
  for (let i = 0; i < keys.length; i++) {
    var key = keys[i]
    query[key.name] = key.value
  }
  return query
}

function initSqs () {
  // Set the region
  AWS.config.update({ region: defaultRegion })

  // Create an SQS service object
  return new AWS.SQS({ apiVersion: '2012-11-05' })
}

function sendDelayedMessage (sqs, queueUrl, message, delay, callback) {
  var params = {
    DelaySeconds: delay,
    MessageAttributes: {},
    MessageBody: message,
    QueueUrl: queueUrl
  }

  sqs.sendMessage(params, function (err, data) {
    handleResult(err, data, callback)
  })
}

function handleResult (err, result, callback) {
  if (err != null) {
    console.error('an error occurred', err)
    callback(err, JSON.stringify(err))
  } else {
    console.log(result)
    callback(null, result)
  }
}
