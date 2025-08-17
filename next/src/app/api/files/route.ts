import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET() {
  try {
    const files = await prisma.file.findMany({
      select: {
        id: true,
        name: true,
        mimeType: true,
        size: true,
        price: true,
        description: true,
        expiryDate: true,
        maxDownloads: true,
        currentDownloads: true,
        tags: true,
        createdAt: true,
        ownerAddress: true,
        // Exclude content field as it's not needed for listing
      },
      orderBy: {
        createdAt: 'desc'
      }
    });

    return NextResponse.json(files);
  } catch (error) {
    console.error('Error fetching files:', error);
    return new NextResponse('Failed to fetch files', { status: 500 });
  }
}
