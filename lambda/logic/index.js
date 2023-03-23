const { ApiGatewayManagementApiClient, PostToConnectionCommand } = require("@aws-sdk/client-apigatewaymanagementapi");

exports.handler = async function (event) {
    console.log(event)
    records = event["Records"]
    for (let i = 0; i < records.length; i ++) {
      record = records[i]
      body = JSON.parse(record.body)
      const domain = body.domain
      const stage = body.stage
      console.log(domain, stage, body)
      
      const callbackUrl = `https://${domain}/${stage}`
      const client = new ApiGatewayManagementApiClient({ endpoint: callbackUrl })
      ids = JSON.parse(body.data.connectionIds.S)
      console.log(ids)
      for (let j = 0; j < ids.length; j ++) {
        const id = ids[j]
        console.log(id)
        const requestParams = {
          ConnectionId: id,
          Data: JSON.stringify({ type: 'game start', msg: '{"targets":[{"x":10, "y":15, "id":"10-15"}]}' }),
        }
      
        const command = new PostToConnectionCommand(requestParams)
      
        try {
          await client.send(command)
        } catch (error) {
          console.log(error)
        }
      }
    }
    return {
      statusCode: 200
    }
}


async function demo(){
    const domain = "70uogn0zz6.execute-api.ap-southeast-1.amazonaws.com"
    const stage = "demo"
    const connectionId = "CPJGacNByQ0CHoA="
    const callbackUrl = `https://${domain}/${stage}`
    const client = new ApiGatewayManagementApiClient({
        endpoint: callbackUrl,
        region: "ap-southeast-1"
    })
  
    const requestParams = {
      ConnectionId: connectionId,
      Data: JSON.stringify({ type: 'game start', msg: '{"targets":[{"x":10, "y":15, "id":"10-15"}]}' }),
    }
  
    const command = new PostToConnectionCommand(requestParams)
  
    try {
      await client.send(command)
    } catch (error) {
      console.log(error)
    }
  
    return {
      statusCode: 200
    }
}

demo()