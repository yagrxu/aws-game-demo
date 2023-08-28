locals {
  targets_delayed_second = 2
  targets_per_batch      = 10
}

resource "aws_lambda_function" "lambda_connect" {
  filename         = var.deploy_type == "local" ? "connect.zip" : "dummy.zip"
  function_name    = "game-demo-connect"
  role             = aws_iam_role.iam_for_lambda.arn
  handler          = "index.handler"
  timeout          = 10
  source_code_hash = filebase64sha256(var.deploy_type == "local" ? "connect.zip" : "dummy.zip")
  runtime          = "nodejs16.x"
  memory_size      = 1024
  publish          = true
  tracing_config {
    mode = "Active"
  }
  environment {
    variables = {
      DELAYED_QUEUE_URL       = aws_ssm_parameter.delayed_queue_url.value
      FIFO_QUEUE_URL          = aws_ssm_parameter.fifo_queue_url.value
      FIFO_QUEUE_GROUP_ID     = aws_ssm_parameter.fifo_queue_group_id.value
      PLAYER_TABLE_NAME       = aws_ssm_parameter.player_table_name.value
      GAME_SESSION_TABLE_NAME = aws_ssm_parameter.game_session_table_name.value
      DEFAULT_REGION          = aws_ssm_parameter.default_region.value
    }
  }
}



resource "aws_lambda_function" "lambda_disconnect" {
  filename         = var.deploy_type == "local" ? "disconnect.zip" : "dummy.zip"
  function_name    = "game-demo-disconnect"
  role             = aws_iam_role.iam_for_lambda.arn
  handler          = "index.handler"
  timeout          = 10
  source_code_hash = filebase64sha256(var.deploy_type == "local" ? "disconnect.zip" : "dummy.zip")
  runtime          = "nodejs16.x"
  publish          = true

  tracing_config {
    mode = "Active"
  }
  environment {
    variables = {
      DELAYED_QUEUE_URL       = aws_ssm_parameter.delayed_queue_url.value
      FIFO_QUEUE_URL          = aws_ssm_parameter.fifo_queue_url.value
      FIFO_QUEUE_GROUP_ID     = aws_ssm_parameter.fifo_queue_group_id.value
      PLAYER_TABLE_NAME       = aws_ssm_parameter.player_table_name.value
      GAME_SESSION_TABLE_NAME = aws_ssm_parameter.game_session_table_name.value
      DEFAULT_REGION          = aws_ssm_parameter.default_region.value
    }
  }
}

resource "aws_lambda_function" "lambda_default" {
  filename         = var.deploy_type == "local" ? "default.zip" : "dummy.zip"
  function_name    = "game-demo-default"
  role             = aws_iam_role.iam_for_lambda.arn
  handler          = "index.handler"
  timeout          = 10
  source_code_hash = filebase64sha256(var.deploy_type == "local" ? "default.zip" : "dummy.zip")
  runtime          = "nodejs16.x"
  memory_size      = 1024
  publish          = true

  tracing_config {
    mode = "Active"
  }
  environment {
    variables = {
      DELAYED_QUEUE_URL       = aws_ssm_parameter.delayed_queue_url.value
      FIFO_QUEUE_URL          = aws_ssm_parameter.fifo_queue_url.value
      FIFO_QUEUE_GROUP_ID     = aws_ssm_parameter.fifo_queue_group_id.value
      PLAYER_TABLE_NAME       = aws_ssm_parameter.player_table_name.value
      GAME_SESSION_TABLE_NAME = aws_ssm_parameter.game_session_table_name.value
      DEFAULT_REGION          = aws_ssm_parameter.default_region.value
    }
  }
}

resource "aws_lambda_function" "lambda_logic" {
  filename         = var.deploy_type == "local" ? "logic.zip" : "dummy.zip"
  function_name    = "game-demo-logic"
  role             = aws_iam_role.iam_for_lambda.arn
  handler          = "index.handler"
  timeout          = 10
  source_code_hash = filebase64sha256(var.deploy_type == "local" ? "logic.zip" : "dummy.zip")
  runtime          = "nodejs16.x"
  memory_size      = 1024
  publish          = true

  tracing_config {
    mode = "Active"
  }
  environment {
    variables = {
      DELAYED_QUEUE_URL       = aws_ssm_parameter.delayed_queue_url.value
      FIFO_QUEUE_URL          = aws_ssm_parameter.fifo_queue_url.value
      FIFO_QUEUE_GROUP_ID     = aws_ssm_parameter.fifo_queue_group_id.value
      PLAYER_TABLE_NAME       = aws_ssm_parameter.player_table_name.value
      GAME_SESSION_TABLE_NAME = aws_ssm_parameter.game_session_table_name.value
      DEFAULT_REGION          = aws_ssm_parameter.default_region.value
      TARGET_DELAYED_SECONDS  = local.targets_delayed_second
      TARGET_PER_BATCH        = local.targets_per_batch
    }
  }
}

resource "aws_lambda_function" "lambda_authorizer" {
  filename         = "authorizer.zip" # var.deploy_type == "local" ? "authorizer.zip" : "dummy.zip"
  function_name    = "game-demo-authorizer"
  role             = aws_iam_role.iam_for_lambda.arn
  handler          = "lambda_function.lambda_handler"
  timeout          = 10
  source_code_hash = filebase64sha256("authorizer.zip") # var.deploy_type == "local" ? "authorizer.zip" : "dummy.zip"
  runtime          = "python3.8"
  publish          = true

  tracing_config {
    mode = "Active"
  }
  environment {
  }
}


resource "aws_lambda_alias" "game_demo_connect_alias_arn" {
  name             = "prd"
  function_name    = aws_lambda_function.lambda_connect.function_name
  function_version = aws_lambda_function.lambda_connect.version
  lifecycle {
    ignore_changes = all
  }
}

resource "aws_lambda_alias" "game_demo_disconnect_alias_arn" {
  name             = "prd"
  function_name    = aws_lambda_function.lambda_disconnect.function_name
  function_version = aws_lambda_function.lambda_disconnect.version
  lifecycle {
    ignore_changes = all
  }
}

resource "aws_lambda_alias" "game_demo_default_alias_arn" {
  name             = "prd"
  function_name    = aws_lambda_function.lambda_default.function_name
  function_version = aws_lambda_function.lambda_default.version
  lifecycle {
    ignore_changes = all
  }
}

resource "aws_lambda_alias" "game_demo_logic_alias_arn" {
  name             = "prd"
  function_name    = aws_lambda_function.lambda_logic.function_name
  function_version = aws_lambda_function.lambda_logic.version
  lifecycle {
    ignore_changes = all
  }
}

resource "aws_lambda_alias" "game_demo_authorizer_alias_arn" {
  name             = "prd"
  function_name    = aws_lambda_function.lambda_authorizer.function_name
  function_version = aws_lambda_function.lambda_authorizer.version
  lifecycle {
    ignore_changes = all
  }
}

resource "aws_lambda_permission" "with_apigateway" {
  statement_id  = "AllowExecutionFromAPIGW"
  action        = "lambda:InvokeFunction"
  function_name = aws_lambda_function.lambda_authorizer.function_name
  principal     = "apigateway.amazonaws.com"
  source_arn    = "${aws_apigatewayv2_api.ws_apigateway.execution_arn}/*"
}
