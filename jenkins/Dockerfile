FROM jenkins/jenkins:lts

USER root

# Install Node.js, npm, Git and Docker CLI
RUN apt-get update && \
    apt-get install -y curl git ca-certificates gnupg lsb-release && \
    curl -fsSL https://deb.nodesource.com/setup_22.x | bash - && \
    apt-get install -y nodejs && \
    apt-get install -y docker.io && \
    apt-get clean && \
    rm -rf /var/lib/apt/lists/*

USER jenkins