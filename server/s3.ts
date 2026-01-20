import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";
import fs from "node:fs";

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
  const fileStream = fs.createReadStream(filePath);

  await s3.send(
    new PutObjectCommand({
      Bucket: BUCKET,
      Key: key,
      Body: fileStream,
      ContentType: "video/mp4",
      ACL: "public-read",
    })
  );

  return `https://${BUCKET}.s3.amazonaws.com/${key}`;
}
