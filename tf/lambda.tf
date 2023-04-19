locals {
  mongodbUrl = "mongodb+srv://${var.mongodb_user}:${var.mongodb_pwd}@${substr(mongodbatlas_cluster.demo.connection_strings[0].standard_srv, length("mongodb+srv://"), length(mongodbatlas_cluster.demo.connection_strings[0].standard_srv))}/admin?retryWrites=true&w=majority"
}
resource "aws_lambda_function" "lambda_connect" {
  filename         = "dummy.zip"
  function_name    = "game-demo-connect"
  role             = aws_iam_role.iam_for_lambda.arn
  handler          = "index.handler"
  timeout          = 10
  source_code_hash = filebase64sha256("dummy.zip")
  runtime          = "nodejs16.x"
  publish          = true

  environment {
    variables = {
      DELAYED_QUEUE_URL       = aws_ssm_parameter.delayed_queue_url.value
      FIFO_QUEUE_URL          = aws_ssm_parameter.fifo_queue_url.value
      FIFO_QUEUE_GROUP_ID     = aws_ssm_parameter.fifo_queue_group_id.value
      PLAYER_TABLE_NAME       = aws_ssm_parameter.player_table_name.value
      GAME_SESSION_TABLE_NAME = aws_ssm_parameter.game_session_table_name.value
      DEFAULT_REGION          = aws_ssm_parameter.default_region.value
      MONGODB_ATLAS_URI       = local.mongodbUrl
    }
  }
}



resource "aws_lambda_function" "lambda_disconnect" {
  filename         = "dummy.zip"
  function_name    = "game-demo-disconnect"
  role             = aws_iam_role.iam_for_lambda.arn
  handler          = "index.handler"
  timeout          = 10
  source_code_hash = filebase64sha256("dummy.zip")
  runtime          = "nodejs16.x"
  publish          = true

  environment {
    variables = {
      DELAYED_QUEUE_URL       = aws_ssm_parameter.delayed_queue_url.value
      FIFO_QUEUE_URL          = aws_ssm_parameter.fifo_queue_url.value
      FIFO_QUEUE_GROUP_ID     = aws_ssm_parameter.fifo_queue_group_id.value
      PLAYER_TABLE_NAME       = aws_ssm_parameter.player_table_name.value
      GAME_SESSION_TABLE_NAME = aws_ssm_parameter.game_session_table_name.value
      DEFAULT_REGION          = aws_ssm_parameter.default_region.value
      MONGODB_ATLAS_URI       = local.mongodbUrl
    }
  }
}

resource "aws_lambda_function" "lambda_default" {
  filename         = "dummy.zip"
  function_name    = "game-demo-default"
  role             = aws_iam_role.iam_for_lambda.arn
  handler          = "index.handler"
  timeout          = 10
  source_code_hash = filebase64sha256("dummy.zip")
  runtime          = "nodejs16.x"
  publish          = true
  environment {
    variables = {
      DELAYED_QUEUE_URL       = aws_ssm_parameter.delayed_queue_url.value
      FIFO_QUEUE_URL          = aws_ssm_parameter.fifo_queue_url.value
      FIFO_QUEUE_GROUP_ID     = aws_ssm_parameter.fifo_queue_group_id.value
      PLAYER_TABLE_NAME       = aws_ssm_parameter.player_table_name.value
      GAME_SESSION_TABLE_NAME = aws_ssm_parameter.game_session_table_name.value
      DEFAULT_REGION          = aws_ssm_parameter.default_region.value
      MONGODB_ATLAS_URI       = local.mongodbUrl
    }
  }
}

resource "aws_lambda_function" "lambda_logic" {
  filename         = "dummy.zip"
  function_name    = "game-demo-logic"
  role             = aws_iam_role.iam_for_lambda.arn
  handler          = "index.handler"
  timeout          = 10
  source_code_hash = filebase64sha256("dummy.zip")
  runtime          = "nodejs16.x"
  publish          = true
  environment {
    variables = {
      DELAYED_QUEUE_URL       = aws_ssm_parameter.delayed_queue_url.value
      FIFO_QUEUE_URL          = aws_ssm_parameter.fifo_queue_url.value
      FIFO_QUEUE_GROUP_ID     = aws_ssm_parameter.fifo_queue_group_id.value
      PLAYER_TABLE_NAME       = aws_ssm_parameter.player_table_name.value
      GAME_SESSION_TABLE_NAME = aws_ssm_parameter.game_session_table_name.value
      DEFAULT_REGION          = aws_ssm_parameter.default_region.value
      MONGODB_ATLAS_URI       = local.mongodbUrl
    }
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
