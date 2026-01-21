import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";
import fs from "node:fs/promises";  // Cambiado a promises

const s3 = new S3Client({
  region: process.env.AWS_REGION || "us-east-1",
});

const BUCKET = process.env.S3_BUCKET!;

export async function uploadToS3({
  filePath,
  key,
}: {
  filePath: string;
  key: string;
}) {
  console.log(`[S3] Uploading ${filePath} to ${BUCKET}/${key}`);

  // Leer el archivo como buffer en lugar de stream
  const fileBuffer = await fs.readFile(filePath);
  
  console.log(`[S3] File read. Size: ${fileBuffer.length} bytes`);

  await s3.send(
    new PutObjectCommand({
      Bucket: BUCKET,
      Key: key,
      Body: fileBuffer,  // Usar buffer en lugar de stream
      ContentType: "video/mp4",
    })
  );

  console.log(`[S3] Upload successful`);

  // Devolver URL pública HTTPS en lugar de s3://
  const publicUrl = `https://${BUCKET}.s3.${process.env.AWS_REGION || "us-east-1"}.amazonaws.com/${key}`;
  
  console.log(`[S3] Public URL: ${publicUrl}`);
  
  return publicUrl;
}