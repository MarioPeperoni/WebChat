import * as cdk from 'aws-cdk-lib';
import { Construct } from 'constructs';

import {
  ChatLambdas,
  ConnectionsTable,
  FrontendHosting,
  HttpApi,
  WebSocketApi,
} from './constructs';

export interface WebChatStackProps extends cdk.StackProps {
  appName: string;
  rootDomain: string;
  apiSubdomain: string;
  wsSubdomain: string;
  allowedOrigins: string[];
  frontendCertArn?: string;
  apiCertArn?: string;
}

export class WebChatStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props: WebChatStackProps) {
    super(scope, id, props);

    cdk.Tags.of(this).add('app', props.appName);

    const connections = new ConnectionsTable(this, 'Connections');

    const lambdas = new ChatLambdas(this, 'Lambdas', {
      appName: props.appName,
      connectionsTable: connections.table,
      allowedOrigins: props.allowedOrigins,
    });

    const httpApi = new HttpApi(this, 'HttpApi', {
      appName: props.appName,
      assignUserFn: lambdas.assignUser,
      allowedOrigins: props.allowedOrigins,
      customDomain: props.apiCertArn
        ? { name: props.apiSubdomain, certArn: props.apiCertArn }
        : undefined,
    });

    const wsApi = new WebSocketApi(this, 'WsApi', {
      appName: props.appName,
      connectFn: lambdas.connect,
      disconnectFn: lambdas.disconnect,
      sendMessageFn: lambdas.sendMessage,
      customDomain: props.apiCertArn
        ? { name: props.wsSubdomain, certArn: props.apiCertArn }
        : undefined,
    });

    const frontend = new FrontendHosting(this, 'Frontend', {
      customDomain: props.frontendCertArn
        ? { name: props.rootDomain, certArn: props.frontendCertArn }
        : undefined,
    });

    new cdk.CfnOutput(this, 'HttpApiUrl', { value: httpApi.api.apiEndpoint });
    new cdk.CfnOutput(this, 'WsApiUrl', { value: wsApi.stage.url });
    new cdk.CfnOutput(this, 'FrontendBucketName', { value: frontend.bucket.bucketName });
    new cdk.CfnOutput(this, 'FrontendDistributionId', {
      value: frontend.distribution.distributionId,
    });
    new cdk.CfnOutput(this, 'FrontendDistributionDomain', {
      value: frontend.distribution.distributionDomainName,
    });
  }
}
