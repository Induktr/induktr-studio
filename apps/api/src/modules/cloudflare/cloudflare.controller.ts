import { CloudFlareService } from "./cloudflare.service";

export class CloudeFlareController {
  constructor(
    public readonly r2Service: CloudFlareService = new CloudFlareService(),
  ) {}
}
