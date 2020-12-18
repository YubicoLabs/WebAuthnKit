# Yubico WebAuthn Starter Kit - Backend

This is the source code used to build the Yubico WebAuthn Starter Kit solution. The backend (including hosting of the React web app) is deployed to your AWS account defined as infrastructure-as-code via a SAM template. We have provided platform specific (Mac/Linux + Windows) scripts to fully automate any of the manual steps not covered by the SAM template.  

#### Here's what the backend deployment will build for you: 
✅  One Amazon Cognito User Pool.

✅  Four AWS Lambda Functions used as custom triggers with Cognito User Pool.

✅  One AWS Lambda Function (Java) as the WebAuthn Relying Party library.

✅  One Amazon RDS Database - Aurora Serverless (MySQL-compatible database used to store user credential attributes).

✅  One Amazon API Gateway as our RESTful API edge endpoint.

✅  React Web App hosted on AWS Amplify Console.

## Getting Started - Backend
WebAuthn Starter Kit utilizes the AWS Serverless Application Model (AWS SAM) template specification for deployment. You'll be using one of the platform-specific scripts to deploy the backend resources to your AWS account. The automated script assumes the following tools be installed on your workstation.

### Prerequisites
1. [Install the AWS CLI v2](https://docs.aws.amazon.com/cli/latest/userguide/install-cliv2.html)
2. [Setup AWS CLI Credentials](https://github.com/awsdocs/aws-sam-developer-guide/blob/master/doc_source/serverless-getting-started-set-up-credentials.md)
3. Install Docker ([Mac](https://hub.docker.com/editions/community/docker-ce-desktop-mac/) |
[Windows](https://hub.docker.com/editions/community/docker-ce-desktop-windows/))

## Deployment
In this section, we'll clone (or download .zip release) the WebAuthn Starter Kit repository and execute the platform-specific script to automatically deploy the backend resources to your AWS account.

### 1. Clone Yubico WebAuthn Starter Kit Repository

$ `git clone https://github.com/YubicoLabs/WebAuthnKit.git`

### 2. Choose deployment script

$ `cd WebAuthnKit/scripts`
    
Choose the platform of your workstation that is deploying the backend. If you are are on a Mac or Linux, choose the [Mac-Linux folder](https://github.com/YubicoLabs/WebAuthnKit/tree/master/scripts/Mac-Linux). If Windows, choose the [PowerShell folder](https://github.com/YubicoLabs/WebAuthnKit/tree/master/scripts/PowerShell).

### 3. Configure Deployment Script (Optional)
Each of the platform-specific scripts read from a configuration file that specifies deployment specific details like AWS region, AWS CLI profile name, and other custom naming options. You don't need to modify the config file if you wish to deploy with all default values.

[Notes about the configuration files]

- If the `Suffix` parameter is not set, the script will set this to a random six digit numeric value.

- If the `DatabaseMasterPassword` parameter is not set, the script will set the password to a random sixteen character string.

- All other parameters that are not specified in the configuration file will be set to default values and appended with a six-digit `Suffix`.

- If a parameter is declared in the configuration file, it will be used by the  script exactly as declared, without appending any suffix.

#### Mac/Linux Script Config
`~/WebAuthnKit/scripts/Mac-Linux/deployStarterKit.json` 

#### Windows PowerShell Script Config
`~\WebAuthnKit\scripts\PowerShell\deployStarterKitPs.json`

## 4. Execute Deployment Script 
Now that you have an understanding of the automated deployment and configuration, let's deploy!

### Mac or Linux:
To run the bash script on Mac or Linux, open Terminal and navigate to:

`> cd /WebAuthnKit/scripts/Mac-Linux/`

`> ./deployStarterKit.sh`

### Windows PowerShell:
To run the PowerShell script, open a PowerShell prompt and navigate to:

`> cd \WebAuthnKit\scripts\PowerShell\`

`> .\deployStarterKit.ps1`

The deployment should take approx 10-15 minutes.

## Teardown
The deployment scripts are just wrappers of an AWS SAM template which relies on an AWS CloudFormation Stack in the background to deploy ALL the backend services. If you wish to remove all the resources for the WebAuthn Starter Kit, you can delete the CloudFormation Stack used to deploy the resources. Deleting a CloudFormation Stack just reverses the deployment and deletes all the resources it created. 

To delete the CloudFormation Stack, launch [CloudFormation Management Console](https://console.aws.amazon.com/cloudformation/home?region=us-east-1#/stacks?filteringText=&filteringStatus=active&viewNested=true&hideStacks=false) and delete the stack with the name you provided or the default name webauthn-[suffix].

The teardown should take less than 10 minutes. Once the stack has been deleted, you should no longer incur any costs for the WebAuthn Starter Kit.
