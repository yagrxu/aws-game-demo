const https = require('https')

exports.handler = async function (event) {
    console.log(event)
    const response = {
        statusCode: 200,
        body: JSON.stringify('Hello from Connect!'),
    }
    return response
}

// * 玩家在创建房间的时候，建立和API Gateway的WebSocket长连接，并基于Header传输房间ID。Lambda Auth & $connect把房间ID写入DynamoDB并返回验证成功
// * 玩家在加入房间的时候，建立和API Gateway的WebSocket长连接，并基于Header传输房间ID。Lambda Auth查询DynamoDB，如果房间存在则返回验证成功，游戏开始
// * 游戏开始时Lambda，还需要向SQS with Delay写入延迟事件：X秒后生成蚊子，X秒后游戏结束


function createRoom(connectionId, roomName){

}

function joinRoom(connectionId, roomName){

}

function initDynamoDB() {
    var AWS = require('aws-sdk');
    // Set the region 
    AWS.config.update({ region: defaultRegion });

    // Create an SQS service object
    return new AWS.DynamoDB({ apiVersion: '2012-08-10' });
}

function updateRecord(ddb, tableName, content, callback) {
    var params = {
        TableName: tableName,
        Item: content
    };

    // Call DynamoDB to add the item to the table
    ddb.putItem(params, function (err, data) {
        callback(err, data)
    });
}

function initSqs() {
    var AWS = require('aws-sdk');
    // Set the region 
    AWS.config.update({ region: defaultRegion });

    // Create an SQS service object
    return new AWS.SQS({ apiVersion: '2012-11-05' });
}

function sendDelayedMessage(sqs, queueUrl, message, callback) {

    var params = {
        // Remove DelaySeconds parameter and value for FIFO queues
        DelaySeconds: 10,
        MessageAttributes: {
            "Title": {
                DataType: "String",
                StringValue: "The Whistler"
            },
            "Author": {
                DataType: "String",
                StringValue: "John Grisham"
            },
            "WeeksOn": {
                DataType: "Number",
                StringValue: "6"
            }
        },
        MessageBody: message,
        // MessageDeduplicationId: "TheWhistler",  // Required for FIFO queues
        // MessageGroupId: "Group1",  // Required for FIFO queues
        QueueUrl: queueUrl
    };

    sqs.sendMessage(params, function (err, data) {
        callback(err, data)
    });
}
