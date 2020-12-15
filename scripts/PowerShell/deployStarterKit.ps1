# Last update: December 14, 2020
# Description: Dockerized Windows PowerShell script for deploying Yubico WebAuthn Starter Kit to AWS Cloud

# [Requirements]
# Prerequisites for deploying the Yubico WebAuthn Starter Kit to AWS Cloud:
#   1. AWS CLI - installed and configured
#   2. Docker installed and running

# [Get Started]
#   1. (Optional) Modify the .\deployStarterKitPs.json with your AWS Profile, Region, etc...
#   2. Run > .\deployStarterKit.ps1

##################
### Functions ####
##################

# Create the suffix for the deployment. It must be max five alphanumeric lower-case characters long.
function Get-Suffix($suffix) {
   if (!$suffix) {
      # If a suffix value is not specified in the config file, return a random 5 character random string.
      $suffix = -join ((65..90) + (97..122) | Get-Random -Count 5 | % { [char]$_ })
   }
   else {
      # There is a suffix in the config file, which is verified.
      while ($suffix.length -gt 5) {
         $suffix = Read-Host "The configured suffix is too long. Enter a value of max 5 characters"
      }
   }
   return $suffix.ToLower()
}

# Each parameter enters here. If no param specified (empty) create a temp name (as $2).
function Get-Param($parameter, $default) {
   if (!$parameter) { return $default }
   else { return $parameter }
}

# Check that the AWS region is not empty. If it is empty, then request the user to enter a value.
function Get-Region($awsRegion) {
   if (!$awsRegion) { 
      $awsRegion = Read-Host "The AWS region cannot be empty. Please enter a valid AWS region"
      return $awsRegion 
   }
   else { return $awsRegion }
}

# If a database master password value is not specified by user, return a 16 character random string.
function Get-DatabaseMasterPassword($databaseMasterPassword) {
   if (!$databaseMasterPassword) { 
      $databaseMasterPassword = -join ((65..90) + (97..122) | Get-Random -Count 16 | % { [char]$_ })
      return $databaseMasterPassword
   }
   else { return $databaseMasterPassword }
}

#######################
##### Parameters ######
#######################

# Referencing the constants file deployStarterKitPs.json in this directory
# All custom name changes should be made to deployStarterKitPs.json
$configFile = "deployStarterKitPs.json"
$configFileJson = Get-Content -Path $configFile | ConvertFrom-Json

# AWS CLI profile used to execute commands. Use 'default' if not specified
$awsCliProfile = Get-Param $configFileJson.AwsCliProfile "default"
Write-Host "AWS CLI profile is:" $awsCliProfile

# Suffix to append to asset names created by AWS CloudFormation
# Calling getSuffix function to generate random value if a suffix is not specified
$suffix = Get-Suffix $configFileJson.Suffix
Write-Host "Suffix is:" $suffix

# AWS CloudFormation stack name
$cfStackName = Get-Param $configFileJson.CfStackName ("webauthnkit-" + $suffix)
Write-Host "AWS CloudFormation stack name is:" $cfStackName

# AWS Region
$awsRegion = Get-Region $configFileJson.AwsRegion
Write-Host "AWS region is:" $awsRegion

# Amazon S3 bucket used for deployment
$s3BucketName = Get-Param $configFileJson.S3BucketName ("webauthnkit-" + $suffix)
Write-Host "Amazon S3 bucket is:" $s3BucketName

# Amazon User Pool
$userPoolName = Get-Param $configFileJson.UserPoolName ("webauthnkit-userpool-" + $suffix)
Write-Host "Amazon User Pool is:" $userPoolName

# Amazon RDS Aurora database name
$databaseName = Get-Param $configFileJson.DatabaseName ("webauthnkitdb" + $suffix)
Write-Host "Amazon RDS Aurora database name is:" $databaseName

# Amazon RDS Aurora database master username
$databaseMasterUsername = Get-Param $configFileJson.DatabaseMasterUsername ("dbmaster" + $suffix)
Write-Host "Amazon RDS Aurora database master username is:" $databaseMasterUsername

