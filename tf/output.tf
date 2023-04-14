output "demo_connect_wss_url" {
  value = aws_apigatewayv2_stage.demo_stage.invoke_url
}

output "arn" {
  value = aws_lambda_function.lambda_connect.invoke_arn
}

output "mongodb_url" {
  value = mongodbatlas_cluster.demo.connection_strings[0].standard_srv
}

# output "mongodb_urls" {
#   value = mongodbatlas_cluster.demo.connection_strings[0]
# }

# output "fifo_queue" {
#   value = aws_sqs_queue.fifo_queue.url
# }

# output "delay_queue" {
#   value = aws_sqs_queue.delay_queue.url
# }
