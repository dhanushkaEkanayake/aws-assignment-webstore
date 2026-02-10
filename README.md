# hSenid Mobile Cloud Assignment Store

A containerized Node.js e-commerce application designed for the **AWS Infrastructure Deployment Assignment**. This application integrates with Amazon RDS, S3, and EFS -- your task is to provision the AWS infrastructure and deploy it.

## What This App Does

- **Product Catalog**: Browse, search, and filter products by category
- **User Authentication**: Register, login, and manage shopping cart
- **Admin Dashboard**: Create, edit, and delete products with image uploads
- **Health Check**: `/health` endpoint for ALB target group monitoring

## Tech Stack

| Component | Technology |
|-----------|-----------|
| Runtime | Node.js 20 (Alpine) |
| Framework | Express.js 4.x + EJS Templates |
| Database | PostgreSQL via Sequelize ORM |
| Storage | AWS S3 (product images + static assets) |
| Logging | Winston with daily rotation to EFS |
| Container | Docker (multi-stage build) |

## AWS Services Used by This App

| Service | What the App Uses It For |
|---------|------------------------|
| **ECR** | Stores the Docker image you build and push |
| **EC2** | Runs the Docker container |
| **RDS (PostgreSQL)** | Stores users, products, and cart data |
| **S3** | Stores product images (uploaded by admin) and static assets (CSS, JS, SVGs) |
| **EFS** | Stores application log files (`app-YYYY-MM-DD.log`, `error-YYYY-MM-DD.log`) |

## Quick Start - Build and Push to ECR

```bash
# 1. Clone the repository
git clone <repository-url>
cd hsenid-mobile-cloud-assignment-store

# 2. Build the Docker image
docker build -t hsenid-cloudmart .

# 3. Login to your ECR
aws ecr get-login-password --region <your-region> | \
  docker login --username AWS --password-stdin <account-id>.dkr.ecr.<region>.amazonaws.com

# 4. Tag and push
docker tag hsenid-cloudmart:latest <account-id>.dkr.ecr.<region>.amazonaws.com/aws-assignment:latest
docker push <account-id>.dkr.ecr.<region>.amazonaws.com/aws-assignment:latest
```

## Deploy on EC2

1. Copy `docker-compose.prod.yml` to your EC2 instance
2. Replace all `<< CHANGE THIS >>` values with your AWS resource details
3. Run:

```bash
docker-compose -f docker-compose.prod.yml up -d
```

4. Seed the database:

```bash
docker exec hsenid-cloudmart node scripts/seed.js
docker exec hsenid-cloudmart node scripts/update-product-images.js
```

## Default Login Credentials

| Role | Email | Password |
|------|-------|----------|
| Admin | `admin@hsenid.lk` | `Admin@123` |
| Customer | `customer@example.com` | `Customer@123` |

## Important Files

| File | Purpose |
|------|---------|
| `Dockerfile` | Multi-stage build for production |
| `docker-compose.prod.yml` | **Production deployment** - copy to EC2 and fill in your values |
| `docker-compose.yml` | Local development only (includes PostgreSQL container) |
| `scripts/seed.js` | Creates default users and sample products |
| `scripts/update-product-images.js` | Updates product image URLs to point to your S3 bucket |
| `scripts/upload-s3-assets.sh` | Uploads static assets (CSS, JS, SVGs) to your S3 bucket |
| `s3-assets/` | Static files to be uploaded to S3 |

## Full Deployment Guide

See **[DEPLOYMENT.md](DEPLOYMENT.md)** for:

- Detailed explanation of how the application works
- How each AWS service (RDS, S3, EFS) is integrated
- Step-by-step deployment instructions
- EC2 IAM role policy
- S3 bucket policy
- EFS mount instructions
- Troubleshooting guide
- Verification checklist

---

**hSenid Mobile Solutions | AWS DevOps Training Assignment**
