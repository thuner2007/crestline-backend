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

    return `<img src="${imageUrl}" alt="${fallbackAlt}" style="width: 80px; height: 80px; object-fit: cover; border-radius: 4px; margin-right: 10px; vertical-align: middle;" />`;
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
        const type = item.vinyl ? '- Vinyl' : item.printed ? '- Bedruckt' : '';
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
          <li style="margin-bottom: 15px; display: flex; align-items: center;">
            ${imageHtml}
            <div>
              <strong>${item.quantity}x ${name}</strong> ${dimensions} ${type}${customizations}
            </div>
          </li>`;
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
            <li style="margin-bottom: 15px; display: flex; align-items: center;">
              ${imageHtml}
              <div>
                <strong>${item.quantity}x ${partName}</strong>${customizations}
              </div>
            </li>`;
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
            <li style="margin-bottom: 15px; display: flex; align-items: center;">
              <div>
                <strong>${item.quantity}x ${serviceName}</strong>${customizations}
              </div>
            </li>`;
        })
        .join('') || '';

    // Check if there are any powdercoat services in the order
    const hasPowdercoatServices =
      orderData.powdercoatServiceOrderItems &&
      orderData.powdercoatServiceOrderItems.length > 0;

    const subject = `Bestellbestätigung - Bestellung #${orderData.orderId}`;

    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
        <h2 style="color: #7e22ce; border-bottom: 2px solid #7e22ce; padding-bottom: 10px;">Vielen Dank für deine Bestellung bei Revsticks!</h2>
        <p>Hallo ${customerName},</p>
        <p>wir haben deine Bestellung erhalten und bearbeiten sie bereits.</p>

        <div style="background-color: #faf5ff; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #7e22ce;">
          <h3 style="color: #7e22ce; margin-top: 0;">Bestelldetails:</h3>
          <p><strong>Bestellnummer:</strong> ${orderData.orderId}</p>
          <p><strong>Gesamtbetrag:</strong> CHF ${orderData.totalPrice.toFixed(2)}</p>
        </div>
        
        <h3 style="color: #333;">Bestellte Artikel:</h3>
        ${itemsHtml ? `<h4 style="color: #555; margin-bottom: 10px;">Sticker:</h4><ul style="list-style: none; padding: 0;">${itemsHtml}</ul>` : ''}
        ${partsHtml ? `<h4 style="color: #555; margin-bottom: 10px;">Teile:</h4><ul style="list-style: none; padding: 0;">${partsHtml}</ul>` : ''}
        ${powdercoatServicesHtml ? `<h4 style="color: #555; margin-bottom: 10px;">Pulverbeschichtung:</h4><ul style="list-style: none; padding: 0;">${powdercoatServicesHtml}</ul>` : ''}
        
        ${
          hasPowdercoatServices
            ? `
        <div style="background-color: #fff3cd; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #ffc107;">
          <h3 style="color: #856404; margin-top: 0;">📦 Wichtige Information zur Pulverbeschichtung</h3>
          <p style="color: #856404; margin-bottom: 10px;"><strong>Bitte sende die zu beschichtenden Teile an folgende Adresse:</strong></p>
          <div style="background-color: #fff; padding: 15px; border-radius: 4px; font-family: monospace; font-size: 14px; color: #333;">
            RevSticks<br>
            MyPost24 PK619666<br>
            MP Strättligen Markt<br>
            3604 Thun
          </div>
          <p style="color: #856404; margin-top: 15px; margin-bottom: 15px;">
            <strong>Wichtig:</strong> Wir können mit der Pulverbeschichtung erst beginnen, nachdem wir deine Teile erhalten haben. 
            Bitte füge deine Bestellnummer <strong>${orderData.orderId}</strong> dem Paket bei.
          </p>
          <h4 style="color: #856404; margin-bottom: 10px;">📋 Zusätzliche wichtige Hinweise:</h4>
          <ul style="color: #856404; margin-left: 20px; margin-bottom: 0;">
            <li style="margin-bottom: 8px;">
              <strong>WICHTIG:</strong> Bitte einen Zettel beilegen, auf dem folgende Informationen stehen:
              <ol style="margin-left: 20px; margin-top: 5px;">
                <li>Name und Adresse</li>
                <li>E-Mail Adresse</li>
                <li>Telefonnummer</li>
                <li>Bestellnummer</li>
              </ol>
            </li>
            <li style="margin-bottom: 8px;">
              <strong>Vorbereitung der Teile:</strong> Alle Kunststoffteile müssen vor dem Versand entfernt werden. Die Teile müssen bereits getrennt/demontiert gesendet werden, da wir keine Demontage durchführen.
            </li>
            <li style="margin-bottom: 8px;">
              <strong>Sauberkeit:</strong> Die Teile müssen sauber sein (Ansonsten können Kosten für das Putzen anfallen)
            </li>
            <li style="margin-bottom: 0;">
              <strong>Farbkennzeichnung:</strong> Teile mit Malerband oder ähnlichem anschreiben, welche Farbe du bekommen sollst (Muss mit Bestellung übereinstimmen)
            </li>
          </ul>
        </div>
        `
            : ''
        }
        
        <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #dee2e6;">
          <p>Du erhältst eine weitere E-Mail, sobald deine Bestellung versendet wurde.</p>
          <p>Bei Fragen stehen wir dir gerne zur Verfügung.</p>

          <p>Vielen Dank,<br>
          <strong>Dein Revsticks Team</strong></p>
        </div>
      </div>
    `;

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
        const type = item.vinyl ? '- Vinyl' : item.printed ? '- Bedruckt' : '';
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
          <li style="margin-bottom: 15px; display: flex; align-items: center;">
            ${imageHtml}
            <div>
              <strong>${item.quantity}x ${name}</strong> ${dimensions} ${type}${customizations}
            </div>
          </li>`;
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
            <li style="margin-bottom: 15px; display: flex; align-items: center;">
              ${imageHtml}
              <div>
                <strong>${item.quantity}x ${partName}</strong>${customizations}
              </div>
            </li>`;
        })
        .join('') || '';

    const subject = `Deine Bestellung wurde versendet - Bestellung #${orderData.orderId}`;

    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
        <h2 style="color: #7e22ce; border-bottom: 2px solid #7e22ce; padding-bottom: 10px;">Deine Bestellung ist unterwegs!</h2>
        <p>Hallo ${customerName},</p>
        <p>gute Neuigkeiten! Deine Bestellung wurde soeben versendet und ist auf dem Weg zu dir.</p>

        <div style="background-color: #faf5ff; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #7e22ce;">
          <h3 style="color: #7e22ce; margin-top: 0;">📦 Versanddetails:</h3>
          <p><strong>Bestellnummer:</strong> ${orderData.orderId}</p>
          <p><strong>Status:</strong> <span style="color: #7e22ce; font-weight: bold;">Versendet</span></p>
          <p><strong>Gesamtbetrag:</strong> CHF ${orderData.totalPrice.toFixed(2)}</p>
        </div>
        
        <h3 style="color: #333;">Versendete Artikel:</h3>
        ${itemsHtml ? `<h4 style="color: #555; margin-bottom: 10px;">Sticker:</h4><ul style="list-style: none; padding: 0;">${itemsHtml}</ul>` : ''}
        ${partsHtml ? `<h4 style="color: #555; margin-bottom: 10px;">Teile:</h4><ul style="list-style: none; padding: 0;">${partsHtml}</ul>` : ''}
        
        <div style="margin-top: 30px; padding: 20px; background-color: #f8f9fa; border-radius: 8px;">
          <h4 style="color: #333; margin-top: 0;">📋 Was passiert als nächstes?</h4>
          <p>• Dein Paket ist auf dem Weg zu deiner angegebenen Lieferadresse</p>
          <p>• Du solltest deine Bestellung in den nächsten 1-5 Werktag(en) erhalten</p>
          <p>• Falls du Fragen zum Versand hast, kontaktiere uns gerne</p>
        </div>
        
        <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #dee2e6;">
          <p>Vielen Dank für dein Vertrauen in Revsticks!</p>
          <p>Bei Fragen zum Versand oder deiner Bestellung stehen wir dir gerne zur Verfügung.</p>
          
          <p>Viele Grüße,<br>
          <strong>Dein Revsticks Team</strong></p>
        </div>
      </div>
    `;

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
