# JobBoard Application - Complete AWS Deployment Guide

A full-stack job board application with React frontend and Node.js backend, deployed on AWS using ECS, CodePipeline, CodeBuild, and CodeDeploy.

## Table of Contents

- [Overview](#overview)
- [Architecture](#architecture)
- [Prerequisites](#prerequisites)
- [Part 1: Local Development Setup](#part-1-local-development-setup)
- [Part 2: AWS Account Preparation](#part-2-aws-account-preparation)
- [Part 3: AWS Infrastructure Setup](#part-3-aws-infrastructure-setup)
- [Part 4: Application Configuration](#part-4-application-configuration)
- [Part 5: CI/CD Pipeline Setup](#part-5-cicd-pipeline-setup)
- [Part 6: Deployment](#part-6-deployment)
- [Part 7: Post-Deployment](#part-7-post-deployment)
- [Monitoring and Maintenance](#monitoring-and-maintenance)
- [Troubleshooting](#troubleshooting)
- [Cost Optimization](#cost-optimization)
- [Cleanup](#cleanup)

---

## Overview

This application consists of:
- **Frontend**: React.js with Vite, served via Nginx
- **Backend**: Node.js with Express, Sequelize ORM
- **Database**: PostgreSQL (RDS)
- **Deployment**: AWS ECS Fargate with Blue/Green deployment
- **CI/CD**: CodePipeline → CodeBuild → CodeDeploy

---

## Architecture

```
GitHub Repository
       ↓
CodePipeline (Orchestration)
       ↓
CodeBuild (Build & Push Docker Images)
       ↓
Amazon ECR (Container Registry)
       ↓
CodeDeploy (Blue/Green Deployment)
       ↓
ECS Fargate (Container Orchestration)
       ↓
Application Load Balancer
       ↓
Users
```

**Infrastructure Components:**
- VPC with public/private subnets
- Application Load Balancer (ALB)
- ECS Cluster with Fargate
- RDS PostgreSQL Database
- ECR Repositories
- CloudWatch Logs
- Secrets Manager
- IAM Roles and Policies

---

## Prerequisites

### Required Software (Local Machine)
1. **Git**: [Download Git](https://git-scm.com/downloads)
2. **Node.js** (v18 or higher): [Download Node.js](https://nodejs.org/)
3. **Docker Desktop**: [Download Docker](https://www.docker.com/products/docker-desktop)
4. **AWS CLI v2**: [Download AWS CLI](https://aws.amazon.com/cli/)
5. **Code Editor**: VS Code, Sublime, etc.

### AWS Account Requirements
- Active AWS Account
- Admin access or permissions for:
  - EC2, ECS, ECR
  - RDS, VPC
  - IAM, Secrets Manager
  - CodePipeline, CodeBuild, CodeDeploy
  - CloudWatch, Application Load Balancer
- Credit card on file (AWS Free Tier eligible)

### Knowledge Requirements
- Basic understanding of Docker
- Familiarity with AWS Console
- Basic command line usage
- Understanding of Git

---

## Part 1: Local Development Setup

### Step 1.1: Clone the Repository

```bash
# Navigate to your projects directory
cd /path/to/your/projects

# Clone your repository (replace with your repo URL)
git clone https://github.com/yourusername/jobboard.git
cd jobboard
```

### Step 1.2: Install Backend Dependencies

```bash
# Navigate to backend directory
cd backend

# Install dependencies
npm install

# Return to root
cd ..
```

### Step 1.3: Install Frontend Dependencies

```bash
# Navigate to frontend directory
cd frontend

# Install dependencies
npm install

# Return to root
cd ..
```

### Step 1.4: Set Up Local Environment Variables

Create `.env` file in the backend directory:

```bash
# Create .env file
cd backend
cat > .env << EOF
PORT=4000
NODE_ENV=development
DB_HOST=localhost
DB_PORT=5432
DB_NAME=jobboard
DB_USER=postgres
DB_PASSWORD=yourpassword
JWT_SECRET=your-super-secret-jwt-key-change-this
EOF
cd ..
```

### Step 1.5: Test Dockerfiles Locally (Optional)

```bash
# Test backend Docker build
cd backend
docker build -t jobboard-backend:local .
cd ..

# Test frontend Docker build
cd frontend
docker build -t jobboard-frontend:local .
cd ..
```

---

## Part 2: AWS Account Preparation

### Step 2.1: Install and Configure AWS CLI

```bash
# Verify AWS CLI installation
aws --version

# Configure AWS CLI with your credentials
aws configure
```

You'll be prompted for:
- **AWS Access Key ID**: Your access key
- **AWS Secret Access Key**: Your secret key
- **Default region**: `us-east-1` (or your preferred region)
- **Default output format**: `json`

**To get AWS credentials:**
1. Log into AWS Console
2. Navigate to IAM → Users → Your Username
3. Click "Security credentials" tab
4. Click "Create access key"
5. Download and save the credentials

### Step 2.2: Set Environment Variables

```bash
# For Linux/Mac
export AWS_ACCOUNT_ID=$(aws sts get-caller-identity --query Account --output text)
export AWS_REGION=us-east-1

# For Windows PowerShell
$env:AWS_ACCOUNT_ID = (aws sts get-caller-identity --query Account --output text)
$env:AWS_REGION = "us-east-1"
```

### Step 2.3: Verify AWS Access

```bash
# Verify your AWS identity
aws sts get-caller-identity

# List available regions
aws ec2 describe-regions --output table
```

---

## Part 3: AWS Infrastructure Setup

### Step 3.1: Create VPC and Networking

#### Option A: Use Default VPC (Easier for beginners)

```bash
# Get your default VPC ID
aws ec2 describe-vpcs --filters "Name=isDefault,Values=true" --query "Vpcs[0].VpcId" --output text

# Save the VPC ID
export VPC_ID=<your-vpc-id>
```

#### Option B: Create New VPC (Recommended for production)

```bash
# Create VPC
aws ec2 create-vpc \
    --cidr-block 10.0.0.0/16 \
    --tag-specifications 'ResourceType=vpc,Tags=[{Key=Name,Value=jobboard-vpc}]' \
    --region $AWS_REGION

# Save the VPC ID from output
export VPC_ID=<vpc-id-from-output>

# Create Internet Gateway
aws ec2 create-internet-gateway \
    --tag-specifications 'ResourceType=internet-gateway,Tags=[{Key=Name,Value=jobboard-igw}]' \
    --region $AWS_REGION

# Save IGW ID
export IGW_ID=<igw-id-from-output>

# Attach Internet Gateway to VPC
aws ec2 attach-internet-gateway \
    --vpc-id $VPC_ID \
    --internet-gateway-id $IGW_ID \
    --region $AWS_REGION

# Create Public Subnet 1 (us-east-1a)
aws ec2 create-subnet \
    --vpc-id $VPC_ID \
    --cidr-block 10.0.1.0/24 \
    --availability-zone us-east-1a \
    --tag-specifications 'ResourceType=subnet,Tags=[{Key=Name,Value=jobboard-public-1a}]' \
    --region $AWS_REGION

# Save Subnet ID
export SUBNET_1=<subnet-id-from-output>

# Create Public Subnet 2 (us-east-1b)
aws ec2 create-subnet \
    --vpc-id $VPC_ID \
    --cidr-block 10.0.2.0/24 \
    --availability-zone us-east-1b \
    --tag-specifications 'ResourceType=subnet,Tags=[{Key=Name,Value=jobboard-public-1b}]' \
    --region $AWS_REGION

# Save Subnet ID
export SUBNET_2=<subnet-id-from-output>

# Create route table
aws ec2 create-route-table \
    --vpc-id $VPC_ID \
    --tag-specifications 'ResourceType=route-table,Tags=[{Key=Name,Value=jobboard-public-rt}]' \
    --region $AWS_REGION

# Save Route Table ID
export RT_ID=<route-table-id-from-output>

# Create route to Internet Gateway
aws ec2 create-route \
    --route-table-id $RT_ID \
    --destination-cidr-block 0.0.0.0/0 \
    --gateway-id $IGW_ID \
    --region $AWS_REGION

# Associate route table with subnets
aws ec2 associate-route-table \
    --subnet-id $SUBNET_1 \
    --route-table-id $RT_ID \
    --region $AWS_REGION

aws ec2 associate-route-table \
    --subnet-id $SUBNET_2 \
    --route-table-id $RT_ID \
    --region $AWS_REGION
```

#### Get Subnet IDs (if using default VPC)

```bash
# List subnets in your VPC
aws ec2 describe-subnets \
    --filters "Name=vpc-id,Values=$VPC_ID" \
    --query "Subnets[*].[SubnetId,AvailabilityZone,CidrBlock]" \
    --output table

# Pick two subnets in different availability zones
export SUBNET_1=<subnet-id-1>
export SUBNET_2=<subnet-id-2>
```

### Step 3.2: Create Security Groups

```bash
# Create ALB Security Group
aws ec2 create-security-group \
    --group-name jobboard-alb-sg \
    --description "Security group for JobBoard ALB" \
    --vpc-id $VPC_ID \
    --region $AWS_REGION

# Save ALB SG ID
export ALB_SG_ID=<sg-id-from-output>

# Allow HTTP traffic to ALB
aws ec2 authorize-security-group-ingress \
    --group-id $ALB_SG_ID \
    --protocol tcp \
    --port 80 \
    --cidr 0.0.0.0/0 \
    --region $AWS_REGION

# Allow HTTPS traffic to ALB (optional)
aws ec2 authorize-security-group-ingress \
    --group-id $ALB_SG_ID \
    --protocol tcp \
    --port 443 \
    --cidr 0.0.0.0/0 \
    --region $AWS_REGION

# Create ECS Security Group
aws ec2 create-security-group \
    --group-name jobboard-ecs-sg \
    --description "Security group for JobBoard ECS tasks" \
    --vpc-id $VPC_ID \
    --region $AWS_REGION

# Save ECS SG ID
export ECS_SG_ID=<sg-id-from-output>

# Allow traffic from ALB to ECS on port 80
aws ec2 authorize-security-group-ingress \
    --group-id $ECS_SG_ID \
    --protocol tcp \
    --port 80 \
    --source-group $ALB_SG_ID \
    --region $AWS_REGION

# Allow traffic from ALB to ECS on port 4000 (backend)
aws ec2 authorize-security-group-ingress \
    --group-id $ECS_SG_ID \
    --protocol tcp \
    --port 4000 \
    --source-group $ALB_SG_ID \
    --region $AWS_REGION

# Create RDS Security Group
aws ec2 create-security-group \
    --group-name jobboard-rds-sg \
    --description "Security group for JobBoard RDS" \
    --vpc-id $VPC_ID \
    --region $AWS_REGION

# Save RDS SG ID
export RDS_SG_ID=<sg-id-from-output>

# Allow PostgreSQL traffic from ECS to RDS
aws ec2 authorize-security-group-ingress \
    --group-id $RDS_SG_ID \
    --protocol tcp \
    --port 5432 \
    --source-group $ECS_SG_ID \
    --region $AWS_REGION
```

### Step 3.3: Create RDS PostgreSQL Database

```bash
# Create DB subnet group
aws rds create-db-subnet-group \
    --db-subnet-group-name jobboard-db-subnet-group \
    --db-subnet-group-description "Subnet group for JobBoard database" \
    --subnet-ids $SUBNET_1 $SUBNET_2 \
    --region $AWS_REGION

# Generate a strong password
export DB_PASSWORD=$(openssl rand -base64 32)
echo "Database Password: $DB_PASSWORD"
# SAVE THIS PASSWORD SECURELY!

# Create RDS instance (this takes 5-10 minutes)
aws rds create-db-instance \
    --db-instance-identifier jobboard-db \
    --db-instance-class db.t3.micro \
    --engine postgres \
    --engine-version 14.7 \
    --master-username postgres \
    --master-user-password "$DB_PASSWORD" \
    --allocated-storage 20 \
    --vpc-security-group-ids $RDS_SG_ID \
    --db-subnet-group-name jobboard-db-subnet-group \
    --db-name jobboard \
    --backup-retention-period 7 \
    --publicly-accessible false \
    --storage-encrypted \
    --region $AWS_REGION

# Wait for RDS to be available (check status)
aws rds wait db-instance-available \
    --db-instance-identifier jobboard-db \
    --region $AWS_REGION

# Get RDS endpoint
export RDS_ENDPOINT=$(aws rds describe-db-instances \
    --db-instance-identifier jobboard-db \
    --query "DBInstances[0].Endpoint.Address" \
    --output text \
    --region $AWS_REGION)

echo "RDS Endpoint: $RDS_ENDPOINT"
```

### Step 3.4: Create Secrets in AWS Secrets Manager

```bash
# Generate JWT secret
export JWT_SECRET=$(openssl rand -base64 64)
echo "JWT Secret: $JWT_SECRET"

# Store database password in Secrets Manager
aws secretsmanager create-secret \
    --name jobboard/db-password \
    --description "JobBoard database password" \
    --secret-string "$DB_PASSWORD" \
    --region $AWS_REGION

# Store JWT secret in Secrets Manager
aws secretsmanager create-secret \
    --name jobboard/jwt-secret \
    --description "JobBoard JWT secret" \
    --secret-string "$JWT_SECRET" \
    --region $AWS_REGION

# Verify secrets were created
aws secretsmanager list-secrets \
    --query "SecretList[?starts_with(Name, 'jobboard/')].Name" \
    --output table \
    --region $AWS_REGION
```

### Step 3.5: Create ECR Repositories

```bash
# Create backend repository
aws ecr create-repository \
    --repository-name jobboard-backend \
    --image-scanning-configuration scanOnPush=true \
    --region $AWS_REGION

# Save backend repository URI
export BACKEND_REPO_URI=$(aws ecr describe-repositories \
    --repository-names jobboard-backend \
    --query "repositories[0].repositoryUri" \
    --output text \
    --region $AWS_REGION)

echo "Backend Repository: $BACKEND_REPO_URI"

# Create frontend repository
aws ecr create-repository \
    --repository-name jobboard-frontend \
    --image-scanning-configuration scanOnPush=true \
    --region $AWS_REGION

# Save frontend repository URI
export FRONTEND_REPO_URI=$(aws ecr describe-repositories \
    --repository-names jobboard-frontend \
    --query "repositories[0].repositoryUri" \
    --output text \
    --region $AWS_REGION)

echo "Frontend Repository: $FRONTEND_REPO_URI"
```

### Step 3.6: Create IAM Roles

#### ECS Task Execution Role

```bash
# Create trust policy file
cat > ecs-task-execution-trust-policy.json << 'EOF'
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

# Create the role
aws iam create-role \
    --role-name ecsTaskExecutionRole \
    --assume-role-policy-document file://ecs-task-execution-trust-policy.json

# Attach AWS managed policy
aws iam attach-role-policy \
    --role-name ecsTaskExecutionRole \
    --policy-arn arn:aws:iam::aws:policy/service-role/AmazonECSTaskExecutionRolePolicy

# Create custom policy for Secrets Manager
cat > ecs-secrets-policy.json << EOF
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Action": [
        "secretsmanager:GetSecretValue",
        "secretsmanager:DescribeSecret"
      ],
      "Resource": [
        "arn:aws:secretsmanager:$AWS_REGION:$AWS_ACCOUNT_ID:secret:jobboard/*"
      ]
    },
    {
      "Effect": "Allow",
      "Action": [
        "logs:CreateLogGroup",
        "logs:CreateLogStream",
        "logs:PutLogEvents"
      ],
      "Resource": "*"
    }
  ]
}
EOF

# Attach custom policy
aws iam put-role-policy \
    --role-name ecsTaskExecutionRole \
    --policy-name SecretsAndLogsAccess \
    --policy-document file://ecs-secrets-policy.json
```

#### ECS Task Role

```bash
# Create trust policy
cat > ecs-task-trust-policy.json << 'EOF'
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

# Create the role
aws iam create-role \
    --role-name ecsTaskRole \
    --assume-role-policy-document file://ecs-task-trust-policy.json

# You can attach additional policies as needed for your application
```

#### CodeBuild Service Role

```bash
# Create trust policy
cat > codebuild-trust-policy.json << 'EOF'
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

# Create the role
aws iam create-role \
    --role-name CodeBuildServiceRole \
    --assume-role-policy-document file://codebuild-trust-policy.json

# Create CodeBuild policy
cat > codebuild-policy.json << EOF
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Action": [
        "logs:CreateLogGroup",
        "logs:CreateLogStream",
        "logs:PutLogEvents"
      ],
      "Resource": "*"
    },
    {
      "Effect": "Allow",
      "Action": [
        "ecr:GetAuthorizationToken",
        "ecr:BatchCheckLayerAvailability",
        "ecr:GetDownloadUrlForLayer",
        "ecr:BatchGetImage",
        "ecr:PutImage",
        "ecr:InitiateLayerUpload",
        "ecr:UploadLayerPart",
        "ecr:CompleteLayerUpload"
      ],
      "Resource": "*"
    },
    {
      "Effect": "Allow",
      "Action": [
        "s3:GetObject",
        "s3:PutObject"
      ],
      "Resource": "*"
    }
  ]
}
EOF

# Attach policy
aws iam put-role-policy \
    --role-name CodeBuildServiceRole \
    --policy-name CodeBuildPolicy \
    --policy-document file://codebuild-policy.json
```

#### CodeDeploy Service Role

```bash
# Create trust policy
cat > codedeploy-trust-policy.json << 'EOF'
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Principal": {
        "Service": "codedeploy.amazonaws.com"
      },
      "Action": "sts:AssumeRole"
    }
  ]
}
EOF

# Create the role
aws iam create-role \
    --role-name CodeDeployServiceRole \
    --assume-role-policy-document file://codedeploy-trust-policy.json

# Attach AWS managed policy for ECS
aws iam attach-role-policy \
    --role-name CodeDeployServiceRole \
    --policy-arn arn:aws:iam::aws:policy/AWSCodeDeployRoleForECS
```

#### CodePipeline Service Role

```bash
# Create trust policy
cat > codepipeline-trust-policy.json << 'EOF'
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Principal": {
        "Service": "codepipeline.amazonaws.com"
      },
      "Action": "sts:AssumeRole"
    }
  ]
}
EOF

# Create the role
aws iam create-role \
    --role-name CodePipelineServiceRole \
    --assume-role-policy-document file://codepipeline-trust-policy.json

# Create CodePipeline policy
cat > codepipeline-policy.json << EOF
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Action": [
        "s3:GetObject",
        "s3:GetObjectVersion",
        "s3:PutObject",
        "s3:GetBucketLocation",
        "s3:ListBucket"
      ],
      "Resource": "*"
    },
    {
      "Effect": "Allow",
      "Action": [
        "codebuild:BatchGetBuilds",
        "codebuild:StartBuild"
      ],
      "Resource": "*"
    },
    {
      "Effect": "Allow",
      "Action": [
        "codedeploy:CreateDeployment",
        "codedeploy:GetApplication",
        "codedeploy:GetApplicationRevision",
        "codedeploy:GetDeployment",
        "codedeploy:GetDeploymentConfig",
        "codedeploy:RegisterApplicationRevision"
      ],
      "Resource": "*"
    },
    {
      "Effect": "Allow",
      "Action": [
        "ecs:*"
      ],
      "Resource": "*"
    },
    {
      "Effect": "Allow",
      "Action": [
        "iam:PassRole"
      ],
      "Resource": "*"
    }
  ]
}
EOF

# Attach policy
aws iam put-role-policy \
    --role-name CodePipelineServiceRole \
    --policy-name CodePipelinePolicy \
    --policy-document file://codepipeline-policy.json
```

### Step 3.7: Create CloudWatch Log Group

```bash
# Create log group
aws logs create-log-group \
    --log-group-name /ecs/jobboard \
    --region $AWS_REGION

# Set retention policy (optional, 7 days)
aws logs put-retention-policy \
    --log-group-name /ecs/jobboard \
    --retention-in-days 7 \
    --region $AWS_REGION
```

### Step 3.8: Create Application Load Balancer

```bash
# Create ALB
aws elbv2 create-load-balancer \
    --name jobboard-alb \
    --subnets $SUBNET_1 $SUBNET_2 \
    --security-groups $ALB_SG_ID \
    --scheme internet-facing \
    --type application \
    --ip-address-type ipv4 \
    --region $AWS_REGION

# Save ALB ARN
export ALB_ARN=$(aws elbv2 describe-load-balancers \
    --names jobboard-alb \
    --query "LoadBalancers[0].LoadBalancerArn" \
    --output text \
    --region $AWS_REGION)

# Get ALB DNS name (you'll use this to access your app)
export ALB_DNS=$(aws elbv2 describe-load-balancers \
    --names jobboard-alb \
    --query "LoadBalancers[0].DNSName" \
    --output text \
    --region $AWS_REGION)

echo "ALB DNS: $ALB_DNS"

# Create target group 1 (Blue)
aws elbv2 create-target-group \
    --name jobboard-tg-blue \
    --protocol HTTP \
    --port 80 \
    --vpc-id $VPC_ID \
    --target-type ip \
    --health-check-enabled \
    --health-check-path / \
    --health-check-interval-seconds 30 \
    --health-check-timeout-seconds 5 \
    --healthy-threshold-count 2 \
    --unhealthy-threshold-count 3 \
    --region $AWS_REGION

# Save Blue TG ARN
export TG_BLUE_ARN=$(aws elbv2 describe-target-groups \
    --names jobboard-tg-blue \
    --query "TargetGroups[0].TargetGroupArn" \
    --output text \
    --region $AWS_REGION)

# Create target group 2 (Green)
aws elbv2 create-target-group \
    --name jobboard-tg-green \
    --protocol HTTP \
    --port 80 \
    --vpc-id $VPC_ID \
    --target-type ip \
    --health-check-enabled \
    --health-check-path / \
    --health-check-interval-seconds 30 \
    --health-check-timeout-seconds 5 \
    --healthy-threshold-count 2 \
    --unhealthy-threshold-count 3 \
    --region $AWS_REGION

# Save Green TG ARN
export TG_GREEN_ARN=$(aws elbv2 describe-target-groups \
    --names jobboard-tg-green \
    --query "TargetGroups[0].TargetGroupArn" \
    --output text \
    --region $AWS_REGION)

# Create ALB listener
aws elbv2 create-listener \
    --load-balancer-arn $ALB_ARN \
    --protocol HTTP \
    --port 80 \
    --default-actions Type=forward,TargetGroupArn=$TG_BLUE_ARN \
    --region $AWS_REGION

# Save Listener ARN
export LISTENER_ARN=$(aws elbv2 describe-listeners \
    --load-balancer-arn $ALB_ARN \
    --query "Listeners[0].ListenerArn" \
    --output text \
    --region $AWS_REGION)
```

### Step 3.9: Create ECS Cluster

```bash
# Create ECS cluster
aws ecs create-cluster \
    --cluster-name jobboard-cluster \
    --region $AWS_REGION

# Verify cluster creation
aws ecs describe-clusters \
    --clusters jobboard-cluster \
    --region $AWS_REGION
```

---

## Part 4: Application Configuration

### Step 4.1: Update Task Definition File

Open `taskdef.json` and replace all placeholders:

```bash
# Use sed to replace placeholders (Linux/Mac)
sed -i "s/<AWS_ACCOUNT_ID>/$AWS_ACCOUNT_ID/g" taskdef.json
sed -i "s/<AWS_REGION>/$AWS_REGION/g" taskdef.json
sed -i "s/<RDS_ENDPOINT>/$RDS_ENDPOINT/g" taskdef.json

# For Windows PowerShell, use:
(Get-Content taskdef.json) -replace '<AWS_ACCOUNT_ID>', $env:AWS_ACCOUNT_ID | Set-Content taskdef.json
(Get-Content taskdef.json) -replace '<AWS_REGION>', $env:AWS_REGION | Set-Content taskdef.json
(Get-Content taskdef.json) -replace '<RDS_ENDPOINT>', $env:RDS_ENDPOINT | Set-Content taskdef.json
```

### Step 4.2: Update AppSpec File

Open `appspec.yaml` and replace placeholders:

```bash
# Update appspec.yaml with your subnet and security group IDs
# Linux/Mac
sed -i "s/<SUBNET_1>/$SUBNET_1/g" appspec.yaml
sed -i "s/<SUBNET_2>/$SUBNET_2/g" appspec.yaml
sed -i "s/<SECURITY_GROUP>/$ECS_SG_ID/g" appspec.yaml

# Windows PowerShell
(Get-Content appspec.yaml) -replace '<SUBNET_1>', $env:SUBNET_1 | Set-Content appspec.yaml
(Get-Content appspec.yaml) -replace '<SUBNET_2>', $env:SUBNET_2 | Set-Content appspec.yaml
(Get-Content appspec.yaml) -replace '<SECURITY_GROUP>', $env:ECS_SG_ID | Set-Content appspec.yaml
```

### Step 4.3: Register ECS Task Definition

```bash
# Register the task definition
aws ecs register-task-definition \
    --cli-input-json file://taskdef.json \
    --region $AWS_REGION

# Verify task definition
aws ecs describe-task-definition \
    --task-definition jobboard-task \
    --region $AWS_REGION
```

### Step 4.4: Create ECS Service

```bash
# Create ECS service with CodeDeploy deployment controller
aws ecs create-service \
    --cluster jobboard-cluster \
    --service-name jobboard-service \
    --task-definition jobboard-task \
    --desired-count 1 \
    --launch-type FARGATE \
    --deployment-controller type=CODE_DEPLOY \
    --network-configuration "awsvpcConfiguration={subnets=[$SUBNET_1,$SUBNET_2],securityGroups=[$ECS_SG_ID],assignPublicIp=ENABLED}" \
    --load-balancers "targetGroupArn=$TG_BLUE_ARN,containerName=frontend,containerPort=80" \
    --region $AWS_REGION

# Wait for service to be stable
aws ecs wait services-stable \
    --cluster jobboard-cluster \
    --services jobboard-service \
    --region $AWS_REGION
```

---

## Part 5: CI/CD Pipeline Setup

### Step 5.1: Create S3 Bucket for CodePipeline Artifacts

```bash
# Create unique bucket name
export PIPELINE_BUCKET="jobboard-pipeline-artifacts-$AWS_ACCOUNT_ID"

# Create S3 bucket
aws s3 mb s3://$PIPELINE_BUCKET --region $AWS_REGION

# Enable versioning
aws s3api put-bucket-versioning \
    --bucket $PIPELINE_BUCKET \
    --versioning-configuration Status=Enabled
```

### Step 5.2: Create CodeDeploy Application

```bash
# Create CodeDeploy application
aws deploy create-application \
    --application-name jobboard-app \
    --compute-platform ECS \
    --region $AWS_REGION

# Create deployment group
aws deploy create-deployment-group \
    --application-name jobboard-app \
    --deployment-group-name jobboard-dg \
    --service-role-arn arn:aws:iam::$AWS_ACCOUNT_ID:role/CodeDeployServiceRole \
    --deployment-config-name CodeDeployDefault.ECSAllAtOnce \
    --ecs-services clusterName=jobboard-cluster,serviceName=jobboard-service \
    --load-balancer-info "targetGroupPairInfoList=[{targetGroups=[{name=jobboard-tg-blue},{name=jobboard-tg-green}],prodTrafficRoute={listenerArns=[$LISTENER_ARN]}}]" \
    --blue-green-deployment-configuration "terminateBlueInstancesOnDeploymentSuccess={action=TERMINATE,terminationWaitTimeInMinutes=5},deploymentReadyOption={actionOnTimeout=CONTINUE_DEPLOYMENT}" \
    --region $AWS_REGION
```

### Step 5.3: Create CodeBuild Project

```bash
# Create CodeBuild project
aws codebuild create-project \
    --name jobboard-build \
    --source type=GITHUB,location=https://github.com/yourusername/jobboard.git \
    --artifacts type=NO_ARTIFACTS \
    --environment type=LINUX_CONTAINER,image=aws/codebuild/standard:7.0,computeType=BUILD_GENERAL1_SMALL,privilegedMode=true,environmentVariables="[{name=AWS_ACCOUNT_ID,value=$AWS_ACCOUNT_ID},{name=AWS_DEFAULT_REGION,value=$AWS_REGION}]" \
    --service-role arn:aws:iam::$AWS_ACCOUNT_ID:role/CodeBuildServiceRole \
    --region $AWS_REGION
```

**Note:** You'll need to authorize CodeBuild to access your GitHub repository. This is easier to do via the AWS Console.

### Step 5.4: Create CodePipeline

It's recommended to create CodePipeline via the AWS Console for easier GitHub integration:

#### Via AWS Console:

1. Navigate to **CodePipeline** in AWS Console
2. Click **Create pipeline**
3. **Pipeline settings:**
   - Name: `jobboard-pipeline`
   - Service role: `CodePipelineServiceRole`
   - Artifact store: Custom location → Select your S3 bucket
   - Click **Next**

4. **Source stage:**
   - Source provider: **GitHub (Version 2)**
   - Click **Connect to GitHub**
   - Create a new connection, name it `jobboard-github`
   - Authorize AWS to access your GitHub
   - Select your repository and branch
   - Output artifact format: **CodePipeline default**
   - Click **Next**

5. **Build stage:**
   - Build provider: **AWS CodeBuild**
   - Project name: `jobboard-build`
   - Click **Next**

6. **Deploy stage:**
   - Deploy provider: **Amazon ECS (Blue/Green)**
   - Application name: `jobboard-app`
   - Deployment group: `jobboard-dg`
   - Task definition: Click **Browse** → Select `taskdef.json`
   - AppSpec file: Click **Browse** → Select `appspec.yaml`
   - Click **Next**

7. **Review** and click **Create pipeline**

### Step 5.5: Push Code to GitHub

```bash
# Make sure all files are committed
git add .
git commit -m "Add AWS deployment configuration"

# Push to GitHub
git push origin main
```

The pipeline will automatically trigger!

---

## Part 6: Deployment

### Step 6.1: Monitor Pipeline Execution

```bash
# Get pipeline status
aws codepipeline get-pipeline-state \
    --name jobboard-pipeline \
    --region $AWS_REGION

# Monitor in real-time via AWS Console:
# CodePipeline → jobboard-pipeline
```

### Step 6.2: Monitor CodeBuild

```bash
# List builds
aws codebuild list-builds-for-project \
    --project-name jobboard-build \
    --region $AWS_REGION

# Get build details
aws codebuild batch-get-builds \
    --ids <build-id> \
    --region $AWS_REGION
```

**Or via Console:**
- Navigate to **CodeBuild** → **Build projects** → `jobboard-build`
- Click on the running build to see logs

### Step 6.3: Monitor CodeDeploy

```bash
# List deployments
aws deploy list-deployments \
    --application-name jobboard-app \
    --deployment-group-name jobboard-dg \
    --region $AWS_REGION

# Get deployment status
aws deploy get-deployment \
    --deployment-id <deployment-id> \
    --region $AWS_REGION
```

**Or via Console:**
- Navigate to **CodeDeploy** → **Applications** → `jobboard-app`
- View deployment progress

### Step 6.4: Verify ECS Tasks

```bash
# List running tasks
aws ecs list-tasks \
    --cluster jobboard-cluster \
    --service-name jobboard-service \
    --region $AWS_REGION

# Get task details
aws ecs describe-tasks \
    --cluster jobboard-cluster \
    --tasks <task-arn> \
    --region $AWS_REGION
```

---

## Part 7: Post-Deployment

### Step 7.1: Access Your Application

```bash
# Get ALB DNS name
echo "Access your application at: http://$ALB_DNS"

# Or retrieve it again
aws elbv2 describe-load-balancers \
    --names jobboard-alb \
    --query "LoadBalancers[0].DNSName" \
    --output text \
    --region $AWS_REGION
```

Open your browser and navigate to the ALB DNS name.

### Step 7.2: Test the Application

1. **Frontend Test:**
   - Access `http://<ALB-DNS>`
   - Verify the page loads

2. **Backend API Test:**
   - Access `http://<ALB-DNS>/api`
   - Should return: `{"msg":"JobBoard API"}`

3. **Register a User:**
   - Use the registration form
   - Create a test account

4. **Login:**
   - Login with your credentials
   - Verify authentication works

5. **Job Listings:**
   - View job listings
   - Test CRUD operations

### Step 7.3: Database Migration (If Needed)

```bash
# Connect to RDS via an ECS task or EC2 bastion
# For now, Sequelize will auto-sync tables on app startup

# Optional: Use ECS Exec to run migrations
aws ecs execute-command \
    --cluster jobboard-cluster \
    --task <task-id> \
    --container backend \
    --interactive \
    --command "/bin/sh"

# Then inside the container:
npm run seed
```

### Step 7.4: Configure Custom Domain (Optional)

1. **Register a domain** (Route 53 or external)

2. **Create SSL certificate** in ACM:
```bash
aws acm request-certificate \
    --domain-name yourdomain.com \
    --validation-method DNS \
    --region $AWS_REGION
```

3. **Add HTTPS listener to ALB:**
```bash
aws elbv2 create-listener \
    --load-balancer-arn $ALB_ARN \
    --protocol HTTPS \
    --port 443 \
    --certificates CertificateArn=<cert-arn> \
    --default-actions Type=forward,TargetGroupArn=$TG_BLUE_ARN \
    --region $AWS_REGION
```

4. **Create Route 53 record:**
```bash
# Via Console: Route 53 → Create record → Alias to ALB
```

---

## Monitoring and Maintenance

### CloudWatch Logs

```bash
# View logs
aws logs tail /ecs/jobboard --follow --region $AWS_REGION

# Filter logs for backend
aws logs tail /ecs/jobboard --follow \
    --filter-pattern "backend" \
    --region $AWS_REGION

# Filter logs for frontend
aws logs tail /ecs/jobboard --follow \
    --filter-pattern "frontend" \
    --region $AWS_REGION
```

### CloudWatch Metrics

**Via Console:**
1. Navigate to **CloudWatch** → **Metrics**
2. Select **ECS** → **ClusterName, ServiceName**
3. View metrics:
   - CPUUtilization
   - MemoryUtilization
   - TargetResponseTime

### Set Up Alarms

```bash
# Create CPU alarm
aws cloudwatch put-metric-alarm \
    --alarm-name jobboard-high-cpu \
    --alarm-description "Alert when CPU exceeds 80%" \
    --metric-name CPUUtilization \
    --namespace AWS/ECS \
    --statistic Average \
    --period 300 \
    --threshold 80 \
    --comparison-operator GreaterThanThreshold \
    --dimensions Name=ServiceName,Value=jobboard-service Name=ClusterName,Value=jobboard-cluster \
    --evaluation-periods 2 \
    --region $AWS_REGION
```

### Auto Scaling (Optional)

```bash
# Register scalable target
aws application-autoscaling register-scalable-target \
    --service-namespace ecs \
    --resource-id service/jobboard-cluster/jobboard-service \
    --scalable-dimension ecs:service:DesiredCount \
    --min-capacity 1 \
    --max-capacity 4 \
    --region $AWS_REGION

# Create scaling policy
aws application-autoscaling put-scaling-policy \
    --service-namespace ecs \
    --resource-id service/jobboard-cluster/jobboard-service \
    --scalable-dimension ecs:service:DesiredCount \
    --policy-name jobboard-cpu-scaling \
    --policy-type TargetTrackingScaling \
    --target-tracking-scaling-policy-configuration file://scaling-policy.json \
    --region $AWS_REGION
```

Create `scaling-policy.json`:
```json
{
  "TargetValue": 70.0,
  "PredefinedMetricSpecification": {
    "PredefinedMetricType": "ECSServiceAverageCPUUtilization"
  },
  "ScaleInCooldown": 300,
  "ScaleOutCooldown": 60
}
```

---

## Troubleshooting

### Common Issues

#### 1. Pipeline Fails at Build Stage

**Check CodeBuild logs:**
```bash
aws codebuild batch-get-builds --ids <build-id> --region $AWS_REGION
```

**Common causes:**
- Missing environment variables
- Docker build errors
- Insufficient IAM permissions

**Fix:**
- Verify `buildspec.yml` syntax
- Check IAM role permissions
- Review build logs in CodeBuild console

#### 2. ECS Tasks Fail to Start

**Check task status:**
```bash
aws ecs describe-tasks \
    --cluster jobboard-cluster \
    --tasks <task-arn> \
    --region $AWS_REGION
```

**Common causes:**
- Image pull errors (ECR permissions)
- Invalid environment variables
- Insufficient memory/CPU

**Fix:**
- Verify ECR repository permissions
- Check Secrets Manager access
- Increase task memory/CPU in `taskdef.json`

#### 3. Application Not Accessible

**Check ALB target health:**
```bash
aws elbv2 describe-target-health \
    --target-group-arn $TG_BLUE_ARN \
    --region $AWS_REGION
```

**Common causes:**
- Security group not allowing traffic
- Health check path incorrect
- Container not listening on expected port

**Fix:**
- Verify security group rules
- Check health check configuration
- Verify container port mappings

#### 4. Database Connection Errors

**Check RDS status:**
```bash
aws rds describe-db-instances \
    --db-instance-identifier jobboard-db \
    --region $AWS_REGION
```

**Common causes:**
- RDS security group blocking ECS tasks
- Wrong RDS endpoint
- Database not available

**Fix:**
- Verify RDS security group allows traffic from ECS SG
- Check `DB_HOST` environment variable
- Ensure RDS instance is in "available" state

#### 5. Secrets Not Loading

**Verify secrets exist:**
```bash
aws secretsmanager list-secrets \
    --region $AWS_REGION
```

**Fix:**
- Ensure secrets are in the same region
- Verify ECS execution role has Secrets Manager permissions
- Check secret ARNs in `taskdef.json`

### Debug Commands

```bash
# View ECS service events
aws ecs describe-services \
    --cluster jobboard-cluster \
    --services jobboard-service \
    --region $AWS_REGION

# View CloudWatch logs
aws logs get-log-events \
    --log-group-name /ecs/jobboard \
    --log-stream-name <stream-name> \
    --region $AWS_REGION

# Check ECR images
aws ecr list-images \
    --repository-name jobboard-backend \
    --region $AWS_REGION

# Get task definition details
aws ecs describe-task-definition \
    --task-definition jobboard-task \
    --region $AWS_REGION
```

---

## Cost Optimization

### Estimated Monthly Costs

- **ECS Fargate (1 task, 1 vCPU, 2GB)**: ~$30/month
- **RDS t3.micro**: ~$15/month
- **ALB**: ~$18/month
- **ECR storage**: ~$1/month (for 10GB)
- **Data transfer**: Variable
- **Total**: ~$65-75/month

### Cost Reduction Tips

1. **Use Fargate Spot** (for dev/test):
```bash
# Update service to use Fargate Spot
aws ecs update-service \
    --cluster jobboard-cluster \
    --service jobboard-service \
    --capacity-provider-strategy capacityProvider=FARGATE_SPOT,weight=1 \
    --region $AWS_REGION
```

2. **Stop non-production resources**:
```bash
# Stop RDS during off-hours
aws rds stop-db-instance \
    --db-instance-identifier jobboard-db \
    --region $AWS_REGION

# Scale ECS service to 0
aws ecs update-service \
    --cluster jobboard-cluster \
    --service jobboard-service \
    --desired-count 0 \
    --region $AWS_REGION
```

3. **Clean up old ECR images**:
```bash
# Delete untagged images
aws ecr batch-delete-image \
    --repository-name jobboard-backend \
    --image-ids imageTag=untagged \
    --region $AWS_REGION
```

4. **Use CloudWatch retention**:
```bash
# Set log retention to 7 days
aws logs put-retention-policy \
    --log-group-name /ecs/jobboard \
    --retention-in-days 7 \
    --region $AWS_REGION
```

---

## Cleanup

### Delete All Resources

```bash
# 1. Delete CodePipeline
aws codepipeline delete-pipeline \
    --name jobboard-pipeline \
    --region $AWS_REGION

# 2. Delete CodeBuild project
aws codebuild delete-project \
    --name jobboard-build \
    --region $AWS_REGION

# 3. Delete CodeDeploy deployment group
aws deploy delete-deployment-group \
    --application-name jobboard-app \
    --deployment-group-name jobboard-dg \
    --region $AWS_REGION

# 4. Delete CodeDeploy application
aws deploy delete-application \
    --application-name jobboard-app \
    --region $AWS_REGION

# 5. Delete ECS service
aws ecs update-service \
    --cluster jobboard-cluster \
    --service jobboard-service \
    --desired-count 0 \
    --region $AWS_REGION

aws ecs delete-service \
    --cluster jobboard-cluster \
    --service jobboard-service \
    --force \
    --region $AWS_REGION

# 6. Deregister task definition
# (Tasks definitions can't be deleted, just deregister)
aws ecs deregister-task-definition \
    --task-definition jobboard-task:1 \
    --region $AWS_REGION

# 7. Delete ECS cluster
aws ecs delete-cluster \
    --cluster jobboard-cluster \
    --region $AWS_REGION

# 8. Delete ALB listener
aws elbv2 delete-listener \
    --listener-arn $LISTENER_ARN \
    --region $AWS_REGION

# 9. Delete target groups
aws elbv2 delete-target-group \
    --target-group-arn $TG_BLUE_ARN \
    --region $AWS_REGION

aws elbv2 delete-target-group \
    --target-group-arn $TG_GREEN_ARN \
    --region $AWS_REGION

# 10. Delete ALB
aws elbv2 delete-load-balancer \
    --load-balancer-arn $ALB_ARN \
    --region $AWS_REGION

# Wait for ALB to be deleted (takes a few minutes)
sleep 120

# 11. Delete RDS instance
aws rds delete-db-instance \
    --db-instance-identifier jobboard-db \
    --skip-final-snapshot \
    --region $AWS_REGION

# 12. Delete ECR repositories
aws ecr delete-repository \
    --repository-name jobboard-backend \
    --force \
    --region $AWS_REGION

aws ecr delete-repository \
    --repository-name jobboard-frontend \
    --force \
    --region $AWS_REGION

# 13. Delete secrets
aws secretsmanager delete-secret \
    --secret-id jobboard/db-password \
    --force-delete-without-recovery \
    --region $AWS_REGION

aws secretsmanager delete-secret \
    --secret-id jobboard/jwt-secret \
    --force-delete-without-recovery \
    --region $AWS_REGION

# 14. Delete CloudWatch log group
aws logs delete-log-group \
    --log-group-name /ecs/jobboard \
    --region $AWS_REGION

# 15. Delete S3 bucket
aws s3 rm s3://$PIPELINE_BUCKET --recursive
aws s3 rb s3://$PIPELINE_BUCKET --region $AWS_REGION

# 16. Delete security groups
aws ec2 delete-security-group \
    --group-id $ECS_SG_ID \
    --region $AWS_REGION

aws ec2 delete-security-group \
    --group-id $RDS_SG_ID \
    --region $AWS_REGION

aws ec2 delete-security-group \
    --group-id $ALB_SG_ID \
    --region $AWS_REGION

# 17. Delete IAM roles (detach policies first)
aws iam delete-role-policy \
    --role-name ecsTaskExecutionRole \
    --policy-name SecretsAndLogsAccess

aws iam detach-role-policy \
    --role-name ecsTaskExecutionRole \
    --policy-arn arn:aws:iam::aws:policy/service-role/AmazonECSTaskExecutionRolePolicy

aws iam delete-role --role-name ecsTaskExecutionRole

aws iam delete-role --role-name ecsTaskRole

aws iam delete-role-policy \
    --role-name CodeBuildServiceRole \
    --policy-name CodeBuildPolicy

aws iam delete-role --role-name CodeBuildServiceRole

aws iam detach-role-policy \
    --role-name CodeDeployServiceRole \
    --policy-arn arn:aws:iam::aws:policy/AWSCodeDeployRoleForECS

aws iam delete-role --role-name CodeDeployServiceRole

aws iam delete-role-policy \
    --role-name CodePipelineServiceRole \
    --policy-name CodePipelinePolicy

aws iam delete-role --role-name CodePipelineServiceRole

# If you created a custom VPC, delete it
# (Skip if using default VPC)
# Delete subnets, route tables, internet gateway, and VPC
```

---

## Appendix

### Environment Variables Reference

| Variable | Description | Example |
|----------|-------------|---------|
| AWS_ACCOUNT_ID | Your AWS account ID | 123456789012 |
| AWS_REGION | AWS region | us-east-1 |
| VPC_ID | VPC identifier | vpc-abc123 |
| SUBNET_1 | First subnet ID | subnet-abc123 |
| SUBNET_2 | Second subnet ID | subnet-def456 |
| ECS_SG_ID | ECS security group | sg-abc123 |
| ALB_SG_ID | ALB security group | sg-def456 |
| RDS_SG_ID | RDS security group | sg-ghi789 |
| RDS_ENDPOINT | RDS endpoint | xxx.rds.amazonaws.com |
| DB_PASSWORD | Database password | (secure string) |
| JWT_SECRET | JWT secret key | (secure string) |

### File Structure

```
jobboard/
├── backend/
│   ├── Dockerfile              # Backend container definition
│   ├── package.json            # Backend dependencies
│   └── src/
│       └── app.js             # Backend application
├── frontend/
│   ├── Dockerfile              # Frontend container definition
│   ├── nginx.conf             # Nginx configuration
│   ├── package.json            # Frontend dependencies
│   └── src/
│       └── App.jsx            # Frontend application
├── .dockerignore              # Docker ignore patterns
├── appspec.yaml               # CodeDeploy configuration
├── buildspec.yml              # CodeBuild configuration
├── taskdef.json               # ECS task definition
├── aws-setup.md               # Detailed AWS setup guide
└── README.md                  # This file
```

### Useful AWS CLI Commands

```bash
# List all ECS clusters
aws ecs list-clusters --region $AWS_REGION

# List all RDS instances
aws rds describe-db-instances --region $AWS_REGION

# List all load balancers
aws elbv2 describe-load-balancers --region $AWS_REGION

# List all ECR repositories
aws ecr describe-repositories --region $AWS_REGION

# List all CodePipelines
aws codepipeline list-pipelines --region $AWS_REGION

# Get current AWS identity
aws sts get-caller-identity

# List all S3 buckets
aws s3 ls
```

### Additional Resources

- [AWS ECS Documentation](https://docs.aws.amazon.com/ecs/)
- [AWS CodePipeline Documentation](https://docs.aws.amazon.com/codepipeline/)
- [AWS CodeBuild Documentation](https://docs.aws.amazon.com/codebuild/)
- [AWS CodeDeploy Documentation](https://docs.aws.amazon.com/codedeploy/)
- [Docker Documentation](https://docs.docker.com/)
- [Node.js Best Practices](https://github.com/goldbergyoni/nodebestpractices)

### Support

For issues or questions:
1. Check CloudWatch Logs for error messages
2. Review AWS service health dashboard
3. Consult AWS documentation
4. Check GitHub issues/discussions

---

## Quick Start Checklist

- [ ] Install prerequisites (Git, Node.js, Docker, AWS CLI)
- [ ] Configure AWS CLI with credentials
- [ ] Create VPC and networking components
- [ ] Create security groups
- [ ] Create RDS database
- [ ] Store secrets in Secrets Manager
- [ ] Create ECR repositories
- [ ] Create IAM roles
- [ ] Create CloudWatch log group
- [ ] Create Application Load Balancer
- [ ] Create ECS cluster
- [ ] Update configuration files (taskdef.json, appspec.yaml)
- [ ] Register ECS task definition
- [ ] Create ECS service
- [ ] Create S3 bucket for pipeline artifacts
- [ ] Create CodeDeploy application
- [ ] Create CodeBuild project
- [ ] Create CodePipeline
- [ ] Push code to GitHub
- [ ] Monitor pipeline execution
- [ ] Verify deployment
- [ ] Test application

---

**Congratulations!** 🎉 You've successfully deployed your JobBoard application on AWS with a fully automated CI/CD pipeline!
