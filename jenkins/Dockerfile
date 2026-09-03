FROM jenkins/jenkins:lts

USER root

RUN apt-get update && \
    apt-get install -y curl git && \
    curl -fsSL https://get.docker.com | sh && \
    curl -fsSL https://deb.nodesource.com/setup_22.x | bash - && \
    apt-get install -y nodejs && \
    curl -LO "https://dl.k8s.io/release/$(curl -L -s https://dl.k8s.io/release/stable.txt)/bin/linux/amd64/kubectl" && \
    install -m 0755 kubectl /usr/local/bin/kubectl && \
    rm kubectl

USER jenkins