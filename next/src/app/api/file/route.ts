// app/api/file/route.ts

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id');

    if (!id) {
      return new NextResponse('File ID required', { status: 400 });
    }

    const file = await prisma.file.findUnique({
      where: { id }
    });

    if (!file) {
      return new NextResponse('File not found', { status: 404 });
    }

    console.log('File state:', {
      id: file.id,
      expiryDate: file.expiryDate,
      currentDownloads: file.currentDownloads,
      maxDownloads: file.maxDownloads
    });

    // Check if file has expired
    if (file.expiryDate && new Date(file.expiryDate) < new Date()) {
      console.log('File expired:', file.expiryDate);
      return new NextResponse('File has expired', { status: 410 });
    }

    // Check max downloads
    if (file.maxDownloads && file.currentDownloads >= file.maxDownloads) {
      console.log('Download limit reached:', {
        current: file.currentDownloads,
        max: file.maxDownloads
      });
      return new NextResponse('Download limit reached', { status: 410 });
    }

    // Update download count
    await prisma.file.update({
      where: { id },
      data: {
        currentDownloads: {
          increment: 1
        }
      }
    });

    return new NextResponse(file.content, {
      status: 200,
      headers: {
        'Content-Type': file.mimeType,
        'Content-Disposition': `attachment; filename="${file.name}"`
      }
    });
  } catch (error) {
    console.error('Download error:', error);
    return new NextResponse('Download failed', { status: 500 });
  }
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
