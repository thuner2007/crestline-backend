import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import axios from 'axios';

interface UpsTokenResponse {
  access_token: string;
  token_type: string;
  expires_in: string;
  issued_at: string;
}

interface UpsRateRequest {
  RateRequest: {
    Request: {
      TransactionReference: {
        CustomerContext: string;
      };
    };
    Shipment: {
      Shipper: {
        Name: string;
        ShipperNumber: string;
        Address: {
          AddressLine: string[];
          City: string;
          PostalCode: string;
          CountryCode: string;
        };
      };
      ShipFrom: {
        Name: string;
        Address: {
          AddressLine: string[];
          City: string;
          PostalCode: string;
          CountryCode: string;
        };
      };
      ShipTo: {
        Name: string;
        Address: {
          AddressLine: string[];
          City: string;
          PostalCode: string;
          CountryCode: string;
        };
      };
      PaymentDetails: {
        ShipmentCharge: {
          Type: string;
          BillShipper: {
            AccountNumber: string;
          };
        };
      };
      Service: {
        Code: string;
      };
      ShipmentServiceOptions: {
        DeclaredValue: {
          CurrencyCode: string;
          MonetaryValue: string;
        };
      };
      Package: {
        PackagingType: {
          Code: string;
        };
        Dimensions: {
          UnitOfMeasurement: {
            Code: string;
          };
          Length: string;
          Width: string;
          Height: string;
        };
        PackageWeight: {
          UnitOfMeasurement: {
            Code: string;
          };
          Weight: string;
        };
      };
    };
  };
}

interface UpsRateResponse {
  RateResponse: {
    Response: {
      ResponseStatus: {
        Code: string;
        Description: string;
      };
    };
    RatedShipment: {
      TotalCharges: {
        CurrencyCode: string;
        MonetaryValue: string;
      };
    };
  };
}

@Injectable()
export class UpsService {
  private readonly logger = new Logger(UpsService.name);
  private accessToken: string | null = null;
  private tokenExpiresAt: number | null = null;

  constructor(private readonly configService: ConfigService) {}

