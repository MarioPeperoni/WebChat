provider "aws" {
  region = "eu-north-1"
}

terraform {
  backend "s3" {
    bucket  = "webchat-terraform"
    key     = "terraform.tfstate"
    region  = "eu-north-1"
    encrypt = true
  }
}
