import { NextRequest, NextResponse } from 'next/server';
import { StoredFile, FileUploadRequest } from '@/types/file';
import crypto from 'crypto';

// In-memory storage (replace with a database in production)
export const fileStorage = new Map<string, StoredFile>();
export const fileContents = new Map<string, Buffer>();

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const file = formData.get('file') as File;
    const metadata = JSON.parse(formData.get('metadata') as string) as FileUploadRequest;
    const ownerAddress = req.headers.get('x-owner-address');

    if (!file || !metadata || !ownerAddress) {
      return new NextResponse('Missing required fields', { status: 400 });
    }

    // Generate unique file ID
    const fileId = crypto.randomBytes(16).toString('hex');
    
    // Store file data
    const buffer = Buffer.from(await file.arrayBuffer());
    fileContents.set(fileId, buffer);
    
    // Store file metadata
    const storedFile: StoredFile = {
      id: fileId,
      name: file.name,
      mimeType: file.type || 'application/octet-stream',
      size: file.size,
      price: metadata.price,
      ownerAddress,
      metadata: {
        description: metadata.description,
        expiryDate: metadata.expiryDate,
        maxDownloads: metadata.maxDownloads,
        currentDownloads: 0,
        tags: metadata.tags || []
      },
      createdAt: new Date().toISOString()
    };

    fileStorage.set(fileId, storedFile);

    return NextResponse.json({
      success: true,
      fileId,
      file: storedFile
    });
  } catch (error) {
    console.error('Upload error:', error);
    return new NextResponse('Upload failed', { status: 500 });
  }
}
