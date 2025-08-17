// app/api/file/route.ts

import { NextRequest, NextResponse } from 'next/server';
import { paymentMiddleware } from 'x402-express';
import { fileStorage } from '../upload/route';

// Create the middleware configuration
const middleware = paymentMiddleware(
  process.env.NEXT_PUBLIC_CREATOR_ADDRESS!, // Set this in .env
  {
    "GET /api/file": {
      price: "$1.00", // This will be overridden per file
      network: "base-sepolia",
      config: {
        description: "Access to paywalled file content",
        inputSchema: {
          type: "object",
          properties: {
            id: { 
              type: "string", 
              description: "File ID to access" 
            }
          },
          required: ["id"]
        },
        outputSchema: {
          type: "object",
          properties: {
            content: { 
              type: "string", 
              description: "The file content" 
            }
          }
        }
      }
    }
  },
  {
    url: "https://x402.org/facilitator"
  }
);

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

  // Override the price for this specific file
  const customMiddleware = paymentMiddleware(
    file.ownerAddress,
    {
      "GET /api/file": {
        price: file.price,
        network: "base-sepolia",
        config: {
          description: file.metadata?.description || "Access to paywalled file"
        }
      }
    },
    {
      url: "https://x402.org/facilitator"
    }
  );

  // Apply the x402 middleware
  const response = await customMiddleware(req);
  if (response.status === 402) {
    return response;
  }

  // Update download count
  if (file.metadata) {
    file.metadata.currentDownloads = (file.metadata.currentDownloads || 0) + 1;
  }

  // Return the file
  return new NextResponse(Buffer.from(/* get file content */), {
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
