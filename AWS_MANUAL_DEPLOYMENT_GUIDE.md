# AWS Manual Deployment Guide - Complete Step-by-Step Process

This guide provides detailed manual instructions for deploying the JobBoard application on AWS without using CloudFormation or Infrastructure as Code. Every step is performed through the AWS Console.

## Table of Contents

1. [Prerequisites](#prerequisites)
2. [Part 1: VPC and Networking Setup](#part-1-vpc-and-networking-setup)
3. [Part 2: Security Groups Configuration](#part-2-security-groups-configuration)
4. [Part 3: RDS Database Setup](#part-3-rds-database-setup)
5. [Part 4: Secrets Manager Configuration](#part-4-secrets-manager-configuration)
6. [Part 5: ECR Repository Creation](#part-5-ecr-repository-creation)
7. [Part 6: IAM Roles and Policies](#part-6-iam-roles-and-policies)
8. [Part 7: CloudWatch Configuration](#part-7-cloudwatch-configuration)
9. [Part 8: Application Load Balancer Setup](#part-8-application-load-balancer-setup)
10. [Part 9: ECS Cluster and EC2 Configuration](#part-9-ecs-cluster-and-ec2-configuration)
11. [Part 10: CodeBuild Setup](#part-10-codebuild-setup)
12. [Part 11: CodeDeploy Configuration](#part-11-codedeploy-configuration)
13. [Part 12: CodePipeline Setup](#part-12-codepipeline-setup)
14. [Part 13: Monitoring and Alarms](#part-13-monitoring-and-alarms)
15. [Part 14: Testing and Verification](#part-14-testing-and-verification)

---

## Prerequisites

### Required Information
Before starting, have the following ready:
- AWS Account with admin access
- GitHub repository URL
- Email address for notifications
- Preferred AWS region (e.g., us-east-1)

### Browser Setup
- Use latest Chrome, Firefox, or Edge
- Enable JavaScript
- Allow pop-ups for AWS Console
- Have multiple browser tabs ready for reference

---

## Part 1: VPC and Networking Setup

### Step 1.1: Create VPC

1. **Log into AWS Console**
   - Go to https://console.aws.amazon.com/
   - Enter your credentials
   - Select your preferred region from top-right dropdown

2. **Navigate to VPC Service**
   - Click "Services" in top menu
   - Under "Networking & Content Delivery", click "VPC"
   - Or use search bar and type "VPC"

3. **Create VPC**
   - Click "Your VPCs" in left sidebar
   - Click orange "Create VPC" button
   - **VPC settings:**
     - Resources to create: Select "VPC only"
     - Name tag: `jobboard-vpc`
     - IPv4 CIDR block: `10.0.0.0/16`
     - IPv6 CIDR block: "No IPv6 CIDR block"
     - Tenancy: "Default"
   - Click "Create VPC" button
   - **Record the VPC ID** (format: vpc-xxxxxxxxx) - you'll need this later

4. **Enable DNS Hostnames**
   - Select your newly created VPC (checkbox)
   - Click "Actions" dropdown
   - Select "Edit VPC settings"
   - Check "Enable DNS hostnames"
   - Click "Save changes"

### Step 1.2: Create Internet Gateway

1. **Navigate to Internet Gateways**
   - In VPC Dashboard, click "Internet gateways" in left sidebar
   - Click "Create internet gateway" button

2. **Configure Internet Gateway**
   - Name tag: `jobboard-igw`
   - Click "Create internet gateway"
   - **Record the Internet Gateway ID** (format: igw-xxxxxxxxx)

3. **Attach to VPC**
   - After creation, you'll see "Attach to a VPC" button
   - Click "Attach to a VPC"
   - VPC: Select `jobboard-vpc` from dropdown
   - Click "Attach internet gateway"
   - Verify state shows "Attached"

### Step 1.3: Create Subnets

**Create Public Subnet 1:**

1. **Navigate to Subnets**
   - Click "Subnets" in left sidebar
   - Click "Create subnet" button

2. **Configure First Subnet**
   - VPC ID: Select `jobboard-vpc`
   - Subnet name: `jobboard-public-subnet-1a`
   - Availability Zone: Select first AZ (e.g., us-east-1a)
   - IPv4 CIDR block: `10.0.1.0/24`
   - Click "Create subnet"
   - **Record Subnet ID** (format: subnet-xxxxxxxxx)

3. **Enable Auto-assign Public IP**
   - Select the subnet you just created
   - Click "Actions" dropdown
   - Select "Edit subnet settings"
   - Check "Enable auto-assign public IPv4 address"
   - Click "Save"

**Create Public Subnet 2:**

4. **Create Second Subnet**
   - Click "Create subnet" button again
   - VPC ID: Select `jobboard-vpc`
   - Subnet name: `jobboard-public-subnet-1b`
   - Availability Zone: Select second AZ (e.g., us-east-1b)
   - IPv4 CIDR block: `10.0.2.0/24`
   - Click "Create subnet"
   - **Record Subnet ID**

5. **Enable Auto-assign Public IP**
   - Select the second subnet
   - Click "Actions" → "Edit subnet settings"
   - Check "Enable auto-assign public IPv4 address"
   - Click "Save"

### Step 1.4: Create and Configure Route Table

1. **Navigate to Route Tables**
   - Click "Route tables" in left sidebar
   - Find the route table associated with `jobboard-vpc` (Main route table)
   - Or click "Create route table"

2. **Create Public Route Table**
   - Name: `jobboard-public-rt`
   - VPC: Select `jobboard-vpc`
   - Click "Create route table"
   - **Record Route Table ID**

3. **Add Internet Gateway Route**
   - Select your route table
   - Click "Routes" tab at bottom
   - Click "Edit routes" button
   - Click "Add route"
   - Destination: `0.0.0.0/0`
   - Target: Select "Internet Gateway", then select `jobboard-igw`
   - Click "Save changes"

4. **Associate Subnets with Route Table**
   - Click "Subnet associations" tab
   - Click "Edit subnet associations" button
   - Check both subnets:
     - `jobboard-public-subnet-1a`
     - `jobboard-public-subnet-1b`
   - Click "Save associations"

**Verification:**
- Go to "Your VPCs"
- You should see `jobboard-vpc` with state "Available"
- Total of 2 subnets in different availability zones
- Internet gateway attached
- Route table with internet route configured

---

## Part 2: Security Groups Configuration

### Step 2.1: Create ALB Security Group

1. **Navigate to Security Groups**
   - In VPC Dashboard, click "Security groups" in left sidebar
   - Click "Create security group" button

2. **Configure ALB Security Group**
   - Security group name: `jobboard-alb-sg`
   - Description: `Security group for JobBoard Application Load Balancer`
   - VPC: Select `jobboard-vpc`

3. **Add Inbound Rules**
   - Click "Add rule" under "Inbound rules"
   
   **Rule 1: HTTP**
   - Type: HTTP
   - Protocol: TCP
   - Port range: 80
   - Source: Anywhere-IPv4 (0.0.0.0/0)
   - Description: "Allow HTTP from internet"
   
   **Rule 2: HTTPS (Optional)**
   - Click "Add rule"
   - Type: HTTPS
   - Protocol: TCP
   - Port range: 443
   - Source: Anywhere-IPv4 (0.0.0.0/0)
   - Description: "Allow HTTPS from internet"

4. **Outbound Rules**
   - Leave default (All traffic to 0.0.0.0/0)

5. **Create Security Group**
   - Click "Create security group" button
   - **Record Security Group ID** (format: sg-xxxxxxxxx)

### Step 2.2: Create ECS Security Group

1. **Create New Security Group**
   - Click "Create security group" button
   - Security group name: `jobboard-ecs-sg`
   - Description: `Security group for JobBoard ECS tasks`
   - VPC: Select `jobboard-vpc`

2. **Add Inbound Rules**

   **Rule 1: Allow traffic from ALB on port 80**
   - Click "Add rule"
   - Type: Custom TCP
   - Protocol: TCP
   - Port range: 80
   - Source: Custom
   - In the search box, select the `jobboard-alb-sg` security group
   - Description: "Allow HTTP from ALB"
   
   **Rule 2: Allow traffic from ALB on port 4000**
   - Click "Add rule"
   - Type: Custom TCP
   - Protocol: TCP
   - Port range: 4000
   - Source: Custom
   - Select `jobboard-alb-sg` security group
   - Description: "Allow backend traffic from ALB"
   
   **Rule 3: Allow all traffic from same security group**
   - Click "Add rule"
   - Type: All traffic
   - Source: Custom
   - Select `jobboard-ecs-sg` (itself)
   - Description: "Allow inter-container communication"

3. **Outbound Rules**
   - Leave default (All traffic)

4. **Create Security Group**
   - Click "Create security group"
   - **Record Security Group ID**

### Step 2.3: Create RDS Security Group

1. **Create New Security Group**
   - Click "Create security group" button
   - Security group name: `jobboard-rds-sg`
   - Description: `Security group for JobBoard RDS database`
   - VPC: Select `jobboard-vpc`

2. **Add Inbound Rules**
   
   **Rule 1: PostgreSQL from ECS**
   - Click "Add rule"
   - Type: PostgreSQL
   - Protocol: TCP
   - Port range: 5432
   - Source: Custom
   - Select `jobboard-ecs-sg` security group
   - Description: "Allow PostgreSQL from ECS tasks"

3. **Outbound Rules**
   - Leave default

4. **Create Security Group**
   - Click "Create security group"
   - **Record Security Group ID**

**Security Groups Summary:**
At this point, you should have 3 security groups:
- `jobboard-alb-sg` (allows HTTP/HTTPS from internet)
- `jobboard-ecs-sg` (allows traffic from ALB)
- `jobboard-rds-sg` (allows PostgreSQL from ECS)

---

## Part 3: RDS Database Setup

### Step 3.1: Create DB Subnet Group

1. **Navigate to RDS Service**
   - Click "Services" in top menu
   - Under "Database", click "RDS"
   - Or search for "RDS"

2. **Create Subnet Group**
   - In left sidebar, click "Subnet groups"
   - Click "Create DB subnet group" button

3. **Configure Subnet Group**
   - Name: `jobboard-db-subnet-group`
   - Description: `Subnet group for JobBoard database`
   - VPC: Select `jobboard-vpc`
   
4. **Add Subnets**
   - Availability Zones: Select both AZs (us-east-1a, us-east-1b)
   - Subnets: Select both subnets:
     - `jobboard-public-subnet-1a` (10.0.1.0/24)
     - `jobboard-public-subnet-1b` (10.0.2.0/24)
   
5. **Create**
   - Click "Create" button
   - Wait for status to show "Complete"

### Step 3.2: Create RDS Database Instance

1. **Navigate to Databases**
   - Click "Databases" in left sidebar
   - Click "Create database" button

2. **Choose Database Creation Method**
   - Select "Standard create"

3. **Engine Options**
   - Engine type: Select "PostgreSQL"
   - Engine Version: Select "PostgreSQL 14.7-R1" (or latest 14.x)
   - Keep default

4. **Templates**
   - Select "Free tier" (for testing) OR "Dev/Test" (for production-like)

5. **Settings**
   - DB instance identifier: `jobboard-db`
   - Master username: `postgres`
   - Master password: **Create a strong password** (e.g., `JobBoard2026SecurePass!`)
   - Confirm password: Re-enter the same password
   - **IMPORTANT: Save this password securely - you'll need it later!**

6. **Instance Configuration**
   - DB instance class: 
     - For free tier: db.t3.micro
     - For production: db.t3.small or higher
   - Leave burstable classes selected

7. **Storage**
   - Storage type: "General Purpose SSD (gp3)"
   - Allocated storage: 20 GiB
   - Storage autoscaling: Enable (optional)
   - Maximum storage threshold: 100 GiB (if autoscaling enabled)

8. **Connectivity**
   - Compute resource: "Don't connect to an EC2 compute resource"
   - VPC: Select `jobboard-vpc`
   - DB subnet group: Select `jobboard-db-subnet-group`
   - Public access: "No" (recommended) or "Yes" (for testing)
   - VPC security group: 
     - Remove default
     - Choose existing
     - Select `jobboard-rds-sg`
   - Availability Zone: "No preference"

9. **Database Authentication**
   - Database authentication: "Password authentication"

10. **Additional Configuration** (Click to expand)
    - Initial database name: `jobboard`
    - DB parameter group: default
    - Option group: default
    - Backup:
      - Enable automated backups: Yes
      - Backup retention period: 7 days
      - Backup window: No preference
    - Encryption: 
      - Enable encryption: Yes
      - Master key: (default) aws/rds
    - Monitoring:
      - Enable Enhanced monitoring: Yes (recommended)
      - Granularity: 60 seconds
    - Maintenance:
      - Enable auto minor version upgrade: Yes
      - Maintenance window: No preference
    - Deletion protection: Enable (recommended for production)

11. **Create Database**
    - Review all settings
    - Click "Create database" button
    - Wait 5-10 minutes for database to be created

12. **Get RDS Endpoint**
    - Once status shows "Available"
    - Click on database name `jobboard-db`
    - In "Connectivity & security" tab
    - **Record the Endpoint** (format: jobboard-db.xxxxxxxxxx.us-east-1.rds.amazonaws.com)
    - Port: 5432

**Important Information to Save:**
- Database endpoint
- Master username: `postgres`
- Master password: (the password you created)
- Database name: `jobboard`
- Port: `5432`

---

## Part 4: Secrets Manager Configuration

### Step 4.1: Store Database Password

1. **Navigate to Secrets Manager**
   - Click "Services" menu
   - Under "Security, Identity, & Compliance", click "Secrets Manager"
   - Or search for "Secrets Manager"

2. **Store New Secret**
   - Click "Store a new secret" button

3. **Choose Secret Type**
   - Secret type: "Other type of secret"

4. **Key/Value Pairs**
   - Click "Plaintext" tab
   - Delete any existing content
   - Enter your database password (the one you created for RDS)
   - Example: `JobBoard2026SecurePass!`

5. **Encryption Key**
   - Encryption key: aws/secretsmanager (default)

6. **Click Next**

7. **Configure Secret**
   - Secret name: `jobboard/db-password`
   - Description: `JobBoard database password for RDS`
   - Tags (optional):
     - Key: `Project`, Value: `JobBoard`
     - Key: `Environment`, Value: `Production`

8. **Click Next**

9. **Configure Rotation** (Optional)
   - Disable automatic rotation (for now)
   - Click "Next"

10. **Review**
    - Review all settings
    - Click "Store" button
    - **Record the Secret ARN** (shown after creation)

### Step 4.2: Store JWT Secret

1. **Generate JWT Secret**
   - Open PowerShell or terminal
   - Generate random string:
   ```powershell
   # Windows PowerShell
   -join ((65..90) + (97..122) + (48..57) | Get-Random -Count 64 | % {[char]$_})
   ```
   - **Copy the generated string**

2. **Create Secret**
   - Click "Store a new secret" button
   - Secret type: "Other type of secret"
   - Click "Plaintext" tab
   - Paste your generated JWT secret

3. **Configure**
   - Secret name: `jobboard/jwt-secret`
   - Description: `JobBoard JWT secret for authentication`
   - Click "Next" → "Next"

4. **Store**
   - Click "Store" button
   - **Record the Secret ARN**

**Verification:**
- Go to Secrets Manager dashboard
- You should see 2 secrets:
  - `jobboard/db-password`
  - `jobboard/jwt-secret`

---

## Part 5: ECR Repository Creation

### Step 5.1: Create Backend Repository

1. **Navigate to ECR**
   - Click "Services" menu
   - Under "Containers", click "Elastic Container Registry"
   - Or search for "ECR"

2. **Create Repository**
   - Click "Get Started" (if first time) or "Create repository"
   - Visibility settings: "Private"
   - Repository name: `jobboard-backend`

3. **Image Scan Settings**
   - Scan on push: Enable (check the box)
   - This will scan images for vulnerabilities

4. **Encryption Settings**
   - Encryption: AES-256 (default)

5. **Create Repository**
   - Click "Create repository" button
   - **Record the Repository URI** (format: 123456789012.dkr.ecr.us-east-1.amazonaws.com/jobboard-backend)

### Step 5.2: Create Frontend Repository

1. **Create Another Repository**
   - Click "Create repository" button
   - Visibility settings: "Private"
   - Repository name: `jobboard-frontend`
   - Scan on push: Enable
   - Click "Create repository"
   - **Record the Repository URI**

**ECR Summary:**
You should have 2 private repositories:
- `jobboard-backend`
- `jobboard-frontend`

---

## Part 6: IAM Roles and Policies

### Step 6.1: Create ECS Instance Role

1. **Navigate to IAM**
   - Click "Services" menu
   - Under "Security, Identity, & Compliance", click "IAM"
   - Or search for "IAM"

2. **Create Role**
   - Click "Roles" in left sidebar
   - Click "Create role" button

3. **Select Trusted Entity**
   - Trusted entity type: "AWS service"
   - Use case: 
     - Service: Select "EC2"
     - Use case: "EC2" (default)
   - Click "Next"

4. **Add Permissions**
   - Search and select these policies (use search box):
     - `AmazonEC2ContainerServiceforEC2Role`
     - `CloudWatchAgentServerPolicy`
   - Click "Next"

5. **Name and Create**
   - Role name: `ecsInstanceRole`
   - Description: `Allows EC2 instances to call ECS services`
   - Tags (optional):
     - Key: `Project`, Value: `JobBoard`
   - Click "Create role"

6. **Verify Role**
   - Find `ecsInstanceRole` in roles list
   - Click on it
   - **Record the Role ARN**

### Step 6.2: Create ECS Task Execution Role

1. **Create New Role**
   - Click "Create role" button
   - Trusted entity type: "AWS service"
   - Use case: "Elastic Container Service"
   - Select "Elastic Container Service Task"
   - Click "Next"

2. **Add Permissions**
   - Search and select:
     - `AmazonECSTaskExecutionRolePolicy`
   - Click "Next"

3. **Name Role**
   - Role name: `ecsTaskExecutionRole`
   - Description: `Allows ECS tasks to call AWS services`
   - Click "Create role"

4. **Add Secrets Manager Permission**
   - Find and click on `ecsTaskExecutionRole`
   - Click "Add permissions" → "Create inline policy"
   - Click "JSON" tab
   - Paste this policy:

```json
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
        "arn:aws:secretsmanager:us-east-1:*:secret:jobboard/*"
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
```

   - Replace `us-east-1` with your region
   - Click "Next"
   - Policy name: `SecretsAndLogsAccess`
   - Click "Create policy"

### Step 6.3: Create ECS Task Role

1. **Create New Role**
   - Click "Create role" button
   - Trusted entity type: "AWS service"
   - Use case: "Elastic Container Service"
   - Select "Elastic Container Service Task"
   - Click "Next"

2. **Add Permissions**
   - Skip adding permissions (click "Next")
   - This role can be customized later if your app needs AWS service access

3. **Name Role**
   - Role name: `ecsTaskRole`
   - Description: `Task role for JobBoard application`
   - Click "Create role"

### Step 6.4: Create CodeBuild Service Role

1. **Create New Role**
   - Click "Create role" button
   - Trusted entity type: "AWS service"
   - Use case: "CodeBuild"
   - Click "Next"

2. **Add Permissions**
   - Search and select:
     - `AmazonEC2ContainerRegistryPowerUser`
   - Click "Next"

3. **Name Role**
   - Role name: `CodeBuildServiceRole`
   - Description: `Service role for CodeBuild`
   - Click "Create role"

4. **Add Additional Permissions**
   - Click on `CodeBuildServiceRole`
   - Click "Add permissions" → "Create inline policy"
   - Click "JSON" tab
   - Paste:

```json
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
        "s3:GetObject",
        "s3:PutObject"
      ],
      "Resource": "*"
    }
  ]
}
```

   - Click "Next"
   - Policy name: `CodeBuildAdditionalPermissions`
   - Click "Create policy"

### Step 6.5: Create CodeDeploy Service Role

1. **Create New Role**
   - Click "Create role" button
   - Trusted entity type: "AWS service"
   - Use case: "CodeDeploy"
   - Select "CodeDeploy - ECS"
   - Click "Next"

2. **Permissions**
   - Policy `AWSCodeDeployRoleForECS` should be auto-selected
   - Click "Next"

3. **Name Role**
   - Role name: `CodeDeployServiceRole`
   - Description: `Service role for CodeDeploy ECS deployments`
   - Click "Create role"

### Step 6.6: Create CodePipeline Service Role

1. **Create New Role**
   - Click "Create role" button
   - Trusted entity type: "AWS service"
   - Use case: "CodePipeline"
   - Click "Next"

2. **Permissions**
   - `AWSCodePipelineServiceRole` should be auto-selected
   - Click "Next"

3. **Name Role**
   - Role name: `CodePipelineServiceRole`
   - Description: `Service role for CodePipeline`
   - Click "Create role"

4. **Add Additional Permissions**
   - Click on `CodePipelineServiceRole`
   - Click "Add permissions" → "Attach policies"
   - Search and attach:
     - `AmazonECS_FullAccess`
   - Click "Attach policies"

**IAM Roles Summary:**
You should have 6 roles created:
1. `ecsInstanceRole` - For EC2 instances running ECS
2. `ecsTaskExecutionRole` - For ECS to pull images and logs
3. `ecsTaskRole` - For application container permissions
4. `CodeBuildServiceRole` - For CodeBuild
5. `CodeDeployServiceRole` - For CodeDeploy
6. `CodePipelineServiceRole` - For CodePipeline

---

## Part 7: CloudWatch Configuration

### Step 7.1: Create Log Group

1. **Navigate to CloudWatch**
   - Click "Services" menu
   - Under "Management & Governance", click "CloudWatch"
   - Or search for "CloudWatch"

2. **Create Log Group**
   - Click "Logs" in left sidebar
   - Click "Log groups"
   - Click "Create log group" button

3. **Configure Log Group**
   - Log group name: `/ecs/jobboard`
   - Retention setting: Select "1 week (7 days)" or your preference
   - KMS key ARN: Leave empty (uses default encryption)

4. **Create**
   - Click "Create log group" button

### Step 7.2: Create SNS Topic for Alarms

1. **Navigate to SNS**
   - Click "Services" menu
   - Under "Application Integration", click "Simple Notification Service"
   - Or search for "SNS"

2. **Create Topic**
   - Click "Topics" in left sidebar
   - Click "Create topic" button

3. **Configure Topic**
   - Type: "Standard"
   - Name: `jobboard-alerts`
   - Display name: `JobBoard Alerts`
   - Click "Create topic"
   - **Record the Topic ARN**

4. **Create Email Subscription**
   - Click "Create subscription" button
   - Protocol: "Email"
   - Endpoint: Enter your email address
   - Click "Create subscription"

5. **Confirm Subscription**
   - Check your email
   - Click the confirmation link in the email from AWS
   - Return to AWS Console
   - Refresh - status should show "Confirmed"

---

## Part 8: Application Load Balancer Setup

### Step 8.1: Create Target Groups

**Create Blue Target Group:**

1. **Navigate to EC2**
   - Click "Services" menu
   - Under "Compute", click "EC2"
   - Or search for "EC2"

2. **Create Target Group**
   - In left sidebar, scroll down to "Load Balancing"
   - Click "Target Groups"
   - Click "Create target group" button

3. **Specify Group Details**
   - Target type: Select "IP addresses"
   - Target group name: `jobboard-tg-blue`
   - Protocol: HTTP
   - Port: 80
   - VPC: Select `jobboard-vpc`

4. **Health Checks**
   - Health check protocol: HTTP
   - Health check path: `/`
   - Advanced health check settings:
     - Port: Traffic port
     - Healthy threshold: 2
     - Unhealthy threshold: 3
     - Timeout: 5 seconds
     - Interval: 30 seconds
     - Success codes: 200

5. **Create**
   - Click "Next"
   - Don't register any targets yet
   - Click "Create target group"
   - **Record Target Group ARN**

**Create Green Target Group:**

6. **Repeat for Green Target Group**
   - Click "Create target group" button
   - Target type: "IP addresses"
   - Target group name: `jobboard-tg-green`
   - Protocol: HTTP
   - Port: 80
   - VPC: `jobboard-vpc`
   - Health checks: Same as blue
   - Click "Next" → "Create target group"
   - **Record Target Group ARN**

### Step 8.2: Create Application Load Balancer

1. **Navigate to Load Balancers**
   - Click "Load Balancers" in left sidebar
   - Click "Create load balancer" button

2. **Select Load Balancer Type**
   - Click "Create" under "Application Load Balancer"

3. **Basic Configuration**
   - Load balancer name: `jobboard-alb`
   - Scheme: "Internet-facing"
   - IP address type: "IPv4"

4. **Network Mapping**
   - VPC: Select `jobboard-vpc`
   - Mappings: Check both availability zones
     - us-east-1a: Select `jobboard-public-subnet-1a`
     - us-east-1b: Select `jobboard-public-subnet-1b`

5. **Security Groups**
   - Remove default security group
   - Select `jobboard-alb-sg`

6. **Listeners and Routing**
   - Protocol: HTTP
   - Port: 80
   - Default action: Forward to
   - Target group: Select `jobboard-tg-blue`

7. **Add HTTPS Listener (Optional)**
   - Click "Add listener"
   - Protocol: HTTPS
   - Port: 443
   - Default action: Forward to `jobboard-tg-blue`
   - Default SSL/TLS certificate: (select if you have one)

8. **Tags (Optional)**
   - Key: `Project`, Value: `JobBoard`
   - Key: `Environment`, Value: `Production`

9. **Create Load Balancer**
   - Review all settings
   - Click "Create load balancer" button
   - Wait for state to become "Active" (2-3 minutes)

10. **Get Load Balancer Information**
    - Click on `jobboard-alb`
    - **Record DNS name** (format: jobboard-alb-xxxxxxxxx.us-east-1.elb.amazonaws.com)
    - **Record ARN**
    - In "Listeners" tab, **record Listener ARN**

---

## Part 9: ECS Cluster and EC2 Configuration

### Step 9.1: Create ECS Cluster

1. **Navigate to ECS**
   - Click "Services" menu
   - Under "Containers", click "Elastic Container Service"
   - Or search for "ECS"

2. **Create Cluster**
   - Click "Clusters" in left sidebar
   - Click "Create cluster" button

3. **Configure Cluster**
   - Cluster name: `jobboard-cluster`
   - Infrastructure: Uncheck "AWS Fargate (serverless)"
   - Check "Amazon EC2 instances"

4. **Auto Scaling Group (optional at this step)**
   - For now, uncheck "Create new Auto Scaling Group"
   - We'll create it separately for more control

5. **Monitoring**
   - Container Insights: **Turn on** (Important for monitoring)

6. **Tags**
   - Key: `Project`, Value: `JobBoard`

7. **Create**
   - Click "Create" button
   - Wait for cluster creation

### Step 9.2: Create Launch Template for EC2

1. **Navigate to EC2 Console**
   - Go to EC2 service
   - Click "Launch Templates" in left sidebar
   - Click "Create launch template" button

2. **Launch Template Name and Description**
   - Launch template name: `jobboard-ecs-launch-template`
   - Template version description: `ECS optimized Amazon Linux 2023`

3. **Application and OS Images (AMI)**
   - Click "Browse more AMIs"
   - Click "AWS Marketplace AMIs" tab
   - Search for: `amzn2023-ami-ecs`
   - Select "Amazon ECS-Optimized Amazon Linux 2023 AMI"
   - Click "Select"

4. **Instance Type**
   - Instance type: `t3.small` (or t3.micro for testing)

5. **Key Pair (Optional but Recommended)**
   - Key pair name: Create new or select existing
   - If creating new:
     - Click "Create new key pair"
     - Key pair name: `jobboard-ecs-key`
     - Key pair type: RSA
     - Private key file format: .pem
     - Click "Create key pair"
     - **Save the downloaded .pem file securely**

6. **Network Settings**
   - Don't include in launch template
   - We'll configure in Auto Scaling Group

7. **Configure Storage**
   - Volume 1 (Root):
     - Size: 30 GiB
     - Volume type: gp3
     - Delete on termination: Yes

8. **Resource Tags**
   - Add tag:
     - Key: `Name`
     - Value: `jobboard-ecs-instance`
     - Resource types: Instances, Volumes

9. **Advanced Details**
   - IAM instance profile: Select `ecsInstanceRole`
   - (If you don't see it, you need to create an instance profile:
     - Go to IAM → Roles → ecsInstanceRole
     - Note if instance profile exists)
   
   - Scroll down to "User data"
   - Paste this script:

```bash
#!/bin/bash
echo ECS_CLUSTER=jobboard-cluster >> /etc/ecs/ecs.config
echo ECS_ENABLE_CONTAINER_METADATA=true >> /etc/ecs/ecs.config
echo ECS_ENABLE_TASK_IAM_ROLE=true >> /etc/ecs/ecs.config
echo ECS_ENABLE_TASK_IAM_ROLE_NETWORK_HOST=true >> /etc/ecs/ecs.config
```

10. **Create Launch Template**
    - Review all settings
    - Click "Create launch template" button

### Step 9.3: Create Auto Scaling Group

1. **Navigate to Auto Scaling Groups**
   - In EC2 console, click "Auto Scaling Groups" in left sidebar
   - Click "Create Auto Scaling group" button

2. **Choose Launch Template**
   - Auto Scaling group name: `jobboard-ecs-asg`
   - Launch template: Select `jobboard-ecs-launch-template`
   - Version: Latest
   - Click "Next"

3. **Choose Instance Launch Options**
   - VPC: Select `jobboard-vpc`
   - Availability Zones and subnets: Select both:
     - `jobboard-public-subnet-1a`
     - `jobboard-public-subnet-1b`
   - Click "Next"

4. **Configure Advanced Options**
   - Load balancing: "No load balancer" (ECS will manage this)
   - Health checks:
     - EC2: Checked
     - ECS: Checked (if available)
     - Health check grace period: 300 seconds
   - Monitoring: Enable CloudWatch group metrics
   - Click "Next"

5. **Configure Group Size and Scaling**
   - Desired capacity: 2
   - Minimum capacity: 1
   - Maximum capacity: 3
   - Automatic scaling: No scaling policies (for now)
   - Click "Next"

6. **Add Notifications (Optional)**
   - Skip
   - Click "Next"

7. **Add Tags**
   - Key: `Name`, Value: `jobboard-ecs-instance`
   - Check "Tag new instances"
   - Click "Next"

8. **Review**
   - Review all settings
   - Click "Create Auto Scaling group"

9. **Wait for Instances**
   - Go to "Activity" tab
   - Wait for instances to launch (2-3 minutes)
   - Go to ECS → Clusters → jobboard-cluster
   - Click "Infrastructure" tab
   - Verify EC2 instances are registered

### Step 9.4: Create ECS Task Definition

1. **Navigate to Task Definitions**
   - In ECS console, click "Task definitions" in left sidebar
   - Click "Create new task definition" button
   - Select "Create new task definition with JSON"

2. **Configure JSON**
   - Delete existing JSON
   - Paste this (update the placeholders with your actual values):

```json
{
  "family": "jobboard-task",
  "networkMode": "bridge",
  "requiresCompatibilities": ["EC2"],
  "executionRoleArn": "arn:aws:iam::YOUR_ACCOUNT_ID:role/ecsTaskExecutionRole",
  "taskRoleArn": "arn:aws:iam::YOUR_ACCOUNT_ID:role/ecsTaskRole",
  "containerDefinitions": [
    {
      "name": "backend",
      "image": "YOUR_ACCOUNT_ID.dkr.ecr.YOUR_REGION.amazonaws.com/jobboard-backend:latest",
      "cpu": 512,
      "memory": 1024,
      "essential": true,
      "portMappings": [
        {
          "containerPort": 4000,
          "hostPort": 0,
          "protocol": "tcp"
        }
      ],
      "environment": [
        {
          "name": "PORT",
          "value": "4000"
        },
        {
          "name": "NODE_ENV",
          "value": "production"
        },
        {
          "name": "DB_HOST",
          "value": "YOUR_RDS_ENDPOINT"
        },
        {
          "name": "DB_NAME",
          "value": "jobboard"
        },
        {
          "name": "DB_USER",
          "value": "postgres"
        }
      ],
      "secrets": [
        {
          "name": "DB_PASSWORD",
          "valueFrom": "arn:aws:secretsmanager:YOUR_REGION:YOUR_ACCOUNT_ID:secret:jobboard/db-password"
        },
        {
          "name": "JWT_SECRET",
          "valueFrom": "arn:aws:secretsmanager:YOUR_REGION:YOUR_ACCOUNT_ID:secret:jobboard/jwt-secret"
        }
      ],
      "logConfiguration": {
        "logDriver": "awslogs",
        "options": {
          "awslogs-group": "/ecs/jobboard",
          "awslogs-region": "YOUR_REGION",
          "awslogs-stream-prefix": "backend"
        }
      }
    },
    {
      "name": "frontend",
      "image": "YOUR_ACCOUNT_ID.dkr.ecr.YOUR_REGION.amazonaws.com/jobboard-frontend:latest",
      "cpu": 512,
      "memory": 1024,
      "essential": true,
      "portMappings": [
        {
          "containerPort": 80,
          "hostPort": 0,
          "protocol": "tcp"
        }
      ],
      "environment": [
        {
          "name": "VITE_API_URL",
          "value": "http://localhost:4000"
        }
      ],
      "logConfiguration": {
        "logDriver": "awslogs",
        "options": {
          "awslogs-group": "/ecs/jobboard",
          "awslogs-region": "YOUR_REGION",
          "awslogs-stream-prefix": "frontend"
        }
      },
      "dependsOn": [
        {
          "containerName": "backend",
          "condition": "START"
        }
      ]
    }
  ]
}
```

**Replace these placeholders:**
- `YOUR_ACCOUNT_ID`: Your AWS account ID (12 digits)
- `YOUR_REGION`: Your AWS region (e.g., us-east-1)
- `YOUR_RDS_ENDPOINT`: The RDS endpoint you saved earlier
- Update the secret ARNs with your actual secret ARNs

3. **Create Task Definition**
   - Review the JSON
   - Click "Create" button

### Step 9.5: Create ECS Service

1. **Navigate to Clusters**
   - Click "Clusters" in left sidebar
   - Click on `jobboard-cluster`

2. **Create Service**
   - Click "Services" tab
   - Click "Create" button

3. **Environment**
   - Compute options: "Launch type"
   - Launch type: "EC2"

4. **Deployment Configuration**
   - Application type: "Service"
   - Family: Select `jobboard-task`
   - Revision: Latest
   - Service name: `jobboard-service`
   - Desired tasks: 2

5. **Deployment Options**
   - Deployment type: "Blue/green deployment (powered by AWS CodeDeploy)"
   - Service role for CodeDeploy: Select `CodeDeployServiceRole`

6. **Load Balancing**
   - Load balancer type: "Application Load Balancer"
   - Application Load Balancer: Select `jobboard-alb`
   - Production listener port: 80:HTTP
   - Target group 1: `jobboard-tg-blue`
   - Target group 2: `jobboard-tg-green`

7. **Container to Load Balance**
   - Container: `frontend:80:0`
   - Click "Add"

8. **Service Auto Scaling (Optional)**
   - For now, select "Do not adjust the service's desired count"

9. **Create**
   - Review all settings
   - Click "Create" button
   - Wait for service to be created

10. **Verify**
    - Go to "Deployments" tab
    - Wait for deployment to complete
    - Check "Tasks" tab - should show 2 running tasks

---

## Part 10: CodeBuild Setup

### Step 10.1: Connect GitHub to AWS

1. **Navigate to CodeBuild**
   - Click "Services" menu
   - Under "Developer Tools", click "CodeBuild"
   - Or search for "CodeBuild"

2. **Create Build Project**
   - Click "Create build project" button

3. **Project Configuration**
   - Project name: `jobboard-build`
   - Description: `Build Docker images for JobBoard application`

4. **Source**
   - Source provider: "GitHub"
   - Repository: "Connect using OAuth" or "Connect with a GitHub personal access token"
   
   **If using OAuth:**
   - Click "Connect to GitHub"
   - Authorize AWS to access your GitHub
   - Repository: "Repository in my GitHub account"
   - GitHub repository: Enter your repo URL or select from list
   - Branch: `main`
   
   **If using Personal Access Token:**
   - Create token on GitHub with `repo` scope
   - Paste token
   - Repository URL: Your GitHub repo URL

5. **Environment**
   - Environment image: "Managed image"
   - Operating system: "Amazon Linux"
   - Runtime(s): "Standard"
   - Image: "aws/codebuild/standard:7.0" (latest)
   - Image version: "Always use the latest image for this runtime version"
   - Environment type: "Linux"
   - Privileged: **Check this box** (Required for Docker)
   - Service role: "Existing service role"
   - Role ARN: Select `CodeBuildServiceRole`

6. **Buildspec**
   - Build specifications: "Use a buildspec file"
   - Buildspec name: `buildspec.yml` (default)

7. **Logs**
   - CloudWatch logs: Enabled
   - Group name: `/aws/codebuild/jobboard`
   - Stream name: Leave empty (auto-generated)

8. **Create Build Project**
   - Click "Create build project" button

### Step 10.2: Add Environment Variables to CodeBuild

1. **Edit Build Project**
   - Click on `jobboard-build` project
   - Click "Edit" dropdown
   - Select "Environment"

2. **Add Environment Variables**
   - Scroll to "Additional configuration"
   - Click "Add environment variable"
   
   **Variable 1:**
   - Name: `AWS_ACCOUNT_ID`
   - Value: Your AWS account ID (12 digits)
   - Type: Plaintext
   
   **Variable 2:**
   - Name: `AWS_DEFAULT_REGION`
   - Value: Your region (e.g., us-east-1)
   - Type: Plaintext

3. **Save**
   - Click "Update environment" button

---

## Part 11: CodeDeploy Configuration

### Step 11.1: Create CodeDeploy Application

1. **Navigate to CodeDeploy**
   - Click "Services" menu
   - Under "Developer Tools", click "CodeDeploy"
   - Or search for "CodeDeploy"

2. **Create Application**
   - Click "Create application" button

3. **Configure Application**
   - Application name: `jobboard-app`
   - Compute platform: "Amazon ECS"

4. **Create**
   - Click "Create application" button

### Step 11.2: Create Deployment Group

1. **Create Deployment Group**
   - After creating app, click "Create deployment group" button

2. **Deployment Group Name**
   - Enter deployment group name: `jobboard-dg`

3. **Service Role**
   - Enter a service role: Select `CodeDeployServiceRole`

4. **Environment Configuration**
   - Choose an ECS cluster name: `jobboard-cluster`
   - Choose an ECS service name: `jobboard-service`

5. **Load Balancers**
   - Production listener: Port 80 on `jobboard-alb`
   - Target group 1 name: `jobboard-tg-blue`
   - Target group 2 name: `jobboard-tg-green`

6. **Deployment Settings**
   - Traffic rerouting: "Reroute traffic immediately"
   - Deployment configuration: "CodeDeployDefault.ECSAllAtOnce"
   - Original revision termination: 
     - Wait time: 5 minutes

7. **Create Deployment Group**
   - Review all settings
   - Click "Create deployment group" button

---

## Part 12: CodePipeline Setup

### Step 12.1: Create S3 Bucket for Artifacts

1. **Navigate to S3**
   - Click "Services" menu
   - Under "Storage", click "S3"

2. **Create Bucket**
   - Click "Create bucket" button

3. **Configure Bucket**
   - Bucket name: `jobboard-pipeline-artifacts-YOUR_ACCOUNT_ID`
   - AWS Region: Select your region
   - Object Ownership: ACLs disabled
   - Block Public Access: Keep all settings checked (block all public access)
   - Bucket Versioning: Enable
   - Default encryption: Enable (SSE-S3)

4. **Create Bucket**
   - Click "Create bucket" button

### Step 12.2: Create Pipeline

1. **Navigate to CodePipeline**
   - Click "Services" menu
   - Under "Developer Tools", click "CodePipeline"
   - Or search for "CodePipeline"

2. **Create Pipeline**
   - Click "Create pipeline" button

3. **Pipeline Settings**
   - Pipeline name: `jobboard-pipeline`
   - Service role: "Existing service role"
   - Role name: Select `CodePipelineServiceRole`
   - Advanced settings:
     - Artifact store: "Custom location"
     - Bucket: Select `jobboard-pipeline-artifacts-YOUR_ACCOUNT_ID`
     - Encryption key: Default AWS Managed Key
   - Click "Next"

4. **Add Source Stage**
   - Source provider: "GitHub (Version 2)"
   - Click "Connect to GitHub"
   
   **GitHub Connection:**
   - Connection name: `jobboard-github-connection`
   - Click "Connect to GitHub"
   - Click "Authorize AWS"
   - Click "Install a new app"
   - Select your GitHub account
   - Select "Only select repositories"
   - Choose your jobboard repository
   - Click "Install"
   - Click "Connect"
   
   **Repository Settings:**
   - Repository name: Select your repository
   - Branch name: `main`
   - Output artifact format: "CodePipeline default"
   - Click "Next"

5. **Add Build Stage**
   - Build provider: "AWS CodeBuild"
   - Region: Your region
   - Project name: Select `jobboard-build`
   - Build type: "Single build"
   - Click "Next"

6. **Add Deploy Stage**
   - Deploy provider: "Amazon ECS (Blue/Green)"
   - Region: Your region
   - AWS CodeDeploy application name: `jobboard-app`
   - AWS CodeDeploy deployment group: `jobboard-dg`
   
   **Input Artifacts:**
   - CodeBuild artifact: `BuildArtifact`
   - Image definitions file: `imagedefinitions.json`
   - AWS AppSpec file: `appspec.yaml`
   - Task definition file: `taskdef.json`
   
   - Click "Next"

7. **Review**
   - Review all pipeline stages
   - Click "Create pipeline" button

8. **Pipeline Execution**
   - Pipeline will automatically start
   - Monitor each stage:
     - Source: Pulling from GitHub
     - Build: Building Docker images
     - Deploy: Deploying to ECS

### Step 12.3: Monitor Pipeline

1. **View Pipeline Execution**
   - You'll see the pipeline running
   - Click on "Details" in each stage to see logs

2. **If Build Fails**
   - Click "Details" on Build stage
   - Review CloudWatch logs
   - Common issues:
     - Missing buildspec.yml file
     - Docker permission issues
     - Environment variable issues

3. **If Deploy Fails**
   - Check CodeDeploy deployment status
   - Review ECS service events
   - Check CloudWatch logs for task failures

---

## Part 13: Monitoring and Alarms

### Step 13.1: Create CloudWatch Dashboard

1. **Navigate to CloudWatch**
   - Go to CloudWatch service
   - Click "Dashboards" in left sidebar
   - Click "Create dashboard" button

2. **Name Dashboard**
   - Dashboard name: `JobBoard-Monitoring`
   - Click "Create dashboard"

3. **Add Widgets**

**Widget 1: ECS CPU Utilization**
   - Click "Add widget"
   - Select "Line"
   - Click "Configure"
   - Select "Metrics"
   - Select "ECS" → "ClusterName, ServiceName"
   - Check: CPUUtilization for `jobboard-cluster` / `jobboard-service`
   - Click "Create widget"

**Widget 2: ECS Memory Utilization**
   - Click "Add widget"
   - Select "Line"
   - Configure similar to CPU
   - Select MemoryUtilization metric
   - Click "Create widget"

**Widget 3: ALB Request Count**
   - Click "Add widget"
   - Select "Line"
   - Select "ApplicationELB" metrics
   - Select RequestCount for your load balancer
   - Click "Create widget"

**Widget 4: RDS CPU**
   - Click "Add widget"
   - Select "Line"
   - Select "RDS" → "Per-Database Metrics"
   - Select CPUUtilization for `jobboard-db`
   - Click "Create widget"

4. **Save Dashboard**
   - Click "Save dashboard" button

### Step 13.2: Create CloudWatch Alarms

**Alarm 1: ECS High CPU**

1. **Navigate to Alarms**
   - Click "Alarms" → "All alarms" in left sidebar
   - Click "Create alarm" button

2. **Select Metric**
   - Click "Select metric"
   - Select "ECS" → "ClusterName, ServiceName"
   - Check CPUUtilization for your service
   - Click "Select metric"

3. **Specify Metric and Conditions**
   - Metric name: CPUUtilization
   - Statistic: Average
   - Period: 5 minutes
   - Threshold type: Static
   - Whenever CPUUtilization is: Greater/Equal
   - Than: 80
   - Datapoints to alarm: 2 out of 2

4. **Configure Actions**
   - Notification: In alarm
   - Send notification to: Select `jobboard-alerts`
   - Click "Next"

5. **Add Name and Description**
   - Alarm name: `jobboard-ecs-high-cpu`
   - Description: `Alert when ECS CPU exceeds 80%`
   - Click "Next"

6. **Preview and Create**
   - Review settings
   - Click "Create alarm"

**Repeat for Additional Alarms:**

**Alarm 2: ECS High Memory**
   - Metric: MemoryUtilization
   - Threshold: 80
   - Name: `jobboard-ecs-high-memory`

**Alarm 3: ALB Unhealthy Targets**
   - Metric: UnHealthyHostCount (ApplicationELB)
   - Threshold: 1
   - Name: `jobboard-alb-unhealthy-targets`

**Alarm 4: ALB High Response Time**
   - Metric: TargetResponseTime
   - Threshold: 2 seconds
   - Name: `jobboard-alb-high-response-time`

**Alarm 5: RDS High CPU**
   - Metric: CPUUtilization (RDS)
   - Threshold: 80
   - Name: `jobboard-rds-high-cpu`

**Alarm 6: RDS Low Storage**
   - Metric: FreeStorageSpace (RDS)
   - Threshold: 2000000000 (2GB in bytes)
   - Condition: Less than
   - Name: `jobboard-rds-low-storage`

### Step 13.3: Enable Container Insights

1. **Navigate to ECS Cluster**
   - Go to ECS service
   - Click on `jobboard-cluster`

2. **Update Cluster**
   - Click "Update cluster" button
   - Under "Monitoring", enable "Container Insights"
   - Click "Update"

3. **View Container Insights**
   - Go to CloudWatch
   - Click "Container Insights" in left sidebar
   - Select "ECS Clusters"
   - View detailed metrics

---

## Part 14: Testing and Verification

### Step 14.1: Access Your Application

1. **Get Load Balancer DNS**
   - Go to EC2 → Load Balancers
   - Click on `jobboard-alb`
   - Copy DNS name

2. **Test in Browser**
   - Open browser
   - Navigate to: `http://YOUR-ALB-DNS-NAME`
   - You should see your application

### Step 14.2: Test API Endpoints

1. **Test API**
   - Navigate to: `http://YOUR-ALB-DNS-NAME/api`
   - Should return: `{"msg":"JobBoard API"}`

2. **Test Registration**
   - Use the frontend registration form
   - Create a test account
   - Verify account creation works

3. **Test Login**
   - Login with created credentials
   - Verify authentication works

### Step 14.3: Verify Database Connection

1. **Check Application Logs**
   - Go to CloudWatch → Log Groups
   - Click `/ecs/jobboard`
   - View log streams
   - Look for database connection messages

2. **Verify RDS Connections**
   - Go to RDS → Databases
   - Click `jobboard-db`
   - Click "Monitoring" tab
   - Check "DatabaseConnections" metric

### Step 14.4: Test CI/CD Pipeline

1. **Make a Code Change**
   - Edit a file in your GitHub repository
   - Commit and push to main branch

2. **Watch Pipeline**
   - Go to CodePipeline
   - Watch pipeline auto-trigger
   - Monitor each stage

3. **Verify Deployment**
   - Check CodeDeploy for blue/green deployment
   - Verify traffic shifts to new version
   - Test application still works

### Step 14.5: Monitor Application Health

1. **Check Target Health**
   - EC2 → Target Groups
   - Click `jobboard-tg-blue`
   - Verify targets are healthy

2. **Check ECS Tasks**
   - ECS → Clusters → jobboard-cluster
   - Click "Tasks" tab
   - Verify 2 tasks running

3. **Check CloudWatch Alarms**
   - CloudWatch → Alarms
   - Verify all alarms in "OK" state

### Step 14.6: Test Auto Scaling (Optional)

1. **Simulate Load**
   - Use a load testing tool
   - Generate traffic to your ALB

2. **Monitor Scaling**
   - Watch ECS service scale up
   - Check Auto Scaling Group activity
   - Verify new tasks are created

---

## Summary of Created Resources

### Networking (7 resources)
- ✅ 1 VPC (`jobboard-vpc`)
- ✅ 1 Internet Gateway (`jobboard-igw`)
- ✅ 2 Subnets (`jobboard-public-subnet-1a`, `jobboard-public-subnet-1b`)
- ✅ 1 Route Table (`jobboard-public-rt`)
- ✅ 3 Security Groups (`jobboard-alb-sg`, `jobboard-ecs-sg`, `jobboard-rds-sg`)

### Database and Secrets (4 resources)
- ✅ 1 RDS Subnet Group
- ✅ 1 RDS Instance (`jobboard-db`)
- ✅ 2 Secrets Manager Secrets

### Container Registry (2 resources)
- ✅ 2 ECR Repositories (`jobboard-backend`, `jobboard-frontend`)

### IAM (6 resources)
- ✅ 6 IAM Roles (ecsInstanceRole, ecsTaskExecutionRole, ecsTaskRole, CodeBuildServiceRole, CodeDeployServiceRole, CodePipelineServiceRole)

### Load Balancing (3 resources)
- ✅ 1 Application Load Balancer (`jobboard-alb`)
- ✅ 2 Target Groups (`jobboard-tg-blue`, `jobboard-tg-green`)

### ECS (5 resources)
- ✅ 1 ECS Cluster (`jobboard-cluster`)
- ✅ 1 Launch Template
- ✅ 1 Auto Scaling Group
- ✅ 1 Task Definition
- ✅ 1 ECS Service

### CI/CD (4 resources)
- ✅ 1 S3 Bucket (for pipeline artifacts)
- ✅ 1 CodeBuild Project
- ✅ 1 CodeDeploy Application with Deployment Group
- ✅ 1 CodePipeline

### Monitoring (3+ resources)
- ✅ 1 CloudWatch Log Group
- ✅ 1 SNS Topic with Email Subscription
- ✅ 1 CloudWatch Dashboard
- ✅ 6+ CloudWatch Alarms

**Total: 40+ AWS Resources Created**

---

## Important Information to Save

Create a file with all these details:

```
AWS Account ID: YOUR_ACCOUNT_ID
Region: us-east-1

VPC ID: vpc-xxxxxxxxx
Subnet 1 ID: subnet-xxxxxxxxx
Subnet 2 ID: subnet-xxxxxxxxx

ALB Security Group: sg-xxxxxxxxx
ECS Security Group: sg-xxxxxxxxx
RDS Security Group: sg-xxxxxxxxx

RDS Endpoint: jobboard-db.xxxxxxxxx.us-east-1.rds.amazonaws.com
RDS Database: jobboard
RDS Username: postgres
RDS Password: [SAVED_SECURELY]

ECR Backend: 123456789012.dkr.ecr.us-east-1.amazonaws.com/jobboard-backend
ECR Frontend: 123456789012.dkr.ecr.us-east-1.amazonaws.com/jobboard-frontend

ALB DNS: jobboard-alb-xxxxxxxxx.us-east-1.elb.amazonaws.com

ECS Cluster: jobboard-cluster
ECS Service: jobboard-service

SNS Topic ARN: arn:aws:sns:us-east-1:xxxxxxxxx:jobboard-alerts
```

---

## Troubleshooting Common Issues

### Issue 1: Tasks Not Starting

**Symptoms:** Tasks stuck in PENDING or repeatedly failing

**Solutions:**
1. Check ECS task logs in CloudWatch
2. Verify security groups allow required ports
3. Check if EC2 instances are registered with ECS
4. Verify task execution role has correct permissions
5. Check if secrets exist in Secrets Manager

### Issue 2: 502 Bad Gateway from ALB

**Symptoms:** ALB returns 502 error

**Solutions:**
1. Check target group health
2. Verify security groups allow ALB → ECS traffic
3. Check container is listening on correct port
4. Review ECS task logs for application errors
5. Verify health check path is correct

### Issue 3: Pipeline Build Fails

**Symptoms:** CodeBuild stage fails

**Solutions:**
1. Check buildspec.yml file exists in repo
2. Verify privileged mode is enabled in CodeBuild
3. Check environment variables are set correctly
4. Review CodeBuild logs for specific errors
5. Verify CodeBuild role has ECR permissions

### Issue 4: Unable to Pull from ECR

**Symptoms:** Task fails with "pull image" error

**Solutions:**
1. Verify task execution role has ECR permissions
2. Check ECR repositories exist
3. Verify images exist in ECR
4. Check region matches
5. Review ECS task execution role policies

### Issue 5: Database Connection Fails

**Symptoms:** Application can't connect to RDS

**Solutions:**
1. Verify RDS security group allows traffic from ECS SG
2. Check RDS endpoint in task definition
3. Verify database credentials in Secrets Manager
4. Check database name matches
5. Ensure RDS is in same VPC as ECS

---

## Next Steps

1. **Set Up Custom Domain**
   - Register domain in Route 53
   - Create SSL certificate in ACM
   - Add HTTPS listener to ALB
   - Create Route 53 alias record

2. **Enable Auto Scaling**
   - Configure ECS service auto scaling
   - Set up target tracking policies
   - Configure scale-in/scale-out rules

3. **Improve Security**
   - Use private subnets for ECS tasks
   - Enable VPC endpoints
   - Implement WAF rules
   - Enable GuardDuty
   - Enable Security Hub

4. **Optimize Costs**
   - Use Spot instances for non-production
   - Purchase Reserved Instances
   - Implement auto-shutdown for dev environments
   - Clean up unused resources

5. **Backup Strategy**
   - Configure RDS automated backups
   - Create RDS snapshots schedule
   - Export logs to S3
   - Document disaster recovery plan

---

## Conclusion

Congratulations! You have successfully deployed a production-ready application on AWS with:

- ✅ High availability across multiple AZs
- ✅ Auto-scaling infrastructure
- ✅ Blue/green deployments with zero downtime
- ✅ Comprehensive monitoring and alerting
- ✅ Automated CI/CD pipeline
- ✅ Secure secret management
- ✅ Container-based architecture

Your application is now running on AWS with enterprise-grade infrastructure!

**Application URL:** `http://YOUR-ALB-DNS-NAME`

**CloudWatch Dashboard:** CloudWatch → Dashboards → JobBoard-Monitoring

**Monitor Deployments:** CodePipeline → jobboard-pipeline

**View Logs:** CloudWatch → Log Groups → /ecs/jobboard
