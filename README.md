# How to Deploy

## Deploy using CI/CD

Please follow the [workshop](https://catalog.us-east-1.prod.workshops.aws/workshops/518de899-dddc-49fa-ae00-aa375d359d1e/zh-CN/-prerequisite) to deploy it using CI/CD services in AWS.

## Deploy from Local

### Setup Cloud9 environment

``` shell
CURRENT_REGION=`aws configure get region`

if [ ! -z "$CURRENT_REGION"]
then
  echo "use default region $CURRENT_REGION"
else
  echo "use default region ap-southeast-1"
  CURRENT_REGION="ap-southeast-1"
fi

DEFAULT_VPC_ID=`aws ec2 describe-vpcs --region $CURRENT_REGION | jq .Vpcs[0].VpcId -r`
DEFAULT_SUBNET_ID=`aws ec2 describe-subnets --region $CURRENT_REGION --filter Name=vpc-id,Values=$DEFAULT_VPC_ID | jq .Subnets[1].SubnetId -r`

aws cloud9 create-environment-ec2 --name demo \
--description "This environment is for demo" \
--instance-type m5.xlarge \
--image-id resolve:ssm:/aws/service/cloud9/amis/amazonlinux-2-x86_64 \
--region $CURRENT_REGION \
--connection-type CONNECT_SSH --subnet-id $DEFAULT_SUBNET_ID

```

### Deploy with Terraform

1. Create S3 Bucket

  ```shell
  aws s3 mb s3://my-tfstate-`aws sts get-caller-identity --query "Account" --output text` --region $CURRENT_REGION
  ```

2. Run Terraform

```shell
sh ./deploy.sh $CURRENT_REGION $CURRENT_REGION
```

**Note!** If you encounter problem during terraform init. Change the content below in `deploy.sh`

```shell
# add "-reconfigure" at the end of terraform init command
terraform init -backend-config="bucket=${TFSTATE_BUCKET}" -backend-config="key=${TFSTATE_KEY}" -backend-config="region=${TFSTATE_REGION}" -reconfigure
```

### Clean Up

```shell
sh ./destroy.sh $CURRENT_REGION $CURRENT_REGION
```

## License

This library is licensed under the MIT-0 License. See the LICENSE file.