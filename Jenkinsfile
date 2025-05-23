pipeline {
    agent any

    stages {
        stage('Checkout') {
            steps {
                checkout scm
            }
        }

        stage('List Files') {
            steps {
                sh 'ls -al'
            }
        }

        stage('Archive Site Files') {
            steps {
                echo 'Archiving static web app files...'
                archiveArtifacts artifacts: '**/*', fingerprint: true
            }
        }
    }

    post {
        success {
            echo 'Build and archive completed successfully!'
        }
        failure {
            echo 'Something went wrong.'
        }
    }
}
