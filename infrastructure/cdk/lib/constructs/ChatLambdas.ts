import * as path from 'node:path';

import * as cdk from 'aws-cdk-lib';
import * as dynamodb from 'aws-cdk-lib/aws-dynamodb';
import * as lambda from 'aws-cdk-lib/aws-lambda';
import { NodejsFunction } from 'aws-cdk-lib/aws-lambda-nodejs';
import { Construct } from 'constructs';

const BACKEND_ROOT = path.join(__dirname, '..', '..', '..', '..', 'backend');
const HANDLERS_ROOT = path.join(BACKEND_ROOT, 'src', 'handlers');
const TS_PROJECT = path.join(BACKEND_ROOT, 'tsconfig.json');

export interface ChatLambdasProps {
  appName: string;
  connectionsTable: dynamodb.Table;
  allowedOrigins: string[];
}

export class ChatLambdas extends Construct {
  readonly assignUser: NodejsFunction;
  readonly connect: NodejsFunction;
  readonly disconnect: NodejsFunction;
  readonly sendMessage: NodejsFunction;

  constructor(scope: Construct, id: string, props: ChatLambdasProps) {
    super(scope, id);

    const baseEnv = {
      POWERTOOLS_SERVICE_NAME: props.appName,
      POWERTOOLS_LOG_LEVEL: 'INFO',
    };

    const defaults = {
      runtime: lambda.Runtime.NODEJS_22_X,
      architecture: lambda.Architecture.ARM_64,
      timeout: cdk.Duration.seconds(10),
      memorySize: 256,
      projectRoot: BACKEND_ROOT,
      depsLockFilePath: path.join(BACKEND_ROOT, 'package-lock.json'),
      bundling: { target: 'node22', minify: true, sourceMap: true, tsconfig: TS_PROJECT },
    } as const;

    this.assignUser = new NodejsFunction(this, 'AssignUserFn', {
      ...defaults,
      entry: path.join(HANDLERS_ROOT, 'user', 'assignUser.ts'),
      handler: 'handler',
      environment: {
        ...baseEnv,
        ALLOWED_ORIGINS: props.allowedOrigins.join(','),
      },
    });

    this.connect = new NodejsFunction(this, 'ConnectFn', {
      ...defaults,
      entry: path.join(HANDLERS_ROOT, 'chat', 'connect.ts'),
      handler: 'handler',
      environment: { ...baseEnv, CONNECTIONS_TABLE: props.connectionsTable.tableName },
    });
    props.connectionsTable.grantWriteData(this.connect);

    this.disconnect = new NodejsFunction(this, 'DisconnectFn', {
      ...defaults,
      entry: path.join(HANDLERS_ROOT, 'chat', 'disconnect.ts'),
      handler: 'handler',
      environment: { ...baseEnv, CONNECTIONS_TABLE: props.connectionsTable.tableName },
    });
    props.connectionsTable.grantWriteData(this.disconnect);

    this.sendMessage = new NodejsFunction(this, 'SendMessageFn', {
      ...defaults,
      entry: path.join(HANDLERS_ROOT, 'chat', 'sendMessage.ts'),
      handler: 'handler',
      timeout: cdk.Duration.seconds(15),
      environment: { ...baseEnv, CONNECTIONS_TABLE: props.connectionsTable.tableName },
    });
    props.connectionsTable.grantReadWriteData(this.sendMessage);
  }
}
