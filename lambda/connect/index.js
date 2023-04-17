exports.handler = async function (event) {
  const response = {
    statusCode: 200,
    body: JSON.stringify('Hello from Connect!')
  }
  return response
}
