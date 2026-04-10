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
import { AvailableColorsService } from './availableColors.service';
import { Roles } from 'src/auth/decorators/roles.decorator';
import { UserRole } from 'src/auth/role.enum';
import { Public } from 'src/auth/decorators/public.decorator';

@Controller('available-colors')
export class AvailableColorsController {
  constructor(private readonly colorsService: AvailableColorsService) {}

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

  @Get('filament/:type/all')
  @Roles(UserRole.ADMIN)
  async getColorsByFilamentTypeIncludingInactive(
    @Param('type') type: string,
  ): Promise<any[]> {
    return this.colorsService.getColorsByFilamentType(type, true);
  }

  @Public()
  @Get('filament/:type')
  async getColorsByFilamentType(@Param('type') type: string): Promise<any[]> {
    return this.colorsService.getColorsByFilamentType(type, false);
  }

  @Post('filament/:type')
  @Roles(UserRole.ADMIN)
  async addColorToFilamentType(
    @Param('type') type: string,
    @Body() body: { color: string },
  ): Promise<any> {
    return this.colorsService.addColorToFilamentType(type, body.color);
  }

  @Put('filament/:type')
  @Roles(UserRole.ADMIN)
  async setColorsForFilamentType(@Param('type') type: string): Promise<any[]> {
    return this.colorsService.setColorsForFilamentType(type);
  }

  @Delete('filament/:type/:id')
  @Roles(UserRole.ADMIN)
  async deleteColorFromFilamentType(
    @Param('type') type: string,
    @Param('id') id: string,
  ): Promise<void> {
    return this.colorsService.deleteColorFromFilamentType(type, id);
  }

  // Generic routes with parameters - must come after specific routes
  @Get(':id')
  @Roles(UserRole.ADMIN)
  async getColor(@Param('id') id: string): Promise<any> {
    return this.colorsService.getColorById(id);
  }

  @Post()
  @Roles(UserRole.ADMIN)
  async addColors(
    @Body() body: { color: string; filamentType?: string },
  ): Promise<any> {
    return this.colorsService.addColor(body.color, body.filamentType);
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
