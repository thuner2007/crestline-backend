import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  Query,
} from '@nestjs/common';
import { PartSectionsService } from './partSections.service';
import {
  CreatePartSectionDto,
  UpdatePartSectionDto,
  AssignPartsToSectionDto,
} from './dto/part-section.dto';
import { Public } from 'src/auth/decorators/public.decorator';
import { Roles } from 'src/auth/decorators/roles.decorator';
import { UserRole } from 'src/auth/role.enum';

@Controller('part-sections')
export class PartSectionsController {
  constructor(private readonly partSectionsService: PartSectionsService) {}

  @Post()
  @Roles(UserRole.ADMIN)
  create(@Body() dto: CreatePartSectionDto) {
    return this.partSectionsService.create(dto);
  }

  @Public()
  @Get()
  findAll(@Query('includeInactive') includeInactive?: string) {
    return this.partSectionsService.findAll(includeInactive === 'true');
  }

  @Get('admin')
  @Roles(UserRole.ADMIN)
  findAllAdmin() {
    return this.partSectionsService.findAllAdmin();
  }

  @Public()
  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.partSectionsService.findOne(id);
  }

  @Put(':id')
  @Roles(UserRole.ADMIN)
  update(@Param('id') id: string, @Body() dto: UpdatePartSectionDto) {
    return this.partSectionsService.update(id, dto);
  }

  @Delete(':id')
  @Roles(UserRole.ADMIN)
  remove(@Param('id') id: string) {
    return this.partSectionsService.remove(id);
  }

  @Put(':id/parts')
  @Roles(UserRole.ADMIN)
  assignParts(@Param('id') id: string, @Body() dto: AssignPartsToSectionDto) {
    return this.partSectionsService.assignParts(id, dto.partIds);
  }

  @Post(':id/parts/:partId')
  @Roles(UserRole.ADMIN)
  addPart(@Param('id') id: string, @Param('partId') partId: string) {
    return this.partSectionsService.addPart(id, partId);
  }

  @Delete(':id/parts/:partId')
  @Roles(UserRole.ADMIN)
  removePart(@Param('id') id: string, @Param('partId') partId: string) {
    return this.partSectionsService.removePart(id, partId);
  }
}
