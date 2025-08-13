"use server";

import { DeleteObjectCommand, PutObjectCommand } from "@aws-sdk/client-s3";
import { ImageDataSchema } from "@/lib/zod";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { r2 } from "@/lib/r2";

export async function generatePresignedUrlForImageUpload(params: { name: string; type: string; size: number; }) {
  const parsedBody = ImageDataSchema.safeParse(params);

  if (!parsedBody.success) throw new Error(parsedBody.error.message);
  
  const { name, type, size } = parsedBody.data;
  const putCommand = new PutObjectCommand({
    Bucket: process.env.NEXT_PUBLIC_IMAGE_BUCKET_NAME!,
    Key: name,
    ContentType: type,
    ContentLength: size
  });

  const url = await getSignedUrl(r2, putCommand, { expiresIn: 60 });

  return {
    success: true as const,
    url
  };
}

export async function generatePresignedUrlForImageDelete(imageLink: string) {
  const putCommand = new DeleteObjectCommand({
    Bucket: process.env.NEXT_PUBLIC_IMAGE_BUCKET_NAME!,
    Key: imageLink.replace(`${process.env.NEXT_PUBLIC_IMAGE_BUCKET_URL!}/`, "")
  });

  const url = await getSignedUrl(r2, putCommand, { expiresIn: 60 });

  return {
    success: true as const,
    url
  };
}
