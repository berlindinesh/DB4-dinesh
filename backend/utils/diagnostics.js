// Diagnostic utilities for troubleshooting
export const printStartupDiagnostics = () => {
  console.log('\n' + '='.repeat(50));
  console.log('🚀 HRMS SERVER STARTUP DIAGNOSTICS');
  console.log('='.repeat(50));
  
  // Environment
  console.log('📊 Environment:', process.env.NODE_ENV || 'development');
  console.log('🌐 Port:', process.env.PORT || '5002');
  
  // CORS Configuration
  const allowedOrigins = process.env.ALLOWED_ORIGINS?.split(',') || [];
  console.log('🔐 CORS Allowed Origins:');
  if (allowedOrigins.length === 0) {
    console.log('  ⚠️  NO ALLOWED_ORIGINS SET - This may cause CORS issues');
    console.log('  💡 Set ALLOWED_ORIGINS in .env file');
  } else {
    allowedOrigins.forEach((origin, index) => {
      console.log(`  ${index + 1}. ${origin}`);
    });
  }
  
  // Database
  console.log('💾 Database Connection: MongoDB Atlas');
  
  // S3 Configuration
  const useS3 = process.env.USE_S3 === 'true' && process.env.AWS_ACCESS_KEY_ID;
  console.log('📦 File Storage:', useS3 ? 'AWS S3' : 'Local Storage');
  if (useS3) {
    console.log('🪣 S3 Bucket:', process.env.S3_BUCKET_NAME || 'Not set');
    console.log('🌍 AWS Region:', process.env.AWS_REGION || 'Not set');
  }
  
  // Socket.IO
  console.log('📡 Socket.IO: Enabled for real-time notifications');
  console.log('🔄 Transports: websocket, polling');
  
  console.log('='.repeat(50));
  console.log('✅ Server starting...\n');
};

export const printSocketDiagnostics = (allowedOrigins) => {
  console.log('\n📡 SOCKET.IO CONFIGURATION:');
  console.log('   ✅ CORS Origins:', allowedOrigins.length > 0 ? allowedOrigins.join(', ') : 'All origins (development)');
  console.log('   ✅ Transports: websocket, polling');
  console.log('   ✅ Ping Timeout: 60s');
  console.log('   ✅ Ping Interval: 25s');
  console.log('');
};

export const checkMissingEnvVars = () => {
  const required = ['JWT_SECRET', 'MONGODB_URI'];
  const missing = required.filter(key => !process.env[key]);
  
  if (missing.length > 0) {
    console.log('⚠️  MISSING REQUIRED ENVIRONMENT VARIABLES:');
    missing.forEach(key => console.log(`   - ${key}`));
    console.log('');
  }
  
  const recommended = ['ALLOWED_ORIGINS', 'EMAIL_USER', 'EMAIL_PASS'];
  const missingRecommended = recommended.filter(key => !process.env[key]);
  
  if (missingRecommended.length > 0) {
    console.log('💡 RECOMMENDED ENVIRONMENT VARIABLES:');
    missingRecommended.forEach(key => console.log(`   - ${key}`));
    console.log('');
  }
};
