#!/bin/bash
# Last updated: December 14, 2020

# Description: Dockerized script for deploying Yubico WebAuthn Starter Kit to AWS Cloud

# [Requirements]
# Prerequisites for deploying the Yubico WebAuthn Starter Kit to AWS Cloud:
#   1. AWS CLI install and configured
#   2. Docker 

# [Get Started]
#   1. (Optional) Modify the ./deployStarterKit.json with your AWS Profile, Region, etc...
#   2. Run $ ./deployStarterKit.sh

# |********************************************************************|
# |*********************** Helper Functions ***************************|
# |********************************************************************|
function error(){
    error_code=$1
    echo "ERROR: $2" >&2
    echo "($PROGNAME dockerized script version: $VERSION, error code: $error_code )" >&2
    exit $1
}

function check_cmd_in_path(){
    cmd=$1
    which $cmd > /dev/null 2>&1 || error 1 "$cmd not found!"
}

# Check to make sure that docker is installed and executable from terminal
check_cmd_in_path docker

# If a SUFFIX value is not specified by user in deployStarterKit.json (SUFFIX), return a random 6 digit number
function getSuffix {
    echo $(if test -z $(grep SUFFIX $CONFIG_FILE | sed -e 's/.*://;s/"//g;s/,//g')
        then echo $(getRandomValue 6)
        else 
        echo $(grep SUFFIX $CONFIG_FILE | sed -e 's/.*://;s/"//g;s/,//g')
    fi)
}

# Each parameter enters here. If no param specified (empty) in deployStarterKit.json, create a temp name (passed in as $2)
# EXAMPLE call to this function: AWS_REGION=$(getParam AWS_REGION us-east-1); us-east-1 is passed in as the default value, if none specified and read as $2
function getParam {
    DEFVALUE=$(grep $1 $CONFIG_FILE | sed -e 's/.*://;s/"//g;s/,//g')
    echo $(if test -z $(grep $1 $CONFIG_FILE | sed -e 's/.*://;s/"//g;s/,//g')
        then echo $2
        else echo $DEFVALUE
    fi)
}

# Create a random number for repeated automated deployment
function getRandomValue {
    echo $(ping -c 1 yubico.com |md5 | head -c$1; echo)
}

# |************************** Paramaters **********************************|
#  Referencing the constants file deployStarterKit.config in this directory
#  All parameter value changes should be made to deployStarterKit.json
# |************************************************************************|

CONFIG_FILE="deployStarterKit.json"

# AWS CLI profile used to execute commands. Use 'default' if not specified
AWS_CLI_PROFILE=$(getParam AWS_CLI_PROFILE default)

# Suffix to append to asset names created by CloudFormation
# Calling getSuffix function to generate random 6-char alphanumeric value if a suffix is not specified
SUFFIX=$(getSuffix)

# CloudFormation stack name
CF_STACK_NAME=$(getParam CF_STACK_NAME webauthnkit-$SUFFIX)

# AWS Region - Defaults to us-east-1 region if not specified
AWS_REGION=$(getParam AWS_REGION us-east-1)

# Amazon S3 bucket used for deployment
# Appending a 4-char alphanumeric value to allow repeatable deployment as S3 buckets are not deleted
S3_BUCKET_NAME=$(getParam S3_BUCKET_NAME webauthnkit-$SUFFIX-$(getRandomValue 6) | sed 'y/ABCDEFGHIJKLMNOPQRSTUVWXYZ/abcdefghijklmnopqrstuvwxyz/')

# Amazon User Pool
USER_POOL_NAME=$(getParam USER_POOL_NAME webauthnkit-userpool-$SUFFIX)

# Amazon RDS Aurora database
# Make the DATABASE_NAME lowercase before RDS does and no dashes.. 
DATABASE_NAME=$(getParam DATABASE_NAME webauthnkitdb$SUFFIX | sed 'y/ABCDEFGHIJKLMNOPQRSTUVWXYZ/abcdefghijklmnopqrstuvwxyz/') 
DATABASE_MASTER_USERNAME=$(getParam DATABASE_MASTER_USERNAME dbmaster$SUFFIX)

# Auto-generate a random 16 character password each time for DATABASE_MASTER_USERNAME, if not specified
DATABASE_MASTER_PASSWORD=$(getParam DATABASE_MASTER_PASSWORD $(getRandomValue 16))

