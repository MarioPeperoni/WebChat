resource "aws_s3_bucket" "webchat_frontend" {
  bucket        = "webchat-frontend-bucket"
  force_destroy = true

  tags = {
    Project = "webchat"
  }
}

resource "aws_s3_bucket_website_configuration" "webchat_frontend_website" {
  bucket = aws_s3_bucket.webchat_frontend.id

  index_document {
    suffix = "index.html"
  }
}


resource "aws_s3_bucket_public_access_block" "webchat_frontend_public_access" {
  bucket = aws_s3_bucket.webchat_frontend.id

  block_public_acls       = false
  block_public_policy     = false
  ignore_public_acls      = false
  restrict_public_buckets = false
}

resource "aws_s3_bucket_policy" "webchat_frontend_policy" {
  bucket     = aws_s3_bucket.webchat_frontend.id
  depends_on = [aws_s3_bucket_public_access_block.webchat_frontend_public_access]

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect    = "Allow"
        Principal = "*"
        Action    = "s3:GetObject"
        Resource  = "${aws_s3_bucket.webchat_frontend.arn}/*"
      },
    ]
  })
}

output "s3_name" {
  description = "S3 Bucket Name"
  value       = aws_s3_bucket.webchat_frontend.bucket
}

output "s3_endpoint" {
  description = "S3 Website Endpoint"
  value       = aws_s3_bucket_website_configuration.webchat_frontend_website.website_endpoint
}
