import * as cdk from 'aws-cdk-lib';
import * as acm from 'aws-cdk-lib/aws-certificatemanager';
import * as apigwv2 from 'aws-cdk-lib/aws-apigatewayv2';
import { HttpLambdaIntegration } from 'aws-cdk-lib/aws-apigatewayv2-integrations';
import type { NodejsFunction } from 'aws-cdk-lib/aws-lambda-nodejs';
import { Construct } from 'constructs';

export interface CustomDomainProps {
  name: string;
  certArn: string;
}

export interface HttpApiProps {
  appName: string;
  assignUserFn: NodejsFunction;
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
        allowMethods: [apigwv2.CorsHttpMethod.GET, apigwv2.CorsHttpMethod.OPTIONS],
        allowHeaders: ['content-type'],
      },
    });

    this.api.addRoutes({
      path: '/user/assign',
      methods: [apigwv2.HttpMethod.GET],
      integration: new HttpLambdaIntegration('AssignUserIntegration', props.assignUserFn),
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
        stage: this.api.defaultStage!,
      });

      new cdk.CfnOutput(this, 'DomainTarget', {
        value: this.domain.regionalDomainName,
        description: `Set CNAME ${props.customDomain.name} to this value`,
      });
    }
  }
}
