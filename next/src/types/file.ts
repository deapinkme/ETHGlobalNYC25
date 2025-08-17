export interface StoredFile {
  id: string;
  name: string;
  mimeType: string;
  size: number;
  price: string;
  ownerAddress: string;
  metadata?: {
    description?: string;
    expiryDate?: string;
    maxDownloads?: number;
    currentDownloads?: number;
    tags?: string[];
  };
  createdAt: string;
}

export interface FileUploadRequest {
  name: string;
  price: string;
  description?: string;
  expiryDate?: string;
  maxDownloads?: number;
  tags?: string[];
}
