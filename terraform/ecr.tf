resource "aws_ecr_repository" "webchat_repo_server" {
  name = "webchat-server"

  image_tag_mutability = "MUTABLE"
  image_scanning_configuration {
    scan_on_push = true
  }

  tags = {
    Project = "webchat"
  }
}
