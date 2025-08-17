'use client';

import { useState } from 'react';
import { useWallet } from '../contexts/WalletContext';
import { WalletConnect } from '../components/WalletConnect';
import { FileUploadRequest } from '@/types/file';

export default function Dashboard() {
  const { address } = useWallet();
  const [uploading, setUploading] = useState(false);
  const [files, setFiles] = useState([]);

  const handleUpload = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setUploading(true);

    try {
      const formData = new FormData(e.currentTarget);
      const metadata: FileUploadRequest = {
        name: formData.get('name') as string,
        price: formData.get('price') as string,
        description: formData.get('description') as string,
        expiryDate: formData.get('expiryDate') as string || undefined,
        maxDownloads: Number(formData.get('maxDownloads')) || undefined,
        tags: (formData.get('tags') as string).split(',').map(t => t.trim())
      };

      formData.append('metadata', JSON.stringify(metadata));

      const response = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
        headers: {
          'x-owner-address': address!
        }
      });

      if (!response.ok) {
        throw new Error('Upload failed');
      }

      const data = await response.json();
      // Update UI with new file
    } catch (error) {
      console.error('Upload error:', error);
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="min-h-screen bg-white">
      <div className="container mx-auto p-8">
        <h1 className="text-3xl font-bold mb-8 text-gray-900">File Gateway Dashboard</h1>
        
        {!address ? (
          <div className="text-center">
            <p className="mb-4 text-gray-600">Connect your wallet to manage files</p>
            <WalletConnect />
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="bg-white p-6 rounded-lg shadow-lg border border-gray-100">
              <h2 className="text-xl font-semibold mb-4 text-gray-900">Upload New File</h2>
              <form onSubmit={handleUpload}>
                <div className="space-y-4">
                  <input 
                    type="file" 
                    name="file" 
                    required 
                    className="w-full text-gray-900" 
                  />
                  <input
                    type="text"
                    name="name"
                    placeholder="File name"
                    required
                    className="w-full p-2 border border-gray-300 rounded-lg text-gray-900 placeholder-gray-500"
                  />
                  <input
                    type="text"
                    name="price"
                    placeholder="Price in USD (e.g., 1.00)"
                    required
                    className="w-full p-2 border border-gray-300 rounded-lg text-gray-900 placeholder-gray-500"
                  />
                  <textarea
                    name="description"
                    placeholder="Description"
                    className="w-full p-2 border border-gray-300 rounded-lg text-gray-900 placeholder-gray-500"
                  />
                  <input
                    type="datetime-local"
                    name="expiryDate"
                    className="w-full p-2 border border-gray-300 rounded-lg text-gray-900"
                  />
                  <input
                    type="number"
                    name="maxDownloads"
                    placeholder="Max downloads (optional)"
                    className="w-full p-2 border border-gray-300 rounded-lg text-gray-900 placeholder-gray-500"
                  />
                  <input
                    type="text"
                    name="tags"
                    placeholder="Tags (comma-separated)"
                    className="w-full p-2 border border-gray-300 rounded-lg text-gray-900 placeholder-gray-500"
                  />
                  <button
                    type="submit"
                    disabled={uploading}
                    className="w-full bg-blue-500 text-white py-3 px-4 rounded-lg font-medium hover:bg-blue-600 transition-colors disabled:opacity-50"
                  >
                    {uploading ? 'Uploading...' : 'Upload File'}
                  </button>
                </div>
              </form>
            </div>

            <div className="bg-white p-6 rounded-lg shadow-lg border border-gray-100">
              <h2 className="text-xl font-semibold mb-4 text-gray-900">Your Files</h2>
              {/* Add file listing component here */}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
