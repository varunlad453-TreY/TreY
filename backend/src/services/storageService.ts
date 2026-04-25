import fs from 'fs';
import path from 'path';
import { randomUUID } from 'crypto';
import { S3Client, PutObjectCommand, GetObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';

type StorageProvider = 'local' | 's3';

interface UploadInput {
  file: Express.Multer.File;
  organizationId: string;
  obligationId: string;
}

interface UploadResult {
  filePath: string;
  provider: StorageProvider;
}

interface DownloadTarget {
  mode: 'local' | 'url';
  localPath?: string;
  url?: string;
}

export class StorageService {
  private provider: StorageProvider;
  private uploadDir: string;
  private s3Client: S3Client | null;
  private s3Bucket: string | null;

  constructor() {
    this.provider = (process.env.STORAGE_PROVIDER || 'local').toLowerCase() === 's3' ? 's3' : 'local';
    this.uploadDir = process.env.UPLOAD_DIR || path.join(__dirname, '../../uploads');
    this.s3Bucket = process.env.S3_BUCKET || null;

    if (this.provider === 's3') {
      if (!this.s3Bucket) {
        throw new Error('STORAGE_PROVIDER=s3 requires S3_BUCKET');
      }

      this.s3Client = new S3Client({
        region: process.env.S3_REGION || 'auto',
        endpoint: process.env.S3_ENDPOINT || undefined,
        forcePathStyle: String(process.env.S3_FORCE_PATH_STYLE || 'false').toLowerCase() === 'true',
        credentials: process.env.S3_ACCESS_KEY_ID && process.env.S3_SECRET_ACCESS_KEY
          ? {
              accessKeyId: process.env.S3_ACCESS_KEY_ID,
              secretAccessKey: process.env.S3_SECRET_ACCESS_KEY
            }
          : undefined
      });
      return;
    }

    this.s3Client = null;
    if (!fs.existsSync(this.uploadDir)) {
      fs.mkdirSync(this.uploadDir, { recursive: true });
    }
  }

  async uploadEvidence({ file, organizationId, obligationId }: UploadInput): Promise<UploadResult> {
    if (this.provider === 's3') {
      return this.uploadToS3({ file, organizationId, obligationId });
    }

    return this.uploadToLocal(file, organizationId);
  }

  async getDownloadTarget(filePath: string): Promise<DownloadTarget> {
    if (filePath.startsWith('s3://')) {
      if (!this.s3Client || !this.s3Bucket) {
        throw new Error('S3 download requested but S3 client is not configured');
      }

      const key = filePath.replace(`s3://${this.s3Bucket}/`, '');
      const command = new GetObjectCommand({ Bucket: this.s3Bucket, Key: key });
      const url = await getSignedUrl(this.s3Client, command, { expiresIn: 60 * 10 });
      return { mode: 'url', url };
    }

    return { mode: 'local', localPath: filePath };
  }

  private async uploadToS3({ file, organizationId, obligationId }: UploadInput): Promise<UploadResult> {
    if (!this.s3Client || !this.s3Bucket) {
      throw new Error('S3 upload requested but S3 client is not configured');
    }

    const buffer = this.getFileBuffer(file);
    const safeName = this.safeFileName(file.originalname || 'evidence.bin');
    const key = `evidence/${organizationId}/${obligationId}/${Date.now()}-${randomUUID()}-${safeName}`;

    await this.s3Client.send(
      new PutObjectCommand({
        Bucket: this.s3Bucket,
        Key: key,
        Body: buffer,
        ContentType: file.mimetype || 'application/octet-stream'
      })
    );

    this.cleanupTempFile(file);

    return {
      filePath: `s3://${this.s3Bucket}/${key}`,
      provider: 's3'
    };
  }

  private async uploadToLocal(file: Express.Multer.File, organizationId: string): Promise<UploadResult> {
    // If route/service already provided a durable local path, keep it.
    if (file.path && !file.buffer) {
      return {
        filePath: file.path,
        provider: 'local'
      };
    }

    const orgDir = path.join(this.uploadDir, organizationId);
    if (!fs.existsSync(orgDir)) {
      fs.mkdirSync(orgDir, { recursive: true });
    }

    const safeName = this.safeFileName(file.originalname || 'evidence.bin');
    const targetPath = path.join(orgDir, `${Date.now()}-${safeName}`);
    fs.writeFileSync(targetPath, this.getFileBuffer(file));
    this.cleanupTempFile(file);

    return {
      filePath: targetPath,
      provider: 'local'
    };
  }

  private getFileBuffer(file: Express.Multer.File): Buffer {
    if (file.buffer && file.buffer.length > 0) {
      return file.buffer;
    }

    if (file.path && fs.existsSync(file.path)) {
      return fs.readFileSync(file.path);
    }

    throw new Error('Uploaded file has no readable content');
  }

  private cleanupTempFile(file: Express.Multer.File): void {
    if (!file.path) {
      return;
    }

    if (!fs.existsSync(file.path)) {
      return;
    }

    try {
      fs.unlinkSync(file.path);
    } catch {
      // no-op: temp cleanup failure should not break request
    }
  }

  private safeFileName(original: string): string {
    return original.replace(/[^a-zA-Z0-9._-]/g, '_');
  }
}

export const storageService = new StorageService();