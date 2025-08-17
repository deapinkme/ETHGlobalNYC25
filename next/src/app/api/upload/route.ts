import { NextRequest, NextResponse } from 'next/server';
import { FileUploadRequest } from '@/types/file';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const file = formData.get('file') as File;
    const metadata = JSON.parse(formData.get('metadata') as string) as FileUploadRequest;
    const ownerAddress = req.headers.get('x-owner-address');

    if (!file || !metadata || !ownerAddress) {
      return new NextResponse('Missing required fields', { status: 400 });
    }

    // Convert file to buffer
    const buffer = Buffer.from(await file.arrayBuffer());
    
    // Store in database
    const storedFile = await prisma.file.create({
      data: {
        name: file.name,
        mimeType: file.type || 'application/octet-stream',
        size: file.size,
        price: metadata.price,
        ownerAddress,
        description: metadata.description,
        expiryDate: metadata.expiryDate ? new Date(metadata.expiryDate) : null,
        maxDownloads: metadata.maxDownloads,
        tags: metadata.tags ? JSON.stringify(metadata.tags) : null,
        content: buffer,
      },
    });

    // Return response without the content field
    const { content, ...fileWithoutContent } = storedFile;
    
    return NextResponse.json({
      success: true,
      fileId: storedFile.id,
      file: fileWithoutContent
    });
  } catch (error) {
    console.error('Upload error:', error);
    return new NextResponse('Upload failed', { status: 500 });
  }
}
