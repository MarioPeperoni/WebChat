import { z } from 'zod';

import type { Logger } from '@/utils';

const GEO_ENDPOINT = 'http://ip-api.com/json';

const GeoResponse = z.discriminatedUnion('status', [
  z.object({ status: z.literal('success'), countryCode: z.string().length(2) }),
  z.object({ status: z.literal('fail'), message: z.string().optional() }),
]);

export class GeoService {
  constructor(private readonly logger: Logger) {}

  async lookupCountry(ip: string): Promise<string | null> {
    try {
      const response = await fetch(
        `${GEO_ENDPOINT}/${ip}?fields=status,countryCode,message`,
      );
      if (!response.ok) {
        this.logger.warn('geo lookup non-ok', { ip, status: response.status });
        return null;
      }
      const parsed = GeoResponse.safeParse(await response.json());
      if (!parsed.success) {
        this.logger.warn('geo lookup unexpected shape', { ip });
        return null;
      }
      if (parsed.data.status === 'fail') {
        this.logger.warn('geo lookup rejected', { ip, message: parsed.data.message });
        return null;
      }
      return parsed.data.countryCode;
    } catch (err) {
      this.logger.warn('geo lookup failed', { ip, err });
      return null;
    }
  }
}
