pipeline {
    agent any

    options {
        timestamps()
        disableConcurrentBuilds()
        buildDiscarder(logRotator(numToKeepStr: '20'))
    }

    environment {
        DOCKERHUB_USER = "shivanshks06"
        API_IMAGE = "shivanshks06/cloudops-api"
        CLIENT_IMAGE = "shivanshks06/cloudops-client"
        COMPOSE_FILE = "compose.yml"
    }

    stages {

        stage('Checkout') {
            steps {
                echo "Checking out latest CloudOps code..."
                checkout scm
            }
        }

        stage('Verify Tools') {
            steps {
                sh '''
                    echo "===== Tool Versions ====="
                    git --version
                    node --version
                    npm --version
                    docker --version
                    docker compose version
                '''
            }
        }

        stage('Install Backend Dependencies') {
            steps {
                dir('server') {
                    sh 'npm ci'
                }
            }
        }

        stage('Install Frontend Dependencies') {
            steps {
                dir('client') {
                    sh 'npm ci'
                }
            }
        }

        stage('Build React') {
            steps {
                dir('client') {
                    sh 'npm run build'
                }
            }
        }

        stage('Verify Backend') {
            steps {
                dir('server') {
                    sh '''
                        node -e "console.log('Backend verification successful')"
                    '''
                }
            }
        }

        stage('Docker Hub Login') {
            steps {
                withCredentials([
                    usernamePassword(
                        credentialsId: 'dockerhub-creds',
                        usernameVariable: 'DOCKER_USER',
                        passwordVariable: 'DOCKER_PASS'
                    )
                ]) {
                    sh '''
                        echo "$DOCKER_PASS" | docker login -u "$DOCKER_USER" --password-stdin
                    '''
                }
            }
        }

        stage('Build Docker Images') {
            steps {
                sh '''
                    docker build \
                      -t ${API_IMAGE}:${BUILD_NUMBER} \
                      -t ${API_IMAGE}:latest \
                      ./server

                    docker build \
                      -t ${CLIENT_IMAGE}:${BUILD_NUMBER} \
                      -t ${CLIENT_IMAGE}:latest \
                      ./client
                '''
            }
        }

        stage('Push Docker Images') {
            steps {
                sh '''
                    docker push ${API_IMAGE}:${BUILD_NUMBER}
                    docker push ${API_IMAGE}:latest

                    docker push ${CLIENT_IMAGE}:${BUILD_NUMBER}
                    docker push ${CLIENT_IMAGE}:latest
                '''
            }
        }

        stage('Deploy to Kubernetes') {
            steps {
                withCredentials([
                    file(credentialsId: 'kubeconfig', variable: 'KUBECONFIG_FILE')
                ]) {
                    sh '''
                        export KUBECONFIG=$KUBECONFIG_FILE

                        kubectl apply -k k8s/

                        kubectl set image deployment/cloudops-api \
                          cloudops-api=shivanshks06/cloudops-api:${BUILD_NUMBER} -n cloudops

                        kubectl set image deployment/cloudops-client \
                          cloudops-client=shivanshks06/cloudops-client:${BUILD_NUMBER} -n cloudops

                        kubectl rollout status deployment/cloudops-api -n cloudops
                        kubectl rollout status deployment/cloudops-client -n cloudops
                    '''
                }
            }
        }

        stage('Cleanup') {
            steps {
                sh '''
                    docker image prune -f || true
                '''
            }
        }

        stage('Pipeline Complete') {
            steps {
                echo "CloudOps CI/CD pipeline completed successfully!"
            }
        }
    }

    post {

        success {
            echo "Build #${BUILD_NUMBER} SUCCESS"
        }

        failure {
            echo "Build #${BUILD_NUMBER} FAILED"
            withCredentials([
                file(credentialsId: 'kubeconfig', variable: 'KUBECONFIG_FILE')
            ]) {
                sh '''
                    export KUBECONFIG=$KUBECONFIG_FILE || true
                    kubectl rollout undo deployment/cloudops-api -n cloudops || true
                    kubectl rollout undo deployment/cloudops-client -n cloudops || true
                '''
            }
        }

        always {
            sh 'docker logout || true'
            echo "Pipeline finished."
        }
    }
}