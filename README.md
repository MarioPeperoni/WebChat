# WebChat

Serverless real-time chat on AWS. React frontend on CloudFront, WebSocket Lambdas behind API Gateway, DynamoDB for connections + nick assignment.

| Layer | URL | Backed by |
|---|---|---|
| Frontend | `https://chat.mthings.online` | S3 + CloudFront + OAC |
| WebSocket | `wss://ws.chat.mthings.online` | WebSocket API → Lambda + DynamoDB |

Primary region: `eu-central-1`. CloudFront cert lives in `us-east-1` (AWS requirement).

## First-time setup

Locally needed: AWS CLI with temporary admin credentials, Node 22, [bun](https://bun.sh).

```bash
cd infrastructure/cdk
npm ci

# 1. CDK bootstrap (once per account/region)
npx cdk bootstrap aws://<ACCOUNT_ID>/eu-central-1

# 2. Issue ACM certificates (Console or aws acm request-certificate):
#    - us-east-1   : chat.mthings.online      (CloudFront)
#    - eu-central-1: ws.chat.mthings.online   (API Gateway custom domain)
#    Validate each one with a CNAME at your domain registrar.

# 3. Paste the two ARNs into infrastructure/cdk/cdk.json (context.frontendCertArn, context.apiCertArn).

# 4. Deploy the GitHub OIDC role (once per AWS account)
npx cdk deploy OidcBootstrapStack \
  --context githubOwner=<gh-owner> \
  --context githubRepo=WebChat
# Copy the DeployRoleArn output → GitHub repo secret AWS_DEPLOY_ROLE_ARN.
```

After this, `git push origin main` runs the CI deploy. Local admin creds are no longer needed.

## Manual deploy (no CI)

```bash
# Infra + Lambdas
cd infrastructure/cdk
npx cdk deploy WebChatStack --outputs-file cdk-outputs.json

# Frontend
cd ../../frontend
bun install
echo "VITE_WS_URL=wss://ws.chat.mthings.online" > .env
bun run build

BUCKET=$(jq -r '.WebChatStack.FrontendBucketName' ../infrastructure/cdk/cdk-outputs.json)
DIST=$(jq -r '.WebChatStack.FrontendDistributionId' ../infrastructure/cdk/cdk-outputs.json)
aws s3 sync dist s3://$BUCKET --delete
aws cloudfront create-invalidation --distribution-id $DIST --paths '/*'
```

## DNS — once, after the first deploy

Read these from the CDK outputs and set two CNAMEs at the registrar:

| Host | Value |
|---|---|
| `chat` | `FrontendDistributionDomain` |
| `ws.chat` | `WsDomainTarget` |

## Local frontend dev

```bash
cd frontend
bun install
echo "VITE_WS_URL=wss://ws.chat.mthings.online" > .env
bun run dev    # http://localhost:5173 hits the deployed WebSocket
```

## Tear-down

```bash
cd infrastructure/cdk
npx cdk destroy WebChatStack
```

`OidcBootstrapStack` has no recurring cost — leave it unless you stop using the repo. ACM certs and DNS records: remove manually.

## Layout

```
backend/            TS Lambda handlers — handler → service → repository, DI container
frontend/           React + Vite
infrastructure/cdk  CDK (TS) — WebChatStack + OidcBootstrapStack
.github/workflows   CI: OIDC-authenticated deploy on push to main
```
