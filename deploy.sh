#!/bin/bash

sh ./prebuild.sh

TFSTATE_REGION=$1
if [ -z "$1" ]; then
  echo "set TFSTATE_REGION to default ap-southeast-1"
  TFSTATE_REGION=ap-southeast-1
fi

AWS_DEFAULT_REGION=$2
if [ -z "$2" ]; then
  echo "set AWS_DEFAULT_REGION to default ap-southeast-1"
  AWS_DEFAULT_REGION=ap-southeast-1
fi

export TFSTATE_KEY=gaming/demo/cannon-mosquito-server-$AWS_DEFAULT_REGION
export TFSTATE_BUCKET=my-tfstate-`aws sts get-caller-identity --query "Account" --output text`
export TFSTATE_REGION=$TFSTATE_REGION
export AWS_REGION=$AWS_DEFAULT_REGION

cd tf
# in case backend changed, please use '-reconfigure' parameter
terraform init -backend-config="bucket=${TFSTATE_BUCKET}" -backend-config="key=${TFSTATE_KEY}" -backend-config="region=${TFSTATE_REGION}" -reconfigure

terraform apply --auto-approve