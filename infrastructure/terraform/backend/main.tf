provider "aws" {
  region = "eu-north-1"
}

resource "aws_s3_bucket" "webchat-terraform" {
  bucket = "webchat-terraform"

  tags = {
    Project = "webchat"
  }
}

resource "aws_s3_bucket_versioning" "webchat-terraform-versioning" {
  bucket = aws_s3_bucket.webchat-terraform.id

  versioning_configuration {
    status = "Enabled"
  }

}

resource "aws_s3_bucket_server_side_encryption_configuration" "webchat-terraform-encryption" {
  bucket = aws_s3_bucket.webchat-terraform.id

  rule {
    apply_server_side_encryption_by_default {
      sse_algorithm = "AES256"
    }
  }
}
