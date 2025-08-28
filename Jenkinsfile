pipeline {
    agent any
    
    environment {
        NODE_ENV = 'test'
        JWT_SECRET = 'jenkins-test-secret'
    }
    
    stages {
        stage('Checkout') {
            steps {
                echo 'Code checked out successfully'
            }
        }
        
        stage('Install Dependencies') {
            parallel {
                stage('Backend Dependencies') {
                    steps {
                        dir('backend') {
                            script {
                                if (isUnix()) {
                                    sh 'npm ci'
                                } else {
                                    bat 'npm ci'
                                }
                            }
                        }
                    }
                }
                stage('Frontend Dependencies') {
                    steps {
                        dir('frontend') {
                            script {
                                if (isUnix()) {
                                    sh 'npm ci'
                                } else {
                                    bat 'npm ci'
                                }
                            }
                        }
                    }
                }
            }
        }
        
        stage('Code Quality & Tests') {
            parallel {
                stage('Backend Tests') {
                    steps {
                        dir('backend') {
                            script {
                                if (isUnix()) {
                                    sh 'npm test'
                                } else {
                                    bat 'npm test'
                                }
                            }
                        }
                    }
                }
                stage('Frontend Tests') {
                    steps {
                        dir('frontend') {
                            script {
                                if (isUnix()) {
                                    sh 'npm test -- --passWithNoTests --watchAll=false --coverage'
                                } else {
                                    bat 'npm test -- --passWithNoTests --watchAll=false --coverage'
                                }
                            }
                        }
                    }
                }
                stage('Backend Coverage') {
                    steps {
                        dir('backend') {
                            script {
                                if (isUnix()) {
                                    sh 'npm run test:coverage'
                                } else {
                                    bat 'npm run test:coverage'
                                }
                            }
                        }
                    }
                }
            }
        }
        
        stage('SonarQube Analysis') {
            steps {
                script {
                    def scannerHome = tool 'SonarQubeScanner'
                    withSonarQubeEnv('SonarQube') {
                        if (isUnix()) {
                            sh "${scannerHome}/bin/sonar-scanner"
                        } else {
                            bat "${scannerHome}\\bin\\sonar-scanner.bat"
                        }
                    }
                }
            }
        }
        
        stage('Build') {
            parallel {
                stage('Backend Build') {
                    steps {
                        dir('backend') {
                            script {
                                if (isUnix()) {
                                    sh 'npm run build'
                                } else {
                                    bat 'npm run build'
                                }
                            }
                        }
                    }
                }
                stage('Frontend Build') {
                    steps {
                        dir('frontend') {
                            script {
                                if (isUnix()) {
                                    sh 'npm run build'
                                } else {
                                    bat 'npm run build'
                                }
                            }
                        }
                    }
                }
            }
        }
        
        stage('Docker Build') {
            steps {
                script {
                    if (isUnix()) {
                        sh 'docker-compose build'
                    } else {
                        bat 'docker-compose build'
                    }
                }
            }
        }
    }
    
    post {
        always {
            // Publish test results
            publishTestResults testResultsPattern: '**/coverage/test-results.xml'
            
            // Publish coverage reports
            publishHTML([
                allowMissing: false,
                alwaysLinkToLastBuild: true,
                keepAll: true,
                reportDir: 'backend/coverage',
                reportFiles: 'index.html',
                reportName: 'Backend Coverage Report'
            ])
            
            publishHTML([
                allowMissing: false,
                alwaysLinkToLastBuild: true,
                keepAll: true,
                reportDir: 'frontend/coverage',
                reportFiles: 'index.html',
                reportName: 'Frontend Coverage Report'
            ])
        }
        
        failure {
            echo 'Pipeline failed! Check logs for details.'
        }
        
        success {
            echo 'Pipeline completed successfully!'
        }
    }
}
