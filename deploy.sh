#!/bin/bash

sh ./prebuild.sh
export TFSTATE_KEY=gaming/demo/cannon-mosquito-server
export TFSTATE_BUCKET=export TFSTATE_BUCKET=$(aws s3 ls --output text | awk '{print $3}' | grep tfstate-)
export TFSTATE_REGION=ap-southeast-1
export AWS_DEFAULT_REGION=us-east-1

cd tf
# in case backend changed, please use '-reconfigure' parameter
terraform init -backend-config="bucket=${TFSTATE_BUCKET}" -backend-config="key=${TFSTATE_KEY}" -backend-config="region=${TFSTATE_REGION}"

terraform apply --auto-approve