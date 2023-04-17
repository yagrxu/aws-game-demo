#!/bin/bash

export TFSTATE_KEY=gaming/demo/cannon-mosquito-server
export TFSTATE_BUCKET=<BUCKET-NAME>
export TFSTATE_REGION=ap-southeast-1
export AWS_DEFAULT_REGION=ap-southeast-1

cd infra
# in case backend changed, please use '-reconfigure' parameter
terraform init -backend-config="bucket=${TFSTATE_BUCKET}" -backend-config="key=${TFSTATE_KEY}" -backend-config="region=${TFSTATE_REGION}"

terraform apply --auto-approve
