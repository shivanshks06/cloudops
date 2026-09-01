FROM jenkins/jenkins:lts

USER root

RUN apt-get update && \
    apt-get install -y curl git ca-certificates gnupg lsb-release && \
    curl -fsSL https://deb.nodesource.com/setup_22.x | bash - && \
    apt-get install -y nodejs docker.io docker-compose && \
    apt-get clean && \
    rm -rf /var/lib/apt/lists/*

USER jenkins