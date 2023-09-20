resource "aws_sfn_state_machine" "sfn_state_machine" {
  name     = "my-state-machine"
  role_arn = aws_iam_role.iam_for_sfn.arn

  definition = <<EOF
{
  "Comment": "An example of combining workflows using a Step Functions StartExecution task state with various integration patterns.",
  "StartAt": "Wait",
  "States": {
    "Wait": {
      "Type": "Wait",
      "Seconds": 8,
      "Next": "Add Targets 1"
    },
    "Add Targets 1": {
      "Type": "Task",
      "Resource": "arn:aws:states:::lambda:invoke",
      "OutputPath": "$.Payload",
      "Parameters": {
        "FunctionName": "arn:aws:lambda:${data.aws_region.current.name}:${data.aws_caller_identity.current.account_id}:function:game-demo-targets:$LATEST",
        "Payload.$": "$"
      },
      "Retry": [
        {
          "ErrorEquals": [
            "Lambda.ServiceException",
            "Lambda.AWSLambdaException",
            "Lambda.SdkClientException",
            "Lambda.TooManyRequestsException"
          ],
          "IntervalSeconds": 2,
          "MaxAttempts": 6,
          "BackoffRate": 2
        }
      ],
      "Next": "Wait (1)"
    },
    "Wait (1)": {
      "Type": "Wait",
      "Seconds": 8,
      "Next": "Add Targets 2"
    },
    "Add Targets 2": {
      "Type": "Task",
      "Resource": "arn:aws:states:::lambda:invoke",
      "OutputPath": "$.Payload",
      "Parameters": {
        "Payload.$": "$",
        "FunctionName": "arn:aws:lambda:${data.aws_region.current.name}:${data.aws_caller_identity.current.account_id}:function:game-demo-targets:$LATEST"
      },
      "Retry": [
        {
          "ErrorEquals": [
            "Lambda.ServiceException",
            "Lambda.AWSLambdaException",
            "Lambda.SdkClientException",
            "Lambda.TooManyRequestsException"
          ],
          "IntervalSeconds": 2,
          "MaxAttempts": 6,
          "BackoffRate": 2
        }
      ],
      "Next": "Wait (2)"
    },
    "Wait (2)": {
      "Type": "Wait",
      "Seconds": 8,
      "Next": "Add Targets 3"
    },
    "Add Targets 3": {
      "Type": "Task",
      "Resource": "arn:aws:states:::lambda:invoke",
      "OutputPath": "$.Payload",
      "Parameters": {
        "Payload.$": "$",
        "FunctionName": "arn:aws:lambda:${data.aws_region.current.name}:${data.aws_caller_identity.current.account_id}:function:game-demo-targets:$LATEST"
      },
      "Retry": [
        {
          "ErrorEquals": [
            "Lambda.ServiceException",
            "Lambda.AWSLambdaException",
            "Lambda.SdkClientException",
            "Lambda.TooManyRequestsException"
          ],
          "IntervalSeconds": 2,
          "MaxAttempts": 6,
          "BackoffRate": 2
        }
      ],
      "Next": "Wait (3)"
    },
    "Wait (3)": {
      "Type": "Wait",
      "Seconds": 8,
      "Next": "Add Targets 4"
    },
    "Add Targets 4": {
      "Type": "Task",
      "Resource": "arn:aws:states:::lambda:invoke",
      "OutputPath": "$.Payload",
      "Parameters": {
        "Payload.$": "$",
        "FunctionName": "arn:aws:lambda:${data.aws_region.current.name}:${data.aws_caller_identity.current.account_id}:function:game-demo-targets:$LATEST"
      },
      "Retry": [
        {
          "ErrorEquals": [
            "Lambda.ServiceException",
            "Lambda.AWSLambdaException",
            "Lambda.SdkClientException",
            "Lambda.TooManyRequestsException"
          ],
          "IntervalSeconds": 2,
          "MaxAttempts": 6,
          "BackoffRate": 2
        }
      ],
      "Next": "Wait (4)"
    },
    "Wait (4)": {
      "Type": "Wait",
      "Seconds": 8,
      "Next": "Add Targets 5"
    },
    "Add Targets 5": {
      "Type": "Task",
      "Resource": "arn:aws:states:::lambda:invoke",
      "OutputPath": "$.Payload",
      "Parameters": {
        "Payload.$": "$",
        "FunctionName": "arn:aws:lambda:${data.aws_region.current.name}:${data.aws_caller_identity.current.account_id}:function:game-demo-targets:$LATEST"
      },
      "Retry": [
        {
          "ErrorEquals": [
            "Lambda.ServiceException",
            "Lambda.AWSLambdaException",
            "Lambda.SdkClientException",
            "Lambda.TooManyRequestsException"
          ],
          "IntervalSeconds": 2,
          "MaxAttempts": 6,
          "BackoffRate": 2
        }
      ],
      "Next": "Wait (5)"
    },
    "Wait (5)": {
      "Type": "Wait",
      "Seconds": 8,
      "Next": "Add Targets 6"
    },
    "Add Targets 6": {
      "Type": "Task",
      "Resource": "arn:aws:states:::lambda:invoke",
      "OutputPath": "$.Payload",
      "Parameters": {
        "Payload.$": "$",
        "FunctionName": "arn:aws:lambda:${data.aws_region.current.name}:${data.aws_caller_identity.current.account_id}:function:game-demo-targets:$LATEST"
      },
      "Retry": [
        {
          "ErrorEquals": [
            "Lambda.ServiceException",
            "Lambda.AWSLambdaException",
            "Lambda.SdkClientException",
            "Lambda.TooManyRequestsException"
          ],
          "IntervalSeconds": 2,
          "MaxAttempts": 6,
          "BackoffRate": 2
        }
      ],
      "Next": "Success"
    },
    "Success": {
      "Type": "Succeed"
    }
  }
}
EOF

  logging_configuration {
    log_destination        = "${aws_cloudwatch_log_group.log_group_for_sfn.arn}:*"
    include_execution_data = true
    level                  = "ERROR"
  }
}

resource "aws_cloudwatch_log_group" "log_group_for_sfn" {
  name = "stepfunction_log"
}

data "aws_iam_policy_document" "states_trusted_advisor" {
  statement {
    effect = "Allow"

    principals {
      type        = "Service"
      identifiers = ["states.amazonaws.com"]
    }

    actions = ["sts:AssumeRole"]
  }
}

data "aws_iam_policy_document" "stepfunction_iam_policy" {
  statement {
    effect    = "Allow"
    actions   = ["*"]
    resources = ["*"]
  }
}


resource "aws_iam_role" "iam_for_sfn" {
  name               = "devax-gaming-stepfunction-role"
  assume_role_policy = data.aws_iam_policy_document.states_trusted_advisor.json
}


resource "aws_iam_role_policy" "stepfunction_role_policy" {
  role   = aws_iam_role.iam_for_sfn.name
  policy = data.aws_iam_policy_document.stepfunction_iam_policy.json
}
