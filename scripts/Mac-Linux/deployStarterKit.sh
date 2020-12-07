# Initial creation: October 9, 2020
# Last updated: November 24, 2020

# Updated random num generator to fix Big Sur bug

# If a SUFFIX value is not specified by user in deployStarterKit.json (SUFFIX), return a random 6 digit number
function getSuffix {
    echo $(if test -z $(grep SUFFIX $CONFIG_FILE | sed -e 's/.*://;s/"//g;s/,//g')
        then echo $(cat /dev/urandom | env LC_CTYPE=C tr -dc 'a-z0-9' | fold -w  6| head -n 1)
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

##-----Parameters-----##

# Referencing the constants file deployStarterKit.config in this directory
# All custom name changes should be made to deployStarterKit.config
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
S3_BUCKET_NAME=$(getParam S3_BUCKET_NAME webauthnkit-$SUFFIX-$(getRandomValue 4) | sed 'y/ABCDEFGHIJKLMNOPQRSTUVWXYZ/abcdefghijklmnopqrstuvwxyz/')

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

#---Create S3 Bucket----#
# Create an Amazon S3 bucket used for SAM deployment
aws s3 mb s3://$S3_BUCKET_NAME --region $AWS_REGION --endpoint-url https://s3.$AWS_REGION.amazonaws.com --profile $AWS_CLI_PROFILE

#---SAM Build & SAM Package----#
# Call AWS SAM build and package from the ~/backend folder where the SAM template (template.yaml) resides
# This assumes the script is ran from ~/scripts/Mac-Linux/ and the SAM template is here: ~/background/template.yaml
cd ../.././backend/
sam build --use-container --skip-pull-image && sam package --s3-bucket $S3_BUCKET_NAME --profile $AWS_CLI_PROFILE

#---SAM Deploy----#
sam deploy --s3-bucket $S3_BUCKET_NAME --stack-name $CF_STACK_NAME --profile $AWS_CLI_PROFILE --region $AWS_REGION --capabilities CAPABILITY_IAM --parameter-overrides UserPoolName=$USER_POOL_NAME DatabaseName=$DATABASE_NAME MasterUserName=$DATABASE_MASTER_USERNAME MasterUserPassword=$DATABASE_MASTER_PASSWORD DefineAuthChallengeFuncName=$DEFINE_AUTH_CHALLENGE_FUNC_NAME CreateAuthChallengeFuncName=$CREATE_AUTH_CHALLENGE_FUNC_NAME VerifyAuthChallengeFuncName=$VERIFY_AUTH_CHALLENGE_FUNC_NAME WebAuthnKitAPIFuncName=$WEBAUTHN_KIT_API_FUNC_NAME PreSignUpFuncName=$PRE_SIGNUP_FUNC_NAME JavaWebAuthnFuncName=$JAVA_WEBAUTHN_LIB_FUNC_NAME WebAuthnKitAPIName=$WEBAUTHN_KIT_API_NAME CreateDBSchemaFuncName=$CREATE_DATABASE_SCHEMA_FUNC_NAME CreateDBSchemaCallerFuncName=$CREATE_DATABASE_SCHEMA_CALLER_FUNC_NAME AmplifyHostingAppName=$AMPLIFY_HOSTING_APP_NAME AmplifyHostingBranchName=$AMPLIFY_HOSTING_BRANCH_NAME

# Wait for the CloudFormation Stack to complete before moving on
aws cloudformation wait stack-create-complete --stack-name $CF_STACK_NAME --region $AWS_REGION --profile $AWS_CLI_PROFILE

# CloudFormation stack has completed, check status
CREATE_STACK_STATUS=$(aws cloudformation describe-stacks --stack-name $CF_STACK_NAME --region $AWS_REGION --profile $AWS_CLI_PROFILE --query 'Stacks[0].StackStatus' --output text)

#---WAIT for CloudFormation Stack to complete---#
# Exit this script if the CloudFormation stack deployment via AWS SAM CLI (or CloudFormation Stack) fails
if [ $CREATE_STACK_STATUS != "CREATE_COMPLETE" ]; 
then
    echo "AWS SAM deployment failed with status [$CREATE_STACK_STATUS]; Exiting..."
    exit 1;
fi

#---React Web App Deployment---#

#---Create aws-exports.js---#
# Retrieves the awsexports value from CloudFormation OUTPUT and save results to the ~/src/aws-exports.js file for React Web App 
echo "Retrieving the awsexports from CloudFormation and writing constants to ~/clients/web/react/src/aws-export.js"
aws cloudformation --region $AWS_REGION describe-stacks --stack-name $CF_STACK_NAME --profile $AWS_CLI_PROFILE --query "Stacks[0].Outputs[?OutputKey=='AWSExports'].OutputValue" --output text > .././clients/web/react/src/aws-exports.js

#---Build and Install React Web App (requires npm)---#
# Install and build React app
echo "Installing and building React App"
cd .././clients/web/react/
npm install --silent
npm run build --silent

#---Archive /dist contents of React Web App---#
# Zip up all the files under /dist directory, but not the directory itself
echo "Zipping up the React app for Amplify"
zip -r -j ./dist/Archive.zip ./dist/* 

#---Upload React Archive to S3---#
# Upload zip file to S3
echo "Uploading Amplify Hosting Archive.zip file to S3"
aws s3 cp ./dist/Archive.zip s3://$S3_BUCKET_NAME --profile $AWS_CLI_PROFILE

# Start deployment to AWS Amplify Hosting AMPLIFY_HOSTING_BRANCH_NAME using zip file just uploaded to S3
echo "Triggering Amplify deployment..."

#---Get Amplify Hosting App Id---#
# Get the Amplify App Id
AMPLIFY_APP_ID=$(aws cloudformation --region $AWS_REGION describe-stacks --stack-name $CF_STACK_NAME --profile $AWS_CLI_PROFILE --query "Stacks[0].Outputs[?OutputKey=='AmplifyHostingAppId'].OutputValue" --output text)

#---Deploy React App to AWS Amplify Hosting---#
# Call start-deployment of the client web app by passing in the zip file to the previously created Amplify Hosting AMPLIFY_HOSTING_BRANCH_NAME branch 
aws amplify start-deployment --app-id $AMPLIFY_APP_ID --branch-name $AMPLIFY_HOSTING_BRANCH_NAME --region $AWS_REGION --source-url s3://$S3_BUCKET_NAME/Archive.zip --profile $AWS_CLI_PROFILE &> /dev/null

#---Launch Amplify Hosting Endpoint---#
# Open hosted web app in favorite browser
AmplifyHostingEndpoint=$(aws cloudformation --region $AWS_REGION describe-stacks --stack-name $CF_STACK_NAME --profile $AWS_CLI_PROFILE --query "Stacks[0].Outputs[?OutputKey=='AmplifyHostingEndpoint'].OutputValue" --output text)
echo "Deploying Web App to AWS Amplify..."
sleep 7 # sleep for 7 seconds while the branch fully deploys
echo "DONE Deploying React Web hosted on AWS Amplify Console here: $AmplifyHostingEndpoint"
open $AmplifyHostingEndpoint

#---View Deployed Resources in CloudFormation---#
echo "Click here to see the output of your CloudFormation Stack"
STACK_ID=$(aws cloudformation describe-stacks --stack-name $CF_STACK_NAME --region $AWS_REGION --profile $AWS_CLI_PROFILE --query "Stacks[0].StackId" --output text)
echo "https://console.aws.amazon.com/cloudformation/home?region=$AWS_REGION#/stacks/outputs?stackId=$STACK_ID"

#---TEARDOWN---#
echo "If you want to DELETE (nearly) everything you just deployed and/or start over, run this command:"
echo "$ aws cloudformation delete-stack --stack-name $CF_STACK_NAME --region $AWS_REGION --profile $AWS_CLI_PROFILE &> /dev/null"
