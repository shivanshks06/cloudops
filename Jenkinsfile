
pipeline {
    agent any

    options {
        timestamps()
    }

    stages {

        stage('Checkout') {
            steps {
                echo 'Cloning CloudOps repository...'
                checkout scm
            }
        }

        stage('Backend Dependencies') {
            steps {
                dir('server') {
                    sh 'npm install'
                }
            }
        }

        stage('Frontend Dependencies') {
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
                    sh 'node --version'
                    sh 'npm --version'
                }
            }
        }

        stage('Success') {
            steps {
                echo 'CloudOps pipeline completed successfully!'
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