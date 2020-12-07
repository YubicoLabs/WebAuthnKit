# Initial creation: October 1, 2020
# Last update: November 5, 2020

### Region Functions ###

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

### Region Parameters ###

# Referencing the constants file deployStarterKit.config in this directory
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

### Perform the AWS deployment ###

# Set the active folder to the WebAuthnKit backend folder
Set-Location -Path $webAuthnKitBackendFolder

# Create an Amazon S3 bucket used for SAM deployment
Write-Host "Create an Amazon S3 bucket used for SAM deployment"
aws s3 mb s3://$s3BucketName --region $awsRegion --endpoint-url https://s3.$awsRegion.amazonaws.com --profile $awsCliProfile

# Call AWS SAM build and package
Write-Host "Call AWS SAM build and package"
sam build --use-container --skip-pull-image ; sam package --s3-bucket $s3BucketName --profile $awsCliProfile

# Call AWS SAM Deploy
Write-Host "Call AWS SAM Deploy"
sam deploy --s3-bucket $s3BucketName --stack-name $cfStackName --profile $awsCliProfile --region $awsRegion --capabilities CAPABILITY_IAM --parameter-overrides UserPoolName=$userPoolName DatabaseName=$databaseName MasterUserName=$databaseMasterUsername MasterUserPassword=$databaseMasterPassword DefineAuthChallengeFuncName=$defineAuthChallengeFuncName CreateAuthChallengeFuncName=$createAuthChallengeFuncName VerifyAuthChallengeFuncName=$verifyAuthChallengeFuncName WebAuthnKitAPIFuncName=$webAuthnKitApiFuncName PreSignUpFuncName=$preSignUpFuncName JavaWebAuthnFuncName=$javaWebAuthnLibFuncName WebAuthnKitAPIName=$webAuthnKitApiName CreateDBSchemaFuncName=$createDatabaseSchemaFuncName CreateDBSchemaCallerFuncName=$createDatabaseSchemaCallerFuncName AmplifyHostingAppName=$amplifyHostingAppName

# Wait for the CloudFormation Stack to complete
Write-Host "Waiting on stack creation..."
$cfResults = $(aws cloudformation wait stack-create-complete --stack-name $cfStackName --region $awsRegion --profile $awsCliProfile)
Write-Host $cfResults

#1 Retrieves the awsexports from CloudFormation Output and save results to the ~/src/aws-exports.js file for React Web App 
Write-Host "Retrieving the awsexports from CloudFormation and writing constants to ~/clients/web/react/src/aws-export.js"

$awsExports = aws cloudformation --region $awsRegion describe-stacks --stack-name $cfStackName --profile $awsCliProfile --query "Stacks[0].Outputs[?OutputKey=='AWSExports'].OutputValue" --output text

New-Item -Path $webAuthnKitClientFolder\src\ -Name "aws-exports.js" -ItemType "file" -Value $awsExports -Force

#2 Install and build React app
Write-Host "Installing and building React App"
Set-Location -Path $webAuthnKitClientFolder
npm install
npm run build

#3  Zip up all the files under /dist directory
Write-Host "Zipping up the React app for Amplify"
Set-Location -Path $webAuthnKitClientFolder\dist\
compress-archive -Path index.html, main.js -DestinationPath Archive.zip -Force

#4 Upload zip file to S3
Write-Host "Uploading Amplify zip file to S3"
aws s3 cp $webAuthnKitClientFolder\dist\Archive.zip s3://$s3BucketName --profile $awsCliProfile

#5 Start deployment to AWS Amplify Hosting dev branch using zip file just uploaded to S3
Write-Host "Triggering Amplify deployment..."

#6 Get the Amplify App Id and store it in $amplifyAppId
$amplifyAppId = $(aws cloudformation --region $awsRegion describe-stacks --stack-name $cfStackName --profile $awsCliProfile --query "Stacks[0].Outputs[?OutputKey=='AmplifyHostingAppId'].OutputValue" --output text)

Write-Host "AmplifyAppId:" $amplifyAppId

#7 Call start-deployment of the client web app by passing in the zip file to the previously created Amplify Hosting dev branch
Set-Location -Path $webAuthnKitClientFolder
aws amplify start-deployment --app-id $amplifyAppId --branch-name $amplifyBranchName --source-url s3://$s3BucketName/Archive.zip --region $awsRegion --profile $awsCliProfile

# DONE Open hosted web app
$amplifyHostingEndpoint = $(aws cloudformation --region $awsRegion describe-stacks --stack-name $cfStackName --profile $awsCliProfile --query "Stacks[0].Outputs[?OutputKey=='AmplifyHostingEndpoint'].OutputValue" --output text) 

Write-Host "AmplifyHostingEndpoint:" $amplifyHostingEndpoint
Write-Host "DONE"

start $amplifyHostingEndpoint