# Auto-generate a random 16 character password each time for databaseMasterUsername, if not specified
$databaseMasterPassword = Get-DatabaseMasterPassword $configFileJson.DatabaseMasterPassword
Write-Host "Amazon RDS Aurora database master password is:" $databaseMasterPassword

# AWS Lambda Function names
$defineAuthChallengeFuncName = Get-Param $configFileJson.DefineAuthChallengeFuncName ("webAuthnKit-DefineAuth-" + $suffix)
Write-Host "AWS Lambda Function DefineAuthChallenge is:" $defineAuthChallengeFuncName

$createAuthChallengeFuncName = Get-Param $configFileJson.CreateAuthChallengeFuncName ("webAuthnKit-CreateAuth-" + $suffix)
Write-Host "AWS Lambda Function CreateAuthChallenge is:" $createAuthChallengeFuncName

$verifyAuthChallengeFuncName = Get-Param $configFileJson.VerifyAuthChallengeFuncName ("webAuthnKit-VerifyAuth-" + $suffix)
Write-Host "AWS Lambda Function VerifyAuthChallenge is:" $verifyAuthChallengeFuncName

$preSignUpFuncName = Get-Param $configFileJson.PreSignUpFuncName ("webAuthnKit-PreSignUp-" + $suffix)
Write-Host "AWS Lambda Function PreSignUp is:" $preSignUpFuncName

$webAuthnKitApiFuncName = Get-Param $configFileJson.WebAuthnKitApiFuncName ("webAuthnKit-API-" + $suffix)
Write-Host "AWS Lambda Function WebAuthnKitApiFuncName is:" $webAuthnKitApiFuncName

$javaWebAuthnLibFuncName = Get-Param $configFileJson.JavaWebAuthnLibFuncName ("webAuthnKit-JavaLib-" + $suffix)
Write-Host "AWS Lambda Function JavaWebAuthnLib is:" $javaWebAuthnLibFuncName

$createDatabaseSchemaFuncName = Get-Param $configFileJson.CreateDatabaseSchemaFuncName ("webAuthnKit-createDBSchema-" + $suffix)
Write-Host "AWS Lambda Function CreateDatabaseSchema is:" $createDatabaseSchemaFuncName

$createDatabaseSchemaCallerFuncName = Get-Param $configFileJson.CreateDatabaseSchemaCallerFuncName ("webAuthnKit-createDBSchemaCaller-" + $suffix)
Write-Host "AWS Lambda Function CreateDatabaseSchemaCaller is:" $createDatabaseSchemaCallerFuncName

# API Gateway Name
$webAuthnKitApiName = Get-Param $configFileJson.WebAuthnKitApiName ("webAuthnKit-API-" + $suffix)
Write-Host "WebAuthnKit API is:" $webAuthnKitApiName

# AWS Amplify Hosting App Name
$amplifyHostingAppName = Get-Param $configFileJson.AmplifyHostingAppName ("webAuthnKit-reactclient-" + $suffix)
Write-Host "AmplifyHostingAppName is:" $amplifyHostingAppName

# AWS Amplify Hosting Branch Name
$amplifyBranchName = Get-Param $configFileJson.AmplifyBranchName "dev"
Write-Host "AmplifyBranchName is:" $amplifyBranchName

# Path to the WebAuthnKit root folder
$webAuthnKitCurrentFolder = Get-Location
$webAuthnKitScriptFolder = Split-Path -Path $webAuthnKitCurrentFolder -Parent
$webAuthnKitRootFolder = Split-Path -Path $webAuthnKitScriptFolder -Parent
Write-Host "WebAuthnKit root folder:" $webAuthnKitRootFolder

# Path to the WebAuthnKit backend folder
$webAuthnKitBackendFolder = $webAuthnKitRootFolder + "\backend"
Write-Host "WebAuthnKit backend folder:" $webAuthnKitBackendFolder

# Path to the WebAuthnKit client folder
$webAuthnKitClientFolder = $webAuthnKitRootFolder + "\clients\web\react\"
Write-Host "WebAuthnKit client folder:" $webAuthnKitClientFolder

