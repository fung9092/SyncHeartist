import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';

const accountId = process.env.R2_ACCOUNT_ID || 'your-account-id';
const accessKeyId = process.env.R2_ACCESS_KEY_ID || 'your-access-key-id';
const secretAccessKey = process.env.R2_SECRET_ACCESS_KEY || 'your-secret-access-key';

export const r2Client = new S3Client({
  region: 'auto',
  endpoint: `https://${accountId}.r2.cloudflarestorage.com`,
  forcePathStyle: true,
  credentials: {
    accessKeyId,
    secretAccessKey,
  },
});

export async function uploadHtmlToR2(htmlContent: string, fileKey: string): Promise<string> {
  const bucketName = process.env.R2_BUCKET_NAME || 'syncheartist';
  const publicUrl = process.env.R2_PUBLIC_URL || 'https://pub-75e8fc0c6ad94111a9fd19f56a9eef10.r2.dev';

  if (!process.env.R2_ACCOUNT_ID) {
    console.warn("Missing R2_ACCOUNT_ID, skipping actual HTML upload. Returning mock URL.");
    return `${publicUrl}/${fileKey}`;
  }

  const command = new PutObjectCommand({
    Bucket: bucketName,
    Key: fileKey,
    Body: htmlContent,
    ContentType: 'text/html; charset=utf-8',
    CacheControl: 'public, max-age=31536000, immutable',
  });

  await r2Client.send(command);

  return `${publicUrl}/${fileKey}`;
}

export async function uploadImageToR2(imageBase64: string, fileKey: string): Promise<string> {
  const bucketName = process.env.R2_BUCKET_NAME || 'syncheartist';
  const publicUrl = process.env.R2_PUBLIC_URL || 'https://pub-75e8fc0c6ad94111a9fd19f56a9eef10.r2.dev';

  if (!process.env.R2_ACCOUNT_ID) {
    console.warn("Missing R2_ACCOUNT_ID, skipping actual Image upload. Returning mock URL.");
    return `${publicUrl}/${fileKey}`;
  }

  const match = imageBase64.match(/^data:(image\/\w+);base64,/);
  const contentType = match ? match[1] : 'image/jpeg';
  const base64Data = imageBase64.replace(/^data:image\/\w+;base64,/, "");
  const buffer = Buffer.from(base64Data, 'base64');

  const command = new PutObjectCommand({
    Bucket: bucketName,
    Key: fileKey,
    Body: buffer,
    ContentType: contentType,
    CacheControl: 'public, max-age=31536000, immutable',
  });

  await r2Client.send(command);

  return `${publicUrl}/${fileKey}`;
}
