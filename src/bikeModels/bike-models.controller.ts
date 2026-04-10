import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Query,
} from '@nestjs/common';
import { BikeModelsService } from './bike-models.service';
import { CreateBikeModelDto, UpdateBikeModelDto } from './dto/bike-model.dto';
import { Roles } from 'src/auth/decorators/roles.decorator';
import { UserRole } from 'src/auth/role.enum';
import { Public } from 'src/auth/decorators/public.decorator';

@Controller('bike-models')
export class BikeModelsController {
  constructor(private readonly bikeModelsService: BikeModelsService) {}

  @Post()
  @Roles(UserRole.ADMIN)
  create(@Body() createBikeModelDto: CreateBikeModelDto) {
    return this.bikeModelsService.create(createBikeModelDto);
  }

  @Get()
  @Public()
  findAll(
    @Query('status') status?: 'active' | 'inactive' | 'all',
    @Query('manufacturer') manufacturer?: string,
  ) {
    return this.bikeModelsService.findAll({ status, manufacturer });
  }

  @Get('manufacturers')
  @Public()
  getManufacturers() {
    return this.bikeModelsService.getManufacturers();
  }

  @Get(':id')
  @Public()
  findOne(@Param('id') id: string) {
    return this.bikeModelsService.findOne(id);
  }

  @Patch(':id')
  @Roles(UserRole.ADMIN)
  update(
    @Param('id') id: string,
    @Body() updateBikeModelDto: UpdateBikeModelDto,
  ) {
    return this.bikeModelsService.update(id, updateBikeModelDto);
  }

  @Patch(':id/toggle-active')
  @Roles(UserRole.ADMIN)
  toggleActive(@Param('id') id: string) {
    return this.bikeModelsService.toggleActive(id);
  }

  @Delete(':id')
  @Roles(UserRole.ADMIN)
  remove(@Param('id') id: string) {
    return this.bikeModelsService.remove(id);
  }
}
