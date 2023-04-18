resource "aws_cloudwatch_dashboard" "main" {
  dashboard_name = "demo-dashboard"

  dashboard_body = jsonencode({
    widgets = [
      {
        type   = "metric"
        x      = 0
        y      = 0
        width  = 12
        height = 6

        properties = {
          metrics = [
            [
              "AWS/Lambda",
              "Invocations",
              "FunctionName",
              aws_lambda_function.lambda_default.function_name
            ],
            [
              "AWS/Lambda",
              "Invocations",
              "FunctionName",
              aws_lambda_function.lambda_logic.function_name
            ]
          ]
          "period" : 300,
          "stat" : "Sum",
          region = "us-east-1"
          title  = "Lambda Invocations: Sum"
        }
      },
      {
        type : "log",
        x : 0,
        y : 7,
        width : 20,
        height : 8,
        properties : {
          region : "us-east-1",
          title : "Logs",
          query : "SOURCE '/aws/lambda/game-demo-logic' | SOURCE '/aws/lambda/game-demo-default' | fields @timestamp, @message, @log \n | sort @timestamp desc \n | limit 200",
          "view" : "table"
        }
      },
      {
        type   = "text"
        x      = 0
        y      = 15
        width  = 3
        height = 3

        properties = {
          markdown = "Hello world"
        }
      }
    ]
  })
}
