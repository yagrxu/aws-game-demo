resource "aws_codecommit_repository" "connect" {
    repository_name = "connect"
    default_branch = "master"
}

resource "aws_codecommit_repository" "disconnect" {
    repository_name = "disconnect"
    default_branch = "master"
}

resource "aws_codecommit_repository" "default" {
    repository_name = "default"
    default_branch = "master"
}

resource "aws_codecommit_repository" "logic" {
    repository_name = "logic"
}

resource "aws_codecommit_repository" "infra" {
    repository_name = "infra"
    default_branch = "master"
}

