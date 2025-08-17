'use client';

import { useState } from 'react';
import { useWallet } from './contexts/WalletContext';
import { wrapFetchWithPayment } from 'x402-fetch';
import { WalletConnect } from './components/WalletConnect';
import Link from 'next/link';

export default function Home() {
  const { walletClient, address } = useWallet();
  const [fileId, setFileId] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const accessFile = async () => {
    if (!walletClient || !address) {
      setError('Please connect your wallet first');
      return;
    }

    setLoading(true);
    setError('');
    
    try {
      const fetchWithPayment = wrapFetchWithPayment(fetch, walletClient);

      const response = await fetchWithPayment(`/api/file?id=${fileId}`, {
        method: 'GET'
      });

      if (!response.ok) {
        throw new Error(await response.text());
      }

      // Handle file download
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      
      // Get filename from Content-Disposition header
      const contentDisposition = response.headers.get('Content-Disposition');
      const filenameMatch = contentDisposition?.match(/filename="(.+)"/);
      a.download = filenameMatch?.[1] || fileId;
      
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'An error occurred';
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="text-center">
          <h1 className="text-4xl font-bold text-black mb-4">
            Crypto-Powered File Gateway
          </h1>
          <p className="text-lg text-black mb-8">
            Access premium files with crypto payments
          </p>
          
          {address ? (
            <Link
              href="/dashboard"
              className="inline-block bg-blue-500 text-white px-6 py-3 rounded-lg font-medium hover:bg-blue-600 transition-colors"
            >
              Upload Your Files
            </Link>
          ) : (
            <WalletConnect />
          )}
        </div>

        <div className="mt-16 max-w-xl mx-auto">
          <div className="bg-white shadow sm:rounded-lg p-6">
            <h2 className="text-2xl font-semibold text-black mb-4">
              Access a File
            </h2>
            
            <div className="space-y-4">
              <input
                type="text"
                value={fileId}
                onChange={(e) => setFileId(e.target.value)}
                placeholder="Enter file ID"
                className="w-full p-3 border border-gray-400 rounded-lg text-black placeholder-gray-500"
              />
              
              <button
                onClick={accessFile}
                disabled={loading || !fileId || !address}
                className="w-full bg-indigo-600 text-white py-3 px-4 rounded-lg font-medium hover:bg-indigo-700 disabled:opacity-50"
              >
                {!address ? 'Connect Wallet to Access' : loading ? 'Processing...' : 'Access File'}
              </button>
              
              {error && (
                <div className="text-red-600 text-sm">{error}</div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
