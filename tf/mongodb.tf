provider "mongodbatlas" {}

resource "mongodbatlas_cluster" "demo" {
  project_id = mongodbatlas_project.devax.id
  name       = "cluster-test"
  # cluster_type                = "SHARDED"
  provider_name               = "TENANT"
  backing_provider_name       = "AWS"
  provider_region_name        = var.mongodb_provider_region_name
  provider_instance_size_name = "M0"
}
data "mongodbatlas_roles_org_id" "demo" {
}

resource "mongodbatlas_project" "devax" {
  name   = "devax-day-for-gaming"
  org_id = data.mongodbatlas_roles_org_id.demo.org_id
  # project_owner_id = var.mongodb_project_owner_id
}

# resource "mongodbatlas_network_container" "demo" {
#   project_id       = mongodbatlas_project.devax.id
#   atlas_cidr_block = "10.8.0.0/21"
#   provider_name    = "AWS"
#   region_name      = "US_EAST_1"
# }

# # Create the peering connection request
# resource "mongodbatlas_network_peering" "demo" {
#   accepter_region_name   = "us-east-1"
#   project_id             = mongodbatlas_project.devax.id
#   container_id           = mongodbatlas_network_container.demo.id
#   provider_name          = "AWS"
#   route_table_cidr_block = module.vpc.vpc_cidr_block
#   vpc_id                 = module.vpc.vpc_id
#   aws_account_id         = data.aws_caller_identity.current.account_id
# }

# # the following assumes an AWS provider is configured
# # Accept the peering connection request
# resource "aws_vpc_peering_connection_accepter" "peer" {
#   vpc_peering_connection_id = mongodbatlas_network_peering.demo.connection_id
#   auto_accept               = true
# }

resource "mongodbatlas_database_user" "demo" {
  username           = var.mongodb_user
  password           = var.mongodb_pwd
  project_id         = mongodbatlas_project.devax.id
  auth_database_name = "admin"

  roles {
    role_name     = "readWrite"
    database_name = "devax"
  }
  roles {
    role_name     = "readWrite"
    database_name = "admin"
  }
  scopes {
    name = mongodbatlas_cluster.demo.name
    type = "CLUSTER"
  }

}


resource "mongodbatlas_project_ip_access_list" "test" {
  project_id = mongodbatlas_project.devax.id
  cidr_block = "0.0.0.0/0"
  comment    = "cidr block for tf acc testing"
}
