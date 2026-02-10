#!/bin/bash
# =============================================================================
# Upload Static Assets to S3
# =============================================================================
# This script uploads static assets (CSS, JS, images) to the S3 bucket.
# Run this from the project root directory.
#
# Prerequisites:
#   - AWS CLI configured (aws configure or IAM role on EC2)
#   - S3 bucket must exist
#
# Usage:
#   chmod +x scripts/upload-s3-assets.sh
#   ./scripts/upload-s3-assets.sh
# =============================================================================

S3_BUCKET="${AWS_S3_BUCKET:-aws-assignment-rsp}"
S3_REGION="${AWS_REGION:-us-east-2}"
ASSETS_DIR="s3-assets/static"

echo "============================================="
echo "Uploading static assets to S3"
echo "Bucket: ${S3_BUCKET}"
echo "Region: ${S3_REGION}"
echo "============================================="

# Upload CSS files
echo ""
echo "--- Uploading CSS ---"
aws s3 cp ${ASSETS_DIR}/css/style.css s3://${S3_BUCKET}/static/css/style.css \
  --content-type "text/css" \
  --cache-control "public, max-age=86400" \
  --region ${S3_REGION}

# Upload JS files
echo ""
echo "--- Uploading JS ---"
aws s3 cp ${ASSETS_DIR}/js/main.js s3://${S3_BUCKET}/static/js/main.js \
  --content-type "application/javascript" \
  --cache-control "public, max-age=86400" \
  --region ${S3_REGION}

# Upload logo
echo ""
echo "--- Uploading Logo ---"
aws s3 cp ${ASSETS_DIR}/images/logo.svg s3://${S3_BUCKET}/static/images/logo.svg \
  --content-type "image/svg+xml" \
  --cache-control "public, max-age=604800" \
  --region ${S3_REGION}

# Upload product placeholder images
echo ""
echo "--- Uploading Product Images ---"
for file in ${ASSETS_DIR}/images/products/*.svg; do
  filename=$(basename "$file")
  aws s3 cp "$file" s3://${S3_BUCKET}/static/images/products/${filename} \
    --content-type "image/svg+xml" \
    --cache-control "public, max-age=604800" \
    --region ${S3_REGION}
done

echo ""
echo "============================================="
echo "Upload complete!"
echo ""
echo "S3 URLs:"
echo "  CSS:    https://${S3_BUCKET}.s3.${S3_REGION}.amazonaws.com/static/css/style.css"
echo "  JS:     https://${S3_BUCKET}.s3.${S3_REGION}.amazonaws.com/static/js/main.js"
echo "  Logo:   https://${S3_BUCKET}.s3.${S3_REGION}.amazonaws.com/static/images/logo.svg"
echo "  Images: https://${S3_BUCKET}.s3.${S3_REGION}.amazonaws.com/static/images/products/"
echo "============================================="
echo ""
echo "To verify, run:"
echo "  aws s3 ls s3://${S3_BUCKET}/static/ --recursive"
