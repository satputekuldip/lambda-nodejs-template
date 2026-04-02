#!/bin/bash

# AWS Lambda Deployment Script for User News API

echo "Starting Lambda deployment process..."

# Install production dependencies and build TypeScript
echo "Installing production dependencies..."
npm install --production

echo "Building TypeScript sources..."
npm run build

# Create zip file for Lambda from compiled output and dependencies
echo "Creating zip file from dist/ and node_modules..."
cd dist
zip -r ../lambda.zip .
cd ..
zip -r lambda.zip node_modules -x lambda.zip

# Optional: Deploy to AWS Lambda (uncomment and configure as needed)
# echo "Deploying to AWS Lambda..."
# aws lambda update-function-code \
#     --function-name lambda-zl-accounts-users \
#     --zip-file fileb://lambda.zip

echo "Deployment package created: lambda.zip"
echo "Upload this file to your AWS Lambda function or use AWS CLI to deploy."
    