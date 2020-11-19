variable "aws_region" {
  description = "The AWS region things are created in"
  default     = "us-east-1"
}

variable "vpc_id" {
  description = "VPC to put the resources in"
}

variable "public_subnet_ids" {
  description = "Subnet IDs to put the load balancer in (should be public subnets)"
}

variable "private_subnet_ids" {
  description = "Subnet IDs to put the databases in (should be private subnets)"
}

variable "jumphost_sg_id" {
  description = "security group of the jumphost. will give access to DBs from this sg"
}

# Domain + ALB
variable "alb_listener_arn" {
  description = "arn of alb https listener"
}

variable "alb_sg_id" {
  description = "id of the security group containing the ALB so we can whitelist traffic"
}

variable "alb_dns_name" {
  description = "alb dns name to setup cname to"
}

variable "domains" {
  description = "domains to put this env on. ALB needs to already have certs for it"
}

variable "cloudflare_zone_id" {
  description = "Zone ID of cloudflare"
}

variable "stage" {
  description = "Stage/environment. Should be prod or staging"
}

variable "ecr_url" {
  description = "url of ecr repo for project image"
}

variable "secrets" {
  description = "secrets to pass as env variables"
  default = []
}

# Fargate
variable "app_port" {
  description = "port the webapp runs on"
  default = 5000
}

variable "app_count" {
  description = "number of app instances to run"
  default = 1
}

variable "webapp_cpu" {
  description = "cpu the webapp should get"
  default = 1024
}

variable "webapp_memory" {
  description = "memory the webapp should get"
  default = 2048
}

variable "scrape_cpu" {
  description = "cpu the scrapers should get"
  default = 1024
}

variable "scrape_memory" {
  description = "memory the scrapers should get"
  default = 3072
}
