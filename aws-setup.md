# AWS Deployment Setup Guide

This guide will help you deploy the JobBoard application using AWS CodePipeline, CodeBuild, CodeDeploy, and ECS.

## Prerequisites

- AWS CLI installed and configured
- Docker installed locally (for testing)
- AWS Account with appropriate permissions
- GitHub repository with your code

## Architecture Overview

- **ECS Fargate**: Container orchestration
- **ECR**: Docker image registry
- **CodePipeline**: CI/CD orchestration
- **CodeBuild**: Build Docker images
- **CodeDeploy**: Blue/Green deployment to ECS
- **RDS PostgreSQL**: Database
- **Application Load Balancer**: Traffic routing
- **Secrets Manager**: Secure credential storage

## Step 1: Create ECR Repositories

```bash
# Create backend repository
aws ecr create-repository --repository-name jobboard-backend --region us-east-1

# Create frontend repository
aws ecr create-repository --repository-name jobboard-frontend --region us-east-1
```

## Step 2: Create VPC and Networking (if not exists)

```bash
# Use default VPC or create a new one
# Note your VPC ID, Subnet IDs, and Security Group IDs
aws ec2 describe-vpcs
aws ec2 describe-subnets
```

## Step 3: Create RDS PostgreSQL Database

```bash
aws rds create-db-instance \
    --db-instance-identifier jobboard-db \
    --db-instance-class db.t3.micro \
    --engine postgres \
    --master-username postgres \
    --master-user-password <YOUR_SECURE_PASSWORD> \
    --allocated-storage 20 \
    --vpc-security-group-ids <SECURITY_GROUP_ID> \
    --db-name jobboard \
    --backup-retention-period 7 \
    --region us-east-1
```

## Step 4: Store Secrets in AWS Secrets Manager

```bash
# Store database password
aws secretsmanager create-secret \
    --name jobboard/db-password \
    --secret-string "<YOUR_DB_PASSWORD>" \
    --region us-east-1

# Store JWT secret
aws secretsmanager create-secret \
    --name jobboard/jwt-secret \
    --secret-string "<YOUR_JWT_SECRET>" \
    --region us-east-1
```

## Step 5: Create IAM Roles

### ECS Task Execution Role

```bash
# Create trust policy file
cat > ecs-task-execution-trust-policy.json << EOF
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Principal": {
        "Service": "ecs-tasks.amazonaws.com"
      },
      "Action": "sts:AssumeRole"
    }
  ]
}
EOF

# Create role
aws iam create-role \
    --role-name ecsTaskExecutionRole \
    --assume-role-policy-document file://ecs-task-execution-trust-policy.json

# Attach AWS managed policy
aws iam attach-role-policy \
    --role-name ecsTaskExecutionRole \
    --policy-arn arn:aws:iam::aws:policy/service-role/AmazonECSTaskExecutionRolePolicy

# Create custom policy for Secrets Manager access
cat > ecs-secrets-policy.json << EOF
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Action": [
        "secretsmanager:GetSecretValue"
      ],
      "Resource": [
        "arn:aws:secretsmanager:*:*:secret:jobboard/*"
      ]
    }
  ]
}
EOF

aws iam put-role-policy \
    --role-name ecsTaskExecutionRole \
    --policy-name SecretsManagerAccess \
    --policy-document file://ecs-secrets-policy.json
```

### ECS Task Role

```bash
cat > ecs-task-trust-policy.json << EOF
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Principal": {
        "Service": "ecs-tasks.amazonaws.com"
      },
      "Action": "sts:AssumeRole"
    }
  ]
}
EOF

aws iam create-role \
    --role-name ecsTaskRole \
    --assume-role-policy-document file://ecs-task-trust-policy.json
```

### CodeBuild Service Role

```bash
cat > codebuild-trust-policy.json << EOF
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Principal": {
        "Service": "codebuild.amazonaws.com"
      },
      "Action": "sts:AssumeRole"
    }
  ]
}
EOF

aws iam create-role \
    --role-name CodeBuildServiceRole \
    --assume-role-policy-document file://codebuild-trust-policy.json

# Attach necessary policies
aws iam attach-role-policy \
    --role-name CodeBuildServiceRole \
    --policy-arn arn:aws:iam::aws:policy/AmazonEC2ContainerRegistryPowerUser

aws iam attach-role-policy \
    --role-name CodeBuildServiceRole \
    --policy-arn arn:aws:iam::aws:policy/CloudWatchLogsFullAccess
```

## Step 6: Create ECS Cluster

```bash
aws ecs create-cluster \
    --cluster-name jobboard-cluster \
    --region us-east-1
```

## Step 7: Create CloudWatch Log Group

```bash
aws logs create-log-group \
    --log-group-name /ecs/jobboard \
    --region us-east-1
```

## Step 8: Create Application Load Balancer

```bash
# Create ALB
aws elbv2 create-load-balancer \
    --name jobboard-alb \
    --subnets <SUBNET_1> <SUBNET_2> \
    --security-groups <SECURITY_GROUP_ID> \
    --region us-east-1

# Create target groups
aws elbv2 create-target-group \
    --name jobboard-tg-blue \
    --protocol HTTP \
    --port 80 \
    --vpc-id <VPC_ID> \
    --target-type ip \
    --health-check-path / \
    --region us-east-1

aws elbv2 create-target-group \
    --name jobboard-tg-green \
    --protocol HTTP \
    --port 80 \
    --vpc-id <VPC_ID> \
    --target-type ip \
    --health-check-path / \
    --region us-east-1

# Create listener
aws elbv2 create-listener \
    --load-balancer-arn <ALB_ARN> \
    --protocol HTTP \
    --port 80 \
    --default-actions Type=forward,TargetGroupArn=<TARGET_GROUP_ARN>
```