# AWS Lambda Function names
DEFINE_AUTH_CHALLENGE_FUNC_NAME=$(getParam DEFINE_AUTH_CHALLENGE_FUNC_NAME webAuthnKit-DefineAuth-$SUFFIX)
CREATE_AUTH_CHALLENGE_FUNC_NAME=$(getParam CREATE_AUTH_CHALLENGE_FUNC_NAME webAuthnKit-CreateAuth-$SUFFIX)
VERIFY_AUTH_CHALLENGE_FUNC_NAME=$(getParam VERIFY_AUTH_CHALLENGE_FUNC_NAME webAuthnKit-VerifyAuth-$SUFFIX)
PRE_SIGNUP_FUNC_NAME=$(getParam PRE_SIGNUP_FUNC_NAME webAuthnKit-PreSignUp-$SUFFIX)
WEBAUTHN_KIT_API_FUNC_NAME=$(getParam WEBAUTHN_KIT_API_FUNC_NAME webAuthnKit-API-$SUFFIX)
JAVA_WEBAUTHN_LIB_FUNC_NAME=$(getParam JAVA_WEBAUTHN_LIB_FUNC_NAME webAuthnKit-JavaLib-$SUFFIX)
CREATE_DATABASE_SCHEMA_FUNC_NAME=$(getParam CREATE_DATABASE_SCHEMA_FUNC_NAME webAuthnKit-createDBSchema-$SUFFIX)
CREATE_DATABASE_SCHEMA_CALLER_FUNC_NAME=$(getParam CREATE_DATABASE_SCHEMA_CALLER_FUNC_NAME webAuthnKit-createDBSchemaCaller-$SUFFIX)

# API Gateway Name
WEBAUTHN_KIT_API_NAME=$(getParam WEBAUTHN_KIT_API_NAME webAuthnKit-API-$SUFFIX)

# AWS Amplify Hosting App Name
AMPLIFY_HOSTING_APP_NAME=$(getParam AMPLIFY_HOSTING_APP_NAME webAuthnKit-reactclient-$SUFFIX)

# AWS Amplify Hosting Branch Name
# If no branch name specified, default to 'dev'
AMPLIFY_HOSTING_BRANCH_NAME=$(getParam AMPLIFY_HOSTING_BRANCH_NAME dev)

# |************************* Docker Build **************************************************|
#  Building docker container using Dockerfile from root of WebAuthn Starter Kit directory
#  The '.' after the build command specifies the Dockerfile located in the current directory
# |*****************************************************************************************|
echo "[Setup] Downloading and building Docker image for deployment...(~1.5 minutes) "
docker build -t starterkit:dev .
echo "Docker image is ready!"

# |********************* Get Local Content Directory *********************************|
# Get the absolute path to the WebAuthnKit folder from here (~/scripts/Mac-Linux folder)
# Using this to share the host (your machine) WebAuthnKit project folder with Docker
# Result: e.g. <USER_LOCAL_DIRECTORY>/WebAuthnKit
STARTER_KIT_DIR=$(echo $(pwd) | rev | cut -d'/' -f3- | rev)

#1 |******************* Clean Install of Java Function  ******************************|
# Run mvn clean install of the Java Lambda function JavaWebAuthnLib
# Result is a production build of /backend/lambda-functions/JavaWebAuthnLib/target/webauthn.jar
# to be deployed via SAM below
echo "Step 1 [Pre-Deployment] Running mvn clean install of the JavaWebAuthnLib (Java) Lambda function..."
docker run -w /webauthnkit/backend/lambda-functions/JavaWebAuthnLib --volume=$STARTER_KIT_DIR:/webauthnkit starterkit:dev mvn clean install > /dev/null 2>&1
echo "mvn clean install: COMPLETE"

#2 |************************ Create S3 Bucket ****************************************|
# Create an Amazon S3 bucket used for SAM deployment
echo "Step 2 [Pre-Deployment] Creating Amazon S3 bucket for staged deployment"
aws s3 mb s3://$S3_BUCKET_NAME --region $AWS_REGION --endpoint-url https://s3.$AWS_REGION.amazonaws.com --profile $AWS_CLI_PROFILE

# |***********************************************************************************|
# |***************** SAM Build, SAM Package, and SAM Deploy **************************|
# |***********************************************************************************|

#3 |*************************** SAM Build ********************************************|
echo "Step 3 [Deployment] Running SAM build...(~1 minute) "
docker run -w /webauthnkit/backend --volume=$STARTER_KIT_DIR:/webauthnkit starterkit:dev \
/home/developer/.local/bin/sam build > /dev/null 2>&1

