# AWS Batch Stack

## Prerequisites

You should have `aws-cli` installed on your computer.

## Setup

### Configure access key and region

Start by creating an AWS access key in your console. Then run the following command
to configure your access key id, access key secret and AWS region.

```
aws configure
```

### Setup docker image on ECR

For the guide [here](https://docs.aws.amazon.com/AmazonECR/latest/userguide/repository-create.html)
to setup your ECR repository and push your image.

#### Create `.env` file

```
cp .env.example .env 
```

After creating your `.env` file, next update the `REPOSITORY_NAME`
with the repository name you used in ECR

### Install CDK

```
npm install -g aws-cdk
```

### Deploy

#### Install dependencies

```
npm install 
```

##### Deploy your stack

```
cdk deploy
```

For a detailed explanation please watch the video on YouTube to understand how it works
https://youtu.be/ETZfp3yuXww


