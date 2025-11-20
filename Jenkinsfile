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
                sh 'docker compose build'
            }
        }
        
        stage('Deploy') {
            steps {
                sh 'docker compose up -d'
                sh 'ls'
            }
        }

        stage('Prisma Reset') {
            steps {
                sh 'docker compose run --rm api npx prisma migrate reset --force --skip-seed'
            }
        }

        stage('Prisma Migrate') {
            steps {
                sh 'docker compose run --rm api npx prisma migrate deploy'
            }
        }

        stage('Prisma Seed') {
            steps {
                sh 'docker compose run --rm api npm run prisma:seed'
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
