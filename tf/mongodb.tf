provider "mongodbatlas" {}

resource "mongodbatlas_cluster" "demo" {
  project_id                  = mongodbatlas_project.devax.id
  name                        = "cluster-devax"
  provider_name               = "TENANT"
  backing_provider_name       = "AWS"
  provider_region_name        = var.provider_region_name
  provider_instance_size_name = "M0"
}
data "mongodbatlas_roles_org_id" "demo" {
}

resource "mongodbatlas_project" "devax" {
  name   = "devax-day-for-gaming"
  org_id = data.mongodbatlas_roles_org_id.demo.org_id
}

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
  comment    = "allows all"
}
