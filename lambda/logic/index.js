const https = require('https')

exports.handler = async function (event) {
    console.log(event)
    const response = {
        statusCode: 200,
        body: JSON.stringify('Hello from Logic!'),
    }
    return response
}


// function postMsg(msg) {
//     // Load the AWS SDK for Node.js
//     var AWS = require('aws-sdk');
//     AWS.config.update({ region: 'REGION' });
//     var sqs = new AWS.SQS({ apiVersion: '2012-11-05' });

//     var params = {
//         // Remove DelaySeconds parameter and value for FIFO queues
//         DelaySeconds: 10,
//         MessageAttributes: {
//             "Title": {
//                 DataType: "String",
//                 StringValue: "The Whistler"
//             },
//             "Author": {
//                 DataType: "String",
//                 StringValue: "John Grisham"
//             },
//             "WeeksOn": {
//                 DataType: "Number",
//                 StringValue: "6"
//             }
//         },
//         MessageBody: "Information about current NY Times fiction bestseller for week of 12/11/2016.",
//         // MessageDeduplicationId: "TheWhistler",  // Required for FIFO queues
//         // MessageGroupId: "Group1",  // Required for FIFO queues
//         QueueUrl: "SQS_QUEUE_URL"
//     };

//     sqs.sendMessage(params, function (err, data) {
//         if (err) {
//             console.log("Error", err);
//         } else {
//             console.log("Success", data.MessageId);
//         }
//     });
// }