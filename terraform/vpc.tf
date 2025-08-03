resource "aws_vpc" "webchat_vpc" {
  cidr_block           = "10.0.0.0/16"
  enable_dns_hostnames = true
  enable_dns_support   = true
  tags = {
    Project = "webchat"
  }
}

resource "aws_subnet" "webchat_net_public" {
  vpc_id                  = aws_vpc.webchat_vpc.id
  cidr_block              = "10.0.1.0/24"
  availability_zone       = "eu-north-1a"
  map_public_ip_on_launch = true
  tags = {
    Project = "webchat"
  }
}

resource "aws_internet_gateway" "webchat_igw" {
  vpc_id = aws_vpc.webchat_vpc.id
  tags = {
    Project = "webchat"
  }
}

resource "aws_route_table" "webchat_route_table" {
  vpc_id = aws_vpc.webchat_vpc.id

  route {
    cidr_block = "0.0.0.0/0"
    gateway_id = aws_internet_gateway.webchat_igw.id
  }
}

resource "aws_route_table_association" "webchat_route_table_association" {
  subnet_id      = aws_subnet.webchat_net_public.id
  route_table_id = aws_route_table.webchat_route_table.id
}
