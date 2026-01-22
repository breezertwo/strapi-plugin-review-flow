import { PLUGIN_ID } from '../pluginId';

interface PendingRequest {
  documentId: string;
  model: string;
  locale: string;
  resolve: (status: string | null) => void;
  reject: (error: Error) => void;
}

type FetchClient = {
  post: (url: string, data: any) => Promise<{ data: { data: Record<string, string | null> } }>;
};

const BATCH_DELAY_MS = 50;

class BatchStatusManager {
  private pendingRequests: PendingRequest[] = [];
  private batchTimeout: ReturnType<typeof setTimeout> | null = null;
  private fetchClient: FetchClient | null = null;

  setFetchClient(client: FetchClient) {
    this.fetchClient = client;
  }

  requestStatus(documentId: string, model: string, locale: string): Promise<string | null> {
    return new Promise((resolve, reject) => {
      this.pendingRequests.push({
        documentId,
        model,
        locale,
        resolve,
        reject,
      });

      if (this.batchTimeout) {
        clearTimeout(this.batchTimeout);
      }

      this.batchTimeout = setTimeout(() => {
        this.processBatch();
      }, BATCH_DELAY_MS);
    });
  }

  private async processBatch() {
    const requests = [...this.pendingRequests];
    this.pendingRequests = [];
    this.batchTimeout = null;

    if (requests.length === 0 || !this.fetchClient) return;

    // Group requests by model and locale
    const groups = new Map<string, PendingRequest[]>();
    for (const request of requests) {
      const key = `${request.model}:${request.locale}`;
      if (!groups.has(key)) {
        groups.set(key, []);
      }
      groups.get(key)!.push(request);
    }

    // Process each group in parallel
    const groupPromises = Array.from(groups.entries()).map(async ([key, groupRequests]) => {
      const lastColonIndex = key.lastIndexOf(':');
      const model = key.substring(0, lastColonIndex);
      const locale = key.substring(lastColonIndex + 1);

      const documentIds = [...new Set(groupRequests.map((r) => r.documentId))]; // Dedupe

      try {
        const { data } = await this.fetchClient!.post(
          `/${PLUGIN_ID}/status/batch/${model}/${locale}`,
          { documentIds }
        );

        const statuses = data.data;

        // Resolve each request with its status
        for (const request of groupRequests) {
          request.resolve(statuses[request.documentId] ?? null);
        }
      } catch (error) {
        // If batch request fails, reject all requests in this group
        for (const request of groupRequests) {
          request.reject(error instanceof Error ? error : new Error('Failed to fetch status'));
        }
      }
    });

    await Promise.all(groupPromises);
  }
}

export const batchStatusManager = new BatchStatusManager();
