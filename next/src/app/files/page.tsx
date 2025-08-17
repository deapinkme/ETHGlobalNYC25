'use client';

import { useState, useEffect } from 'react';
import { useWallet } from '../contexts/WalletContext';
import { WalletConnect } from '../components/WalletConnect';
import { ethers } from 'ethers';
import { x402 } from 'x402-client';

interface File {
  id: string;
  name: string;
  mimeType: string;
  size: number;
  price: string;
  description?: string;
  expiryDate?: string;
  maxDownloads?: number;
  currentDownloads: number;
  tags?: string;
  createdAt: string;
  ownerAddress: string;
}

export default function Files() {
  const { address } = useWallet();
  const [files, setFiles] = useState<File[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchFiles();
  }, []);

  const fetchFiles = async () => {
    try {
      const response = await fetch('/api/files');
      if (!response.ok) throw new Error('Failed to fetch files');
      const data = await response.json();
      setFiles(data);
    } catch (error) {
      console.error('Error fetching files:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDownload = async (file: File) => {
    if (!address) {
      alert('Please connect your wallet first');
      return;
    }

    try {
      // Get payment receipt from x402
      const receipt = await x402.pay({
        path: `/api/file?id=${file.id}`,
        method: 'GET'
      });

      // Download file with receipt
      const response = await fetch(`/api/file?id=${file.id}`, {
        headers: {
          'x402-receipt': receipt
        }
      });

      if (!response.ok) {
        throw new Error(`Download failed: ${await response.text()}`);
      }

      // Handle file download
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = file.name;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (error) {
      console.error('Download error:', error);
      alert('Failed to download file');
    }
  };

  const formatDate = (date: string) => {
    return new Date(date).toLocaleString();
  };

  const formatSize = (bytes: number) => {
    const units = ['B', 'KB', 'MB', 'GB'];
    let size = bytes;
    let unitIndex = 0;
    while (size >= 1024 && unitIndex < units.length - 1) {
      size /= 1024;
      unitIndex++;
    }
    return `${size.toFixed(1)} ${units[unitIndex]}`;
  };

  return (
    <div className="min-h-screen bg-white">
      <div className="container mx-auto p-8">
        <h1 className="text-3xl font-bold mb-8 text-gray-900">Available Files</h1>

        {!address && (
          <div className="mb-8 p-4 bg-yellow-50 rounded-lg">
            <p className="text-yellow-700 mb-4">Connect your wallet to download files</p>
            <WalletConnect />
          </div>
        )}

        {loading ? (
          <div className="text-center">
            <p className="text-gray-600">Loading files...</p>
          </div>
        ) : files.length === 0 ? (
          <div className="text-center">
            <p className="text-gray-600">No files available</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {files.map(file => (
              <div key={file.id} className="bg-white rounded-lg shadow-lg border border-gray-200 p-6">
                <h3 className="font-semibold text-xl text-gray-900 mb-4">{file.name}</h3>
                <div className="space-y-2 text-sm text-gray-600 mb-4">
                  <p>Size: {formatSize(file.size)}</p>
                  <p className="text-lg font-semibold text-green-600">Price: ${file.price}</p>
                  {file.description && <p>Description: {file.description}</p>}
                  <p>Uploaded: {formatDate(file.createdAt)}</p>
                  {file.maxDownloads && (
                    <p>Downloads: {file.currentDownloads} / {file.maxDownloads}</p>
                  )}
                  {file.tags && (
                    <div className="flex flex-wrap gap-2 mt-2">
                      {JSON.parse(file.tags).map((tag: string) => (
                        <span key={tag} className="bg-gray-100 px-2 py-1 rounded-full text-xs">
                          {tag}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
                <button
                  onClick={() => handleDownload(file)}
                  disabled={!address}
                  className="w-full bg-blue-500 text-white py-3 px-4 rounded-lg font-medium hover:bg-blue-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Buy for ${file.price}
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