# Path to the User HOME folder
$userHomeFolder = powershell echo $ENV:UserProfile
Write-Host "User HOME folder:" $userHomeFolder

# Set the active folder to this script folder
Set-Location -Path .

####################################
######### Docker Build #############
####################################
docker build -t starterkit:dev .
Write-Host "Docker image is ready!"

#1 Clean install of Java Function
Write-Host "Step 1 [Pre-Deployment] Running mvn clean install of the JavaWebAuthnLib (Java) Lambda function..."
docker run -w /webauthnkit/backend/lambda-functions/JavaWebAuthnLib --volume=$webAuthnKitRootFolder':'/webauthnkit starterkit:dev mvn clean install 2>&1>$null
Write-Host "mvn clean install: COMPLETE"

#2 Create an Amazon S3 bucket used for SAM deployment
Write-Host "Step 2 [Pre-Deployment] Creating Amazon S3 bucket for staged deployment"
aws s3 mb s3://$s3BucketName --region $awsRegion --endpoint-url https://s3.$awsRegion.amazonaws.com --profile $awsCliProfile

####################################################
######### SAM Build | Package | Deploy #############
####################################################

#3 SAM Build 
Write-Host "Step 3 [Deployment] Running SAM build...(~1 minute) "
docker run -w /webauthnkit/backend --volume=$webAuthnKitRootFolder':'/webauthnkit starterkit:dev /home/developer/.local/bin/sam build 2>&1>$null

#4 SAM Package 
Write-Host "Step 4 [Deployment] Running SAM package..."
docker run -w /webauthnkit/backend --volume=$webAuthnKitRootFolder':'/webauthnkit starterkit:dev /home/developer/.local/bin/sam package 2>&1>$null

#5 SAM Deploy
Write-Host "Step 5 [Deployment] Running SAM deploy..."
docker run -w /webauthnkit/backend --volume=$webAuthnKitRootFolder':'/webauthnkit --volume=$webAuthnKitRootFolder':'/webauthnkit --volume=$userHomeFolder\.aws:/home/developer/.aws:ro starterkit:dev /home/developer/.local/bin/sam deploy --s3-bucket $s3BucketName --stack-name $cfStackName --profile $awsCliProfile --region $awsRegion --capabilities CAPABILITY_IAM --parameter-overrides UserPoolName=$userPoolName DatabaseName=$databaseName MasterUserName=$databaseMasterUsername MasterUserPassword=$databaseMasterPassword DefineAuthChallengeFuncName=$defineAuthChallengeFuncName CreateAuthChallengeFuncName=$createAuthChallengeFuncName VerifyAuthChallengeFuncName=$verifyAuthChallengeFuncName WebAuthnKitAPIFuncName=$webAuthnKitApiFuncName PreSignUpFuncName=$preSignUpFuncName JavaWebAuthnFuncName=$javaWebAuthnLibFuncName WebAuthnKitAPIName=$webAuthnKitApiName CreateDBSchemaFuncName=$createDatabaseSchemaFuncName CreateDBSchemaCallerFuncName=$createDatabaseSchemaCallerFuncName AmplifyHostingAppName=$amplifyHostingAppName

# Wait for the CloudFormation Stack to complete
Write-Host "Step 5 [Deployment] Waiting for CloudFormation deployment...(~6 minutes)"
$cfResults = $(aws cloudformation wait stack-create-complete --stack-name $cfStackName --region $awsRegion --profile $awsCliProfile)
Write-Host $cfResults

#6 Retrieves the awsexports from CloudFormation Output and save results to the ~\src\aws-exports.js file for React Web App 
Write-Host "Retrieving the awsexports from CloudFormation and writing constants to ~\clients\web\react\src\aws-export.js"
$awsExports = aws cloudformation --region $awsRegion describe-stacks --stack-name $cfStackName --profile $awsCliProfile --query "Stacks[0].Outputs[?OutputKey=='AWSExports'].OutputValue" --output text
New-Item -Path $webAuthnKitClientFolder\src\ -Name "aws-exports.js" -ItemType "file" -Value $awsExports -Force

