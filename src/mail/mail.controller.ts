import { Controller, Post, Body } from '@nestjs/common';
import { MailService } from './mail.service';
import { Public } from 'src/auth/decorators/public.decorator';

@Controller('mail')
export class MailController {
  constructor(private readonly mailService: MailService) {}

  @Public()
  @Post()
  async sendMail(@Body('email') email: string) {
    return this.mailService.sendWelcomeEmail(email);
  }
}
