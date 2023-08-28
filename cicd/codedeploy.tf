data "aws_iam_policy_document" "codedeploy_assume_role" {
  statement {
    effect = "Allow"

    principals {
      type        = "Service"
      identifiers = ["codedeploy.amazonaws.com"]
    }

    actions = ["sts:AssumeRole"]
  }
}

resource "aws_iam_role" "codedeploy_iam_role" {
  name               = "codedeploy-iam-role"
  assume_role_policy = data.aws_iam_policy_document.codedeploy_assume_role.json
}

resource "aws_iam_role_policy_attachment" "codedeploy_iam_role_policy_attachment" {
  policy_arn = "arn:aws:iam::aws:policy/AdministratorAccess"
  role       = aws_iam_role.codedeploy_iam_role.name
}


resource "aws_codedeploy_app" "authorizer_deployment_app" {
  compute_platform = "Lambda"
  name             = "authorizer-app"
}

resource "aws_codedeploy_deployment_group" "authorizer_deployment_group" {
  app_name               = aws_codedeploy_app.authorizer_deployment_app.name
  deployment_group_name  = "authorizer_deployment_group"
  service_role_arn       = aws_iam_role.codedeploy_iam_role.arn
  deployment_config_name = "CodeDeployDefault.LambdaCanary10Percent5Minutes"

  deployment_style {
    deployment_option = "WITH_TRAFFIC_CONTROL"
    deployment_type   = "BLUE_GREEN"
  }
}

resource "aws_codedeploy_app" "connect_deployment_app" {
  compute_platform = "Lambda"
  name             = "connect-app"
}

resource "aws_codedeploy_deployment_group" "connect_deployment_group" {
  app_name               = aws_codedeploy_app.connect_deployment_app.name
  deployment_group_name  = "connect_deployment_group"
  service_role_arn       = aws_iam_role.codedeploy_iam_role.arn
  deployment_config_name = "CodeDeployDefault.LambdaCanary10Percent5Minutes"

  deployment_style {
    deployment_option = "WITH_TRAFFIC_CONTROL"
    deployment_type   = "BLUE_GREEN"
  }
}

resource "aws_codedeploy_app" "disconnect_deployment_app" {
  compute_platform = "Lambda"
  name             = "disconnect-app"
}

resource "aws_codedeploy_deployment_group" "disconnect_deployment_group" {
  app_name               = aws_codedeploy_app.disconnect_deployment_app.name
  deployment_group_name  = "disconnect_deployment_group"
  service_role_arn       = aws_iam_role.codedeploy_iam_role.arn
  deployment_config_name = "CodeDeployDefault.LambdaCanary10Percent5Minutes"

  deployment_style {
    deployment_option = "WITH_TRAFFIC_CONTROL"
    deployment_type   = "BLUE_GREEN"
  }
}

resource "aws_codedeploy_app" "logic_deployment_app" {
  compute_platform = "Lambda"
  name             = "logic-app"
}

resource "aws_codedeploy_deployment_group" "logic_deployment_group" {
  app_name               = aws_codedeploy_app.logic_deployment_app.name
  deployment_group_name  = "logic_deployment_group"
  service_role_arn       = aws_iam_role.codedeploy_iam_role.arn
  deployment_config_name = "CodeDeployDefault.LambdaCanary10Percent5Minutes"

  deployment_style {
    deployment_option = "WITH_TRAFFIC_CONTROL"
    deployment_type   = "BLUE_GREEN"
  }
}

resource "aws_codedeploy_app" "default_deployment_app" {
  compute_platform = "Lambda"
  name             = "default-app"
}

resource "aws_codedeploy_deployment_group" "default_deployment_group" {
  app_name               = aws_codedeploy_app.default_deployment_app.name
  deployment_group_name  = "default_deployment_group"
  service_role_arn       = aws_iam_role.codedeploy_iam_role.arn
  deployment_config_name = "CodeDeployDefault.LambdaCanary10Percent5Minutes"

  deployment_style {
    deployment_option = "WITH_TRAFFIC_CONTROL"
    deployment_type   = "BLUE_GREEN"
  }
}
