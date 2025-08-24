resource "aws_instance" "webchat_ec2" {
  ami           = "ami-0b6acaa45fec15278" # Amazon Linux 2023
  instance_type = "t3.micro"

  subnet_id              = aws_subnet.webchat_net_public.id
  vpc_security_group_ids = [aws_security_group.webchat_backend_sg.id]
  iam_instance_profile   = aws_iam_instance_profile.webchat_instance_profile.id

  key_name = aws_key_pair.webchat_key.key_name

  tags = {
    Project = "webchat"
  }
}

output "ec2_ip" {
  description = "Public IP of the WebChat EC2 instance"
  value       = aws_instance.webchat_ec2.public_ip
}
