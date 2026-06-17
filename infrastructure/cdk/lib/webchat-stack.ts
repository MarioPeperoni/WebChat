import * as cdk from 'aws-cdk-lib';
import { Construct } from 'constructs';

import {
  ChatTable,
  FrontendHosting,
  WebSocketApi,
  WsLambdas,
} from './constructs';

export interface WebChatStackProps extends cdk.StackProps {
  appName: string;
  rootDomain: string;
  wsSubdomain: string;
  frontendCertArn?: string;
  wsCertArn?: string;
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
      commandFn: wsLambdas.command,
      customDomain: props.wsCertArn
        ? { name: props.wsSubdomain, certArn: props.wsCertArn }
        : undefined,
    });

    const frontend = new FrontendHosting(this, 'Frontend', {
      customDomain: props.frontendCertArn
        ? { name: props.rootDomain, certArn: props.frontendCertArn }
        : undefined,
    });

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
