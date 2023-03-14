resource "aws_dynamodb_table" "player-table" {
  name           = "PlayerTable"
  billing_mode   = "PROVISIONED"
  read_capacity  = 2
  write_capacity = 2
  hash_key       = "connectionId"
  range_key      = "roomId"

  attribute {
    name = "roomId"
    type = "S"
  }

  attribute {
    name = "connectionId"
    type = "S"
  }

}


resource "aws_dynamodb_table" "game-session-table" {
  name           = "GameSessionTable"
  billing_mode   = "PROVISIONED"
  read_capacity  = 2
  write_capacity = 2
  hash_key       = "roomId"

  attribute {
    name = "roomId"
    type = "S"
  }

}