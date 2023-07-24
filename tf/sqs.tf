resource "aws_sqs_queue" "fifo_queue" {
  name                        = "game-demo.fifo"
  fifo_queue                  = true
  content_based_deduplication = true
  redrive_policy = jsonencode({
    deadLetterTargetArn = aws_sqs_queue.deadletter.arn
    maxReceiveCount     = 4
  })
}

resource "aws_sqs_queue" "delay_queue" {
  name                      = "game-demo-delay"
  delay_seconds             = 5
  max_message_size          = 2048
  message_retention_seconds = 86400
  receive_wait_time_seconds = 10
  redrive_policy = jsonencode({
    deadLetterTargetArn = aws_sqs_queue.delay_queue_dl.arn
    maxReceiveCount     = 4
  })
}

resource "aws_sqs_queue" "deadletter" {
  name                        = "game-demo-deadletter.fifo"
  fifo_queue                  = true
  content_based_deduplication = true
}

resource "aws_sqs_queue" "delay_queue_dl" {
  name                      = "game-demo-delay-dl"
  delay_seconds             = 1
  max_message_size          = 2048
  message_retention_seconds = 86400
  receive_wait_time_seconds = 10
}

resource "aws_lambda_event_source_mapping" "sqs-delay" {
  batch_size       = 1
  event_source_arn = aws_sqs_queue.delay_queue.arn
  function_name    = aws_lambda_alias.game_demo_default_alias_arn.arn
}

resource "aws_lambda_event_source_mapping" "sqs-fifo" {
  batch_size       = 1
  event_source_arn = aws_sqs_queue.fifo_queue.arn
  function_name    = aws_lambda_alias.game_demo_logic_alias_arn.arn
}