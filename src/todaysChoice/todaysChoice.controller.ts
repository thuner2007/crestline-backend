import {
  Controller,
  Get,
  Post,
  Body,
  Delete,
  Param,
  Put,
} from '@nestjs/common';
import { TodaysChoiceService } from './todaysChoice.service';
import { Roles } from 'src/auth/decorators/roles.decorator';
import { UserRole } from 'src/auth/role.enum';
import { Public } from 'src/auth/decorators/public.decorator';
import { Throttle } from '@nestjs/throttler';

@Controller('todays-choice')
export class TodaysChoiceController {
  constructor(private readonly todaysChoiceService: TodaysChoiceService) {}

  @Throttle({ default: { limit: 30, ttl: 6000 } }) // 10 requests per 6 seconds
  @Public()
  @Get()
  async findAll() {
    return this.todaysChoiceService.findAll();
  }

  @Post()
  @Roles(UserRole.ADMIN)
  async create(@Body() body: { stickerId?: string; partId?: string }) {
    return this.todaysChoiceService.create(body);
  }

  @Put(':id')
  @Roles(UserRole.ADMIN)
  async update(
    @Param('id') id: string,
    @Body() body: { stickerId?: string; partId?: string },
  ) {
    return this.todaysChoiceService.update(id, body);
  }

  @Delete(':id')
  @Roles(UserRole.ADMIN)
  async remove(@Param('id') id: string) {
    return this.todaysChoiceService.remove(id);
  }
}
