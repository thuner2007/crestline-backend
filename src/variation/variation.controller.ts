import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Delete,
  Put,
  Patch,
} from '@nestjs/common';
import { VariationService } from './variation.service';
import {
  CreateVariationGroupDto,
  UpdateVariationGroupDto,
  AddStickerToVariationDto,
  RemoveStickerFromVariationDto,
} from './dto/variation.dto';
import { Public } from 'src/auth/decorators/public.decorator';
import { Roles } from 'src/auth/decorators/roles.decorator';
import { UserRole } from 'src/auth/role.enum';

@Controller('variations')
export class VariationController {
  constructor(private readonly variationService: VariationService) {}

  @Post()
  @Roles(UserRole.ADMIN)
  async create(@Body() createVariationGroupDto: CreateVariationGroupDto) {
    return this.variationService.createVariationGroup(createVariationGroupDto);
  }

  @Public()
  @Get()
  async findAll() {
    return this.variationService.findAllVariationGroups();
  }

  @Public()
  @Get(':id')
  async findOne(@Param('id') id: string) {
    return this.variationService.findVariationGroupById(id);
  }

  @Put(':id')
  @Roles(UserRole.ADMIN)
  async update(
    @Param('id') id: string,
    @Body() updateVariationGroupDto: UpdateVariationGroupDto,
  ) {
    return this.variationService.updateVariationGroup(
      id,
      updateVariationGroupDto,
    );
  }

  @Delete(':id')
  @Roles(UserRole.ADMIN)
  async delete(@Param('id') id: string) {
    await this.variationService.deleteVariationGroup(id);
    return { message: 'Variation group deleted successfully' };
  }

  @Patch(':id/add-sticker')
  @Roles(UserRole.ADMIN)
  async addSticker(
    @Param('id') id: string,
    @Body() addStickerDto: AddStickerToVariationDto,
  ) {
    return this.variationService.addStickerToVariationGroup(
      id,
      addStickerDto.stickerId,
    );
  }

  @Patch(':id/remove-sticker')
  @Roles(UserRole.ADMIN)
  async removeSticker(
    @Param('id') id: string,
    @Body() removeStickerDto: RemoveStickerFromVariationDto,
  ) {
    return this.variationService.removeStickerFromVariationGroup(
      id,
      removeStickerDto.stickerId,
    );
  }
}
