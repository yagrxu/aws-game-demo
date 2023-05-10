// init dynamodb client, using aws, defaultRegion as argument
function initDynamodbClient (aws, defaultRegion) {
  // Set the region
  aws.config.update({ region: defaultRegion })

  // Create an DynamoDB service object
  return new aws.DynamoDB({ apiVersion: '2012-08-10' })
}

// get record from DynamoDB table with ddbClient, tableName, keys and callback as arguments
function readRecord (ddbClient, tableName, keys, callback) {
  // create params object
  var params = {
    TableName: tableName,
    Key: keys
  }

  // get item from dynamodb table
  ddbClient.getItem(params, function (err, data) {
    handleDynamoDbResponse(err, data, callback)
  })
}

// update item in dynamodb table with updateRecord as function name, using ddbClient, tableName, item and callback as arguments
function updateRecord (ddbClient, tableName, item, callback) {
  // create params object
  var params = {
    TableName: tableName,
    Item: item
  }

  // update item in dynamodb table
  ddbClient.putItem(params, function (err, data) {
    handleDynamoDbResponse(err, data, callback)
  })
}

// delete item in dynamodb table with deleteRecord as function name, using ddbClient, tableName, keys and callback as arguments
function deleteRecord (ddbClient, tableName, keys, callback) {
  // create params object
  var params = {
    TableName: tableName,
    Key: keys
  }

  // delete item in dynamodb table
  ddbClient.deleteItem(params, function (err, data) {
    handleDynamoDbResponse(err, data, callback)
  })
}

// batch delete item in dynamodb table with deleteRecords as function name, using ddbClient, tableName, keys and callback as arguments
function deleteRecords (ddbClient, tableName, keys, callback) {
  var params = {
    RequestItems: {}
  }
  params.RequestItems[tableName] = []
  for (i = 0; i < keys.length; i++) {
    params.RequestItems[tableName].push({
      DeleteRequest: {
        Key: keys[i]
      }
    })
  }

  ddbClient.batchWriteItem(params, function (err, data) {
    handleDynamoDbResponse(err, data, callback)
  })
}

function handleDynamoDbResponse (err, data, callback) {
  if (err) {
    console.log(err)
    callback(err, null)
  } else {
    console.log(data)
    callback(null, data)
  }
}

// export function putItem
module.exports = {
  initDynamodbClient: initDynamodbClient,
  readRecord: readRecord,
  updateRecord: updateRecord,
  deleteRecord: deleteRecord,
  deleteRecords: deleteRecords
}
