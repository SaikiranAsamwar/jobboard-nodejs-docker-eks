# Job Board Application - Full Stack with Docker & Kubernetes

A modern, production-ready job board application built with Node.js, React, PostgreSQL, Docker, and Kubernetes. This project demonstrates full-stack development, containerization, and cloud-native deployment practices.

## 🚀 Features

- **User Authentication**: JWT-based authentication system
- **Job Management**: Create, view, and apply for job postings
- **Modern UI**: Responsive React frontend with animations and modern design
- **RESTful API**: Express.js backend with proper routing and middleware
- **Database**: PostgreSQL with Sequelize ORM
- **Containerization**: Docker support for all services
- **Orchestration**: Kubernetes manifests for cloud deployment
- **Cross-browser Support**: Safari-compatible CSS with proper vendor prefixes

## 📋 Table of Contents

- [Architecture](#architecture)
- [Prerequisites](#prerequisites)
- [Local Development Setup](#local-development-setup)
- [Docker Setup](#docker-setup)
- [Kubernetes Deployment](#kubernetes-deployment)
- [API Documentation](#api-documentation)
- [Environment Variables](#environment-variables)
- [Project Structure](#project-structure)
- [Technologies Used](#technologies-used)

## 🏗️ Architecture

```
┌─────────────┐      ┌─────────────┐      ┌─────────────┐
│   React     │─────▶│  Node.js    │─────▶│ PostgreSQL  │
│  Frontend   │      │   Backend   │      │  Database   │
│  (Port 80)  │      │ (Port 4000) │      │ (Port 5432) │
└─────────────┘      └─────────────┘      └─────────────┘
```

## ✅ Prerequisites

Before you begin, ensure you have the following installed:

- **Node.js** (v16 or higher)
- **npm** (v8 or higher)
- **Docker** (v20 or higher)
- **Docker Compose** (v2 or higher)
- **kubectl** (for Kubernetes deployment)
- **Git**

## 🛠️ Local Development Setup

### 1. Clone the Repository

```bash
git clone https://github.com/SaikiranAsamwar/jobboard-nodejs-docker-eks.git
cd jobboard-nodejs-docker-eks
```

### 2. Backend Setup

```bash
cd backend

# Install dependencies
npm install

# Create environment file
cp .env.example .env

# Update .env with your configuration
# DB_URI=postgresql://postgres:postgres@localhost:5432/jobboard
# JWT_SECRET=your_jwt_secret_key
# PORT=4000

# Start PostgreSQL (if running locally)
# Make sure PostgreSQL is running on port 5432

# Run database seed script
node src/seed.js

# Start the backend server
node src/app.js
```

Backend will be available at `http://localhost:4000`

### 3. Frontend Setup

```bash
cd ../frontend

# Install dependencies
npm install

# Create environment file
cp .env.example .env

# Update .env with backend URL
# VITE_API_URL=http://localhost:4000

# Start the development server
npm run dev
```

Frontend will be available at `http://localhost:5173`

## 🐳 Docker Setup

### Using Docker Compose (Recommended for Local Development)

```bash
# From the project root directory

# Build and start all services
docker-compose up --build

# Run in detached mode
docker-compose up -d

# View logs
docker-compose logs -f

# Stop all services
docker-compose down

# Stop and remove volumes
docker-compose down -v
```

**Service Endpoints:**
- Frontend: `http://localhost:3000`
- Backend: `http://localhost:4001`
- PostgreSQL: `localhost:5432`

### Building Individual Docker Images

```bash
# Build backend image
cd backend
docker build -t saikiranasamwar4/jobboard-backend:latest .

# Build frontend image
cd ../frontend
docker build -t saikiranasamwar4/jobboard-frontend:latest .

# Push to Docker Hub (requires docker login)
docker push saikiranasamwar4/jobboard-backend:latest
docker push saikiranasamwar4/jobboard-frontend:latest
```

## ☸️ Kubernetes Deployment

### Prerequisites for Kubernetes

- Kubernetes cluster (EKS, GKE, AKS, or local Minikube)
- `kubectl` configured to communicate with your cluster
- Docker images pushed to a container registry

### 1. Create Kubernetes Secrets

```bash
# Create secret for database credentials and JWT
kubectl create secret generic jobboard-secrets \
  --from-literal=postgres_password=yourpassword \
  --from-literal=db_uri=postgresql://postgres:yourpassword@postgres:5432/jobboard \
  --from-literal=jwt_secret=yourjwtsecret
```

### 2. Deploy PostgreSQL

```bash
kubectl apply -f k8s/postgres-deployment.yaml
```

This creates:
- PostgreSQL deployment (1 replica)
- PostgreSQL service
- Persistent Volume Claim (10Gi)

### 3. Deploy Backend

```bash
kubectl apply -f k8s/backend-deployment.yaml
```

This creates:
- Backend deployment (2 replicas)
- Backend service (ClusterIP on port 4000)

### 4. Deploy Frontend

```bash
kubectl apply -f k8s/frontend-deployment.yaml
```

This creates:
- Frontend deployment (2 replicas)
- Frontend service (ClusterIP on port 80)

### 5. Setup Ingress (Optional)

```bash
kubectl apply -f k8s/ingress.yaml
```

This creates an ALB ingress controller that routes:
- `/api/*` → Backend service
- `/*` → Frontend service

### 6. Verify Deployment

```bash
# Check all pods are running
kubectl get pods

# Check services
kubectl get services

# Check ingress
kubectl get ingress

# View logs
kubectl logs -f deployment/jobboard-backend
kubectl logs -f deployment/jobboard-frontend
```

### 7. Access the Application

```bash
# Get the external IP or Load Balancer URL
kubectl get ingress jobboard-ingress

# Access via the provided URL
```

## 📡 API Documentation

### Authentication Endpoints

#### Register User
```
POST /api/auth/register
Content-Type: application/json

{
  "email": "user@example.com",
  "password": "password123",
  "name": "John Doe"
}
```

#### Login
```
POST /api/auth/login
Content-Type: application/json

{
  "email": "user@example.com",
  "password": "password123"
}

Response: { "token": "jwt_token_here" }
```

### Job Endpoints

#### Get All Jobs
```
GET /api/jobs
Authorization: Bearer <token>
```

#### Get Single Job
```
GET /api/jobs/:id
Authorization: Bearer <token>
```

#### Create Job (Admin only)
```
POST /api/jobs
Authorization: Bearer <token>
Content-Type: application/json

{
  "title": "Software Engineer",
  "description": "Job description here",
  "location": "New York, NY",
  "company": "Tech Corp"
}
```

#### Apply for Job
```
POST /api/jobs/:id/apply
Authorization: Bearer <token>
```

## 🔐 Environment Variables

### Backend (.env)

```env
# Database Configuration
DB_URI=postgresql://username:password@host:port/database

# JWT Configuration
JWT_SECRET=your_secret_key_here

# Server Configuration
PORT=4000
NODE_ENV=production
```

### Frontend (.env)

```env
# API Configuration
VITE_API_URL=http://localhost:4000
```

## 📁 Project Structure

```
jobboard-nodejs-docker-eks/
├── backend/
│   ├── src/
│   │   ├── app.js              # Express application entry point
│   │   ├── seed.js             # Database seeding script
│   │   ├── models/
│   │   │   └── index.js        # Sequelize models
│   │   ├── routes/
│   │   │   ├── auth.js         # Authentication routes
│   │   │   ├── jobs.js         # Job routes
│   │   │   └── users.js        # User routes
│   │   └── controllers/        # Route controllers
│   ├── Dockerfile              # Backend container image
│   ├── package.json            # Backend dependencies
│   └── .env.example            # Environment template
├── frontend/
│   ├── src/
│   │   ├── App.jsx             # Main React component
│   │   ├── main.jsx            # React entry point
│   │   ├── pages/
│   │   │   ├── Login.jsx       # Login page
│   │   │   └── Jobs.jsx        # Jobs listing page
│   │   ├── components/         # Reusable components
│   │   └── *.css               # Styling files
│   ├── Dockerfile              # Frontend container image
│   ├── vite.config.js          # Vite configuration
│   └── package.json            # Frontend dependencies
├── k8s/
│   ├── postgres-deployment.yaml    # PostgreSQL K8s manifest
│   ├── backend-deployment.yaml     # Backend K8s manifest
│   ├── frontend-deployment.yaml    # Frontend K8s manifest
│   └── ingress.yaml                # Ingress controller config
├── docker-compose.yml          # Docker Compose configuration
├── .gitignore                  # Git ignore rules
└── README.md                   # Project documentation
```

## 🛠️ Technologies Used

### Frontend
- **React** 18.x - UI library
- **Vite** - Build tool and dev server
- **React Router** - Client-side routing
- **Bootstrap** - CSS framework
- **Axios** - HTTP client

### Backend
- **Node.js** - JavaScript runtime
- **Express** - Web framework
- **Sequelize** - ORM for PostgreSQL
- **JWT** - Authentication
- **bcrypt** - Password hashing
- **CORS** - Cross-origin resource sharing

### Database
- **PostgreSQL** 15 - Relational database

### DevOps
- **Docker** - Containerization
- **Docker Compose** - Multi-container orchestration
- **Kubernetes** - Container orchestration
- **Nginx** - Frontend web server

## 🔄 Development Workflow

### Making Changes

1. Create a new branch
```bash
git checkout -b feature/your-feature-name
```

2. Make your changes

3. Test locally
```bash
# Test with Docker Compose
docker-compose up --build
```

4. Commit and push
```bash
git add .
git commit -m "Description of changes"
git push origin feature/your-feature-name
```

5. Create a Pull Request on GitHub

### Updating Docker Images

```bash
# Build new images
docker build -t saikiranasamwar4/jobboard-backend:latest ./backend
docker build -t saikiranasamwar4/jobboard-frontend:latest ./frontend

# Push to Docker Hub
docker push saikiranasamwar4/jobboard-backend:latest
docker push saikiranasamwar4/jobboard-frontend:latest

# Update Kubernetes deployment
kubectl rollout restart deployment/jobboard-backend
kubectl rollout restart deployment/jobboard-frontend
```

## 🐛 Troubleshooting

### Common Issues

**Backend won't start:**
- Check PostgreSQL is running
- Verify DB_URI in .env file
- Check port 4000 is not in use

**Frontend can't connect to backend:**
- Verify VITE_API_URL in frontend .env
- Check CORS settings in backend
- Ensure backend is running

**Docker Compose issues:**
- Run `docker-compose down -v` to clean volumes
- Check Docker daemon is running
- Verify port conflicts

**Kubernetes pods not starting:**
- Check secrets are created: `kubectl get secrets`
- View pod logs: `kubectl logs <pod-name>`
- Check image pull policy and registry access

## 📝 License

This project is open source and available under the [MIT License](LICENSE).

## 👨‍💻 Author

**Saikiran Rajesh Asamwar**  
Certified AWS DevOps Engineer

- 🌐 GitHub: [@SaikiranAsamwar](https://github.com/SaikiranAsamwar)
- <img src="https://www.docker.com/wp-content/uploads/2022/03/Moby-logo.png" alt="Docker" width="20"/> Docker Hub: [saikiranasamwar4](https://hub.docker.com/u/saikiranasamwar4)
- 💼 LinkedIn: [Saikiran Asamwar](https://www.linkedin.com/in/saikiran-asamwar/)
- 📧 Email: saikiranasamwar@gmail.com

## 🤝 Contributing

Contributions, issues, and feature requests are welcome!

1. Fork the project
2. Create your feature branch
3. Commit your changes
4. Push to the branch
5. Open a Pull Request

## ⭐ Show your support

Give a ⭐️ if this project helped you!