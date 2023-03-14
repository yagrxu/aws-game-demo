resource "aws_lambda_function" "lambda_connect" {
  filename      = "connect.zip"
  function_name = "game-demo-connect"
  role          = aws_iam_role.iam_for_lambda.arn
  handler       = "index.handler"
  timeout       = 10
  source_code_hash = filebase64sha256("connect.zip")
  runtime = "nodejs16.x"
  # vpc_config {
  #   subnet_ids = module.vpc.private_subnets
  #   security_group_ids = [module.vpc.default_security_group_id]
  # }
  tracing_config {
    mode = "Active"
  }
  # environment {
  #   variables = {
  #     DETAILS_MAIN_URL = data.aws_ssm_parameter.details_main_url.value
  #   }
  # }
}

resource "aws_lambda_function" "lambda_disconnect" {
  filename      = "disconnect.zip"
  function_name = "game-demo-disconnect"
  role          = aws_iam_role.iam_for_lambda.arn
  handler       = "index.handler"
  timeout       = 10
  source_code_hash = filebase64sha256("disconnect.zip")
  runtime = "nodejs16.x"
  # vpc_config {
  #   subnet_ids = module.vpc.private_subnets
  #   security_group_ids = [module.vpc.default_security_group_id]
  # }
  tracing_config {
    mode = "Active"
  }
}

resource "aws_lambda_function" "lambda_default" {
  filename      = "default.zip"
  function_name = "game-demo-default"
  role          = aws_iam_role.iam_for_lambda.arn
  handler       = "index.handler"
  timeout       = 10
  source_code_hash = filebase64sha256("default.zip")
  runtime = "nodejs16.x"
  # vpc_config {
  #   subnet_ids = module.vpc.private_subnets
  #   security_group_ids = [module.vpc.default_security_group_id]
  # }
  tracing_config {
    mode = "Active"
  }

}


resource "aws_lambda_function" "lambda_logic" {
  filename      = "logic.zip"
  function_name = "game-demo-logic"
  role          = aws_iam_role.iam_for_lambda.arn
  handler       = "index.handler"
  timeout       = 10
  source_code_hash = filebase64sha256("logic.zip")
  runtime = "nodejs16.x"
  # vpc_config {
  #   subnet_ids = module.vpc.private_subnets
  #   security_group_ids = [module.vpc.default_security_group_id]
  # }
  tracing_config {
    mode = "Active"
  }

}