import { Injectable } from '@nestjs/common';
import { MailerService } from '@nestjs-modules/mailer';

@Injectable()
export class MailService {
  constructor(private readonly mailerService: MailerService) {}

  private getImageHtml(
    images: string[],
    fallbackAlt: string,
    itemType: 'sticker' | 'part' = 'sticker',
  ): string {
    if (!images || images.length === 0) {
      return '';
    }

    // Use the first image as the main product image
    const mainImage = images[0];

    // Construct the full MinIO URL if the image is just a filename
    let imageUrl = mainImage;
    if (!mainImage.startsWith('http')) {
      // Use appropriate bucket based on item type
      const bucketName = itemType === 'sticker' ? 'stickers' : 'parts';
      imageUrl = `https://minio-api.cwx-dev.com/${bucketName}/${mainImage}`;
    }

    return `<img src="${imageUrl}" alt="${fallbackAlt}" style="width: 70px; height: 70px; object-fit: cover; border-radius: 0; display: block;" />`;
  }

  private formatCustomizationOptions(customizationOptions: any): string {
    if (!customizationOptions || typeof customizationOptions !== 'object') {
      return '';
    }

    let formattedOptions: string[] = [];

    try {
      // Handle the structured customization options format
      if (Array.isArray(customizationOptions)) {
        // Array of individual option selections
        formattedOptions = customizationOptions
          .map((option) => this.formatSingleOption(option))
          .filter(Boolean);
      } else if (
        customizationOptions.options &&
        Array.isArray(customizationOptions.options)
      ) {
        // Structured format with options array
        formattedOptions = customizationOptions.options
          .map((option: any) => this.formatSingleOption(option))
          .filter(Boolean);
      } else {
        // Fallback: treat as key-value pairs
        formattedOptions = Object.entries(customizationOptions)
          .map(([key, value]) => {
            if (value !== null && value !== undefined && value !== '') {
              return `${this.formatCustomizationKey(key)}: ${value}`;
            }
            return null;
          })
          .filter(Boolean) as string[];
      }

      return formattedOptions.length > 0
        ? ` (${formattedOptions.join(', ')})`
        : '';
    } catch (error) {
      // If there's any error parsing, just return empty string
      console.error('Error formatting customization options:', error);
      return '';
    }
  }

  private formatSingleOption(option: any): string | null {
    if (!option || typeof option !== 'object') {
      return null;
    }

    // Handle different option structures
    let optionName = '';
    let optionValue = '';

    // Extract option name and value based on the structure from your example
    // Format: {type: 'inputfield', value: 'textool', optionId: 'text'}
    if (option.optionId) {
      optionName = this.formatCustomizationKey(option.optionId);
    } else if (option.id) {
      optionName = this.formatCustomizationKey(option.id);
    } else if (option.name) {
      optionName = this.formatCustomizationKey(option.name);
    } else if (option.type) {
      // Fallback to type if no specific name is available
      optionName = this.formatCustomizationKey(option.type);
    }

    // Extract the value
    if (
      option.value !== undefined &&
      option.value !== null &&
      option.value !== ''
    ) {
      optionValue = String(option.value);
    } else if (option.selectedValue) {
      optionValue = String(option.selectedValue);
    } else if (option.selection) {
      optionValue = String(option.selection);
    }

    // Skip options with empty values (like the color option with empty value)
    if (!optionValue || optionValue.trim() === '') {
      return null;
    }

    // For dropdown options, try to get the translated value
    if (option.type === 'dropdown') {
      // Try to find the translated value from the option structure
      optionValue = this.getDropdownTranslatedValue(option, optionValue);
    }

    // Format the final option string
    if (optionName && optionValue) {
      return `${optionName}: ${optionValue}`;
    }

    return null;
  }

  private getDropdownTranslatedValue(
    option: any,
    fallbackValue: string,
  ): string {
    // If there's a selected item with translations, use that
    if (option.selectedItem && option.selectedItem.translations) {
      const deTranslation = option.selectedItem.translations.de;
      if (deTranslation && deTranslation.title) {
        return deTranslation.title;
      }
      // Fallback to first available translation
      const firstTranslation = Object.values(
        option.selectedItem.translations,
      )[0] as any;
      if (firstTranslation && firstTranslation.title) {
        return firstTranslation.title;
      }
    }

    // If there are items in the dropdown definition, try to find the matching one
    if (option.items && Array.isArray(option.items)) {
      const matchingItem = option.items.find(
        (item: any) =>
          item.id === fallbackValue ||
          item.value === fallbackValue ||
          item.key === fallbackValue,
      );

      if (matchingItem && matchingItem.translations) {
        const deTranslation = matchingItem.translations.de;
        if (deTranslation && deTranslation.title) {
          return deTranslation.title;
        }
        // Fallback to first available translation
        const firstTranslation = Object.values(
          matchingItem.translations,
        )[0] as any;
        if (firstTranslation && firstTranslation.title) {
          return firstTranslation.title;
        }
      }
    }

    // If the option has a definition with items (from the sticker's customization options)
    if (
      option.definition &&
      option.definition.items &&
      Array.isArray(option.definition.items)
    ) {
      const matchingItem = option.definition.items.find(
        (item: any) =>
          item.id === fallbackValue ||
          item.value === fallbackValue ||
          item.key === fallbackValue,
      );

      if (matchingItem && matchingItem.translations) {
        const deTranslation = matchingItem.translations.de;
        if (deTranslation && deTranslation.title) {
          return deTranslation.title;
        }
        // Fallback to first available translation
        const firstTranslation = Object.values(
          matchingItem.translations,
        )[0] as any;
        if (firstTranslation && firstTranslation.title) {
          return firstTranslation.title;
        }
      }
    }

    // Try to clean up common option patterns
    if (fallbackValue.startsWith('option-')) {
      // Convert "option-2" to something more readable
      const optionNumber = fallbackValue.replace('option-', '');
      return `Option ${optionNumber}`;
    }

    // Return the fallback value if no translation is found
    return fallbackValue;
  }

