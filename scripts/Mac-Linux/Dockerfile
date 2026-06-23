# Docker image for WebAuthnKit v3.0.0 deployment
# Requires: Java 17, Node 20, Maven, AWS CLI, SAM CLI

FROM --platform=linux/amd64 ubuntu:22.04

ENV TERM=linux
ENV DEBIAN_FRONTEND=noninteractive

# Install system dependencies
RUN apt-get update && apt-get install -y --no-install-recommends \
    curl \
    unzip \
    zip \
    git \
    sudo \
    make \
    ca-certificates \
    gnupg \
    software-properties-common \
    && rm -rf /var/lib/apt/lists/*

# Install Java 17 (OpenJDK)
RUN apt-get update && apt-get install -y openjdk-17-jdk-headless \
    && rm -rf /var/lib/apt/lists/*
ENV JAVA_HOME=/usr/lib/jvm/java-17-openjdk-amd64
ENV PATH="${JAVA_HOME}/bin:${PATH}"

# Install Maven 3.9
RUN curl -fL https://archive.apache.org/dist/maven/maven-3/3.9.6/binaries/apache-maven-3.9.6-bin.tar.gz | tar xz -C /opt \
    && ln -s /opt/apache-maven-3.9.6/bin/mvn /usr/local/bin/mvn

# Install Node.js 20 LTS
RUN curl -fsSL https://deb.nodesource.com/setup_20.x | bash - \
    && apt-get install -y nodejs \
    && rm -rf /var/lib/apt/lists/*

# Install AWS CLI v2
RUN curl -fS "https://awscli.amazonaws.com/awscli-exe-linux-x86_64.zip" -o awscliv2.zip \
    && unzip -qq awscliv2.zip \
    && ./aws/install \
    && rm -rf awscliv2.zip aws/

# Install AWS SAM CLI
RUN curl -fL https://github.com/aws/aws-sam-cli/releases/latest/download/aws-sam-cli-linux-x86_64.zip -o sam-cli.zip \
    && unzip -qq sam-cli.zip -d sam-installation \
    && ./sam-installation/install \
    && rm -rf sam-cli.zip sam-installation/

# Install webpack globally
RUN npm install -g webpack webpack-cli --quiet

# Create a non-root user matching the deploy script expectations
RUN useradd -m developer
USER developer

CMD ["bash"]
