const async = require('async')
var MongoClient = require('mongodb').MongoClient

const playerTableName = process.env.PLAYER_TABLE_NAME
const gameSessionTableName = process.env.GAME_SESSION_TABLE_NAME
var mongodbUri = process.env.MONGODB_ATLAS_URI

exports.handler = function (event, context, callback) {
  context.callbackWaitsForEmptyEventLoop = false
  connectionId = event.requestContext.connectionId
  cleanup(connectionId, callback)
}

function lambdaResponse (callback) {
  const response = {
    statusCode: 200,
    body: JSON.stringify('Hello from Disconnect!')
  }
  callback(null, response)
}

function cleanup (connectionId, lambdaCallback) {
  var roomId
  MongoClient.connect(mongodbUri, function (connErr, client) {
    if (connErr) return lambdaResponse(lambdaCallback)
    let db = client.db('devax')
    async.waterfall(
      [
        function (callback) {
          readRecord(
            db,
            playerTableName,
            [
              {
                name: 'connectionId',
                value: connectionId
              }
            ],
            function (err, data) {
              callback(err, data)
            }
          )
        },
        function (data, callback) {
          if (!data) {
            callback(new Error('no item found'), null)
            return
          }
          roomId = data.roomId
          deleteRecords(
            db,
            playerTableName,
            [{ name: 'roomId', value: roomId }],
            function (err, data) {
              callback(err, null)
            }
          )
        },
        function (data, callback) {
          deleteRecords(
            db,
            gameSessionTableName,
            [{ name: 'roomId', value: roomId }],
            function (err, data) {
              callback(err, null)
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

function deleteRecords (db, collectionName, keys, callback) {
  db.collection(collectionName).deleteMany(
    formQuery(keys),
    function (err, result) {
      handleResult(err, null, callback)
    }
  )
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
    console.error('an error occurred in createDoc', err)
    callback(null, JSON.stringify(err))
  } else {
    callback(null, result)
  }
}
