#!/bin/bash

export TFSTATE_KEY=gaming/demo/cannon-mosquito-cicd
export TFSTATE_BUCKET=$(aws s3 ls --output text | awk '{print $3}' | grep tfstate-)
export TFSTATE_REGION=ap-southeast-1
export AWS_DEFAULT_REGION=us-east-1

cd cicd
# in case backend changed, please use '-reconfigure' parameter
terraform init -backend-config="bucket=${TFSTATE_BUCKET}" -backend-config="key=${TFSTATE_KEY}" -backend-config="region=${TFSTATE_REGION}" -reconfigure

terraform apply --auto-approve