terraform {
  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "4.63.0"
    }
    null = {
      source  = "hashicorp/null"
      version = "3.2.1"
    }
  }
  backend "s3" {
    #   bucket = "yagr-tf-state-log"
    #   key    = "gaming/demo/cannon-mosquito-server"
    #   region = "us-east-1"
  }

}
