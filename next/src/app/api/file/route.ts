// app/api/file/route.ts

import { NextRequest, NextResponse } from 'next/server';
import { fileStorage } from '../upload/route';

// Add a type for file content storage
const fileContents = new Map<string, Buffer>();

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const id = searchParams.get('id');

  if (!id) {
    return new NextResponse('File ID required', { status: 400 });
  }

  const file = fileStorage.get(id);
  if (!file) {
    return new NextResponse('File not found', { status: 404 });
  }

  // Check if file has expired
  if (file.metadata?.expiryDate && new Date(file.metadata.expiryDate) < new Date()) {
    return new NextResponse('File has expired', { status: 410 });
  }

  // Check max downloads
  if (file.metadata?.maxDownloads && 
      file.metadata.currentDownloads && 
      file.metadata.currentDownloads >= file.metadata.maxDownloads) {
    return new NextResponse('Download limit reached', { status: 410 });
  }

  // Update download count
  if (file.metadata) {
    file.metadata.currentDownloads = (file.metadata.currentDownloads || 0) + 1;
  }

  // Get the file content (in a real app, this would come from your storage)
  const content = fileContents.get(id) || Buffer.from('');

  // Return the file
  return new NextResponse(content, {
    status: 200,
    headers: {
      'Content-Type': file.mimeType,
      'Content-Disposition': `attachment; filename="${file.name}"`
    }
  });
}

export async function OPTIONS() {
  return new NextResponse(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, OPTIONS',
      'Access-Control-Allow-Headers': 'x402-receipt, x402-signature'
    }
  });
}
