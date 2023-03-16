const https = require('https')

exports.handler = async function (event) {
    console.log(event)
    const response = {
        statusCode: 200,
        body: JSON.stringify('Hello from Logic!'),
    }
    return response
}