#4 |***************************** SAM Package ****************************************|
echo "Step 4 [Deployment] Running SAM package..."
docker run -w /webauthnkit/backend --volume=$STARTER_KIT_DIR:/webauthnkit starterkit:dev \
/home/developer/.local/bin/sam package > /dev/null 2>&1

#5 |**************************** SAM Deploy ******************************************|
echo "Step 5 [Deployment] Running SAM deploy..."
docker run -w /webauthnkit/backend --volume=$STARTER_KIT_DIR:/webauthnkit \
--volume=${HOME}/.aws:/home/developer/.aws:ro starterkit:dev \
/home/developer/.local/bin/sam deploy \
--s3-bucket $S3_BUCKET_NAME \
--stack-name $CF_STACK_NAME \
--profile $AWS_CLI_PROFILE \
--region $AWS_REGION \
--capabilities CAPABILITY_IAM \
--parameter-overrides UserPoolName=$USER_POOL_NAME \
DatabaseName=$DATABASE_NAME \
MasterUserName=$DATABASE_MASTER_USERNAME \
MasterUserPassword=$DATABASE_MASTER_PASSWORD \
DefineAuthChallengeFuncName=$DEFINE_AUTH_CHALLENGE_FUNC_NAME \
CreateAuthChallengeFuncName=$CREATE_AUTH_CHALLENGE_FUNC_NAME \
VerifyAuthChallengeFuncName=$VERIFY_AUTH_CHALLENGE_FUNC_NAME \
WebAuthnKitAPIFuncName=$WEBAUTHN_KIT_API_FUNC_NAME \
PreSignUpFuncName=$PRE_SIGNUP_FUNC_NAME \
JavaWebAuthnFuncName=$JAVA_WEBAUTHN_LIB_FUNC_NAME \
WebAuthnKitAPIName=$WEBAUTHN_KIT_API_NAME \
CreateDBSchemaFuncName=$CREATE_DATABASE_SCHEMA_FUNC_NAME \
CreateDBSchemaCallerFuncName=$CREATE_DATABASE_SCHEMA_CALLER_FUNC_NAME \
AmplifyHostingAppName=$AMPLIFY_HOSTING_APP_NAME \
AmplifyHostingBranchName=$AMPLIFY_HOSTING_BRANCH_NAME

# |************* CloudFormation WAITING ********************************************|
# Waiting for Step 5 [Deployment] of CloudFormation Stack via AWS SAM deploy...
# If the CF Stack fails, exit this script immediately
echo "Step 5 [Deployment] Waiting for CloudFormation deployment...(~6 minutes)"
aws cloudformation wait stack-create-complete --stack-name $CF_STACK_NAME --region $AWS_REGION --profile $AWS_CLI_PROFILE
# CloudFormation stack has completed, check status
CREATE_STACK_STATUS=$(aws cloudformation describe-stacks --stack-name $CF_STACK_NAME --region $AWS_REGION --profile $AWS_CLI_PROFILE --query 'Stacks[0].StackStatus' --output text)
# Exit this script if the CloudFormation stack deployment via AWS SAM CLI (or CloudFormation Stack) fails
if [ $CREATE_STACK_STATUS != "CREATE_COMPLETE" ]; 
then
    echo "AWS SAM deployment failed with status [$CREATE_STACK_STATUS]; Exiting..."
    exit 1;
fi

# |*********************************************************************************|
# |****************** React Web Client Deployment **********************************|
# |*********************************************************************************|

#6 |************************ Populate aws-exports.js *******************************|
# Retrieves the awsexports value from CloudFormation OUTPUT and save results to the ~/src/aws-exports.js file for React Web App 
echo "Step 6 [AWS-Exports] Retrieving the awsexports from CloudFormation and writing constants to ~/clients/web/react/src/aws-exports.js"
aws cloudformation --region $AWS_REGION describe-stacks --stack-name $CF_STACK_NAME --profile $AWS_CLI_PROFILE --query "Stacks[0].Outputs[?OutputKey=='AWSExports'].OutputValue" --output text > ../.././clients/web/react/src/aws-exports.js

