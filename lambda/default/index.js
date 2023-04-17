'use strict'
const async = require('async')
var MongoClient = require('mongodb').MongoClient
const AWS = require('aws-sdk')
const process = require('process')
var mongodbUri = process.env.MONGODB_ATLAS_URI
const fifoQueueUrl = process.env.FIFO_QUEUE_URL
const fifoQueueGroupId = process.env.FIFO_QUEUE_GROUP_ID
const playerTableName = process.env.PLAYER_TABLE_NAME
const gameSessionTableName = process.env.GAME_SESSION_TABLE_NAME
const defaultRegion = process.env.DEFAULT_REGION
const sqs = initSqs()
const enableLog = process.env['LOG_ENABLED'] || false

exports.handler = function (event, context, callback) {
  context.callbackWaitsForEmptyEventLoop = false
  if (event['requestContext']) {
    handleAction(event, context, callback)
  } else if (event['Records']) {
    handleMessages(event, callback)
  }
}

function lambdaResponse (callback) {
  const response = {
    statusCode: 200,
    body: JSON.stringify('Hello from Default!')
  }
  callback(null, response)
}

function handleAction (event, context, callback) {
  let request = JSON.parse(event['body'])
  let connectionId = event['requestContext']['connectionId']
  const domain = event.requestContext.domainName
  const stage = event.requestContext.stage
  if (!isNull(request) && !isNull(request['action'])) {
    switch (request['action']) {
      case 'create':
        createRoom(connectionId, request['room'], context, callback)
        break
      case 'join':
        joinRoom(connectionId, request['room'], domain, stage, callback)
        break
      case 'shoot':
        proceedShooting(request, connectionId, domain, stage, callback)
        break
      default:
        break
    }
  } else {
    lambdaResponse(callback)
  }
}

function handleMessages (event, callback) {
  let records = event.Records
  for (let i = 0; i < records.length; i++) {
    let record = records[i]
    let request = JSON.parse(record['body'])
    if (!isNull(request) && !isNull(request['action'])) {
      switch (request['action']) {
        case 'newtargets':
          proceedNewTargets(request.data, callback)
          break
        case 'stop':
          proceedStop(request.data, callback)
          break
        default:
          break
      }
    } else {
      lambdaResponse(callback)
    }
  }
}

function proceedStop (request, lambdaCallback) {
  async.waterfall(
    [
      function (callback) {
        sendFifoMessage(
          sqs,
          fifoQueueUrl,
          JSON.stringify({
            data: request,
            action: 'stop'
          }),
          function (err, data) {
            if (err) {
              callback(err, null)
            } else {
              callback(null, data)
            }
          }
        )
      }
    ],
    function (err, result) {
      lambdaResponse(lambdaCallback)
    }
  )
}

function proceedNewTargets (request, lambdaCallback) {
  async.waterfall(
    [
      function (callback) {
        sendFifoMessage(
          sqs,
          fifoQueueUrl,
          JSON.stringify({
            data: request,
            action: 'newtargets'
          }),
          function (err, data) {
            if (err) {
              callback(err, null)
            } else {
              callback(null, data)
            }
          }
        )
      }
    ],
    function (err, result) {
      lambdaResponse(lambdaCallback)
    }
  )
}

function proceedShooting (request, connectionId, domain, stage, lambdaCallback) {
  let shootInfo = request
  shootInfo.connectionId = connectionId
  shootInfo.domain = domain
  shootInfo.stage = stage
  async.waterfall(
    [
      function (callback) {
        sendFifoMessage(
          sqs,
          fifoQueueUrl,
          JSON.stringify(shootInfo),
          function (err, data) {
            if (err) {
              callback(err, null)
            } else {
              callback(null, data)
            }
          }
        )
      }
    ],
    function (err, result) {
      lambdaResponse(lambdaCallback)
    }
  )
}

function createRoom (connectionId, roomName, context, lambdaCallback) {
  context.callbackWaitsForEmptyEventLoop = false
  MongoClient.connect(mongodbUri, function (connErr, client) {
    if (connErr) return lambdaResponse(lambdaCallback)
    let db = client.db('devax')

    async.waterfall(
      [
        function (callback) {
          insertRecord(
            db,
            playerTableName,
            {
              connectionId: connectionId,
              roomId: roomName,
              host: '0'
            },
            function (err, data) {
              callback(err, data)
            }
          )
        },
        function (data, callback) {
          insertRecord(
            db,
            gameSessionTableName,
            {
              roomId: roomName,
              connectionIds: [connectionId]
            },
            function (err, data) {
              callback(err, data)
            }
          )
        }
      ],
      function (err, result) {
        lambdaResponse(lambdaCallback)
      }
    )
  })
}

function joinRoom (connectionId, roomId, domain, stage, lambdaCallback) {
  MongoClient.connect(mongodbUri, function (connErr, client) {
    if (connErr) return lambdaResponse(lambdaCallback)
    let db = client.db('devax')
    async.waterfall(
      [
        function (callback) {
          insertRecord(
            db,
            playerTableName,
            {
              connectionId: connectionId,
              roomId: roomId,
              host: '1'
            },
            function (err, data) {
              callback(err, data)
            }
          )
        },
        function (data, callback) {
          readRecord(
            db,
            gameSessionTableName,
            [
              {
                name: 'roomId',
                value: roomId
              }
            ],
            function (err, data) {
              callback(err, data)
            }
          )
        },
        function (data, callback) {
          let participants = data['connectionIds']
          participants.push(connectionId)
          updateRecord(
            db,
            gameSessionTableName,
            {
              $set: {
                connectionIds: participants
              }
            },
            [{ name: 'roomId', value: roomId }],
            function (err, data) {
              callback(err, data)
            }
          )
        },
        function (data, callback) {
          readRecord(
            db,
            gameSessionTableName,
            [
              {
                name: 'roomId',
                value: roomId
              }
            ],
            function (err, data) {
              callback(err, data)
            }
          )
        },
        function (data, callback) {
          sendFifoMessage(
            sqs,
            fifoQueueUrl,
            JSON.stringify({
              data: data,
              action: 'start',
              domain: domain,
              stage: stage
            }),
            callback
          )
        }
      ],
      function (err, result) {
        lambdaResponse(lambdaCallback)
      }
    )
  })
}

function isNull (value) {
  return value == null
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

function handleResult (err, result, callback) {
  if (err != null) {
    console.error('an error occurred', err)
    callback(err, JSON.stringify(err))
  } else {
    callback(null, result)
  }
}

function initSqs () {
  // Set the region
  AWS.config.update({ region: defaultRegion })

  // Create an SQS service object
  return new AWS.SQS({ apiVersion: '2012-11-05' })
}

function sendFifoMessage (sqs, queueUrl, message, callback) {
  var params = {
    // Remove DelaySeconds parameter and value for FIFO queues
    // DelaySeconds: 10,
    MessageAttributes: {},
    MessageBody: message,
    MessageDeduplicationId: Math.random() * 100 + '', // Required for FIFO queues
    MessageGroupId: fifoQueueGroupId, // Required for FIFO queues
    QueueUrl: queueUrl
  }

  sqs.sendMessage(params, function (err, data) {
    callback(err, data)
  })
}

function log (...args) {
  console.log(args)
}

// createRoom("12345", "yagrxu")
// joinRoom("54321", "yagrxu")