  private formatCustomizationKey(key: string): string {
    // German translations for common customization keys
    const translations: { [key: string]: string } = {
      // Basic properties
      color: 'Farbe',
      size: 'Größe',
      material: 'Material',
      finish: 'Oberflächenbehandlung',
      quantity: 'Anzahl',
      width: 'Breite',
      height: 'Höhe',
      thickness: 'Dicke',

      // Text and fonts
      text: 'Text',
      font: 'Schriftart',
      fontSize: 'Schriftgröße',
      fontColor: 'Schriftfarbe',
      backgroundColor: 'Hintergrundfarbe',

      // Style and variants
      style: 'Stil',
      variant: 'Variante',
      option: 'Option',

      // Specific customization options
      customText: 'Benutzerdefinierter Text',
      specialInstructions: 'Besondere Anweisungen',
      'choose a color': 'Farbe wählen',
      'choosea color': 'Farbe wählen',
      chooseacolor: 'Farbe wählen',
      'size options': 'Größenoptionen',
      sizeoptions: 'Größenoptionen',
      'special instructions': 'Besondere Anweisungen',
      specialinstructions: 'Besondere Anweisungen',

      // Option types
      inputfield: 'Texteingabe',
      dropdown: 'Auswahl',
      vinylColors: 'Vinyl-Farben',
      vinylcolors: 'Vinyl-Farben',

      // Common option IDs
      optionid: 'Option',
      'option-id': 'Option',
      option_id: 'Option',
    };

    // Clean and normalize the key
    const cleanKey = key
      .toLowerCase()
      .replace(/[_-]/g, '')
      .replace(/\s+/g, '')
      .trim();

    // Check if we have a direct translation
    if (translations[cleanKey]) {
      return translations[cleanKey];
    }

    // Check original key with spaces
    const keyWithSpaces = key.toLowerCase().trim();
    if (translations[keyWithSpaces]) {
      return translations[keyWithSpaces];
    }

    // Convert camelCase or snake_case to readable format
    return key
      .replace(/([A-Z])/g, ' $1')
      .replace(/[_-]/g, ' ')
      .replace(/^\w/, (c) => c.toUpperCase())
      .trim();
  }

  async sendWelcomeEmail(to: string) {
    await this.mailerService.sendMail({
      to,
      subject: 'Willkommen bei unserem Service!',
      text: 'Vielen Dank für deine Registrierung!',
      html: '<b>Vielen Dank für deine Registrierung!</b>',
    });
  }

