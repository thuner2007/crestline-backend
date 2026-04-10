import { Injectable } from '@nestjs/common';
import * as Minio from 'minio';
import * as dotenv from 'dotenv';
import { BufferedFile } from './file.model';

dotenv.config();

@Injectable()
export class MinioService {
  private minioClient: Minio.Client;

  constructor() {
    // Absolute minimal configuration - matching CLI exactly
    this.minioClient = new Minio.Client({
      endPoint: process.env.MINIO_ENDPOINT,
      port: parseInt(process.env.MINIO_PORT, 10),
      useSSL: process.env.MINIO_USE_SSL === 'true',
      accessKey: process.env.MINIO_ACCESS_KEY,
      secretKey: process.env.MINIO_SECRET_KEY,
    });

    console.log('MinIO Client initialized - with chunked upload support');
  }

  private sanitizeFilename(filename: string): string {
    return filename
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^\x00-\x7F]/g, '')
      .replace(/[^a-zA-Z0-9.-]/g, '_')
      .replace(/_{2,}/g, '_')
      .replace(/^_+|_+$/g, '')
      .toLowerCase();
  }

  private getPublicUrl(bucketName: string, fileName: string): string {
    const protocol = process.env.MINIO_USE_SSL === 'true' ? 'https' : 'http';
    const port = process.env.MINIO_PORT;
    const endpoint = process.env.MINIO_ENDPOINT;

    // If port is standard (80 for http, 443 for https), don't include it in URL
    const portSuffix =
      (protocol === 'http' && port === '80') ||
      (protocol === 'https' && port === '443')
        ? ''
        : `:${port}`;

    return `${protocol}://${endpoint}${portSuffix}/${bucketName}/${fileName}`;
  }

  async uploadFile(
    bucketName: string,
    file: BufferedFile,
    isPublic: boolean = false,
    batchDelay: number = 50,
  ): Promise<string> {
    const sanitizedOriginalName = this.sanitizeFilename(file.originalname);
    const fileExt = sanitizedOriginalName.split('.').pop() || 'bin';
    const fileName = `${Date.now()}-${Math.random().toString(36).substring(2)}.${fileExt}`;

    console.log(`=== UPLOAD DEBUG ===`);
    console.log(`File: ${file.originalname} -> ${fileName}`);
    console.log(
      `Size: ${file.size} bytes (${(file.size / 1024 / 1024).toFixed(2)}MB)`,
    );

    if (batchDelay > 0) {
      await new Promise((resolve) => setTimeout(resolve, batchDelay));
    }

    // Use MinIO's native multipart upload for files larger than 64MB
    // For smaller files, use direct upload which is more efficient
    const sizeThreshold = 64 * 1024 * 1024; // 64MB threshold
    const useMultipartUpload = file.size > sizeThreshold;

    console.log(
      `Upload strategy: ${useMultipartUpload ? 'MULTIPART' : 'DIRECT'}`,
    );

    try {
      // Ensure bucket exists
      await this.createBucketIfNotExists(bucketName, isPublic);

      // Use MinIO's putObject method which handles multipart internally for large files
      await this.minioClient.putObject(
        bucketName,
        fileName,
        file.buffer,
        file.size,
        { 'Content-Type': file.mimetype },
      );

      console.log('✓ Upload successful:', fileName);

      // Return full URL if public, otherwise just filename
      if (isPublic) {
        const publicUrl = this.getPublicUrl(bucketName, fileName);
        console.log('✓ Public URL:', publicUrl);
        return publicUrl;
      }

      return fileName;
    } catch (error) {
      console.error('✗ Upload failed:', {
        message: error.message || 'No message',
        code: error.code || 'No code',
        name: error.name || 'No name',
      });
      throw new Error(`Upload failed: ${error.message || 'Unknown error'}`);
    }
  }

  async uploadMultipleFiles(
    bucketName: string,
    files: Array<BufferedFile>,
    isPublic: boolean = false,
  ): Promise<string[]> {
    const uploadedUrls: string[] = [];

    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      try {
        const fileName = await this.uploadFile(
          bucketName,
          file,
          isPublic,
          100, // Small delay between files to prevent overwhelming the server
        );
        uploadedUrls.push(fileName);
        console.log(`✓ ${i + 1}/${files.length} uploaded`);
      } catch (error) {
        console.error(
          `✗ Failed to upload ${file.originalname}:`,
          error.message,
        );
        throw error;
      }
    }

    return uploadedUrls;
  }

  async deleteFile(bucketName: string, fileName: string): Promise<void> {
    try {
      await this.minioClient.removeObject(bucketName, fileName);
      console.log('✓ File deleted:', fileName);
    } catch (error) {
      console.error('Delete error:', error.message);
      throw new Error(`Failed to delete: ${error.message}`);
    }
  }

  async createBucketIfNotExists(
    bucketName: string,
    isPublic: boolean = true,
  ): Promise<void> {
    try {
      // Check if bucket exists
      const bucketExists = await this.minioClient.bucketExists(bucketName);

      if (!bucketExists) {
        console.log(`Creating bucket: ${bucketName}`);
        await this.minioClient.makeBucket(bucketName, 'us-east-1');
        console.log(`✓ Bucket ${bucketName} created`);
      }

      // Make bucket public if needed
      if (isPublic) {
        await this.makeBucketPublic(bucketName);
      }
    } catch (error) {
      console.error(`Error managing bucket ${bucketName}:`, error.message);
      throw error;
    }
  }

  async makeBucketPublic(bucketName: string): Promise<void> {
    try {
      // Define a public read policy for the bucket
      const policy = {
        Version: '2012-10-17',
        Statement: [
          {
            Effect: 'Allow',
            Principal: { AWS: ['*'] },
            Action: ['s3:GetObject'],
            Resource: [`arn:aws:s3:::${bucketName}/*`],
          },
        ],
      };

      await this.minioClient.setBucketPolicy(
        bucketName,
        JSON.stringify(policy),
      );
      console.log(`✓ Bucket ${bucketName} is now public`);
    } catch (error) {
      console.error(
        `Error setting public policy for ${bucketName}:`,
        error.message,
      );
      throw error;
    }
  }
}
