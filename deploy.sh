#!/bin/bash

sh ./prebuild.sh

cd tf
terraform apply --auto-approve