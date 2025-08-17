import axios from "axios";
import type { AxiosInstance } from "axios";
import type { WalletClient } from "viem";
import { withPaymentInterceptor } from "x402-axios";

const baseApiClient = axios.create({
  headers: {
    "Content-Type": "application/json",
  },
});

let apiClient: AxiosInstance = baseApiClient;

export function updateApiClient(walletClient: WalletClient | null) {
  if (walletClient && walletClient.account) {
    console.log('Updating API client with wallet:', walletClient.account.address);
    apiClient = withPaymentInterceptor(baseApiClient, walletClient, {
      network: "base-sepolia",
      facilitatorUrl: "https://x402.org/facilitator"
    });
  } else {
    console.log('Resetting API client - no wallet');
    apiClient = baseApiClient;
  }
}

export const api = {
  getFiles: async () => {
    const response = await apiClient.get("/api/files");
    return response.data;
  },

  downloadFile: async (fileId: string) => {
    try {
      console.log('Attempting to download file:', fileId);
      const response = await apiClient.get(`/api/file?id=${fileId}`, {
        responseType: 'blob',
        headers: {
          'Accept': '*/*'
        }
      });
      console.log('Download response:', response);
      return response.data;
    } catch (error) {
      console.error('Download error:', error);
      throw error;
    }
  }
};
