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

# 

resource "aws_iam_role_policy_attachment" "test-attach" {
  role       = aws_iam_role.apigw_logging_role.name
  policy_arn = "arn:aws:iam::aws:policy/CloudWatchLogsFullAccess"
}
