resource "aws_ecr_repository" "webchat_repo_server" {
  name = "webchat-server"

  image_tag_mutability = "MUTABLE"
  image_scanning_configuration {
    scan_on_push = true
  }

  force_delete = true

  tags = {
    Project = "webchat"
  }
}

output "ecr_repository_url" {
  description = "URL of the ECR repository for the WebChat server"
  value       = aws_ecr_repository.webchat_repo_server.repository_url

}
