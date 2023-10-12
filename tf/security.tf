resource "aws_api_gateway_account" "demo" {
  cloudwatch_role_arn = "${aws_iam_role.apigw_logging_role.arn}"
}

resource "aws_iam_role" "apigw_logging_role" {
  name = "apigw_logging_role"

  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Action = "sts:AssumeRole"
        Effect = "Allow"
        Sid    = ""
        Principal = {
          Service = "apigateway.amazonaws.com"
        }
      },
    ]
  })

  tags = {
    tag-key = "tag-value"
  }
}


resource "aws_iam_role" "apigw_trigger_lambda_role" {
  name = "apigw_lambda_trigger_role"

  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Action = "sts:AssumeRole"
        Effect = "Allow"
        Sid    = ""
        Principal = {
          Service = "apigateway.amazonaws.com"
        }
      },
    ]
  })

  tags = {
    tag-key = "tag-value"
  }
}

# 

resource "aws_iam_role_policy_attachment" "test-attach" {
  role       = aws_iam_role.apigw_logging_role.name
  policy_arn = "arn:aws:iam::aws:policy/CloudWatchLogsFullAccess"
}

resource "aws_iam_role_policy_attachment" "lambda_attach" {
  role       = aws_iam_role.apigw_trigger_lambda_role.name
  policy_arn = "arn:aws:iam::aws:policy/AdministratorAccess"
}

resource "aws_iam_role" "iam_for_lambda" {
  name = "game_demo_lambda_role"

  assume_role_policy = <<EOF
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Action": "sts:AssumeRole",
      "Principal": {
        "Service": "lambda.amazonaws.com"
      },
      "Effect": "Allow",
      "Sid": ""
    }
  ]
}
EOF
}

resource "aws_iam_policy" "lambda_policy" {
  name        = "game_demo_policy"
  path        = "/"
  description = "demo"

  policy = <<EOF
{
    "Version": "2012-10-17",
    "Statement": [
        {
            "Sid": "ObservabilityPolicies",
            "Effect": "Allow",
            "Action": [
                "xray:UpdateSamplingRule",
                "xray:DeleteSamplingRule",
                "xray:PutTelemetryRecords",
                "xray:Link",
                "xray:DeleteGroup",
                "xray:CreateGroup",
                "logs:CreateLogGroup",
                "logs:PutLogEvents",
                "xray:PutTraceSegments",
                "logs:CreateLogStream",
                "xray:DeleteResourcePolicy",
                "xray:UpdateGroup",
                "xray:CreateSamplingRule",
                "xray:PutResourcePolicy"
            ],
            "Resource": "*"
        },
        {
            "Sid": "SQS",
            "Effect": "Allow",
            "Action": "sqs:*",
            "Resource": ["${aws_sqs_queue.fifo_queue.arn}", "${aws_sqs_queue.delay_queue.arn}"]
        },
        {
            "Sid": "DDB",
            "Effect": "Allow",
            "Action": "dynamodb:*",
            "Resource": ["${aws_dynamodb_table.player-table.arn}", "${aws_dynamodb_table.game-session-table.arn}"]
        },
        {
            "Sid": "SFN",
            "Effect": "Allow",
            "Action": [
              "states:StartExecution",
              "states:StopExecution"
            ],
            "Resource": [
              "${aws_sfn_state_machine.sfn_state_machine.arn}", "arn:aws:states:*:${data.aws_caller_identity.current.account_id}:execution:*:*"]
        },
        {
            "Sid": "EXEC",
            "Effect": "Allow",
            "Action": "execute-api:ManageConnections",
            "Resource": "*"
        }
    ]
}
EOF
}

resource "aws_iam_role_policy_attachment" "lambda_logs" {
  role       = aws_iam_role.iam_for_lambda.name
  policy_arn = aws_iam_policy.lambda_policy.arn
}