#7 |************** Install and Build React Web App Client **************************|
# Note: Webpack was previously installed vi Dockerfile
echo "Step 7 [Web Client] Building and installing React Web Client..."
echo "Running npm install...(~2 minutes)"
#docker run -w /webauthnkit/clients/web/react --volume=$STARTER_KIT_DIR:/webauthnkit starterkit:dev npm install --only=production > /dev/null 2>&1
docker run -w /webauthnkit/clients/web/react --volume=$STARTER_KIT_DIR:/webauthnkit starterkit:dev npm install > /dev/null 2>&1

echo "Step 7 [Web Client] Running npm run build....(~1 minute)"
docker run -w /webauthnkit/clients/web/react --volume=$STARTER_KIT_DIR:/webauthnkit starterkit:dev npm run build > /dev/null 2>&1

#8 |********************** Archive React Web App **********************************|
# Archive /dist contents of React Web App
# Zip up all the files under React  ~/dist directory, but not the directory itself
echo "Step 8 [Web Client] Zipping up the React app in preperation for Amplify deployment"
(cd ../.././clients/web/react/dist && zip -r Archive.zip *)

#9 |************** Upload React Web App Archive to S3 *****************************|
echo "Step 9 [Web Client] Uploading Web Client to S3 for staging..."
aws s3 cp ../.././clients/web/react/dist/Archive.zip s3://$S3_BUCKET_NAME --profile $AWS_CLI_PROFILE

# |********* Amplify Deployment (hosting) of React Web Client *********|
# Start deployment to AWS Amplify Hosting AMPLIFY_HOSTING_BRANCH_NAME using zipped file uploaded to S3

#10 |************** Get Amplify Hosting App ID ************************************|
echo "Step 10 [Web Client] Deploying React Web App to Amplify (hosting) via CloudFormation..."
# Get the Amplify App Id
echo "Step 10 [Web Client] Retrieving Amplify App Id from CloudFormation Stack Output"
AMPLIFY_APP_ID=$(aws cloudformation --region $AWS_REGION describe-stacks --stack-name $CF_STACK_NAME --profile $AWS_CLI_PROFILE --query "Stacks[0].Outputs[?OutputKey=='AmplifyHostingAppId'].OutputValue" --output text)

#11 |*********** Deploy React App to AWS Amplify Hosting **************************|
# Call start-deployment of the client web app by passing in the zip file to the previously created Amplify Hosting AMPLIFY_HOSTING_BRANCH_NAME branch 
echo "Step 11 [Web Client] Deploying React Web Client to Amplify Hosting"
aws amplify start-deployment --app-id $AMPLIFY_APP_ID --branch-name $AMPLIFY_HOSTING_BRANCH_NAME --region $AWS_REGION --source-url s3://$S3_BUCKET_NAME/Archive.zip --profile $AWS_CLI_PROFILE &> /dev/null

#12 |********** Launch Amplify Hosting Endpoint in Browser ************************|
AmplifyHostingEndpoint=$(aws cloudformation --region $AWS_REGION describe-stacks --stack-name $CF_STACK_NAME --profile $AWS_CLI_PROFILE --query "Stacks[0].Outputs[?OutputKey=='AmplifyHostingEndpoint'].OutputValue" --output text)
sleep 7 # sleep for 7 seconds while the branch fully deploys, otherwise a browser refresh is needed
echo "Step 12 [DEPLOYMENT COMPLETED] Launching Web Client in browser at: $AmplifyHostingEndpoint"
open $AmplifyHostingEndpoint

#13 |********** Show CloudFormation Console Link to view AWS resources ************|
echo "Step 13 [Review] Click here to see the output of your CloudFormation Stack"
STACK_ID=$(aws cloudformation describe-stacks --stack-name $CF_STACK_NAME --region $AWS_REGION --profile $AWS_CLI_PROFILE --query "Stacks[0].StackId" --output text)
echo "https://console.aws.amazon.com/cloudformation/home?region=$AWS_REGION#/stacks/outputs?stackId=$STACK_ID"

#14 |******************* TEARDOWN (Optional) **************************************|
echo "Step 14 [Teardown (Optional)] If you want to DELETE (nearly) everything you just deployed and/or start over, run these commands:"
echo "Removes the CloudFormation Stack which removes (nearly) all the resources it created"
echo "$ aws cloudformation delete-stack --stack-name $CF_STACK_NAME --region $AWS_REGION --profile $AWS_CLI_PROFILE &> /dev/null"
echo "Removes the S3 bucket created and used only for deploying the WebAuthn Starter Kit"
echo "$ aws s3 rb s3://$S3_BUCKET_NAME --force --region $AWS_REGION --profile $AWS_CLI_PROFILE"