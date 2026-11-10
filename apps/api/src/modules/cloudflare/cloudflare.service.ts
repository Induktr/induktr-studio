import { PrismaService } from "../prisma/prisma.service";
import { S3Client } from "bun";

export class CloudFlareService {
  constructor(
    private readonly prisma: PrismaService = new PrismaService(),
    private readonly r2Service?: S3Client
  ) {
    void this.prisma;
    this.fetchR2Buckets().catch(() => {});
  }

  async fetchR2Buckets() {
    const accountId = process.env.CLOUDFLARE_ACCOUNT_ID || "your-account-id";
    const apiKey = process.env.CLOUDFLARE_API_KEY || "your-api-key";

    if (!accountId || !apiKey) {
      throw new Error("CLOUDFLARE_ACCOUNT_ID or CLOUDFLARE_API_KEY is not defined");
    }

    const controller = new AbortController();

    const response = await fetch(`https://api.cloudflare.com/client/v4/accounts/${accountId}/r2/buckets`, {
      headers: {
        "Authorization": `Bearer ${apiKey}`,
      },
      signal: controller.signal
    });

    const data = await response.json();
    console.log(data);
  }

  async sendFileBucket(bucketName: string = "induktr_studio") {    
    if (!this.r2Service) return;
    this.r2Service.file(bucketName, { retry: 3 });
  }
}
