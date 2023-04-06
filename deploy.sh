#!/bin/bash

sh ./prebuild.sh
export TFSTATE_KEY=gaming/demo/cannon-mosquito-server
export TFSTATE_BUCKET=yagr-tf-state-log
export TFSTATE_REGION=us-east-1
export AWS_DEFAULT_REGION=us-east-1

cd tf
# in case backend changed, please use '-reconfigure' parameter
terraform init -backend-config="bucket=${TFSTATE_BUCKET}" -backend-config="key=${TFSTATE_KEY}" -backend-config="region=${TFSTATE_REGION}"

terraform apply --auto-approve