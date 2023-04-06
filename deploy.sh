#!/bin/bash

sh ./prebuild.sh
sh ./env-setup.sh

cd tf
terraform init -backend-config="bucket=${TFSTATE_BUCKET}" -backend-config="key=${TFSTATE_KEY}" -backend-config="region=${TFSTATE_REGION}"
terraform apply --auto-approve