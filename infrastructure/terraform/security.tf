resource "aws_security_group" "webchat_backend_sg" {
  name        = "webchat-backend-sg"
  description = "Allow HTTP, HTTPS, SSH"
  vpc_id      = aws_vpc.webchat_vpc.id

  tags = {
    Project = "webchat"
  }
}

resource "aws_vpc_security_group_ingress_rule" "webchat_ssh_rule" {
  description       = "Allow SSH access"
  security_group_id = aws_security_group.webchat_backend_sg.id

  from_port   = 22
  to_port     = 22
  ip_protocol = "tcp"
  cidr_ipv4   = "0.0.0.0/0"

  tags = {
    Project = "webchat"
  }
}

resource "aws_vpc_security_group_ingress_rule" "webchat_http_rule" {
  description       = "Allow HTTP access"
  security_group_id = aws_security_group.webchat_backend_sg.id

  from_port   = 80
  to_port     = 80
  ip_protocol = "tcp"
  cidr_ipv4   = "0.0.0.0/0"

  tags = {
    Project = "webchat"
  }
}

resource "aws_vpc_security_group_ingress_rule" "webchat_https_rule" {
  description       = "Allow HTTPS access"
  security_group_id = aws_security_group.webchat_backend_sg.id

  from_port   = 443
  to_port     = 443
  ip_protocol = "tcp"
  cidr_ipv4   = "0.0.0.0/0"

  tags = {
    Project = "webchat"
  }
}

resource "aws_vpc_security_group_egress_rule" "webchat_egress_rule" {
  description       = "Allow all outbound traffic"
  security_group_id = aws_security_group.webchat_backend_sg.id

  from_port   = -1
  to_port     = -1
  ip_protocol = "-1"
  cidr_ipv4   = "0.0.0.0/0"

  tags = {
    Project = "webchat"
  }
}

// IAM role and policy for ECR access
data "aws_iam_policy_document" "webchat_ecr_policy" {
  statement {
    actions = [
      "ecr:GetAuthorizationToken",
      "ecr:BatchCheckLayerAvailability",
      "ecr:GetDownloadUrlForLayer",
      "ecr:BatchGetImage"
    ]
    resources = ["*"]
  }
}

resource "aws_iam_policy" "webchat_ecr_policy" {
  name        = "webchat-ecr-policy"
  description = "Policy for ECR access"
  policy      = data.aws_iam_policy_document.webchat_ecr_policy.json

  tags = {
    Project = "webchat"
  }
}

resource "aws_iam_role" "webchat_ecr_role" {
  name = "webchat-ecr-role"

  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Action = "sts:AssumeRole"
        Effect = "Allow"
        Principal = {
          Service = "ec2.amazonaws.com"
        }
      }
    ]
  })

  tags = {
    Project = "webchat"
  }
}

resource "aws_iam_role_policy_attachment" "webchat_ecr_policy_attachment" {
  role       = aws_iam_role.webchat_ecr_role.name
  policy_arn = aws_iam_policy.webchat_ecr_policy.arn
}

resource "aws_iam_instance_profile" "webchat_instance_profile" {
  name = "webchat-instance-profile"
  role = aws_iam_role.webchat_ecr_role.name

  tags = {
    Project = "webchat"
  }
}

// Key pair for EC2 instances
resource "aws_key_pair" "webchat_key" {
  key_name   = "webchat-key"
  public_key = file("~/.ssh/webchat_key.pub")
}
