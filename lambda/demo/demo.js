'use strict'
var MongoClient = require('mongodb').MongoClient
const async = require('async')
let atlas_connection_uri

const mongodbUrl = process.env.MONGODB_ATLAS_URI
exports.handler = (event, context, callback) => {
  var uri = process.env.MONGODB_ATLAS_URI
  context.callbackWaitsForEmptyEventLoop = false
  console.log('atlas_connection_uri', uri)
  if (atlas_connection_uri != null) {
    processEvent(event, context, callback)
  } else {
    atlas_connection_uri = uri
    processEvent(event, context, callback)
  }
}

function processEvent (event, context, callback) {
  var jsonContents = JSON.parse(JSON.stringify(event))
  try {
    MongoClient.connect(mongodbUrl, function (err, client) {
      console.log('connected')
      if (err) {
        console.log(`the error is ${err}.`, err)
        process.exit(1)
      }
      db = client.db('devax')
      collectionName = 'demo'
      async.waterfall(
        [
          function (callback) {
            createDoc(
              db,
              collectionName,
              {
                id: 123,
                data: 'hello world'
              },
              callback
            )
          },
          function (data, callback) {
            readRecord(db, collectionName, [{ name: id, value: 123 }], callback)
          }
        ],
        function (err, result) {
          console.log(err)
          console.log(result)
          if (!err) {
            console.log('updated ok')
          }
        }
      )
    })
  } catch (err) {
    console.error('an error occurred', err)
  }
}

function createDoc (db, collectionName, json, callback) {
  db.collection(collectionName).insertOne(json, function (err, result) {
    if (err != null) {
      console.error('an error occurred in createDoc', err)
      callback(null, JSON.stringify(err))
    } else {
      var message = `Kudos! You just created an entry into the restaurants collection with id: ${result.insertedId}`
      console.log(message)
      callback(null, message)
    }
  })
}

function readRecord (db, collectionName, keys, callback) {
  // Call DynamoDB to add the item to the table
  var query = {}
  for (let i = 0; i < keys.length; i++) {
    var key = keys[i]
    query[key.name] = key.value
  }
  db.collection(collectionName)
    .find(query)
    .toArray(function (err, result) {
      if (err) {
        callback(err, 'not found')
      }
      console.log(result)
      callback(null, result[0])
    })
}
