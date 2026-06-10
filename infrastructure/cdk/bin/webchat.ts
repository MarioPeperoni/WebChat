#!/usr/bin/env node
import * as cdk from 'aws-cdk-lib';

import { WebChatStack } from '../lib/webchat-stack';
import { OidcBootstrapStack } from '../lib/oidc-bootstrap-stack';

const app = new cdk.App();

const appName = app.node.tryGetContext('appName');
if (!appName) throw new Error('Context value "appName" is required (set in cdk.json)');

const region = app.node.tryGetContext('region') ?? 'eu-central-1';
const account = process.env.CDK_DEFAULT_ACCOUNT;

new OidcBootstrapStack(app, 'OidcBootstrapStack', {
  env: { account, region },
  appName,
  githubOwner: app.node.tryGetContext('githubOwner') ?? '<set-githubOwner-context>',
  githubRepo: app.node.tryGetContext('githubRepo') ?? '<set-githubRepo-context>',
});

new WebChatStack(app, 'WebChatStack', {
  env: { account, region },
  appName,
  rootDomain: app.node.tryGetContext('rootDomain') ?? 'chat.mthings.online',
  wsSubdomain: app.node.tryGetContext('wsSubdomain') ?? 'ws.chat.mthings.online',
  frontendCertArn: app.node.tryGetContext('frontendCertArn'),
  apiCertArn: app.node.tryGetContext('apiCertArn'),
});
