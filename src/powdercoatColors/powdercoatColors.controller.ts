import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Put,
} from '@nestjs/common';
import { PowdercoatColorsService } from './powdercoatColors.service';
import { Roles } from 'src/auth/decorators/roles.decorator';
import { UserRole } from 'src/auth/role.enum';
import { Public } from 'src/auth/decorators/public.decorator';

@Controller('powdercoat-colors')
export class PowdercoatColorsController {
  constructor(private readonly colorsService: PowdercoatColorsService) {}

  @Public()
  @Get()
  async getAllColors(): Promise<string[]> {
    return this.colorsService.getAllColors();
  }

  @Get('all')
  @Roles(UserRole.ADMIN)
  async getAllColorsIncludingInactive(): Promise<string[]> {
    return this.colorsService.getAllColors(true);
  }

  @Get(':id')
  @Roles(UserRole.ADMIN)
  async getColor(@Param('id') id: string): Promise<any> {
    return this.colorsService.getColorById(id);
  }

  @Post()
  @Roles(UserRole.ADMIN)
  async addColors(@Body() body: { color: string }): Promise<string> {
    return this.colorsService.addColor(body.color);
  }

  @Put()
  @Roles(UserRole.ADMIN)
  async setColors(@Body() body: { colors: string[] }): Promise<string[]> {
    return this.colorsService.setColors(body.colors);
  }

  @Patch(':id')
  @Roles(UserRole.ADMIN)
  async updateColor(
    @Param('id') id: string,
    @Body() body: { color: string },
  ): Promise<any> {
    return this.colorsService.updateColor(id, body.color);
  }

  @Patch(':id/toggle')
  @Roles(UserRole.ADMIN)
  async toggleActive(@Param('id') id: string): Promise<any> {
    return this.colorsService.toggleActive(id);
  }

  @Delete(':color')
  @Roles(UserRole.ADMIN)
  async deleteColor(@Param('color') color: string): Promise<void> {
    return this.colorsService.deleteColorByName(color);
  }
}
