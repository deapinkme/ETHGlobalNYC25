import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { paymentMiddleware } from 'x402-next';
import { prisma } from '@/lib/prisma';

interface X402Config {
  price: string;
  network: string;
  config?: {
    description?: string;
    mimeType?: string;
    inputSchema?: Record<string, any>;
    outputSchema?: Record<string, any>;
  };
}

interface X402Middleware {
  (req: NextRequest): Promise<NextResponse>;
  updateConfig: (path: string, config: X402Config) => void;
}

// Configure the payment middleware
export async function middleware(req: NextRequest) {
  console.log('Middleware called for:', req.url);
  
  // Only handle file downloads
  if (!req.nextUrl.pathname.startsWith('/api/file')) {
    return NextResponse.next();
  }

  const fileId = req.nextUrl.searchParams.get('id');
  if (!fileId) {
    return NextResponse.next();
  }

  // Get file price from database
  const file = await prisma.file.findUnique({
    where: { id: fileId },
    select: { price: true }
  });

  if (!file) {
    return NextResponse.next();
  }

  console.log('Processing payment for file:', {
    id: fileId,
    price: file.price
  });

  // Create and execute middleware for this specific price
  const response = await paymentMiddleware(
    process.env.NEXT_PUBLIC_CREATOR_ADDRESS!,
    {
      '/api/file': {
        price: file.price,
        network: "base-sepolia",
        config: {
          description: 'Access to paywalled file content',
          mimeType: 'application/octet-stream'
        }
      }
    },
    {
      url: "https://x402.org/facilitator"
    }
  )(req);

  console.log('Middleware response:', {
    status: response.status,
    headers: Object.fromEntries(response.headers.entries())
  });

  return response;
}

// Configure which paths the middleware should run on
export const config = {
  matcher: [
    '/api/file/:path*'
  ]
};

// Middleware to dynamically set price and owner based on file ID
export async function updateMiddlewareConfig(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const id = searchParams.get('id');

  if (id) {
    const file = await prisma.file.findUnique({
      where: { id },
      select: {
        price: true,
        mimeType: true,
        description: true
      }
    });
    
    if (file) {
      middleware.updateConfig('/api/file', {
        price: file.price,
        network: "base-sepolia",
        config: {
          description: file.description || "Access to paywalled file",
          mimeType: file.mimeType
        }
      });
    }
  }
}
