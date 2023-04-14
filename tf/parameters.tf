resource "aws_ssm_parameter" "delayed_queue_url" {
  name      = "/devax-game/delayed_queue_url"
  type      = "String"
  value     = aws_sqs_queue.delay_queue.url
  overwrite = true
}

resource "aws_ssm_parameter" "fifo_queue_url" {
  name      = "/devax-game/fifo_queue_url"
  type      = "String"
  value     = aws_sqs_queue.fifo_queue.url
  overwrite = true
}

resource "aws_ssm_parameter" "fifo_queue_group_id" {
  name      = "/devax-game/fifo_queue_group_id"
  type      = "String"
  value     = var.default_group_id
  overwrite = true
}

resource "aws_ssm_parameter" "player_table_name" {
  name      = "/devax-game/player_table_name"
  type      = "String"
  value     = var.player_table_name
  overwrite = true
}

resource "aws_ssm_parameter" "game_session_table_name" {
  name      = "/devax-game/game_session_table_name"
  type      = "String"
  value     = var.game_session_table_name
  overwrite = true
}

resource "aws_ssm_parameter" "default_region" {
  name      = "/devax-game/default_region"
  type      = "String"
  value     = data.aws_region.current.name
  overwrite = true
}
