import { Injectable, Logger } from '@nestjs/common';
import axios from 'axios';

const POST_API_BASE = 'https://service.post.ch/vsc/api/product/v1/products';

@Injectable()
export class PostService {
  private readonly logger = new Logger(PostService.name);

  /**
   * Determine the Swiss Post format code for given dimensions (in cm).
   *
   * MB – max L+B+H ≤ 90 cm, no single side > 60 cm
   * PK – max 100×60×60 cm
   *
   * Returns null when the package doesn't fit into either format.
   */
  private getFormat(
    lengthCm: number,
    widthCm: number,
    heightCm: number,
  ): 'MB' | 'PK' | null {
    const sorted = [lengthCm, widthCm, heightCm].sort((a, b) => b - a);
    const maxSide = sorted[0];
    const sum = sorted[0] + sorted[1] + sorted[2];

    // MB: no side > 60 cm, sum ≤ 90 cm
    if (maxSide <= 60 && sum <= 90) return 'MB';

    // PK: max 100×60×60 cm (longest side ≤ 100, others ≤ 60)
    if (sorted[0] <= 100 && sorted[1] <= 60 && sorted[2] <= 60) return 'PK';

    return null; // Too large – caller should handle accordingly
  }

  /**
   * Query the Swiss Post price API for a single parcel.
   *
   * @param countryCode  ISO 3166-1 alpha-2 destination country code (e.g. "DE")
   * @param lengthCm     Package length in cm
   * @param widthCm      Package width in cm
   * @param heightCm     Package height in cm
   * @param weightKg     Package weight in kg
   * @returns            Cheapest parcel price in CHF, or null if unavailable
   */
  async getShippingRate(params: {
    countryCode: string;
    lengthCm: number;
    widthCm: number;
    heightCm: number;
    weightKg: number;
  }): Promise<number | null> {
    const { countryCode, lengthCm, widthCm, heightCm, weightKg } = params;

    const format = this.getFormat(lengthCm, widthCm, heightCm);
    if (!format) {
      this.logger.warn(
        `Package dimensions ${lengthCm}x${widthCm}x${heightCm} cm exceed Swiss Post limits`,
      );
      return null;
    }

    // Swiss Post API expects weight in grams; use at least 50 g
    const weightGrams = Math.max(Math.round(weightKg * 1000), 50);

    const url = `${POST_API_BASE}?lang=de&isoCode=${countryCode.toUpperCase()}&format=${format}&weight=${weightGrams}&interface=KMU&goodsType=GOODS`;

    try {
      this.logger.log(`Querying Swiss Post API: ${url}`);

      const response = await axios.get<{
        products: Array<{
          price: number;
          isParcel: boolean;
          typeDescription: string;
        }>;
      }>(url, { timeout: 10_000 });

      const allProducts = response.data?.products ?? [];

      if (allProducts.length === 0) {
        this.logger.warn(
          `Swiss Post returned no products for ${countryCode}, format=${format}, weight=${weightGrams}g`,
        );
        return null;
      }

      const cheapest = Math.min(...allProducts.map((p) => p.price));
      this.logger.log(
        `Swiss Post cheapest parcel to ${countryCode}: ${cheapest} CHF (format=${format}, weight=${weightGrams}g)`,
      );
      return cheapest;
    } catch (error) {
      this.logger.error(
        `Swiss Post API error: ${error.message}`,
        error.response?.data,
      );
      return null; // Caller falls back to UPS alone
    }
  }

  /**
   * Round weight up to the nearest bucket accepted by the Swiss Post letter API.
   * Valid buckets: 100 g, 250 g, 500 g, 1000 g, 2000 g.
   * Returns null when the weight exceeds 2 kg (too heavy for a letter).
   */
  private getLetterWeightBucketGrams(weightKg: number): number | null {
    const weightGrams = weightKg * 1000;
    const buckets = [100, 250, 500, 1000, 2000];
    return buckets.find((b) => b >= weightGrams) ?? null;
  }

  /**
   * Query the Swiss Post price API for an international letter (B4 format).
   * B4 dimensions: max 35.3 × 25 × 2 cm, max weight 2 kg.
   *
   * @param countryCode  ISO 3166-1 alpha-2 destination country code (e.g. "DE")
   * @param weightKg     Package weight in kg (max 2 kg)
   * @returns            Cheapest letter price in CHF, or null if unavailable
   */
  async getLetterRate(params: {
    countryCode: string;
    weightKg: number;
  }): Promise<number | null> {
    const { countryCode, weightKg } = params;

    const weightGrams = this.getLetterWeightBucketGrams(weightKg);
    if (weightGrams === null) {
      this.logger.warn(
        `Letter weight ${weightKg} kg exceeds 2 kg limit for Swiss Post B4`,
      );
      return null;
    }

    const url = `${POST_API_BASE}?lang=de&isoCode=${countryCode.toUpperCase()}&format=B4&weight=${weightGrams}&interface=VSC&goodsType=DOCUMENTS`;

    try {
      this.logger.log(`Querying Swiss Post letter API: ${url}`);

      const response = await axios.get<{
        products: Array<{
          price: number;
          isParcel: boolean;
          typeDescription: string;
        }>;
      }>(url, { timeout: 10_000 });

      const allProducts = response.data?.products ?? [];

      if (allProducts.length === 0) {
        this.logger.warn(
          `Swiss Post returned no letter products for ${countryCode}, format=B4, weight=${weightGrams}g`,
        );
        return null;
      }

      const cheapest = Math.min(...allProducts.map((p) => p.price));
      this.logger.log(
        `Swiss Post cheapest B4 letter to ${countryCode}: ${cheapest} CHF (weight=${weightGrams}g)`,
      );
      return cheapest;
    } catch (error) {
      this.logger.error(
        `Swiss Post letter API error: ${error.message}`,
        error.response?.data,
      );
      return null;
    }
  }

  /**
   * Get the total Swiss Post shipping rate for multiple packages.
   * Returns null if any package query fails.
   */
  async getShippingRateForMultiplePackages(params: {
    countryCode: string;
    packages: Array<{
      length: number; // cm
      width: number; // cm
      height: number; // cm
      weight: number; // kg
    }>;
  }): Promise<number | null> {
    let total = 0;

    for (const pkg of params.packages) {
      const rate = await this.getShippingRate({
        countryCode: params.countryCode,
        lengthCm: pkg.length,
        widthCm: pkg.width,
        heightCm: pkg.height,
        weightKg: pkg.weight,
      });

      if (rate === null) return null;
      total += rate;
    }

    this.logger.log(
      `Swiss Post total for ${params.packages.length} package(s): ${total} CHF`,
    );
    return total;
  }
}
