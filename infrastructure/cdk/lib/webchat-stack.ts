import * as cdk from 'aws-cdk-lib';
import { Construct } from 'constructs';

import {
  ApiLambdas,
  ChatTable,
  FrontendHosting,
  HttpApi,
  WebSocketApi,
  WsLambdas,
} from './constructs';

export interface WebChatStackProps extends cdk.StackProps {
  appName: string;
  rootDomain: string;
  wsSubdomain: string;
  apiSubdomain: string;
  frontendCertArn?: string;
  apiCertArn?: string;
}

export class WebChatStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props: WebChatStackProps) {
    super(scope, id, props);

    cdk.Tags.of(this).add('app', props.appName);

    const chatTable = new ChatTable(this, 'Chat');

    const wsLambdas = new WsLambdas(this, 'WsLambdas', {
      appName: props.appName,
      chatTable: chatTable.table,
    });

    const wsApi = new WebSocketApi(this, 'WsApi', {
      appName: props.appName,
      connectFn: wsLambdas.connect,
      disconnectFn: wsLambdas.disconnect,
      helloFn: wsLambdas.hello,
      sendMessageFn: wsLambdas.sendMessage,
      customDomain: props.apiCertArn
        ? { name: props.wsSubdomain, certArn: props.apiCertArn }
        : undefined,
    });

    const wsCallbackUrl = `https://${wsApi.api.apiId}.execute-api.${cdk.Aws.REGION}.amazonaws.com/${wsApi.stage.stageName}`;

    const apiLambdas = new ApiLambdas(this, 'ApiLambdas', {
      appName: props.appName,
      chatTable: chatTable.table,
      wsCallbackUrl,
    });
    wsApi.api.grantManageConnections(apiLambdas.setColor);

    const httpApi = new HttpApi(this, 'HttpApi', {
      appName: props.appName,
      setColorFn: apiLambdas.setColor,
      allowedOrigins: [`https://${props.rootDomain}`, 'http://localhost:5173'],
      customDomain: props.apiCertArn
        ? { name: props.apiSubdomain, certArn: props.apiCertArn }
        : undefined,
    });

    const frontend = new FrontendHosting(this, 'Frontend', {
      customDomain: props.frontendCertArn
        ? { name: props.rootDomain, certArn: props.frontendCertArn }
        : undefined,
    });

    new cdk.CfnOutput(this, 'WsApiUrl', { value: wsApi.stage.url });
    new cdk.CfnOutput(this, 'HttpApiUrl', { value: httpApi.api.apiEndpoint });
    new cdk.CfnOutput(this, 'FrontendBucketName', { value: frontend.bucket.bucketName });
    new cdk.CfnOutput(this, 'FrontendDistributionId', {
      value: frontend.distribution.distributionId,
    });
    new cdk.CfnOutput(this, 'FrontendDistributionDomain', {
      value: frontend.distribution.distributionDomainName,
    });
  }
}