  async sendOrderConfirmationEmail(orderData: {
    email: string;
    firstName?: string;
    lastName?: string;
    orderId: string;
    totalPrice: number;
    orderItems: Array<{
      quantity: number;
      width?: number;
      height?: number;
      vinyl?: boolean;
      printed?: boolean;
      stickerId?: string;
      stickerName?: string;
      stickerImages?: string[];
      customizationOptions?: any;
    }>;
    partOrderItems?: Array<{
      quantity: number;
      partId: string;
      partName?: string;
      partImages?: string[];
      customizationOptions?: any;
    }>;
    powdercoatServiceOrderItems?: Array<{
      quantity: number;
      powdercoatingServiceId: string;
      powdercoatingServiceName?: string;
      customizationOptions?: any;
    }>;
  }) {
    const customerName =
      orderData.firstName && orderData.lastName
        ? `${orderData.firstName} ${orderData.lastName}`
        : 'Kunde';

    const itemsHtml = orderData.orderItems
      .map((item) => {
        const dimensions =
          item.width && item.height ? `(${item.width}x${item.height}cm)` : '';
        const type = item.vinyl ? '— Vinyl' : item.printed ? '— Bedruckt' : '';
        const name =
          item.stickerName || (item.stickerId ? 'Sticker' : 'Custom Sticker');
        const customizations = this.formatCustomizationOptions(
          item.customizationOptions,
        );
        const imageHtml = this.getImageHtml(
          item.stickerImages || [],
          name,
          'sticker',
        );

        return `
          <tr>
            <td style="padding: 14px 0; border-bottom: 1px solid #27272a; vertical-align: middle;">
              <table cellpadding="0" cellspacing="0" border="0" style="width: 100%;">
                <tr>
                  <td style="width: 70px; vertical-align: middle; padding-right: 14px;">${imageHtml}</td>
                  <td style="vertical-align: middle;">
                    <span style="font-family: 'DM Sans', Arial, sans-serif; font-size: 15px; font-weight: 600; color: #ffffff;">${item.quantity}x ${name}</span>
                    ${dimensions || type ? `<br><span style="font-family: 'DM Sans', Arial, sans-serif; font-size: 13px; color: #71717a;">${dimensions} ${type}</span>` : ''}
                    ${customizations ? `<br><span style="font-family: 'DM Sans', Arial, sans-serif; font-size: 13px; color: #a1a1aa;">${customizations}</span>` : ''}
                  </td>
                </tr>
              </table>
            </td>
          </tr>`;
      })
      .join('');

    const partsHtml =
      orderData.partOrderItems
        ?.map((item) => {
          const customizations = this.formatCustomizationOptions(
            item.customizationOptions,
          );
          const partName = item.partName || `Teil (ID: ${item.partId})`;
          const imageHtml = this.getImageHtml(
            item.partImages || [],
            partName,
            'part',
          );

          return `
          <tr>
            <td style="padding: 14px 0; border-bottom: 1px solid #27272a; vertical-align: middle;">
              <table cellpadding="0" cellspacing="0" border="0" style="width: 100%;">
                <tr>
                  <td style="width: 70px; vertical-align: middle; padding-right: 14px;">${imageHtml}</td>
                  <td style="vertical-align: middle;">
                    <span style="font-family: 'DM Sans', Arial, sans-serif; font-size: 15px; font-weight: 600; color: #ffffff;">${item.quantity}x ${partName}</span>
                    ${customizations ? `<br><span style="font-family: 'DM Sans', Arial, sans-serif; font-size: 13px; color: #a1a1aa;">${customizations}</span>` : ''}
                  </td>
                </tr>
              </table>
            </td>
          </tr>`;
        })
        .join('') || '';

    const powdercoatServicesHtml =
      orderData.powdercoatServiceOrderItems
        ?.map((item) => {
          const customizations = this.formatCustomizationOptions(
            item.customizationOptions,
          );
          const serviceName =
            item.powdercoatingServiceName ||
            `Pulverbeschichtung (ID: ${item.powdercoatingServiceId})`;

          return `
          <tr>
            <td style="padding: 14px 0; border-bottom: 1px solid #27272a; vertical-align: middle;">
              <span style="font-family: 'DM Sans', Arial, sans-serif; font-size: 15px; font-weight: 600; color: #ffffff;">${item.quantity}x ${serviceName}</span>
              ${customizations ? `<br><span style="font-family: 'DM Sans', Arial, sans-serif; font-size: 13px; color: #a1a1aa;">${customizations}</span>` : ''}
            </td>
          </tr>`;
        })
        .join('') || '';

    // Check if there are any powdercoat services in the order
    const hasPowdercoatServices =
      orderData.powdercoatServiceOrderItems &&
      orderData.powdercoatServiceOrderItems.length > 0;

    const subject = `Bestellbestätigung — Bestellung #${orderData.orderId}`;

    const html = `<!DOCTYPE html>
<html lang="de">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<link href="https://fonts.googleapis.com/css2?family=Oswald:wght@700&family=DM+Sans:wght@400;500;600&display=swap" rel="stylesheet">
</head>
<body style="margin: 0; padding: 0; background-color: #09090b;">

<table cellpadding="0" cellspacing="0" border="0" width="100%" style="background-color: #09090b; min-height: 100%;">
  <tr>
    <td align="center" style="padding: 40px 16px;">
      <table cellpadding="0" cellspacing="0" border="0" width="600" style="max-width: 600px; width: 100%;">

        <!-- HEADER / LOGO -->
        <tr>
          <td style="padding-bottom: 40px;">
            <table cellpadding="0" cellspacing="0" border="0">
              <tr>
                <td style="width: 4px; background-color: #f59e0b; padding: 0;">&nbsp;</td>
                <td style="padding-left: 14px;">
                  <span style="font-family: 'Oswald', Impact, sans-serif; font-size: 22px; font-weight: 700; letter-spacing: 0.18em; text-transform: uppercase; color: #ffffff;">CRESTLINE <span style="color: #f59e0b;">CUSTOMS</span></span>
                </td>
              </tr>
            </table>
          </td>
        </tr>

        <!-- EYEBROW + HEADLINE -->
        <tr>
          <td style="padding-bottom: 32px;">
            <p style="margin: 0 0 10px 0; font-family: 'Oswald', Impact, sans-serif; font-size: 11px; font-weight: 700; letter-spacing: 0.3em; text-transform: uppercase; color: #fbbf24;">— BESTELLBESTÄTIGUNG</p>
            <h1 style="margin: 0; font-family: 'Oswald', Impact, sans-serif; font-size: 32px; font-weight: 700; letter-spacing: 0.18em; text-transform: uppercase; color: #ffffff; line-height: 1.15;">VIELEN DANK FÜR<br><span style="color: #f59e0b;">DEINE BESTELLUNG</span></h1>
          </td>
        </tr>

        <!-- INTRO TEXT -->
        <tr>
          <td style="padding-bottom: 32px;">
            <p style="margin: 0; font-family: 'DM Sans', Arial, sans-serif; font-size: 15px; color: #a1a1aa; line-height: 1.6;">Hallo ${customerName},<br><br>wir haben deine Bestellung erhalten und bearbeiten sie bereits.</p>
          </td>
        </tr>

        <!-- ORDER DETAILS CARD -->
        <tr>
          <td style="padding-bottom: 32px;">
            <table cellpadding="0" cellspacing="0" border="0" width="100%">
              <tr>
                <td style="width: 4px; background-color: #f59e0b;">&nbsp;</td>
                <td style="background-color: #18181b; padding: 24px 24px 24px 20px;">
                  <p style="margin: 0 0 6px 0; font-family: 'Oswald', Impact, sans-serif; font-size: 11px; font-weight: 700; letter-spacing: 0.3em; text-transform: uppercase; color: #fbbf24;">BESTELLDETAILS</p>
                  <table cellpadding="0" cellspacing="0" border="0" width="100%" style="margin-top: 14px;">
                    <tr>
                      <td style="font-family: 'DM Sans', Arial, sans-serif; font-size: 13px; color: #71717a; padding-bottom: 8px;">BESTELLNUMMER</td>
                      <td align="right" style="font-family: 'DM Sans', Arial, sans-serif; font-size: 14px; font-weight: 600; color: #ffffff; padding-bottom: 8px;">#${orderData.orderId}</td>
                    </tr>
                    <tr>
                      <td style="font-family: 'DM Sans', Arial, sans-serif; font-size: 13px; color: #71717a;">GESAMTBETRAG</td>
                      <td align="right" style="font-family: 'Oswald', Impact, sans-serif; font-size: 18px; font-weight: 700; color: #f59e0b;">CHF ${orderData.totalPrice.toFixed(2)}</td>
                    </tr>
                  </table>
                </td>
              </tr>
            </table>
          </td>
        </tr>

        <!-- ITEMS -->
        ${
          itemsHtml
            ? `
        <tr>
          <td style="padding-bottom: 8px;">
            <p style="margin: 0 0 12px 0; font-family: 'Oswald', Impact, sans-serif; font-size: 11px; font-weight: 700; letter-spacing: 0.3em; text-transform: uppercase; color: #fbbf24;">STICKER</p>
            <table cellpadding="0" cellspacing="0" border="0" width="100%">${itemsHtml}</table>
          </td>
        </tr>`
            : ''
        }

        ${
          partsHtml
            ? `
        <tr>
          <td style="padding-bottom: 8px; padding-top: 16px;">
            <p style="margin: 0 0 12px 0; font-family: 'Oswald', Impact, sans-serif; font-size: 11px; font-weight: 700; letter-spacing: 0.3em; text-transform: uppercase; color: #fbbf24;">TEILE</p>
            <table cellpadding="0" cellspacing="0" border="0" width="100%">${partsHtml}</table>
          </td>
        </tr>`
            : ''
        }

        ${
          powdercoatServicesHtml
            ? `
        <tr>
          <td style="padding-bottom: 8px; padding-top: 16px;">
            <p style="margin: 0 0 12px 0; font-family: 'Oswald', Impact, sans-serif; font-size: 11px; font-weight: 700; letter-spacing: 0.3em; text-transform: uppercase; color: #fbbf24;">PULVERBESCHICHTUNG</p>
            <table cellpadding="0" cellspacing="0" border="0" width="100%">${powdercoatServicesHtml}</table>
          </td>
        </tr>`
            : ''
        }

        ${
          hasPowdercoatServices
            ? `
        <!-- POWDERCOAT WARNING CARD -->
        <tr>
          <td style="padding-top: 32px; padding-bottom: 8px;">
            <table cellpadding="0" cellspacing="0" border="0" width="100%">
              <tr>
                <td style="width: 4px; background-color: #f59e0b;">&nbsp;</td>
                <td style="background-color: #18181b; padding: 24px 24px 24px 20px;">
                  <p style="margin: 0 0 6px 0; font-family: 'Oswald', Impact, sans-serif; font-size: 11px; font-weight: 700; letter-spacing: 0.3em; text-transform: uppercase; color: #fbbf24;">WICHTIGE INFORMATION ZUR PULVERBESCHICHTUNG</p>
                  <p style="margin: 14px 0 6px 0; font-family: 'DM Sans', Arial, sans-serif; font-size: 14px; font-weight: 600; color: #ffffff;">Bitte sende die zu beschichtenden Teile an folgende Adresse:</p>
                  <table cellpadding="0" cellspacing="0" border="0" width="100%" style="margin: 10px 0 18px 0;">
                    <tr>
                      <td style="background-color: #27272a; padding: 14px 16px; font-family: 'DM Sans', monospace, Arial, sans-serif; font-size: 13px; color: #e4e4e7; line-height: 1.8;">
                        Crestline Customs<br>
                        MyPost24 PK619666<br>
                        MP Strättligen Markt<br>
                        3604 Thun
                      </td>
                    </tr>
                  </table>
                  <p style="margin: 0 0 18px 0; font-family: 'DM Sans', Arial, sans-serif; font-size: 14px; color: #a1a1aa; line-height: 1.6;">Wir können mit der Pulverbeschichtung erst beginnen, nachdem wir deine Teile erhalten haben. Bitte füge deine Bestellnummer <span style="color: #f59e0b; font-weight: 600;">#${orderData.orderId}</span> dem Paket bei.</p>
                  <p style="margin: 0 0 10px 0; font-family: 'Oswald', Impact, sans-serif; font-size: 11px; font-weight: 700; letter-spacing: 0.25em; text-transform: uppercase; color: #fbbf24;">ZUSÄTZLICHE HINWEISE</p>
                  <table cellpadding="0" cellspacing="0" border="0" width="100%">
                    <tr><td style="padding: 6px 0; font-family: 'DM Sans', Arial, sans-serif; font-size: 14px; color: #a1a1aa; line-height: 1.6;"><span style="color: #f59e0b; font-weight: 700;">&#9679;</span>&nbsp; <strong style="color: #ffffff;">Zettel beilegen</strong> mit Name, Adresse, E-Mail, Telefonnummer & Bestellnummer</td></tr>
                    <tr><td style="padding: 6px 0; font-family: 'DM Sans', Arial, sans-serif; font-size: 14px; color: #a1a1aa; line-height: 1.6;"><span style="color: #f59e0b; font-weight: 700;">&#9679;</span>&nbsp; <strong style="color: #ffffff;">Vorbereitung:</strong> Alle Kunststoffteile müssen entfernt, Teile bereits demontiert werden</td></tr>
                    <tr><td style="padding: 6px 0; font-family: 'DM Sans', Arial, sans-serif; font-size: 14px; color: #a1a1aa; line-height: 1.6;"><span style="color: #f59e0b; font-weight: 700;">&#9679;</span>&nbsp; <strong style="color: #ffffff;">Sauberkeit:</strong> Teile müssen sauber sein (sonst Reinigungskosten)</td></tr>
                    <tr><td style="padding: 6px 0; font-family: 'DM Sans', Arial, sans-serif; font-size: 14px; color: #a1a1aa; line-height: 1.6;"><span style="color: #f59e0b; font-weight: 700;">&#9679;</span>&nbsp; <strong style="color: #ffffff;">Farbkennzeichnung:</strong> Gewünschte Farbe mit Malerband beschriften (muss mit Bestellung übereinstimmen)</td></tr>
                  </table>
                </td>
              </tr>
            </table>
          </td>
        </tr>`
            : ''
        }

        <!-- DIVIDER -->
        <tr><td style="height: 1px; background-color: #27272a; padding: 0; margin: 32px 0;">&nbsp;</td></tr>

        <!-- FOOTER -->
        <tr>
          <td style="padding-top: 32px;">
            <p style="margin: 0 0 8px 0; font-family: 'DM Sans', Arial, sans-serif; font-size: 14px; color: #a1a1aa; line-height: 1.6;">Du erhältst eine weitere E-Mail, sobald deine Bestellung versendet wurde.</p>
            <p style="margin: 0 0 24px 0; font-family: 'DM Sans', Arial, sans-serif; font-size: 14px; color: #a1a1aa; line-height: 1.6;">Bei Fragen stehen wir dir gerne zur Verfügung.</p>
            <p style="margin: 0; font-family: 'DM Sans', Arial, sans-serif; font-size: 14px; color: #52525b;">Vielen Dank,<br><span style="font-family: 'Oswald', Impact, sans-serif; font-size: 13px; font-weight: 700; letter-spacing: 0.2em; text-transform: uppercase; color: #71717a;">DEIN CRESTLINE CUSTOMS TEAM</span></p>
          </td>
        </tr>

      </table>
    </td>
  </tr>
</table>

</body>
</html>`;

    const stickerItemsText =
      orderData.orderItems.length > 0
        ? `Sticker:\n${orderData.orderItems
            .map((item) => {
              const dimensions =
                item.width && item.height
                  ? `(${item.width}x${item.height}cm)`
                  : '';
              const type = item.vinyl
                ? '- Vinyl'
                : item.printed
                  ? '- Bedruckt'
                  : '';
              const name =
                item.stickerName ||
                (item.stickerId ? 'Sticker' : 'Custom Sticker');
              const customizations = this.formatCustomizationOptions(
                item.customizationOptions,
              );
              return `- ${item.quantity}x ${name} ${dimensions} ${type}${customizations}`;
            })
            .join('\n')}`
        : '';

    const partItemsText =
      orderData.partOrderItems?.length > 0
        ? `Teile:\n${orderData.partOrderItems
            .map((item) => {
              const customizations = this.formatCustomizationOptions(
                item.customizationOptions,
              );
              return `- ${item.quantity}x ${item.partName || `Teil (ID: ${item.partId})`}${customizations}`;
            })
            .join('\n')}`
        : '';

    const powdercoatServiceItemsText =
      orderData.powdercoatServiceOrderItems?.length > 0
        ? `Pulverbeschichtung:\n${orderData.powdercoatServiceOrderItems
            .map((item) => {
              const customizations = this.formatCustomizationOptions(
                item.customizationOptions,
              );
              return `- ${item.quantity}x ${item.powdercoatingServiceName || `Pulverbeschichtung (ID: ${item.powdercoatingServiceId})`}${customizations}`;
            })
            .join('\n')}`
        : '';

    const powdercoatInstructions = hasPowdercoatServices
      ? `

WICHTIGE INFORMATION ZUR PULVERBESCHICHTUNG:
Bitte sende die zu beschichtenden Teile an folgende Adresse:

RevSticks
MyPost24 PK619666
MP Strättligen Markt
3604 Thun

WICHTIG: Wir können mit der Pulverbeschichtung erst beginnen, nachdem wir deine Teile erhalten haben. 
Bitte füge deine Bestellnummer ${orderData.orderId} dem Paket bei.

ZUSÄTZLICHE WICHTIGE HINWEISE:
- WICHTIG: Bitte einen Zettel beilegen, auf dem folgende Informationen stehen:
  1. Name und Adresse
  2. E-Mail Adresse
  3. Telefonnummer
  4. Bestellnummer
- Vorbereitung der Teile: Alle Kunststoffteile müssen vor dem Versand entfernt werden. Die Teile müssen bereits getrennt/demontiert gesendet werden, da wir keine Demontage durchführen.
- Die Teile müssen sauber sein (Ansonsten können Kosten für das Putzen anfallen)
- Teile mit Malerband oder ähnlichem anschreiben, welche Farbe sie bekommen sollen (Muss mit Bestellung übereinstimmen)

`
      : '';

    const text = `
Vielen Dank für deine Bestellung bei Revsticks!

Hallo ${customerName},

wir haben deine Bestellung erhalten und bearbeiten sie bereits.

Bestelldetails:
Bestellnummer: ${orderData.orderId}
Gesamtbetrag: CHF ${orderData.totalPrice.toFixed(2)}

Bestellte Artikel:
${stickerItemsText}
${partItemsText}
${powdercoatServiceItemsText}${powdercoatInstructions}
Du erhältst eine weitere E-Mail, sobald deine Bestellung versendet wurde.

Bei Fragen stehen wir dir gerne zur Verfügung.

Vielen Dank,
Dein Revsticks Team
    `;

    await this.mailerService.sendMail({
      to: orderData.email,
      subject,
      text,
      html,
    });
  }

