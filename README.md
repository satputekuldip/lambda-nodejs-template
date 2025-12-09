# Lambda Node.js Template with Bitbucket CI/CD (OIDC)

This is a template for an AWS Lambda function running Node.js (ES Modules) using `serverless-http` to wrap an Express app. It includes a pre-configured Bitbucket Pipelines setup for automated deployment to AWS using OpenID Connect (OIDC) for secure, keyless authentication.

## Project Structure

```
├── config/             # Database and app configuration
├── functions/          # Business logic and route handlers
├── utils/              # Utility functions (e.g., standard responses)
├── index.mjs           # Lambda entry point (Express app wrapper)
├── bitbucket-pipelines.yml # CI/CD configuration
├── deploy-lambda.sh    # Script for manual deployment/packaging
└── package.json        # Dependencies and scripts
```

## Prerequisites

-   **Node.js** (v20+ recommended)
-   **AWS Account**
-   **Bitbucket Repository**
-   **AWS CLI** (optional, for manual deployment)

## Local Setup

1.  **Install Dependencies:**
    ```bash
    npm install
    ```

2.  **Environment Variables:**
    Copy `.env.example` to `.env` and configure your local variables.
    ```bash
    cp .env.example .env
    ```

3.  **Run Locally:**
    Since this is a standard Express app wrapped for Lambda, you can add a local server script if needed, or test functions individually.

## Manual Deployment

You can package the application for manual upload using the included script:

```bash
chmod +x deploy-lambda.sh
./deploy-lambda.sh
```

This creates a `lambda.zip` file which you can upload via the AWS Console or AWS CLI.

---

## Setting up Bitbucket Pipelines with AWS OIDC

This project is configured to use OpenID Connect (OIDC) to authenticate with AWS. This allows Bitbucket Pipelines to deploy to your AWS account without storing long-term Access Keys / Secret Keys.

### Step 1: Get OIDC Info from Bitbucket

1.  Go to your **Bitbucket Repository**.
2.  Navigate to **Repository Settings** > **OpenID Connect** (under Pipelines).
3.  Note down the **Identity provider URL** and **Audience**.
    *   *URL Example:* `https://api.bitbucket.org/2.0/workspaces/my-workspace/pipelines-config/identity/oidc`
    *   *Audience Example:* `ari:cloud:bitbucket::workspace/my-workspace`

### Step 2: Create Identity Provider in AWS

1.  Log in to the **AWS Console** and go to **IAM**.
2.  Click **Identity providers** > **Add provider**.
3.  Select **OpenID Connect**.
4.  **Provider URL**: Paste the *Identity provider URL* you copied from Bitbucket. Click "Get thumbprint".
5.  **Audience**: Paste the *Audience* from Bitbucket.
6.  Click **Add provider**.

### Step 3: Create IAM Role for Deployment

1.  In **IAM**, go to **Roles** > **Create role**.
2.  Select **Web identity**.
3.  **Identity provider**: Select the provider you just created.
4.  **Audience**: Select the audience you added.
5.  Click **Next**.
6.  **Permissions**: Add policies required for your deployment. For this template, you typically need:
    *   `AWSLambdaBasicExecutionRole` (logging)
    *   Permission to update your specific Lambda function code:
        ```json
        {
            "Version": "2012-10-17",
            "Statement": [
                {
                    "Effect": "Allow",
                    "Action": [
                        "lambda:UpdateFunctionCode",
                        "lambda:GetFunctionConfiguration"
                    ],
                    "Resource": "arn:aws:lambda:YOUR_REGION:YOUR_ACCOUNT_ID:function:YOUR_FUNCTION_NAME"
                }
            ]
        }
        ```
7.  Click **Next**, name the role (e.g., `BitbucketPipelinesDeployRole`), and create it.

### Step 4: Refine Trust Relationship (Optional but Recommended)

To ensure only *this* specific repository can deploy using this role:

1.  Click on the Role you just created.
2.  Go to the **Trust relationships** tab > **Edit trust policy**.
3.  Update the `Condition` to match your repository UUID (you can find the repository UUID in the Bitbucket OIDC settings page or URL).
    ```json
    "Condition": {
        "StringLike": {
             "api.bitbucket.org/2.0/workspaces/YOUR_WORKSPACE/pipelines-config/identity/oidc:sub": "{YOUR_REPO_UUID}:*"
        }
    }
    ```

### Step 5: Configure Bitbucket Repository Variables

1.  Go to your **Bitbucket Repository** > **Repository Settings** > **Repository variables** (under Pipelines).
2.  Add the following variables:

    | Name | Value | Description |
    |------|-------|-------------|
    | `AWS_REGION` | `us-east-1` (or your region) | AWS Region where the Lambda exists |
    | `AWS_OIDC_ROLE_ARN` | `arn:aws:iam::123456789:role/BitbucketPipelinesDeployRole` | ARN of the IAM Role created in Step 3 |
    | `LAMBDA_FUNCTION_NAME`| `my-lambda-function` | Name of the destination Lambda function |

### Step 6: Deploy

1.  Commit and push your changes to the `main` branch.
2.  Navigate to **Pipelines** in Bitbucket to watch the deployment status.

The pipeline will:
1.  Install dependencies.
2.  Zip the application.
3.  Authenticate via OIDC using the assumed role.
4.  Deploy the zip file to your AWS Lambda function.
