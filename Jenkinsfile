pipeline {
    agent any

    environment {
        ENV_FILE = credentials('backend-env')
    }

    stages {

        stage('Checkout') {
            steps {
                checkout scm
            }
        }

        stage('Setup Environment') {
            steps {
                script {
                    sh 'cp $ENV_FILE .env'
                    sh 'cat $ENV_FILE'
                    sh 'chmod 600 .env'
                }
            }
        }

        stage('Build') {
            steps {
                sh 'docker compose build dex-engine-main'
            }
        }
        
        stage('Deploy') {
            steps {
                sh 'docker compose up -d dex-engine-main'
                sh 'ls'
            }
        }
    }

    post {
        success {
            echo 'Deployment successful!'
        }
        failure {
            echo 'Deployment failed!'
        }
        always {
            sh 'rm -f .env'
            cleanWs()
        }
    }
}