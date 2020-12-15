# Pull in base image that already has Java, MVN, and Node pre-installed
FROM openkbs/jdk-mvn-py3
# The above Docker base image has the following pre-installed/configured:
# node: v15.1.0 | npm: v7.0.8 | java: OpenJDK v1.8.0_265 | python: v3.6.9

# Terminal interaction
ENV TERM linux
ENV DEBIAN_FRONTEND noninteractive

#1 - Install AWS CLI
RUN echo "Installing AWS CLI..."
RUN curl -S "https://awscli.amazonaws.com/awscli-exe-linux-x86_64.zip" -o "awscliv2.zip" > /dev/null && unzip -qq awscliv2.zip && sudo ./aws/install > /dev/null

#2 - Install AWS SAM CLI via Python3 (https://github.com/aws/aws-sam-cli/issues/1424)
RUN echo "Installing AWS SAM CLI..."
RUN pip3 install --user --upgrade aws-sam-cli --no-warn-script-location --quiet > /dev/null 2>&1

#3 - Install webpack
RUN echo "Installing Webpack..."
RUN sudo npm install webpack webpack-cli -g --quiet