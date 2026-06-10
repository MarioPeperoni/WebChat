import * as cdk from 'aws-cdk-lib';
import * as iam from 'aws-cdk-lib/aws-iam';
import { Construct } from 'constructs';

export interface OidcBootstrapStackProps extends cdk.StackProps {
  appName: string;
  githubOwner: string;
  githubRepo: string;
  branches?: string[];
  roleName?: string;
}

export class OidcBootstrapStack extends cdk.Stack {
  readonly deployRole: iam.Role;

  constructor(scope: Construct, id: string, props: OidcBootstrapStackProps) {
    super(scope, id, props);

    cdk.Tags.of(this).add('app', props.appName);

    const branches = props.branches ?? ['main'];
    const roleName = props.roleName ?? `${props.appName}-github-actions-deploy`;

    const provider = new iam.OpenIdConnectProvider(this, 'GithubOidcProvider', {
      url: 'https://token.actions.githubusercontent.com',
      clientIds: ['sts.amazonaws.com'],
    });

    const subjectClaims = branches.map(
      (branch) => `repo:${props.githubOwner}/${props.githubRepo}:ref:refs/heads/${branch}`,
    );

    this.deployRole = new iam.Role(this, 'GithubActionsDeployRole', {
      roleName,
      maxSessionDuration: cdk.Duration.hours(1),
      assumedBy: new iam.WebIdentityPrincipal(provider.openIdConnectProviderArn, {
        StringEquals: {
          'token.actions.githubusercontent.com:aud': 'sts.amazonaws.com',
        },
        StringLike: {
          'token.actions.githubusercontent.com:sub': subjectClaims,
        },
      }),
    });

    this.deployRole.addToPrincipalPolicy(
      new iam.PolicyStatement({
        sid: 'AssumeCdkBootstrapRoles',
        actions: ['sts:AssumeRole'],
        resources: ['arn:aws:iam::*:role/cdk-*'],
      }),
    );

    const bucketPrefix = `${props.appName.toLowerCase()}stack-`;
    this.deployRole.addToPrincipalPolicy(
      new iam.PolicyStatement({
        sid: 'FrontendBucketSync',
        actions: [
          's3:ListBucket',
          's3:GetObject',
          's3:PutObject',
          's3:DeleteObject',
        ],
        resources: [
          `arn:aws:s3:::${bucketPrefix}*`,
          `arn:aws:s3:::${bucketPrefix}*/*`,
        ],
      }),
    );

    this.deployRole.addToPrincipalPolicy(
      new iam.PolicyStatement({
        sid: 'CloudFrontInvalidate',
        actions: ['cloudfront:CreateInvalidation'],
        resources: ['*'],
      }),
    );

    new cdk.CfnOutput(this, 'DeployRoleArn', {
      value: this.deployRole.roleArn,
      description: 'Set this as GitHub secret AWS_DEPLOY_ROLE_ARN',
    });
  }
}
