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
import { FilamentTypesService } from './filamentTypes.service';
import { Roles } from 'src/auth/decorators/roles.decorator';
import { UserRole } from 'src/auth/role.enum';
import { Public } from 'src/auth/decorators/public.decorator';

@Controller('filament-types')
export class FilamentTypesController {
  constructor(private readonly filamentTypesService: FilamentTypesService) {}

  @Public()
  @Get()
  async getAll() {
    return this.filamentTypesService.getAll();
  }

  @Get('all')
  @Roles(UserRole.ADMIN)
  async getAllIncludingInactive() {
    return this.filamentTypesService.getAll(true);
  }

  @Public()
  @Get(':id')
  async getById(@Param('id') id: string) {
    return this.filamentTypesService.getById(id);
  }

  @Public()
  @Get('name/:name')
  async getByName(@Param('name') name: string) {
    return this.filamentTypesService.getByName(name);
  }

  @Post()
  @Roles(UserRole.ADMIN)
  async create(
    @Body()
    body: {
      name: string;
      description?: string;
      active?: boolean;
    },
  ) {
    return this.filamentTypesService.create(body);
  }

  @Put(':id')
  @Roles(UserRole.ADMIN)
  async update(
    @Param('id') id: string,
    @Body()
    body: {
      name?: string;
      description?: string;
      active?: boolean;
    },
  ) {
    return this.filamentTypesService.update(id, body);
  }

  @Patch(':id/toggle')
  @Roles(UserRole.ADMIN)
  async toggleActive(@Param('id') id: string) {
    return this.filamentTypesService.toggleActive(id);
  }

  @Delete(':id')
  @Roles(UserRole.ADMIN)
  async delete(@Param('id') id: string) {
    await this.filamentTypesService.delete(id);
    return { message: 'Filament type deleted successfully' };
  }
}