## Step 9: Update Configuration Files

Update the following files with your AWS account details:

1. **taskdef.json**: Replace placeholders
   - `<AWS_ACCOUNT_ID>`
   - `<AWS_REGION>`
   - `<RDS_ENDPOINT>`

2. **appspec.yaml**: Replace placeholders
   - `<SUBNET_1>`, `<SUBNET_2>`
   - `<SECURITY_GROUP>`

3. **buildspec.yml**: Set environment variables in CodeBuild

## Step 10: Create ECS Service

```bash
aws ecs create-service \
    --cluster jobboard-cluster \
    --service-name jobboard-service \
    --task-definition jobboard-task \
    --desired-count 1 \
    --launch-type FARGATE \
    --network-configuration "awsvpcConfiguration={subnets=[<SUBNET_1>,<SUBNET_2>],securityGroups=[<SECURITY_GROUP>],assignPublicIp=ENABLED}" \
    --load-balancers targetGroupArn=<TARGET_GROUP_ARN>,containerName=frontend,containerPort=80 \
    --deployment-controller type=CODE_DEPLOY \
    --region us-east-1
```

## Step 11: Create CodeDeploy Application

```bash
# Create application
aws deploy create-application \
    --application-name jobboard-app \
    --compute-platform ECS \
    --region us-east-1

# Create deployment group
aws deploy create-deployment-group \
    --application-name jobboard-app \
    --deployment-group-name jobboard-dg \
    --service-role-arn arn:aws:iam::<ACCOUNT_ID>:role/CodeDeployServiceRole \
    --deployment-config-name CodeDeployDefault.ECSAllAtOnce \
    --ecs-services clusterName=jobboard-cluster,serviceName=jobboard-service \
    --load-balancer-info targetGroupPairInfoList="[{targetGroups=[{name=jobboard-tg-blue},{name=jobboard-tg-green}],prodTrafficRoute={listenerArns=[<LISTENER_ARN>]}}]" \
    --blue-green-deployment-configuration "terminateBlueInstancesOnDeploymentSuccess={action=TERMINATE,terminationWaitTimeInMinutes=5},deploymentReadyOption={actionOnTimeout=CONTINUE_DEPLOYMENT}" \
    --region us-east-1
```

## Step 12: Create CodeBuild Project

```bash
aws codebuild create-project \
    --name jobboard-build \
    --source type=GITHUB,location=https://github.com/<YOUR_USERNAME>/<YOUR_REPO>.git \
    --artifacts type=NO_ARTIFACTS \
    --environment type=LINUX_CONTAINER,image=aws/codebuild/standard:7.0,computeType=BUILD_GENERAL1_SMALL,privilegedMode=true \
    --service-role arn:aws:iam::<ACCOUNT_ID>:role/CodeBuildServiceRole \
    --region us-east-1
```

## Step 13: Create CodePipeline

```bash
# Create pipeline using AWS Console or CLI
# The pipeline should have 3 stages:
# 1. Source (GitHub)
# 2. Build (CodeBuild)
# 3. Deploy (CodeDeploy to ECS)
```

You can create this via the AWS Console for easier configuration:
1. Go to CodePipeline
2. Create new pipeline
3. Connect to GitHub
4. Add CodeBuild as build stage
5. Add CodeDeploy as deploy stage

## Step 14: Set Environment Variables in CodeBuild

In CodeBuild project settings, add these environment variables:
- `AWS_ACCOUNT_ID`: Your AWS account ID
- `AWS_DEFAULT_REGION`: Your AWS region (e.g., us-east-1)

## Testing

1. Push code to your GitHub repository
2. CodePipeline will automatically trigger
3. CodeBuild will build Docker images and push to ECR
4. CodeDeploy will perform blue/green deployment to ECS
5. Access your application via the ALB DNS name

## Monitoring

- **CloudWatch Logs**: `/ecs/jobboard`
- **ECS Console**: Monitor service health
- **CodePipeline**: View pipeline execution
- **ALB**: Monitor target health

## Cleanup

To delete all resources:

```bash
# Delete ECS service
aws ecs delete-service --cluster jobboard-cluster --service jobboard-service --force

# Delete ECS cluster
aws ecs delete-cluster --cluster jobboard-cluster

# Delete RDS instance
aws rds delete-db-instance --db-instance-identifier jobboard-db --skip-final-snapshot

# Delete ECR repositories
aws ecr delete-repository --repository-name jobboard-backend --force
aws ecr delete-repository --repository-name jobboard-frontend --force

# Delete other resources as needed
```

## Cost Optimization Tips

- Use Fargate Spot for non-production environments
- Enable auto-scaling based on CPU/memory
- Use smaller instance types during off-peak hours
- Clean up old ECR images regularly
- Use RDS reserved instances for production

## Security Best Practices

- Enable VPC endpoints for ECR, Secrets Manager
- Use private subnets for ECS tasks
- Enable CloudTrail for audit logging
- Rotate secrets regularly
- Use AWS WAF with ALB
- Enable container image scanning in ECR
