resource "aws_apigatewayv2_api" "ws_apigateway" {
  name                       = "ws-gateway-demo"
  protocol_type              = "WEBSOCKET"
  route_selection_expression = "$request.body.action"
}

resource "aws_apigatewayv2_route" "ws_apigateway_route" {
  api_id    = aws_apigatewayv2_api.ws_apigateway.id
  route_key = "$default"
  target    = "integrations/${aws_apigatewayv2_integration.default.id}"
}

resource "aws_apigatewayv2_route" "ws_apigateway_route_connect" {
  api_id             = aws_apigatewayv2_api.ws_apigateway.id
  route_key          = "$connect"
  authorization_type = "CUSTOM"
  authorizer_id      = aws_apigatewayv2_authorizer.ws_apigateway_authorizer.id
  target             = "integrations/${aws_apigatewayv2_integration.connect.id}"
}

resource "aws_apigatewayv2_authorizer" "ws_apigateway_authorizer" {
  api_id          = aws_apigatewayv2_api.ws_apigateway.id
  authorizer_type = "REQUEST"
  authorizer_uri  = aws_lambda_alias.game_demo_authorizer_alias_arn.invoke_arn
  # aws_lambda_function.lambda_authorizer.invoke_arn
  authorizer_credentials_arn = "arn:aws:iam::613477150601:role/apigw_lambda_trigger_role"
  identity_sources           = ["route.request.header.Auth"]
  name                       = "game-connect-authorizer"
}

resource "aws_apigatewayv2_route" "ws_apigateway_route_disconnect" {
  api_id    = aws_apigatewayv2_api.ws_apigateway.id
  route_key = "$disconnect"
  target    = "integrations/${aws_apigatewayv2_integration.disconnect.id}"
}

resource "aws_apigatewayv2_integration" "connect" {
  api_id           = aws_apigatewayv2_api.ws_apigateway.id
  integration_type = "AWS_PROXY"

  connection_type           = "INTERNET"
  credentials_arn           = aws_iam_role.apigw_trigger_lambda_role.arn
  content_handling_strategy = "CONVERT_TO_TEXT"
  description               = "Lambda demo"
  integration_method        = "POST"
  integration_uri           = aws_lambda_alias.game_demo_connect_alias_arn.invoke_arn
  passthrough_behavior      = "WHEN_NO_MATCH"

}

resource "aws_apigatewayv2_integration" "default" {
  api_id           = aws_apigatewayv2_api.ws_apigateway.id
  integration_type = "AWS_PROXY"

  connection_type           = "INTERNET"
  credentials_arn           = aws_iam_role.apigw_trigger_lambda_role.arn
  content_handling_strategy = "CONVERT_TO_TEXT"
  description               = "Lambda demo"
  integration_method        = "POST"
  integration_uri           = aws_lambda_alias.game_demo_default_alias_arn.invoke_arn
  passthrough_behavior      = "WHEN_NO_MATCH"
}



resource "aws_apigatewayv2_integration" "disconnect" {
  api_id           = aws_apigatewayv2_api.ws_apigateway.id
  integration_type = "AWS_PROXY"

  connection_type           = "INTERNET"
  credentials_arn           = aws_iam_role.apigw_trigger_lambda_role.arn
  content_handling_strategy = "CONVERT_TO_TEXT"
  description               = "Lambda demo"
  integration_method        = "POST"
  integration_uri           = aws_lambda_alias.game_demo_disconnect_alias_arn.invoke_arn
  passthrough_behavior      = "WHEN_NO_MATCH"
}

resource "aws_cloudwatch_log_group" "server_apigateway_log_group" {
  name = "server-apigateway-log-group"
}

resource "aws_apigatewayv2_stage" "demo_stage" {
  api_id        = aws_apigatewayv2_api.ws_apigateway.id
  name          = "demo"
  deployment_id = aws_apigatewayv2_deployment.ws_apigateway_deployment.id
  access_log_settings {
    destination_arn = aws_cloudwatch_log_group.server_apigateway_log_group.arn
    format          = "{ \"requestId\":\"$context.requestId\", \"ip\": \"$context.identity.sourceIp\", \"caller\":\"$context.identity.caller\", \"user\":\"$context.identity.user\",\"requestTime\":\"$context.requestTime\", \"eventType\":\"$context.eventType\",\"routeKey\":\"$context.routeKey\", \"status\":\"$context.status\",\"connectionId\":\"$context.connectionId\" }"
  }
  default_route_settings {
    logging_level            = "INFO"
    detailed_metrics_enabled = true
    throttling_burst_limit   = 100
    throttling_rate_limit    = 100
  }
}

resource "aws_apigatewayv2_deployment" "ws_apigateway_deployment" {
  api_id      = aws_apigatewayv2_api.ws_apigateway.id
  description = "0.0.2"
  triggers = {
    redeployment = sha1(join(",", tolist([
      jsonencode(aws_apigatewayv2_integration.connect),
      jsonencode(aws_apigatewayv2_integration.default),
      jsonencode(aws_apigatewayv2_route.ws_apigateway_route_connect),
      jsonencode(aws_apigatewayv2_route.ws_apigateway_route),
    ])))
  }
  lifecycle {
    create_before_destroy = true
  }
}
