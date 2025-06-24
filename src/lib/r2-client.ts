import {
  S3Client,
  PutObjectCommand,
  DeleteObjectCommand,
  GetObjectCommand,
} from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";

const r2Client = new S3Client({
  region: process.env.R2_REGION || "auto",
  endpoint: process.env.R2_ENDPOINT,
  credentials: {
    accessKeyId: process.env.R2_ACCESS_KEY_ID!,
    secretAccessKey: process.env.R2_SECRET_ACCESS_KEY!,
  },
  forcePathStyle: true,
});

export { r2Client };

export async function uploadToR2(
  buffer: Buffer,
  key: string,
  contentType: string
): Promise<string> {
  console.log("Attempting to upload to R2:");
  console.log("Key:", key);
  console.log("ContentType:", contentType);
  console.log("Buffer size:", buffer.length);

  try {
    const command = new PutObjectCommand({
      Bucket: process.env.R2_BUCKET_NAME!,
      Key: key,
      Body: buffer,
      ContentType: contentType,
    });

    await r2Client.send(command);
    console.log("Upload successful!");

    // Return the key instead of public URL since bucket is now private
    return key;
  } catch (error) {
    console.error("R2 upload failed:", error);
    throw error;
  }
}

export async function deleteFromR2(key: string): Promise<void> {
  console.log("Attempting to delete from R2:", key);

  try {
    const command = new DeleteObjectCommand({
      Bucket: process.env.R2_BUCKET_NAME!,
      Key: key,
    });

    await r2Client.send(command);
    console.log("Delete successful!");
  } catch (error) {
    console.error("R2 delete failed:", error);
    throw error;
  }
}

export async function generatePresignedUrl(
  key: string,
  expiresIn: number = 3600
): Promise<string> {
  console.log("Generating presigned URL for:", key);

  try {
    const command = new GetObjectCommand({
      Bucket: process.env.R2_BUCKET_NAME!,
      Key: key,
    });

    const signedUrl = await getSignedUrl(r2Client, command, { expiresIn });
    console.log("Presigned URL generated successfully");
    return signedUrl;
  } catch (error) {
    console.error("Failed to generate presigned URL:", error);
    throw error;
  }
}
