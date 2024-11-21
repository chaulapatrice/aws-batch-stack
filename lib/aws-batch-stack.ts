import * as cdk from "aws-cdk-lib";
import { Construct } from "constructs";
import * as batch from "aws-cdk-lib/aws-batch";
import * as ec2 from "aws-cdk-lib/aws-ec2";
import { SubnetType } from "aws-cdk-lib/aws-ec2";
import * as ecs from "aws-cdk-lib/aws-ecs";
import * as iam from "aws-cdk-lib/aws-iam";
import * as ecr from "aws-cdk-lib/aws-ecr";

export class AwsBatchStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    const vpc = new ec2.Vpc(this, "VPC", {
      ipAddresses: ec2.IpAddresses.cidr("10.0.0.0/23"),
      maxAzs: 2,
      enableDnsSupport: true,
      gatewayEndpoints: {
        S3: {
          service: ec2.GatewayVpcEndpointAwsService.S3,
        },
      },
      subnetConfiguration: [
        {
          cidrMask: 25,
          name: "public",
          subnetType: SubnetType.PUBLIC,
        },
        {
          cidrMask: 25,
          name: "private",
          subnetType: SubnetType.PRIVATE_ISOLATED,
        },
      ],
    });

    vpc.addInterfaceEndpoint("VPC_Endpoint_ECR_DKR", {
      service: new ec2.InterfaceVpcEndpointService(
        "com.amazonaws.us-east-1.ecr.dkr",
        443,
      ),
      privateDnsEnabled: true,
      subnets: {
        subnetType: ec2.SubnetType.PRIVATE_ISOLATED,
        availabilityZones: ["us-east-1a", "us-east-1b"],
      },
    });

    vpc.addInterfaceEndpoint("VPC_Endpoint_ECR_API", {
      service: new ec2.InterfaceVpcEndpointService(
        "com.amazonaws.us-east-1.ecr.api",
        443,
      ),
      privateDnsEnabled: true,
      subnets: {
        subnetType: ec2.SubnetType.PRIVATE_ISOLATED,
        availabilityZones: ["us-east-1a", "us-east-1b"],
      },
    });

    vpc.addInterfaceEndpoint("VPC_Cloud_Watch", {
      service: new ec2.InterfaceVpcEndpointService(
        "com.amazonaws.us-east-1.logs",
        443,
      ),
      privateDnsEnabled: true,
      subnets: {
        subnetType: ec2.SubnetType.PRIVATE_ISOLATED,
        availabilityZones: ["us-east-1a", "us-east-1b"],
      },
    });

    const environment = new batch.FargateComputeEnvironment(
      this,
      "Batch_ComputeEnvironment",
      {
        vpc,
        vpcSubnets: vpc.selectSubnets({
          subnetType: ec2.SubnetType.PRIVATE_ISOLATED,
        }),
      },
    );

    const jobQueue = new batch.JobQueue(this, "Batch_JobQueue", {
      priority: 1,
    });

    jobQueue.addComputeEnvironment(environment, 1);

    const container = new batch.EcsFargateContainerDefinition(
      this,
      "Batch_ECSJobContainer",
      {
        image: ecs.ContainerImage.fromEcrRepository(
          ecr.Repository.fromRepositoryArn(
            this,
            "Student_Rankings_Repo",
            `arn:aws:ecr:us-east-1:${process.env.CDK_DEFAULT_ACCOUNT}:repository/${process.env.REPOSITORY_NAME}`,
          ),
          "latest",
        ),
        memory: cdk.Size.mebibytes(512),
        cpu: 0.25,
      },
    );

    container.executionRole.addToPrincipalPolicy(
      new iam.PolicyStatement({
        actions: [
          "ecr:GetAuthorizationToken",
          "ecr:BatchCheckLayerAvailability",
          "ecr:GetDownloadUrlForLayer",
          "ecr:BatchGetImage",
        ],
        resources: ["*"],
        effect: iam.Effect.ALLOW,
      }),
    );

    new batch.EcsJobDefinition(this, "Batch_ECSJobDefinition", {
      container,
    });
  }
}