  /**
   * Get UPS OAuth access token
   */
  private async getAccessToken(): Promise<string> {
    // Return cached token if still valid (with 5 minute buffer)
    if (
      this.accessToken &&
      this.tokenExpiresAt &&
      Date.now() < this.tokenExpiresAt - 300000
    ) {
      return this.accessToken;
    }

    const clientId = this.configService.get<string>('UPS_CLIENT_ID');
    const clientSecret = this.configService.get<string>('UPS_CLIENT_SECRET');
    const baseUrl = this.configService.get<string>('UPS_BASE_URL');

    try {
      const response = await axios.post<UpsTokenResponse>(
        `${baseUrl}/security/v1/oauth/token`,
        new URLSearchParams({
          grant_type: 'client_credentials',
        }),
        {
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
          },
          auth: {
            username: clientId,
            password: clientSecret,
          },
        },
      );

      this.accessToken = response.data.access_token;
      const expiresIn = parseInt(response.data.expires_in, 10);
      this.tokenExpiresAt = Date.now() + expiresIn * 1000;

      this.logger.log('UPS access token obtained successfully');
      return this.accessToken;
    } catch (error) {
      this.logger.error('Failed to get UPS access token', error);
      throw new Error('Failed to authenticate with UPS');
    }
  }

  /**
   * Get shipping rate from UPS
   */
  async getShippingRate(params: {
    destinationAddress: {
      street: string;
      city: string;
      zipCode: string;
      countryCode: string;
    };
    packageDimensions: {
      length: number; // in cm
      width: number; // in cm
      height: number; // in cm
    };
    weight: number; // in kg
    declaredValue: number; // in CHF
  }): Promise<number> {
    try {
      const token = await this.getAccessToken();
      const baseUrl = this.configService.get<string>('UPS_BASE_URL');
      const shipperNumber =
        this.configService.get<string>('UPS_SHIPPER_NUMBER');

      const rateRequest: UpsRateRequest = {
        RateRequest: {
          Request: {
            TransactionReference: {
              CustomerContext: 'Shipping cost estimate',
            },
          },
          Shipment: {
            Shipper: {
              Name: 'Revsticks',
              ShipperNumber: shipperNumber,
              Address: {
                AddressLine: ['Spitalackerstrasse 47'],
                City: 'Bern',
                PostalCode: '3013',
                CountryCode: 'CH',
              },
            },
            ShipFrom: {
              Name: 'Revsticks',
              Address: {
                AddressLine: ['Spitalackerstrasse 47'],
                City: 'Bern',
                PostalCode: '3013',
                CountryCode: 'CH',
              },
            },
            ShipTo: {
              Name: 'Customer',
              Address: {
                AddressLine: [params.destinationAddress.street],
                City: params.destinationAddress.city,
                PostalCode: params.destinationAddress.zipCode,
                CountryCode: params.destinationAddress.countryCode,
              },
            },
            PaymentDetails: {
              ShipmentCharge: {
                Type: '01',
                BillShipper: {
                  AccountNumber: shipperNumber,
                },
              },
            },
            Service: {
              Code: '11', // UPS Standard
            },
            ShipmentServiceOptions: {
              DeclaredValue: {
                CurrencyCode: 'CHF',
                MonetaryValue: params.declaredValue.toFixed(2),
              },
            },
            Package: {
              PackagingType: {
                Code: '02', // Customer Supplied Package
              },
              Dimensions: {
                UnitOfMeasurement: {
                  Code: 'CM',
                },
                Length: Math.ceil(params.packageDimensions.length).toString(),
                Width: Math.ceil(params.packageDimensions.width).toString(),
                Height: Math.ceil(params.packageDimensions.height).toString(),
              },
              PackageWeight: {
                UnitOfMeasurement: {
                  Code: 'KGS',
                },
                Weight: params.weight.toFixed(2),
              },
            },
          },
        },
      };

      this.logger.log(
        `Requesting UPS rate for ${params.destinationAddress.countryCode}`,
      );

      const response = await axios.post<UpsRateResponse>(
        `${baseUrl}/api/rating/v2403/rate?additionalinfo=`,
        rateRequest,
        {
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
        },
      );

      const totalCharges = parseFloat(
        response.data.RateResponse.RatedShipment.TotalCharges.MonetaryValue,
      );

      this.logger.log(`UPS shipping cost: ${totalCharges} CHF`);
      return totalCharges;
    } catch (error) {
      this.logger.error(
        'Failed to get UPS shipping rate',
        error.response?.data || error.message,
      );
      throw new Error('Failed to calculate shipping cost');
    }
  }

  /**
   * Get shipping rate for multiple packages from UPS
   */
  async getShippingRateForMultiplePackages(params: {
    destinationAddress: {
      street: string;
      city: string;
      zipCode: string;
      countryCode: string;
    };
    packages: Array<{
      length: number; // in cm
      width: number; // in cm
      height: number; // in cm
      weight: number; // in kg
    }>;
    declaredValue: number; // in CHF (total for all packages)
  }): Promise<number> {
    // Calculate total shipping cost for all packages
    let totalShippingCost = 0;

    // Divide declared value proportionally by weight
    const totalWeight = params.packages.reduce(
      (sum, pkg) => sum + pkg.weight,
      0,
    );

    for (let i = 0; i < params.packages.length; i++) {
      const pkg = params.packages[i];
      const packageDeclaredValue =
        (pkg.weight / totalWeight) * params.declaredValue;

      this.logger.log(
        `Getting rate for package ${i + 1} of ${params.packages.length}`,
      );

      const packageCost = await this.getShippingRate({
        destinationAddress: params.destinationAddress,
        packageDimensions: {
          length: pkg.length,
          width: pkg.width,
          height: pkg.height,
        },
        weight: pkg.weight,
        declaredValue: packageDeclaredValue,
      });

      totalShippingCost += packageCost;
    }

    this.logger.log(
      `Total UPS shipping cost for ${params.packages.length} packages: ${totalShippingCost} CHF`,
    );

    return totalShippingCost;
  }
}
