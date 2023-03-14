output "demo_connect_wss_url" {
  value = aws_apigatewayv2_stage.demo_stage.invoke_url
}

output "arn" {
  value = aws_lambda_function.lambda_connect.invoke_arn
}