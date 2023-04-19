resource "aws_ssm_parameter" "mongodb_private_key" {
  name      = "/devax-game/mongodb_private_key"
  type      = "String"
  value     = var.mongodb_private_key
  overwrite = true
}
resource "aws_ssm_parameter" "mongodb_public_key" {
  name      = "/devax-game/mongodb_public_key"
  type      = "String"
  value     = var.mongodb_public_key
  overwrite = true
}
