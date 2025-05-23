pipeline {
    agent any

    stages {
        stage('Checkout') {
            steps {
                echo 'Cloning repository...'
                checkout scm
            }
        }

        stage('List Files') {
            steps {
                echo 'Project directory:'
                sh 'ls -al'
            }
        }

        // Optional stage to validate your HTML/CSS/JS with linters
        // Uncomment below after setting up tools
        /*
        stage('Lint Code') {
            steps {
                echo 'Running linters...'
                sh 'npm install'
                sh 'npm run lint'
            }
        }
        */

        stage('Build or Deploy') {
            steps {
                echo 'Static site ready for deployment!'
                // You could copy files to an S3 bucket, FTP server, etc.
                // sh 'scp -r * user@yourserver:/var/www/html/'
            }
        }
    }

    post {
        success {
            echo 'Build completed successfully!'
        }
        failure {
            echo '❌ Build failed!'
        }
    }
}
