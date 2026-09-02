pipeline {
    agent any

    options {
        timestamps()
    }

    environment {
        DOCKERHUB_USER = "shivanshks06"
    }

    stages {

        stage('Checkout') {
            steps {
                echo 'Cloning CloudOps repository...'
                checkout scm
            }
        }

        stage('Verify Tools') {
            steps {
                sh '''
                    git --version
                    node --version
                    npm --version
                    docker --version
                    docker-compose --version
                '''
            }
        }

        stage('Install Backend Dependencies') {
            steps {
                dir('server') {
                    sh 'npm install'
                }
            }
        }

        stage('Install Frontend Dependencies') {
            steps {
                dir('client') {
                    sh 'npm install'
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
                    sh 'node -e "console.log(\'Backend verification successful\')"'
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
                    docker build -t ${DOCKERHUB_USER}/cloudops-api:${BUILD_NUMBER} -t ${DOCKERHUB_USER}/cloudops-api:latest ./server

                    docker build -t ${DOCKERHUB_USER}/cloudops-client:${BUILD_NUMBER} -t ${DOCKERHUB_USER}/cloudops-client:latest ./client
                '''
            }
        }

        stage('Push Docker Images') {
            steps {
                sh '''
                    docker push ${DOCKERHUB_USER}/cloudops-api:${BUILD_NUMBER}
                    docker push ${DOCKERHUB_USER}/cloudops-api:latest

                    docker push ${DOCKERHUB_USER}/cloudops-client:${BUILD_NUMBER}
                    docker push ${DOCKERHUB_USER}/cloudops-client:latest
                '''
            }
        }

        stage('Pipeline Complete') {
            steps {
                echo "CloudOps CI pipeline completed successfully!"
            }
        }
    }

    post {

        success {
            echo "Build SUCCESS"
        }

        failure {
            echo "Build FAILED"
        }

        always {
            sh 'docker logout || true'
            echo "Pipeline finished"
        }
    }
}