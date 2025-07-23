#!/usr/bin/env node

// Test script to verify S3 integration with your HRMS app
import axios from 'axios';
import FormData from 'form-data';
import fs from 'fs';
import path from 'path';

const API_BASE_URL = process.env.API_BASE_URL || 'http://localhost:5002';

// Test S3 configuration
async function testS3Config() {
  console.log('🧪 Testing S3 Configuration...');
  
  try {
    const response = await axios.get(`${API_BASE_URL}/api/s3/test`, {
      headers: {
        'Authorization': 'Bearer YOUR_JWT_TOKEN', // Replace with actual token
        'X-Company-Code': 'YOUR_COMPANY_CODE'     // Replace with actual company code
      }
    });
    
    console.log('✅ S3 Configuration Test Result:', response.data);
    return response.data.useS3;
  } catch (error) {
    console.error('❌ S3 Configuration Test Failed:', error.response?.data || error.message);
    return false;
  }
}

// Test employee image upload (simulating frontend form)
async function testEmployeeImageUpload() {
  console.log('🧪 Testing Employee Image Upload...');
  
  // Create a test FormData (simulating PersonalInformationForm.js)
  const formData = new FormData();
  
  // Add form data (simulating what frontend sends)
  formData.append('formData', JSON.stringify({
    userId: 'test-user-123',
    personalInfo: {
      firstName: 'Test',
      lastName: 'User',
      email: 'test@example.com'
    }
  }));
  
  // Add a test image file (create a small test image or use existing)
  if (fs.existsSync('test-image.jpg')) {
    formData.append('employeeImage', fs.createReadStream('test-image.jpg'));
  } else {
    console.log('ℹ️  No test-image.jpg found, skipping image upload test');
    return;
  }
  
  try {
    const response = await axios.post(`${API_BASE_URL}/api/employees/personal-info`, formData, {
      headers: {
        ...formData.getHeaders(),
        'Authorization': 'Bearer YOUR_JWT_TOKEN', // Replace with actual token
        'X-Company-Code': 'YOUR_COMPANY_CODE'     // Replace with actual company code
      }
    });
    
    console.log('✅ Employee Image Upload Success:', {
      success: response.data.success,
      storage: response.data.storage,
      imageUrl: response.data.imageUrl,
      employeeId: response.data.employeeId
    });
    
    return response.data.imageUrl;
  } catch (error) {
    console.error('❌ Employee Image Upload Failed:', error.response?.data || error.message);
    return null;
  }
}

// Test image retrieval
async function testImageRetrieval(imageUrl) {
  if (!imageUrl) {
    console.log('⏭️  Skipping image retrieval test (no image URL)');
    return;
  }
  
  console.log('🧪 Testing Image Retrieval...');
  console.log('📍 Image URL:', imageUrl);
  
  try {
    const response = await axios.head(imageUrl);
    console.log('✅ Image Retrieval Success:', {
      status: response.status,
      contentType: response.headers['content-type'],
      contentLength: response.headers['content-length']
    });
  } catch (error) {
    console.error('❌ Image Retrieval Failed:', error.response?.status || error.message);
  }
}

// Test MongoDB URL storage simulation
function testUrlStorage(imageUrl, storage) {
  console.log('🧪 Testing MongoDB URL Storage Pattern...');
  
  if (!imageUrl) {
    console.log('⏭️  No image URL to test');
    return;
  }
  
  // Simulate how URLs are stored in MongoDB
  const mongoRecord = {
    personalInfo: {
      firstName: 'Test',
      lastName: 'User',
      employeeImage: imageUrl // This is what gets stored
    }
  };
  
  console.log('📄 MongoDB Record Pattern:', mongoRecord);
  
  // Simulate how frontend retrieves and constructs URLs
  const retrievedUrl = mongoRecord.personalInfo.employeeImage;
  
  if (storage === 'S3') {
    if (retrievedUrl.includes('amazonaws.com')) {
      console.log('✅ S3 URL correctly stored and retrieved');
    } else {
      console.log('❌ S3 URL format incorrect');
    }
  } else {
    if (retrievedUrl.startsWith('/uploads/')) {
      console.log('✅ Local URL correctly stored and retrieved');
    } else {
      console.log('❌ Local URL format incorrect');
    }
  }
}

// Run all tests
async function runAllTests() {
  console.log('🚀 Starting HRMS S3 Integration Tests\n');
  
  // Test 1: S3 Configuration
  const useS3 = await testS3Config();
  console.log('');
  
  // Test 2: Employee Image Upload
  const imageUrl = await testEmployeeImageUpload();
  console.log('');
  
  // Test 3: Image Retrieval
  await testImageRetrieval(imageUrl);
  console.log('');
  
  // Test 4: URL Storage Pattern
  testUrlStorage(imageUrl, useS3 ? 'S3' : 'Local');
  console.log('');
  
  console.log('🎯 Test Summary:');
  console.log(`📦 Storage Type: ${useS3 ? 'AWS S3' : 'Local Storage'}`);
  console.log(`🖼️  Image Upload: ${imageUrl ? 'SUCCESS' : 'FAILED'}`);
  console.log(`🔗 URL Pattern: ${imageUrl ? (imageUrl.includes('amazonaws.com') ? 'S3 URL' : 'Local URL') : 'N/A'}`);
  
  if (useS3 && imageUrl && imageUrl.includes('amazonaws.com')) {
    console.log('✅ S3 Integration Working Correctly!');
  } else if (!useS3 && imageUrl && imageUrl.includes('/uploads/')) {
    console.log('✅ Local Storage Working Correctly!');
  } else {
    console.log('❌ Integration Issues Found - Check Configuration');
  }
}

// Instructions for running the test
if (process.argv.length <= 2) {
  console.log(`
📋 HRMS S3 Integration Test

To run this test:

1. Update the JWT token and company code in the script
2. Optionally place a test-image.jpg file in this directory
3. Run: node test-s3-integration.js run

Environment Variables to Set:
- API_BASE_URL (default: http://localhost:5002)
- USE_S3=true (to enable S3)
- AWS_ACCESS_KEY_ID
- AWS_SECRET_ACCESS_KEY
- S3_BUCKET_NAME=db4people

📦 To install S3 packages:
cd backend && npm install @aws-sdk/client-s3 @aws-sdk/s3-request-presigner multer-s3 uuid
`);
} else if (process.argv[2] === 'run') {
  runAllTests().catch(console.error);
}
