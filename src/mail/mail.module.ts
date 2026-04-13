import { MailerModule } from '@nestjs-modules/mailer';
import { Module, Logger } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { MailService } from './mail.service';
import { MailController } from './mail.controller';

@Module({
  imports: [
    MailerModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: async (configService: ConfigService) => {
        const logger = new Logger('MailModule');

        const smtpHost = configService.get<string>(
          'SMTP_HOST',
          'mail.infomaniak.com',
        );
        const smtpPort = configService.get<number>('SMTP_PORT', 465);
        const smtpUser = configService.get<string>(
          'SMTP_USER',
          'info@revsticks.ch',
        );
        const smtpPassword = configService.get<string>('SMTP_PASSWORD', '');

        logger.log(
          `SMTP Configuration - Host: ${smtpHost}, Port: ${smtpPort}, User: ${smtpUser}`,
        );

        return {
          transport: {
            host: smtpHost,
            port: smtpPort,
            secure: true,
            auth: {
              user: smtpUser,
              pass: smtpPassword,
            },
          },
          defaults: {
            from: `"Crestline Customs" <${smtpUser}>`,
          },
        };
      },
      inject: [ConfigService],
    }),
  ],
  controllers: [MailController],
  providers: [MailService],
  exports: [MailService],
})
export class MailModule {}