  async sendShippingNotificationEmail(orderData: {
    email: string;
    firstName?: string;
    lastName?: string;
    orderId: string;
    totalPrice: number;
    orderItems: Array<{
      quantity: number;
      width?: number;
      height?: number;
      vinyl?: boolean;
      printed?: boolean;
      stickerId?: string;
      stickerName?: string;
      stickerImages?: string[];
      customizationOptions?: any;
    }>;
    partOrderItems?: Array<{
      quantity: number;
      partId: string;
      partName?: string;
      partImages?: string[];
      customizationOptions?: any;
    }>;
  }) {
    const customerName =
      orderData.firstName && orderData.lastName
        ? `${orderData.firstName} ${orderData.lastName}`
        : 'Kunde';

    const itemsHtml = orderData.orderItems
      .map((item) => {
        const dimensions =
          item.width && item.height ? `(${item.width}x${item.height}cm)` : '';
        const type = item.vinyl ? '— Vinyl' : item.printed ? '— Bedruckt' : '';
        const name =
          item.stickerName || (item.stickerId ? 'Sticker' : 'Custom Sticker');
        const customizations = this.formatCustomizationOptions(
          item.customizationOptions,
        );
        const imageHtml = this.getImageHtml(
          item.stickerImages || [],
          name,
          'sticker',
        );

        return `
          <tr>
            <td style="padding: 14px 0; border-bottom: 1px solid #27272a; vertical-align: middle;">
              <table cellpadding="0" cellspacing="0" border="0" style="width: 100%;">
                <tr>
                  <td style="width: 70px; vertical-align: middle; padding-right: 14px;">${imageHtml}</td>
                  <td style="vertical-align: middle;">
                    <span style="font-family: 'DM Sans', Arial, sans-serif; font-size: 15px; font-weight: 600; color: #ffffff;">${item.quantity}x ${name}</span>
                    ${dimensions || type ? `<br><span style="font-family: 'DM Sans', Arial, sans-serif; font-size: 13px; color: #71717a;">${dimensions} ${type}</span>` : ''}
                    ${customizations ? `<br><span style="font-family: 'DM Sans', Arial, sans-serif; font-size: 13px; color: #a1a1aa;">${customizations}</span>` : ''}
                  </td>
                </tr>
              </table>
            </td>
          </tr>`;
      })
      .join('');

    const partsHtml =
      orderData.partOrderItems
        ?.map((item) => {
          const customizations = this.formatCustomizationOptions(
            item.customizationOptions,
          );
          const partName = item.partName || `Teil (ID: ${item.partId})`;
          const imageHtml = this.getImageHtml(
            item.partImages || [],
            partName,
            'part',
          );

          return `
          <tr>
            <td style="padding: 14px 0; border-bottom: 1px solid #27272a; vertical-align: middle;">
              <table cellpadding="0" cellspacing="0" border="0" style="width: 100%;">
                <tr>
                  <td style="width: 70px; vertical-align: middle; padding-right: 14px;">${imageHtml}</td>
                  <td style="vertical-align: middle;">
                    <span style="font-family: 'DM Sans', Arial, sans-serif; font-size: 15px; font-weight: 600; color: #ffffff;">${item.quantity}x ${partName}</span>
                    ${customizations ? `<br><span style="font-family: 'DM Sans', Arial, sans-serif; font-size: 13px; color: #a1a1aa;">${customizations}</span>` : ''}
                  </td>
                </tr>
              </table>
            </td>
          </tr>`;
        })
        .join('') || '';

    const subject = `Deine Bestellung ist unterwegs — #${orderData.orderId}`;

    const html = `<!DOCTYPE html>
<html lang="de">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<link href="https://fonts.googleapis.com/css2?family=Oswald:wght@700&family=DM+Sans:wght@400;500;600&display=swap" rel="stylesheet">
</head>
<body style="margin: 0; padding: 0; background-color: #09090b;">

<table cellpadding="0" cellspacing="0" border="0" width="100%" style="background-color: #09090b; min-height: 100%;">
  <tr>
    <td align="center" style="padding: 40px 16px;">
      <table cellpadding="0" cellspacing="0" border="0" width="600" style="max-width: 600px; width: 100%;">

        <!-- HEADER / LOGO -->
        <tr>
          <td style="padding-bottom: 40px;">
            <table cellpadding="0" cellspacing="0" border="0">
              <tr>
                <td style="width: 4px; background-color: #f59e0b; padding: 0;">&nbsp;</td>
                <td style="padding-left: 14px;">
                  <span style="font-family: 'Oswald', Impact, sans-serif; font-size: 22px; font-weight: 700; letter-spacing: 0.18em; text-transform: uppercase; color: #ffffff;">CRESTLINE <span style="color: #f59e0b;">CUSTOMS</span></span>
                </td>
              </tr>
            </table>
          </td>
        </tr>

        <!-- EYEBROW + HEADLINE -->
        <tr>
          <td style="padding-bottom: 32px;">
            <p style="margin: 0 0 10px 0; font-family: 'Oswald', Impact, sans-serif; font-size: 11px; font-weight: 700; letter-spacing: 0.3em; text-transform: uppercase; color: #fbbf24;">— BESTELLUNG VERSENDET</p>
            <h1 style="margin: 0; font-family: 'Oswald', Impact, sans-serif; font-size: 32px; font-weight: 700; letter-spacing: 0.18em; text-transform: uppercase; color: #ffffff; line-height: 1.15;">DEINE BESTELLUNG<br><span style="color: #f59e0b;">IST UNTERWEGS</span></h1>
          </td>
        </tr>

        <!-- INTRO TEXT -->
        <tr>
          <td style="padding-bottom: 32px;">
            <p style="margin: 0; font-family: 'DM Sans', Arial, sans-serif; font-size: 15px; color: #a1a1aa; line-height: 1.6;">Hallo ${customerName},<br><br>gute Neuigkeiten! Deine Bestellung wurde soeben versendet und ist auf dem Weg zu dir.</p>
          </td>
        </tr>

        <!-- SHIPPING DETAILS CARD -->
        <tr>
          <td style="padding-bottom: 32px;">
            <table cellpadding="0" cellspacing="0" border="0" width="100%">
              <tr>
                <td style="width: 4px; background-color: #f59e0b;">&nbsp;</td>
                <td style="background-color: #18181b; padding: 24px 24px 24px 20px;">
                  <p style="margin: 0 0 6px 0; font-family: 'Oswald', Impact, sans-serif; font-size: 11px; font-weight: 700; letter-spacing: 0.3em; text-transform: uppercase; color: #fbbf24;">VERSANDDETAILS</p>
                  <table cellpadding="0" cellspacing="0" border="0" width="100%" style="margin-top: 14px;">
                    <tr>
                      <td style="font-family: 'DM Sans', Arial, sans-serif; font-size: 13px; color: #71717a; padding-bottom: 8px;">BESTELLNUMMER</td>
                      <td align="right" style="font-family: 'DM Sans', Arial, sans-serif; font-size: 14px; font-weight: 600; color: #ffffff; padding-bottom: 8px;">#${orderData.orderId}</td>
                    </tr>
                    <tr>
                      <td style="font-family: 'DM Sans', Arial, sans-serif; font-size: 13px; color: #71717a; padding-bottom: 8px;">STATUS</td>
                      <td align="right" style="font-family: 'Oswald', Impact, sans-serif; font-size: 14px; font-weight: 700; letter-spacing: 0.1em; color: #f59e0b; padding-bottom: 8px;">VERSENDET</td>
                    </tr>
                    <tr>
                      <td style="font-family: 'DM Sans', Arial, sans-serif; font-size: 13px; color: #71717a;">GESAMTBETRAG</td>
                      <td align="right" style="font-family: 'Oswald', Impact, sans-serif; font-size: 18px; font-weight: 700; color: #f59e0b;">CHF ${orderData.totalPrice.toFixed(2)}</td>
                    </tr>
                  </table>
                </td>
              </tr>
            </table>
          </td>
        </tr>

        <!-- ITEMS -->
        ${
          itemsHtml
            ? `
        <tr>
          <td style="padding-bottom: 8px;">
            <p style="margin: 0 0 12px 0; font-family: 'Oswald', Impact, sans-serif; font-size: 11px; font-weight: 700; letter-spacing: 0.3em; text-transform: uppercase; color: #fbbf24;">STICKER</p>
            <table cellpadding="0" cellspacing="0" border="0" width="100%">${itemsHtml}</table>
          </td>
        </tr>`
            : ''
        }

        ${
          partsHtml
            ? `
        <tr>
          <td style="padding-bottom: 8px; padding-top: 16px;">
            <p style="margin: 0 0 12px 0; font-family: 'Oswald', Impact, sans-serif; font-size: 11px; font-weight: 700; letter-spacing: 0.3em; text-transform: uppercase; color: #fbbf24;">TEILE</p>
            <table cellpadding="0" cellspacing="0" border="0" width="100%">${partsHtml}</table>
          </td>
        </tr>`
            : ''
        }

        <!-- NEXT STEPS CARD -->
        <tr>
          <td style="padding-top: 32px; padding-bottom: 8px;">
            <table cellpadding="0" cellspacing="0" border="0" width="100%">
              <tr>
                <td style="width: 4px; background-color: #f59e0b;">&nbsp;</td>
                <td style="background-color: #18181b; padding: 24px 24px 24px 20px;">
                  <p style="margin: 0 0 14px 0; font-family: 'Oswald', Impact, sans-serif; font-size: 11px; font-weight: 700; letter-spacing: 0.3em; text-transform: uppercase; color: #fbbf24;">WAS PASSIERT ALS NÄCHSTES?</p>
                  <table cellpadding="0" cellspacing="0" border="0" width="100%">
                    <tr><td style="padding: 6px 0; font-family: 'DM Sans', Arial, sans-serif; font-size: 14px; color: #a1a1aa; line-height: 1.6;"><span style="color: #f59e0b; font-weight: 700;">&#9679;</span>&nbsp; Dein Paket ist auf dem Weg zu deiner angegebenen Lieferadresse</td></tr>
                    <tr><td style="padding: 6px 0; font-family: 'DM Sans', Arial, sans-serif; font-size: 14px; color: #a1a1aa; line-height: 1.6;"><span style="color: #f59e0b; font-weight: 700;">&#9679;</span>&nbsp; Du solltest deine Bestellung in den nächsten <strong style="color: #ffffff;">1–5 Werktagen</strong> erhalten</td></tr>
                    <tr><td style="padding: 6px 0; font-family: 'DM Sans', Arial, sans-serif; font-size: 14px; color: #a1a1aa; line-height: 1.6;"><span style="color: #f59e0b; font-weight: 700;">&#9679;</span>&nbsp; Falls du Fragen zum Versand hast, kontaktiere uns gerne</td></tr>
                  </table>
                </td>
              </tr>
            </table>
          </td>
        </tr>

        <!-- DIVIDER -->
        <tr><td style="height: 1px; background-color: #27272a; padding: 0; margin: 32px 0;">&nbsp;</td></tr>

        <!-- FOOTER -->
        <tr>
          <td style="padding-top: 32px;">
            <p style="margin: 0 0 8px 0; font-family: 'DM Sans', Arial, sans-serif; font-size: 14px; color: #a1a1aa; line-height: 1.6;">Vielen Dank für dein Vertrauen in Crestline Customs!</p>
            <p style="margin: 0 0 24px 0; font-family: 'DM Sans', Arial, sans-serif; font-size: 14px; color: #a1a1aa; line-height: 1.6;">Bei Fragen zum Versand oder deiner Bestellung stehen wir dir gerne zur Verfügung.</p>
            <p style="margin: 0; font-family: 'DM Sans', Arial, sans-serif; font-size: 14px; color: #52525b;">Viele Grüße,<br><span style="font-family: 'Oswald', Impact, sans-serif; font-size: 13px; font-weight: 700; letter-spacing: 0.2em; text-transform: uppercase; color: #71717a;">DEIN CRESTLINE CUSTOMS TEAM</span></p>
          </td>
        </tr>

      </table>
    </td>
  </tr>
</table>

</body>
</html>`;

    const stickerItemsText =
      orderData.orderItems.length > 0
        ? `Sticker:\n${orderData.orderItems
            .map((item) => {
              const dimensions =
                item.width && item.height
                  ? `(${item.width}x${item.height}cm)`
                  : '';
              const type = item.vinyl
                ? '- Vinyl'
                : item.printed
                  ? '- Bedruckt'
                  : '';
              const name =
                item.stickerName ||
                (item.stickerId ? 'Sticker' : 'Custom Sticker');
              const customizations = this.formatCustomizationOptions(
                item.customizationOptions,
              );
              return `- ${item.quantity}x ${name} ${dimensions} ${type}${customizations}`;
            })
            .join('\n')}`
        : '';

    const partItemsText =
      orderData.partOrderItems?.length > 0
        ? `Teile:\n${orderData.partOrderItems
            .map((item) => {
              const customizations = this.formatCustomizationOptions(
                item.customizationOptions,
              );
              return `- ${item.quantity}x ${item.partName || `Teil (ID: ${item.partId})`}${customizations}`;
            })
            .join('\n')}`
        : '';

    const text = `
Deine Bestellung ist unterwegs!

Hallo ${customerName},

gute Neuigkeiten! Deine Bestellung wurde soeben versendet und ist auf dem Weg zu dir.

Versanddetails:
Bestellnummer: ${orderData.orderId}
Status: Versendet
Gesamtbetrag: CHF ${orderData.totalPrice.toFixed(2)}

Versendete Artikel:
${stickerItemsText}
${partItemsText}

Was passiert als nächstes?
• Dein Paket ist auf dem Weg zu deiner angegebenen Lieferadresse
• Du solltest deine Bestellung in den nächsten 2-5 Werktagen erhalten
• Falls du Fragen zum Versand hast, kontaktiere uns gerne

Vielen Dank für dein Vertrauen in Revsticks!

Bei Fragen zum Versand oder deiner Bestellung stehen wir dir gerne zur Verfügung.

Viele Grüße,
Dein Revsticks Team
    `;

    await this.mailerService.sendMail({
      to: orderData.email,
      subject,
      text,
      html,
    });
  }
}
