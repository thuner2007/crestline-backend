import { Test, TestingModule } from '@nestjs/testing';
import { MailService } from './mail.service';
import { MailerService } from '@nestjs-modules/mailer';

/**
 * ColinWalkerUnittest2 - Unit Tests für MailService
 *
 * Diese Test-Suite testet die MailService Klasse mit Mocks für MailerService.
 * Es werden normale Testfälle, Grenzwerte und Fehlerbehandlung getestet.
 *
 * Getestete Methoden:
 * 1. sendWelcomeEmail() - Einfache Email ohne komplexe Daten
 * 2. sendOrderConfirmationEmail() - Komplexe Email mit verschiedenen Produkttypen
 * 3. sendShippingNotificationEmail() - Email mit optionalen Feldern
 *
 * Mock Framework: Jest (analog zu Moq/Mockito)
 */
describe('ColinWalkerUnittest2 - MailService', () => {
  let service: MailService;
  let mailerService: jest.Mocked<MailerService>;

  beforeEach(async () => {
    // Mock MailerService erstellen
    const mockMailerService = {
      sendMail: jest.fn().mockResolvedValue(undefined),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        MailService,
        {
          provide: MailerService,
          useValue: mockMailerService,
        },
      ],
    }).compile();

    service = module.get<MailService>(MailService);
    mailerService = module.get(MailerService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('sendWelcomeEmail', () => {
    it('sollte eine Welcome-Email mit gültiger Email-Adresse senden', async () => {
      // Arrange
      const email = 'test@example.com';

      // Act
      await service.sendWelcomeEmail(email);

      // Assert
      expect(mailerService.sendMail).toHaveBeenCalledTimes(1);
      expect(mailerService.sendMail).toHaveBeenCalledWith({
        to: email,
        subject: 'Willkommen bei unserem Service!',
        text: 'Vielen Dank für deine Registrierung!',
        html: '<b>Vielen Dank für deine Registrierung!</b>',
      });
    });

    it('sollte einen Fehler werfen wenn MailerService fehlschlägt', async () => {
      // Arrange
      const email = 'test@example.com';
      const error = new Error('SMTP connection failed');
      mailerService.sendMail.mockRejectedValueOnce(error);

      // Act & Assert
      await expect(service.sendWelcomeEmail(email)).rejects.toThrow(
        'SMTP connection failed',
      );
    });
  });

  describe('sendOrderConfirmationEmail', () => {
    it('sollte Bestellbestätigung mit allen Produkttypen senden', async () => {
      // Arrange
      const orderData = {
        email: 'customer@example.com',
        firstName: 'Max',
        lastName: 'Mustermann',
        orderId: 'ORD-12345',
        totalPrice: 149.99,
        orderItems: [
          {
            quantity: 2,
            width: 10,
            height: 15,
            vinyl: true,
            printed: false,
            stickerId: 'sticker-1',
            stickerName: 'Cool Sticker',
            stickerImages: ['sticker1.jpg'],
            customizationOptions: { text: 'Custom Text' },
          },
        ],
        partOrderItems: [
          {
            quantity: 1,
            partId: 'part-1',
            partName: 'Handlebars',
            partImages: ['part1.jpg'],
            customizationOptions: { color: 'red' },
          },
        ],
        powdercoatServiceOrderItems: [
          {
            quantity: 1,
            powdercoatingServiceId: 'powder-1',
            powdercoatingServiceName: 'Premium Coating',
            customizationOptions: { finish: 'matte' },
          },
        ],
      };

      // Act
      await service.sendOrderConfirmationEmail(orderData);

      // Assert
      expect(mailerService.sendMail).toHaveBeenCalledTimes(1);
      const call = mailerService.sendMail.mock.calls[0][0];

      expect(call.to).toBe(orderData.email);
      expect(call.subject).toContain(orderData.orderId);
      expect(call.html).toContain('Max Mustermann');
      expect(call.html).toContain('CHF 149.99');
      expect(call.html).toContain('Cool Sticker');
      expect(call.html).toContain('Handlebars');
      expect(call.html).toContain('Premium Coating');
      expect(call.html).toContain('MyPost24 PK619666'); // Pulverbeschichtungs-Hinweis
    });

    it('sollte mit minimalen Daten umgehen können (Grenzwert)', async () => {
      // Arrange
      const orderData = {
        email: 'min@example.com',
        orderId: 'MIN-1',
        totalPrice: 0,
        orderItems: [],
      };

      // Act
      await service.sendOrderConfirmationEmail(orderData);

      // Assert
      expect(mailerService.sendMail).toHaveBeenCalledTimes(1);
      const call = mailerService.sendMail.mock.calls[0][0];

      expect(call.to).toBe(orderData.email);
      expect(call.html).toContain('Kunde'); // Fallback Name
      expect(call.html).toContain('CHF 0.00');
    });
  });

  describe('sendShippingNotificationEmail', () => {
    it('sollte Versandbenachrichtigung mit vollständigen Daten senden', async () => {
      // Arrange
      const orderData = {
        email: 'shipped@example.com',
        firstName: 'Anna',
        lastName: 'Schmidt',
        orderId: 'SHIP-123',
        totalPrice: 89.99,
        orderItems: [
          {
            quantity: 3,
            width: 8,
            height: 12,
            vinyl: false,
            printed: true,
            stickerName: 'Premium Sticker',
            stickerImages: ['premium.jpg'],
          },
        ],
        partOrderItems: [
          {
            quantity: 2,
            partId: 'part-123',
            partName: 'Grips',
            partImages: ['grips.jpg'],
          },
        ],
      };

      // Act
      await service.sendShippingNotificationEmail(orderData);

      // Assert
      expect(mailerService.sendMail).toHaveBeenCalledTimes(1);
      const call = mailerService.sendMail.mock.calls[0][0];

      expect(call.to).toBe(orderData.email);
      expect(call.subject).toContain('versendet');
      expect(call.subject).toContain(orderData.orderId);
      expect(call.html).toContain('Anna Schmidt');
      expect(call.html).toContain('Versendet');
      expect(call.html).toContain('Premium Sticker');
      expect(call.html).toContain('Grips');
    });

    it('sollte bei MailerService Fehler Exception werfen', async () => {
      // Arrange
      const orderData = {
        email: 'error@example.com',
        orderId: 'ERROR-1',
        totalPrice: 50.0,
        orderItems: [],
      };

      const error = new Error('Network timeout');
      mailerService.sendMail.mockRejectedValueOnce(error);

      // Act & Assert
      await expect(
        service.sendShippingNotificationEmail(orderData),
      ).rejects.toThrow('Network timeout');
    });
  });
});
