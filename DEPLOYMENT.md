# Deployment Guide - hSenid Mobile Cloud Assignment Store

## Table of Contents

- [Application Overview](#application-overview)
- [How the Application Works](#how-the-application-works)
- [AWS Services Integration](#aws-services-integration)
- [Deployment Steps](#deployment-steps)
- [Post-Deployment Setup](#post-deployment-setup)
- [Verification Checklist](#verification-checklist)
- [Troubleshooting](#troubleshooting)

---

## Application Overview

This is a Node.js e-commerce web application that allows users to browse products, add them to a cart, and checkout. Admin users can manage products (create, edit, delete) with image uploads.

The application is designed to integrate with AWS services:

| AWS Service | Purpose |
|-------------|---------|
| **Amazon ECR** | Stores the Docker container image |
| **Amazon EC2** | Runs the containerized application |
| **Amazon RDS** | PostgreSQL database for users, products, and cart data |
| **Amazon S3** | Stores product images and static assets (CSS, JS) |
| **Amazon EFS** | Persistent storage for application log files |

---

## How the Application Works

### Architecture

```
User Browser
     |
     v
 [EC2 Instance]
     |
     +-- Docker Container (Node.js App - Port 8089)
              |
              +---> RDS PostgreSQL (users, products, cart_items tables)
              |
              +---> S3 Bucket
              |       +-- /static/css/       (stylesheets)
              |       +-- /static/js/        (client-side scripts)
              |       +-- /static/images/    (logos, product placeholder SVGs)
              |       +-- /products/         (user-uploaded product images)
              |
              +---> EFS (mounted at /logs on EC2, bind-mounted to /app/logs in container)
                      +-- app-2026-02-10.log   (daily application logs)
                      +-- error-2026-02-10.log (daily error logs)
```

### User Flow

1. Visitors can browse products and view details
2. Users register/login to get a shopping cart
3. Authenticated users can add products to cart and checkout
4. Admin users (`admin@hsenid.lk` / `Admin@123`) can manage products from `/admin/products`
5. When an admin creates a product with an image, the image is uploaded to S3
6. The app reads the database from RDS and writes logs to EFS

### Key Endpoints

| URL | What It Does |
|-----|-------------|
| `/` | Redirects to products page |
| `/products` | Browse all products with search and category filter |
| `/products/:id` | View a single product's details |
| `/login` | Login page |
| `/register` | Registration page |
| `/cart` | View shopping cart (requires login) |
| `/admin/products` | Admin product management dashboard (requires admin login) |
| `/health` | Health check endpoint (returns 200 OK) - use for ALB target group |

### Default Users (created by seed script)

| Role | Email | Password |
|------|-------|----------|
| Admin | `admin@hsenid.lk` | `Admin@123` |
| Customer | `customer@example.com` | `Customer@123` |

---

## AWS Services Integration

### How RDS Is Used

The application uses **Sequelize ORM** to connect to a PostgreSQL database on RDS. It creates 3 tables automatically on first startup:

- **users** - stores registered users (email, bcrypt-hashed password, role)
- **products** - stores product catalog (name, description, price, category, S3 image URL)
- **cart_items** - stores shopping cart entries (user ID, product ID, quantity)

The connection is configured via environment variables (`DB_HOST`, `DB_PORT`, `DB_NAME`, `DB_USER`, `DB_PASSWORD`). In production, it uses SSL to connect to RDS.

**Important**: The RDS security group must allow inbound PostgreSQL traffic (port 5432) from the EC2 instance's security group.

### How S3 Is Used

S3 serves two purposes in this application:

**1. Static Assets (CSS, JS, product placeholder images)**
- Uploaded once during setup using the `scripts/upload-s3-assets.sh` script
- Stored under `s3://your-bucket/static/`
- The app serves these from S3 instead of from the container when `STATIC_S3_URL` is set
- This simulates a CDN-like pattern common in production deployments

**2. Product Images (uploaded by admin)**
- When an admin creates or edits a product and uploads an image, the app uses AWS SDK to put the file into `s3://your-bucket/products/<product-id>/<timestamp>.<ext>`
- The image URL is saved in the database
- Images are served directly from S3 to the browser

**S3 Bucket Policy Required** - The bucket needs a public read policy so browsers can load the images and assets:

```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Sid": "PublicReadAssets",
      "Effect": "Allow",
      "Principal": "*",
      "Action": "s3:GetObject",
      "Resource": [
        "arn:aws:s3:::YOUR-BUCKET-NAME/static/*",
        "arn:aws:s3:::YOUR-BUCKET-NAME/products/*"
      ]
    }
  ]
}
```

**Note**: You must disable "Block Public Access" settings on the bucket before applying this policy.

### How EFS Is Used

The application writes daily-rotated log files using the Winston logging library:

- `app-YYYY-MM-DD.log` - All application logs (requests, events, info)
- `error-YYYY-MM-DD.log` - Error logs only (for quick debugging)

On EC2, the EFS file system is mounted at `/logs`. Docker maps this into the container:

```
EC2 Host:  /logs/          <-- EFS mount point
                |
Container: /app/logs/      <-- App writes logs here (mapped via docker volume)
```

This ensures logs persist even if the container is restarted or replaced. In a multi-instance setup (Auto Scaling), all instances share the same EFS, so logs from all instances are in one place.

**EFS Setup on EC2**:
```bash
# Mount EFS (replace fs-xxxxxxxx with your EFS ID)
sudo mkdir -p /logs
sudo mount -t nfs4 -o nfsvers=4.1 fs-xxxxxxxx.efs.us-east-2.amazonaws.com:/ /logs
sudo chmod 777 /logs

# To persist the mount across reboots, add to /etc/fstab:
# fs-xxxxxxxx.efs.us-east-2.amazonaws.com:/ /logs nfs4 nfsvers=4.1,rsize=1048576,wsize=1048576,hard,timeo=600,retrans=2 0 0
```

### EC2 IAM Role Permissions

The EC2 instance needs an IAM role with the following permissions for the application to work:

```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Sid": "S3ProductImages",
      "Effect": "Allow",
      "Action": ["s3:PutObject", "s3:GetObject", "s3:DeleteObject"],
      "Resource": "arn:aws:s3:::YOUR-BUCKET-NAME/products/*"
    },
    {
      "Sid": "S3StaticAssets",
      "Effect": "Allow",
      "Action": ["s3:GetObject", "s3:ListBucket"],
      "Resource": [
        "arn:aws:s3:::YOUR-BUCKET-NAME",
        "arn:aws:s3:::YOUR-BUCKET-NAME/static/*"
      ]
    },
    {
      "Sid": "ECRPull",
      "Effect": "Allow",
      "Action": [
        "ecr:GetAuthorizationToken",
        "ecr:BatchCheckLayerAvailability",
        "ecr:GetDownloadUrlForLayer",
        "ecr:BatchGetImage"
      ],
      "Resource": "*"
    },
    {
      "Sid": "CloudWatchLogs",
      "Effect": "Allow",
      "Action": [
        "logs:CreateLogGroup",
        "logs:CreateLogStream",
        "logs:PutLogEvents",
        "logs:DescribeLogStreams"
      ],
      "Resource": "arn:aws:logs:*:*:log-group:/hsenid-cloudmart/*"
    }
  ]
}
```

---

## Deployment Steps

### Step 1: Build and Push Docker Image to ECR

```bash
# Clone the repository
git clone <repository-url>
cd hsenid-mobile-cloud-assignment-store

# Build the Docker image
docker build -t hsenid-cloudmart .

# Authenticate to your ECR
aws ecr get-login-password --region <your-region> | \
  docker login --username AWS --password-stdin <your-account-id>.dkr.ecr.<your-region>.amazonaws.com

# Tag the image for ECR
docker tag hsenid-cloudmart:latest \
  <your-account-id>.dkr.ecr.<your-region>.amazonaws.com/aws-assignment:latest

# Push to ECR
docker push <your-account-id>.dkr.ecr.<your-region>.amazonaws.com/aws-assignment:latest
```

### Step 2: Upload Static Assets to S3

Run this from the cloned repository directory (where you have AWS CLI configured):

```bash
# Upload CSS, JS, logo, and product placeholder images to S3
export AWS_S3_BUCKET=your-bucket-name
export AWS_REGION=your-region
bash scripts/upload-s3-assets.sh

# Verify
aws s3 ls s3://your-bucket-name/static/ --recursive
```

### Step 3: Configure docker-compose on EC2

1. Copy `docker-compose.prod.yml` to your EC2 instance
2. Rename it to `docker-compose.yml`
3. Replace all `<< CHANGE THIS >>` placeholders with your actual values

### Step 4: Start the Application on EC2

```bash
# Pull the image from ECR
aws ecr get-login-password --region <your-region> | \
  docker login --username AWS --password-stdin <your-account-id>.dkr.ecr.<your-region>.amazonaws.com

# Start the application
docker-compose up -d

# Check it's running
docker ps
docker logs hsenid-cloudmart --tail 20
```

### Step 5: Initialize the Database

The application automatically creates the database tables on first startup. To add sample data:

```bash
# Seed default users and 10 sample products
docker exec hsenid-cloudmart node scripts/seed.js

# Update product images to point to S3 URLs
docker exec hsenid-cloudmart node scripts/update-product-images.js
```

---

## Post-Deployment Setup

### S3 Bucket Public Access

For the app to serve images and static assets, the S3 bucket needs public read access:

```bash
# 1. Disable Block Public Access
aws s3api put-public-access-block \
  --bucket YOUR-BUCKET-NAME \
  --public-access-block-configuration "BlockPublicAcls=false,IgnorePublicAcls=false,BlockPublicPolicy=false,RestrictPublicBuckets=false" \
  --region YOUR-REGION

# 2. Apply bucket policy for public read
aws s3api put-bucket-policy --bucket YOUR-BUCKET-NAME --region YOUR-REGION --policy '{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Sid": "PublicReadAssets",
      "Effect": "Allow",
      "Principal": "*",
      "Action": "s3:GetObject",
      "Resource": [
        "arn:aws:s3:::YOUR-BUCKET-NAME/static/*",
        "arn:aws:s3:::YOUR-BUCKET-NAME/products/*"
      ]
    }
  ]
}'
```

### EFS Mount Permissions

```bash
sudo mkdir -p /logs
sudo chmod 777 /logs
```

---

## Verification Checklist

After deployment, verify each AWS service integration:

| Check | Command / Action | Expected Result |
|-------|-----------------|-----------------|
| App is running | `curl http://localhost:8089/health` | Returns `{"status":"ok"}` |
| RDS connected | Check docker logs for `Database connected successfully` | No connection errors |
| Products load | Open `http://<EC2-IP>:8089/products` | Products page shows with images |
| S3 images load | Check product images are visible (not broken icons) | Colorful SVG images display |
| S3 static assets | View page source, CSS/JS URLs point to S3 | `https://bucket.s3.region.amazonaws.com/static/...` |
| S3 upload works | Login as admin, create product with image | Log shows `Image uploaded to S3` |
| EFS logs writing | `ls -la /logs/` on EC2 host | See `app-YYYY-MM-DD.log` files |
| Admin login | Login with `admin@hsenid.lk` / `Admin@123` | Redirects to home, Admin badge visible |

---

## Troubleshooting

### Container won't start

```bash
# Check container status
docker ps -a

# Check logs for errors
docker logs hsenid-cloudmart
```

Common causes:
- Wrong ECR image URI - check account ID, region, repo name, tag
- ECR login expired - re-run `aws ecr get-login-password` command

### Database connection failed

**Symptom**: Logs show `Unable to connect to the database` or `no pg_hba.conf entry`

**Checks**:
- Verify RDS endpoint is correct in `DB_HOST`
- Verify RDS security group allows inbound from EC2 security group on port 5432
- Verify `DB_USER` and `DB_PASSWORD` are correct
- Verify `DB_NAME` database exists in RDS (the app creates tables, not the database itself)

To create the database on RDS:
```bash
# From EC2, connect to RDS using psql
psql -h YOUR-RDS-ENDPOINT -U YOUR-DB-USER -d postgres
# Then run:
CREATE DATABASE cloudmart;
\q
```

### Product images not loading (broken image icons)

**Symptom**: Products show "No Image" blue placeholder or broken image icon

**Checks**:
1. Are S3 static assets uploaded? `aws s3 ls s3://YOUR-BUCKET/static/ --recursive`
2. Were product images updated in DB? Run `docker exec hsenid-cloudmart node scripts/update-product-images.js`
3. Is S3 bucket publicly readable? Test: `curl -I https://YOUR-BUCKET.s3.YOUR-REGION.amazonaws.com/static/css/style.css` (should return 200)
4. If public access is blocked, apply the bucket policy (see Post-Deployment Setup above)

### S3 upload fails when adding products

**Symptom**: Logs show `S3 upload error` when admin creates a product with an image

**Checks**:
- EC2 IAM role must have `s3:PutObject` permission on the bucket
- Verify IAM role is attached: `curl http://169.254.169.254/latest/meta-data/iam/security-credentials/`
- Verify `AWS_S3_BUCKET` and `AWS_REGION` are set correctly in docker-compose

### EFS logs not writing

**Symptom**: `/logs/` directory on EC2 is empty

**Checks**:
- Is EFS mounted? `df -h /logs` (should show an NFS mount)
- Does the directory have write permissions? `ls -la /logs/`
- Fix permissions: `sudo chmod 777 /logs`
- Restart container after fixing: `docker restart hsenid-cloudmart`

### Page loads but CSS/JS is missing (unstyled page)

**Symptom**: Page loads with raw HTML, no styling

**Checks**:
- Is `STATIC_S3_URL` set correctly in docker-compose?
- Format should be: `https://BUCKET-NAME.s3.REGION.amazonaws.com/static`
- Are assets uploaded to S3? `aws s3 ls s3://YOUR-BUCKET/static/css/`
- Is S3 bucket publicly readable?

### HTTPS redirect / SSL issues

This app is designed to run on **HTTP** (not HTTPS). If you're accessing via HTTPS:
- The app itself does not handle SSL
- SSL termination should be done at the ALB level
- If you see ERR_SSL_PROTOCOL_ERROR when using HTTPS directly to EC2, that's expected - use HTTP

---

## Environment Variables Reference

| Variable | Required | Description | Example |
|----------|----------|-------------|---------|
| `NODE_ENV` | Yes | Must be `production` for deployment | `production` |
| `PORT` | Yes | Port the app listens on | `8089` |
| `DB_DIALECT` | Yes | Database type | `postgres` |
| `DB_HOST` | Yes | RDS endpoint | `mydb.abc.us-east-2.rds.amazonaws.com` |
| `DB_PORT` | Yes | Database port | `5432` |
| `DB_NAME` | Yes | Database name | `cloudmart` |
| `DB_USER` | Yes | Database username | `dbadmin` |
| `DB_PASSWORD` | Yes | Database password | `MySecurePassword123` |
| `SESSION_SECRET` | Yes | Random string for session encryption | `any-random-string-here` |
| `AWS_REGION` | Yes | AWS region for S3 | `us-east-2` |
| `AWS_S3_BUCKET` | Yes | S3 bucket name | `my-assignment-bucket` |
| `STATIC_S3_URL` | Yes | Full URL to S3 static folder | `https://my-bucket.s3.us-east-2.amazonaws.com/static` |

---

**hSenid Mobile Solutions | AWS DevOps Training Assignment**
