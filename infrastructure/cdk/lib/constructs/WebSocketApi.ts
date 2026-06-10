import * as cdk from 'aws-cdk-lib';
import * as acm from 'aws-cdk-lib/aws-certificatemanager';
import * as apigwv2 from 'aws-cdk-lib/aws-apigatewayv2';
import { WebSocketLambdaIntegration } from 'aws-cdk-lib/aws-apigatewayv2-integrations';
import type { NodejsFunction } from 'aws-cdk-lib/aws-lambda-nodejs';
import { Construct } from 'constructs';

import type { CustomDomainProps } from './HttpApi';

export interface WebSocketApiProps {
  appName: string;
  connectFn: NodejsFunction;
  disconnectFn: NodejsFunction;
  sendMessageFn: NodejsFunction;
  customDomain?: CustomDomainProps;
}

export class WebSocketApi extends Construct {
  readonly api: apigwv2.WebSocketApi;
  readonly stage: apigwv2.WebSocketStage;
  readonly domain?: apigwv2.DomainName;

  constructor(scope: Construct, id: string, props: WebSocketApiProps) {
    super(scope, id);

    this.api = new apigwv2.WebSocketApi(this, 'Api', {
      apiName: `${props.appName}-ws`,
      connectRouteOptions: {
        integration: new WebSocketLambdaIntegration('ConnectIntegration', props.connectFn),
      },
      disconnectRouteOptions: {
        integration: new WebSocketLambdaIntegration('DisconnectIntegration', props.disconnectFn),
      },
    });

    this.api.addRoute('sendmessage', {
      integration: new WebSocketLambdaIntegration('SendMessageIntegration', props.sendMessageFn),
    });

    this.stage = new apigwv2.WebSocketStage(this, 'Stage', {
      webSocketApi: this.api,
      stageName: 'prod',
      autoDeploy: true,
    });

    this.api.grantManageConnections(props.sendMessageFn);

    if (props.customDomain) {
      const cert = acm.Certificate.fromCertificateArn(this, 'Cert', props.customDomain.certArn);
      this.domain = new apigwv2.DomainName(this, 'Domain', {
        domainName: props.customDomain.name,
        certificate: cert,
      });
      new apigwv2.ApiMapping(this, 'Mapping', {
        api: this.api,
        domainName: this.domain,
        stage: this.stage,
      });

      new cdk.CfnOutput(this, 'DomainTarget', {
        value: this.domain.regionalDomainName,
        description: `Set CNAME ${props.customDomain.name} to this value`,
      });
    }
  }
}
