#!/bin/bash

# AWS Lambda Deployment Script for User News API

echo "Starting Lambda deployment process..."

# Create deployment package
echo "Creating deployment package..."
npm install --production

# Create zip file for Lambda excluding lambda.zip if it exists
echo "Creating zip file..."
zip -r lambda.zip . -x lambda.zip

# Optional: Deploy to AWS Lambda (uncomment and configure as needed)
# echo "Deploying to AWS Lambda..."
# aws lambda update-function-code \
#     --function-name lambda-zl-accounts-users \
#     --zip-file fileb://lambda.zip

echo "Deployment package created: lambda.zip"
echo "Upload this file to your AWS Lambda function or use AWS CLI to deploy."
    