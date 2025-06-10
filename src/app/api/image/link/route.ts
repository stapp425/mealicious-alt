import { ImageDataSchema } from "@/lib/zod";
import { r2 } from "@/r2-client";
import { PutObjectCommand } from "@aws-sdk/client-s3";
import { NextRequest, NextResponse } from "next/server";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";

export async function POST(req: NextRequest) {
  try {
    const jsonBody = await req.json();
    
    const parsedBody = ImageDataSchema.safeParse(jsonBody);

    if (!parsedBody.success) {
      return NextResponse.json(
        { message: parsedBody.error.message },
        { status: 400 }
      );
    }

    const { name, type, size } = parsedBody.data;

    const putCommand = new PutObjectCommand({
      Bucket: process.env.NEXT_PUBLIC_IMAGE_BUCKET_NAME!,
      Key: name,
      ContentType: type,
      ContentLength: size
    });

    const url = await getSignedUrl(r2, putCommand, { expiresIn: 60 });

    return NextResponse.json({ url }, { status: 200 });
  } catch (err) {
    return NextResponse.json(
      { message: "There was an internal error while uploading the image." },
      { status: 500 }
    );
  }
}