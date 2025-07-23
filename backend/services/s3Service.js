import { S3Client, DeleteObjectCommand, GetObjectCommand, PutObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { s3Client, BUCKET_NAME, useS3 } from '../config/s3Config.js';
import fs from 'fs';
import path from 'path';

class S3Service {
  constructor() {
    this.s3Client = s3Client;
    this.bucketName = BUCKET_NAME;
    this.useS3 = useS3;
  }

  // Upload file to S3 (for manual uploads)
  async uploadFile(fileBuffer, fileName, contentType, metadata = {}) {
    if (!this.useS3) {
      throw new Error('S3 is not enabled');
    }

    const uploadParams = {
      Bucket: this.bucketName,
      Key: fileName,
      Body: fileBuffer,
      ContentType: contentType,
      Metadata: metadata,
    };

    try {
      const result = await this.s3Client.send(new PutObjectCommand(uploadParams));
      const fileUrl = `https://${this.bucketName}.s3.${process.env.AWS_REGION || 'us-east-2'}.amazonaws.com/${fileName}`;
      
      console.log('✅ File uploaded to S3:', fileUrl);
      return {
        success: true,
        url: fileUrl,
        key: fileName,
        result: result,
      };
    } catch (error) {
      console.error('❌ Error uploading file to S3:', error);
      throw error;
    }
  }

  // Delete file from S3
  async deleteFile(fileKey) {
    if (!this.useS3) {
      // For local storage, delete from file system
      try {
        const filePath = path.join(process.cwd(), 'uploads', fileKey);
        if (fs.existsSync(filePath)) {
          fs.unlinkSync(filePath);
          console.log('✅ Local file deleted:', filePath);
          return { success: true };
        }
      } catch (error) {
        console.error('❌ Error deleting local file:', error);
        throw error;
      }
      return { success: true };
    }

    // Extract key from URL if full URL is provided
    if (fileKey.includes('amazonaws.com')) {
      const urlParts = fileKey.split('.com/');
      fileKey = urlParts[1] || fileKey;
    }

    const deleteParams = {
      Bucket: this.bucketName,
      Key: fileKey,
    };

    try {
      await this.s3Client.send(new DeleteObjectCommand(deleteParams));
      console.log('✅ File deleted from S3:', fileKey);
      return { success: true, key: fileKey };
    } catch (error) {
      console.error('❌ Error deleting file from S3:', error);
      throw error;
    }
  }

  // Get signed URL for private files (if needed)
  async getSignedUrl(fileKey, expiresIn = 3600) {
    if (!this.useS3) {
      throw new Error('S3 is not enabled');
    }

    const getObjectParams = {
      Bucket: this.bucketName,
      Key: fileKey,
    };

    try {
      const signedUrl = await getSignedUrl(
        this.s3Client,
        new GetObjectCommand(getObjectParams),
        { expiresIn }
      );
      return signedUrl;
    } catch (error) {
      console.error('❌ Error generating signed URL:', error);
      throw error;
    }
  }

  // Migrate local file to S3
  async migrateLocalFileToS3(localFilePath, s3Key) {
    if (!this.useS3) {
      throw new Error('S3 is not enabled');
    }

    const fullLocalPath = path.join(process.cwd(), 'uploads', localFilePath);
    
    if (!fs.existsSync(fullLocalPath)) {
      throw new Error(`Local file not found: ${fullLocalPath}`);
    }

    try {
      const fileBuffer = fs.readFileSync(fullLocalPath);
      const contentType = this.getContentType(localFilePath);
      
      const result = await this.uploadFile(fileBuffer, s3Key, contentType, {
        migratedFrom: 'local',
        originalPath: localFilePath,
        migratedAt: new Date().toISOString(),
      });

      console.log(`✅ Migrated ${localFilePath} to S3: ${result.url}`);
      return result;
    } catch (error) {
      console.error(`❌ Error migrating ${localFilePath} to S3:`, error);
      throw error;
    }
  }

  // Get content type based on file extension
  getContentType(fileName) {
    const ext = path.extname(fileName).toLowerCase();
    const contentTypes = {
      '.jpg': 'image/jpeg',
      '.jpeg': 'image/jpeg',
      '.png': 'image/png',
      '.gif': 'image/gif',
      '.webp': 'image/webp',
      '.pdf': 'application/pdf',
      '.doc': 'application/msword',
      '.docx': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    };
    return contentTypes[ext] || 'application/octet-stream';
  }

  // Check if S3 is properly configured
  async testConnection() {
    if (!this.useS3) {
      return { success: false, message: 'S3 is not enabled' };
    }

    try {
      // Try to list objects (with limit to avoid large responses)
      const listParams = {
        Bucket: this.bucketName,
        MaxKeys: 1,
      };
      
      await this.s3Client.send(new PutObjectCommand({
        ...listParams,
        Key: 'test-connection.txt',
        Body: 'Connection test',
        ContentType: 'text/plain',
      }));

      // Clean up test file
      await this.deleteFile('test-connection.txt');

      return { success: true, message: 'S3 connection successful' };
    } catch (error) {
      console.error('❌ S3 connection test failed:', error);
      return { success: false, message: error.message };
    }
  }
}

export default new S3Service();
