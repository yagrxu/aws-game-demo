const async = require("async")
const process = require("process")

defaultRegion = "ap-southeast-1"
enableLog = process.env["LOG_ENABLED"] || false
exports.handler = function (event) {
    console.log(event)
    handleAction(event)
    const response = {
        statusCode: 200,
        body: JSON.stringify('Hello from Default!'),
    }
    return response
}


// * 玩家在创建房间的时候，建立和API Gateway的WebSocket长连接，并基于Header传输房间ID。Lambda Auth & $connect把房间ID写入DynamoDB并返回验证成功
// * 玩家在加入房间的时候，建立和API Gateway的WebSocket长连接，并基于Header传输房间ID。Lambda Auth查询DynamoDB，如果房间存在则返回验证成功，游戏开始
// * 游戏开始时Lambda，还需要向SQS with Delay写入延迟事件：X秒后生成蚊子，X秒后游戏结束

function handleAction(event) {
    request = JSON.parse(event["body"])
    connectionId = event["requestContext"]["connectionId"]

    if (!isNull(request) && !isNull(request["action"])) {
        switch (request["action"]) {
            case "create":
                console.log("create")
                createRoom(connectionId, request["room"])
                break
            case "join":
                console.log("join")
                const domain = event.requestContext.domainName
                const stage = event.requestContext.stage
                joinRoom(connectionId, request["room"], domain, stage)
                
                break
            default:
                console.log("default")
                break
        }
    }
    else {
        console.log(request)
        console.log(isNull(request))
        console.log(isNull(request.action))
    }
}

function createRoom(connectionId, roomName) {
    ddb = initDynamoDB()
    async.waterfall([
        function (callback) {
            console.log("updatetable")
            updateRecord(ddb, "PlayerTable", {
                'connectionId': { S: connectionId },
                'roomId': { S: roomName }
            }, function (err, data) {
                if (err) {
                    console.log(err)
                    callback(err, null)
                }
                else {
                    console.log(data)
                    callback(null, data)
                }
            })
        }
        ,
        function (data, callback) {
            console.log("updateanothertable")
            updateRecord(ddb, "GameSessionTable", {
                'roomId': { S: roomName },
                'connectionIds': { S: JSON.stringify([connectionId]) }
            }, function (err, data) {
                if (err) {
                    console.log(err)
                    callback(err, null)
                }
                else {
                    console.log(data)
                    callback(null, data)
                }
            })
        }

    ], function (err, result) {
        console.log(err)
        console.log(result)
        if (!err) {
            console.log("updated ok")
        }
    })
    console.log("finished")
}

function joinRoom(connectionId, roomName, domain, stage) {
    ddb = initDynamoDB()
    sqs = initSqs()
    async.waterfall([
        function (callback) {
            updateRecord(ddb, "PlayerTable", {
                'connectionId': { S: connectionId },
                'roomId': { S: roomName }
            }, function (err, data) {
                if (err) {
                    callback(err, null)
                }
                else {
                    callback(null, data)
                }
            })
        },
        function (data, callback) {
            readRecord(ddb, "GameSessionTable", {
                'roomId': { S: roomName }
            }, function (err, data) {
                if (err) {
                    callback(err, null)
                }
                else {
                    callback(null, data.Item)
                }
            })
        },
        function (data, callback) {
            participants = JSON.parse(data["connectionIds"]["S"])
            participants.push(connectionId)
            updateRecord(ddb, "GameSessionTable", {
                'roomId': { S: roomName },
                'connectionIds': { S: JSON.stringify(participants) },
                'targets': {S: JSON.stringify(randomTargets())}
            }, function (err, data) {
                if (err) {
                    callback(err, null)
                }
                else {
                    callback(null, data)
                }
            })
        },
        function (data, callback) {
            readRecord(ddb, "GameSessionTable", {
                'roomId': { S: roomName }
            }, function (err, data) {
                if (err) {
                    callback(err, null)
                }
                else {
                    callback(null, data.Item)
                }
            })
        },
        function (data, callback) {
            sendFifoMessage(sqs, "https://sqs.ap-southeast-1.amazonaws.com/613477150601/game-demo.fifo", JSON.stringify({
                "data": data,
                "domain": domain,
                "stage": stage
            }), callback)
        }
    ], function (err, result) {
        console.log(err)
        console.log(result)
        if (!err) {
            console.log("updated join ok")
        }
    })
}

function randomTargets(){
    return [{"x":10, "y":15, "id":"10-15"}]
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

    ddb.putItem(params, function (err, data) {
        callback(err, data)
    });
}

function isNull (value) {  
    return value == null
}


function readRecord(ddb, tableName, keys, callback) {
    var params = {
        TableName: tableName,
        Key: keys
    };

    ddb.getItem(params, function (err, data) {
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

// function sendDelayedMessage(sqs, queueUrl, message, callback) {

//     var params = {
//         // Remove DelaySeconds parameter and value for FIFO queues
//         DelaySeconds: 2,
//         MessageAttributes: {},
//         MessageBody: message,
//         // MessageDeduplicationId: "TheWhistler",  // Required for FIFO queues
//         // MessageGroupId: "Group1",  // Required for FIFO queues
//         QueueUrl: queueUrl
//     };

//     sqs.sendMessage(params, function (err, data) {
//         callback(err, data)
//     });
// }

function sendFifoMessage(sqs, queueUrl, message, callback) {

    var params = {
        // Remove DelaySeconds parameter and value for FIFO queues
        // DelaySeconds: 10,
        MessageAttributes: {
        },
        MessageBody: message,
        MessageDeduplicationId: Math.random() * 100 + "",  // Required for FIFO queues
        MessageGroupId: "Group1",  // Required for FIFO queues
        QueueUrl: queueUrl
    };

    sqs.sendMessage(params, function (err, data) {
        callback(err, data)
    });
}

// function log(...args){
//     console.log(args)
// }

// createRoom("12345", "yagrxu")
// joinRoom("54321", "yagrxu")

