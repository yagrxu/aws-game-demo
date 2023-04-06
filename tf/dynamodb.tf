resource "aws_dynamodb_table" "player-table" {
  name           = var.player_table_name
  billing_mode   = "PROVISIONED"
  read_capacity  = 2
  write_capacity = 2
  hash_key       = "connectionId"

  attribute {
    name = "connectionId"
    type = "S"
  }

}

resource "aws_dynamodb_table" "game-session-table" {
  name           = var.game_session_table_name
  billing_mode   = "PROVISIONED"
  read_capacity  = 2
  write_capacity = 2
  hash_key       = "roomId"

  attribute {
    name = "roomId"
    type = "S"
  }
}


