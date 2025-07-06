import { S3Client } from "@aws-sdk/client-s3";

export const r2 = new S3Client({
  region: "auto",
  endpoint: process.env.IMAGE_BUCKET_URL!,
  credentials: {
    accessKeyId: process.env.IMAGE_BUCKET_ACCESS_KEY_ID!,
    secretAccessKey: process.env.IMAGE_BUCKET_ACCESS_KEY_SECRET!
  }
});
