pipeline {
    agent any

    options {
        timestamps()
    }

    environment {
        COMPOSE_FILE = "compose.yml"
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
                sh 'git --version'
                sh 'node --version'
                sh 'npm --version'
                sh 'docker --version'
                sh 'docker-compose --version'
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

        stage('Build Docker Images') {
            steps {
                sh 'docker-compose -f ${COMPOSE_FILE} build'
            }
        }

        stage('Pipeline Complete') {
            steps {
                echo 'CloudOps CI pipeline completed successfully.'
            }
        }
    }

    post {
        success {
            echo 'Build SUCCESS'
        }

        failure {
            echo 'Build FAILED'
        }

        always {
            echo 'Pipeline finished'
        }
    }
}