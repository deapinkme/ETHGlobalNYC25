import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { paymentMiddleware } from 'x402-next';
import { fileStorage } from './api/upload/route';

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
export const middleware: X402Middleware = paymentMiddleware(
  process.env.NEXT_PUBLIC_CREATOR_ADDRESS!, // Set this in .env
  {
    '/api/file': {
      price: '$1.00', // This will be dynamically set per file
      network: "base-sepolia",
      config: {
        description: 'Access to paywalled file content',
        mimeType: 'application/octet-stream', // Will be overridden per file
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
    url: "https://x402.org/facilitator" // for testnet
  }
) as X402Middleware;

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
    const file = fileStorage.get(id);
    if (file) {
      middleware.updateConfig('/api/file', {
        price: file.price,
        network: "base-sepolia",
        config: {
          description: file.metadata?.description || "Access to paywalled file",
          mimeType: file.mimeType
        }
      });
    }
  }
}
