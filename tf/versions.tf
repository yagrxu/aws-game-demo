terraform {
  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "4.57.1"
    }
  }
  backend "s3" {
    bucket = "yagr-tf-state-log"
    key    = "gaming/demo/cannon-mosquito-server"
    region = "us-east-1"
  }
  
}