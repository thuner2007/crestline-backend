import { Controller, Get } from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';
import { Public } from 'src/auth/decorators/public.decorator';

@Throttle({ default: { limit: 15, ttl: 1000 } }) // Limited to 15 requests per second
@Controller('life-check')
export class LifeCheckController {
  @Public()
  @Get()
  getHello(): string {
    return 'Hello';
  }
}
