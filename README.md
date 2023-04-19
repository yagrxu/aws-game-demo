# aws-game-demo

# Cloud9 Creation

``` shell
CURRENT_REGION=`aws configure get region`

if [ ! -z "$CURRENT_REGION"]
then
  echo "use default region $CURRENT_REGION"
else
  echo "use default region us-east-1"
  CURRENT_REGION="us-east-1"
fi

DEFAULT_VPC_ID=`aws ec2 describe-vpcs --region us-east-1 | jq .Vpcs[0].VpcId -r`
DEFAULT_SUBNET_ID=`aws ec2 describe-subnets --region us-east-1 --filter Name=vpc-id,Values=$DEFAULT_VPC_ID | jq .Subnets[1].SubnetId -r`

aws cloud9 create-environment-ec2 --name demo \
--description "This environment is for demo" \
--instance-type m5.xlarge \
--image-id resolve:ssm:/aws/service/cloud9/amis/amazonlinux-2-x86_64 \
--region $CURRENT_REGION \
--connection-type CONNECT_SSH --subnet-id $DEFAULT_SUBNET_ID
```
## License
This library is licensed under the MIT-0 License. See the LICENSE file.
