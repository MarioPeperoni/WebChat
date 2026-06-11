import * as path from 'node:path';

import * as cdk from 'aws-cdk-lib';
import * as dynamodb from 'aws-cdk-lib/aws-dynamodb';
import * as lambda from 'aws-cdk-lib/aws-lambda';
import { NodejsFunction } from 'aws-cdk-lib/aws-lambda-nodejs';
import { Construct } from 'constructs';

const WORKSPACE_ROOT = path.join(__dirname, '..', '..', '..', '..');
const BACKEND_ROOT = path.join(WORKSPACE_ROOT, 'backend');
const HANDLERS_ROOT = path.join(BACKEND_ROOT, 'src', 'handlers');
const TS_PROJECT = path.join(BACKEND_ROOT, 'tsconfig.json');

export interface WsLambdasProps {
  appName: string;
  chatTable: dynamodb.Table;
}

export class WsLambdas extends Construct {
  readonly connect: NodejsFunction;
  readonly disconnect: NodejsFunction;
  readonly hello: NodejsFunction;
  readonly sendMessage: NodejsFunction;

  constructor(scope: Construct, id: string, props: WsLambdasProps) {
    super(scope, id);

    const baseEnv = {
      POWERTOOLS_SERVICE_NAME: props.appName,
      POWERTOOLS_LOG_LEVEL: 'INFO',
      CHAT_TABLE: props.chatTable.tableName,
    };

    const defaults = {
      runtime: lambda.Runtime.NODEJS_22_X,
      architecture: lambda.Architecture.ARM_64,
      timeout: cdk.Duration.seconds(10),
      memorySize: 256,
      projectRoot: WORKSPACE_ROOT,
      depsLockFilePath: path.join(WORKSPACE_ROOT, 'bun.lock'),
      bundling: { target: 'node22', minify: false, sourceMap: true, tsconfig: TS_PROJECT },
      environment: baseEnv,
    } as const;

    this.connect = new NodejsFunction(this, 'ConnectFn', {
      ...defaults,
      entry: path.join(HANDLERS_ROOT, 'chat', 'connect.ts'),
      handler: 'handler',
    });
    props.chatTable.grantReadWriteData(this.connect);

    this.disconnect = new NodejsFunction(this, 'DisconnectFn', {
      ...defaults,
      entry: path.join(HANDLERS_ROOT, 'chat', 'disconnect.ts'),
      handler: 'handler',
    });
    props.chatTable.grantReadWriteData(this.disconnect);

    this.hello = new NodejsFunction(this, 'HelloFn', {
      ...defaults,
      entry: path.join(HANDLERS_ROOT, 'chat', 'hello.ts'),
      handler: 'handler',
    });
    props.chatTable.grantReadData(this.hello);

    this.sendMessage = new NodejsFunction(this, 'SendMessageFn', {
      ...defaults,
      entry: path.join(HANDLERS_ROOT, 'chat', 'sendMessage.ts'),
      handler: 'handler',
      timeout: cdk.Duration.seconds(15),
    });
    props.chatTable.grantReadWriteData(this.sendMessage);
  }
}