#7 Install and Build React Web App Client
Write-Host "Step 7 [Web Client] Building and installing React Web Client..."
Write-Host "Running npm install...(~2 minutes)"
docker run -w /webauthnkit/clients/web/react --volume=$webAuthnKitRootFolder':'/webauthnkit starterkit:dev npm install 2>&1>$null

Write-Host "Step 7 [Web Client] Running npm run build....(~1 minute)"
docker run -w /webauthnkit/clients/web/react --volume=$webAuthnKitRootFolder':'/webauthnkit starterkit:dev npm run build 2>&1>$null

#8 Archive React Web App 
# Zip up all the files under React  ~\dist directory, but not the directory itself
Write-Host "Step 8 [Web Client] Zipping up the React app for Amplify Hosting"
Set-Location -Path $webAuthnKitClientFolder\dist\
compress-archive -Path index.html, main.js -DestinationPath Archive.zip -Force

#9 Upload zip file to S3
Write-Host "Step 9 [Web Client] Uploading Web Client to S3 for staging..."
aws s3 cp $webAuthnKitClientFolder\dist\Archive.zip s3://$s3BucketName --profile $awsCliProfile

#10 Amplify Deployment (hosting) of React Web Client 
Write-Host "Step 10 [Web Client] Deploying React Web App to Amplify (hosting) via CloudFormation..."
$amplifyAppId = $(aws cloudformation --region $awsRegion describe-stacks --stack-name $cfStackName --profile $awsCliProfile --query "Stacks[0].Outputs[?OutputKey=='AmplifyHostingAppId'].OutputValue" --output text)

#11 Deploy React App to AWS Amplify Hosting
# Call start-deployment of the client web app by passing in the zip file to the previously created Amplify Hosting AMPLIFY_HOSTING_BRANCH_NAME branch 
Write-Host "Step 11 [Web Client] Deploying React Web Client to Amplify Hosting"
Set-Location -Path $webAuthnKitClientFolder
aws amplify start-deployment --app-id $amplifyAppId --branch-name $amplifyBranchName --source-url s3://$s3BucketName/Archive.zip --region $awsRegion --profile $awsCliProfile

#12 Launch Amplify Hosting Endpoint in Browser
Write-Host "Step 12 [DEPLOYMENT COMPLETED] Launching Web Client in browser"
$amplifyHostingEndpoint = $(aws cloudformation --region $awsRegion describe-stacks --stack-name $cfStackName --profile $awsCliProfile --query "Stacks[0].Outputs[?OutputKey=='AmplifyHostingEndpoint'].OutputValue" --output text) 
Write-Host "DONE"
Write-Host "Launching web client at:" $amplifyHostingEndpoint
# Pause for 7 seconds to let the web app to refresh
Start-Sleep -Seconds 7
start $amplifyHostingEndpoint

#13 Show CloudFormation Console Link to view AWS resources
Write-Host "Step 13 [Review] Click here to see the output of your CloudFormation Stack"
$stackID=$(aws cloudformation describe-stacks --stack-name $cfStackName --region $awsRegion --profile $awsCliProfile --query "Stacks[0].StackId" --output text)
Write-Host "https://console.aws.amazon.com/cloudformation/home?region=$awsRegion#/stacks/outputs?stackId=$stackID"

#14 TEARDOWN (Optional)
Write-Host "Step 14 [Teardown (Optional)] If you want to DELETE (nearly) everything you just deployed and/or start over, run these commands:"
Write-Host "Removes the CloudFormation Stack which removes (nearly) all the resources it created"
Write-Host "> aws cloudformation delete-stack --stack-name $cfStackName --region $awsRegion --profile $awsCliProfile"
Write-Host "Removes the S3 bucket used only for deploying the WebAuthn Starter Kit"
Write-Host "> aws s3 rb s3://$s3BucketName --force --region $awsRegion --profile $awsCliProfile"