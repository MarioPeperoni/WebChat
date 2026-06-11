import * as cdk from 'aws-cdk-lib';
import * as acm from 'aws-cdk-lib/aws-certificatemanager';
import * as apigwv2 from 'aws-cdk-lib/aws-apigatewayv2';
import { HttpLambdaIntegration } from 'aws-cdk-lib/aws-apigatewayv2-integrations';
import type { NodejsFunction } from 'aws-cdk-lib/aws-lambda-nodejs';
import { Construct } from 'constructs';

import type { CustomDomainProps } from './WebSocketApi';

export interface HttpApiProps {
  appName: string;
  setColorFn: NodejsFunction;
  allowedOrigins: string[];
  customDomain?: CustomDomainProps;
}

export class HttpApi extends Construct {
  readonly api: apigwv2.HttpApi;
  readonly domain?: apigwv2.DomainName;

  constructor(scope: Construct, id: string, props: HttpApiProps) {
    super(scope, id);

    this.api = new apigwv2.HttpApi(this, 'Api', {
      apiName: `${props.appName}-http`,
      corsPreflight: {
        allowOrigins: props.allowedOrigins,
        allowMethods: [
          apigwv2.CorsHttpMethod.PUT,
          apigwv2.CorsHttpMethod.OPTIONS,
        ],
        allowHeaders: ['content-type', 'x-user-id'],
        maxAge: cdk.Duration.hours(1),
      },
    });

    this.api.addRoutes({
      path: '/users/me/color',
      methods: [apigwv2.HttpMethod.PUT],
      integration: new HttpLambdaIntegration('SetColorIntegration', props.setColorFn),
    });

    if (props.customDomain) {
      const cert = acm.Certificate.fromCertificateArn(this, 'Cert', props.customDomain.certArn);
      this.domain = new apigwv2.DomainName(this, 'Domain', {
        domainName: props.customDomain.name,
        certificate: cert,
      });
      new apigwv2.ApiMapping(this, 'Mapping', {
        api: this.api,
        domainName: this.domain,
      });

      new cdk.CfnOutput(this, 'DomainTarget', {
        value: this.domain.regionalDomainName,
        description: `Set CNAME ${props.customDomain.name} to this value`,
      });
    }
  }
}
