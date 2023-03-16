const https = require('https')

exports.handler = async function (event) {
    console.log(event)
    const response = {
        statusCode: 200,
        body: JSON.stringify('Hello from Disconnect!'),
    }
    return response
}



function initDynamoDB() {
    var AWS = require('aws-sdk');
    // Set the region 
    AWS.config.update({ region: defaultRegion });

    // Create an SQS service object
    return new AWS.DynamoDB({ apiVersion: '2012-08-10' });
}

function deleteRecord(ddb, tableName, keys, callback) {
    var params = {
        TableName: tableName,
        Key: keys,
    };

    // Call DynamoDB to add the item to the table
    ddb.deleteItem(params, function (err, data) {
        callback(err, data)
    });
}

function deleteRecords(ddb, tableName, keys, callback) {
    var params = {
        RequestItems:{
        }
    };
    params.RequestItems[tableName] = []
    for(i = 0; i < keys.length; i ++){
        params.RequestItems[tableName].push({
            "DeleteRequest":{
                "Key": keys[i]
            }
        })
    }

    // Call DynamoDB to add the item to the table
    ddb.batchWriteItem(params, function (err, data) {
        callback(err, data)
    });
}
