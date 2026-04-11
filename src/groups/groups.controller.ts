import {
  Controller,
  Post,
  Body,
  Delete,
  Param,
  Put,
  Get,
  UseInterceptors,
  UploadedFiles,
} from '@nestjs/common';
import { GroupsService } from './groups.service';
import { CreateGroupDto, CreatePartGroupDto } from './dto/group.dto';
import { CreateSubgroupDto } from './dto/subgroup.dto';
import { Roles } from '../auth/decorators/roles.decorator';
import { UserRole } from '../auth/role.enum';
import { Public } from 'src/auth/decorators/public.decorator';
import { FilesInterceptor } from '@nestjs/platform-express';
import { MinioService } from 'src/storage/minio.service';

@Controller('groups')
export class GroupsController {
  constructor(
    private readonly groupsService: GroupsService,
    private readonly minioService: MinioService,
  ) {}

  @Post()
  @Roles(UserRole.ADMIN)
  createGroup(@Body() createGroupDto: CreateGroupDto) {
    return this.groupsService.createGroup(createGroupDto);
  }

  @Post('subgroup')
  @Roles(UserRole.ADMIN)
  createSubgroup(@Body() createSubgroupDto: CreateSubgroupDto) {
    return this.groupsService.createSubgroup(createSubgroupDto);
  }

  @Post('part-group')
  @UseInterceptors(FilesInterceptor('image'))
  @Roles(UserRole.ADMIN)
  async createPartGroup(
    @Body() createPartGroupDtoRaw: any,
    @UploadedFiles() files: Array<Express.Multer.File>,
  ) {
    // Process the image if uploaded
    let imageUrl = createPartGroupDtoRaw.image;

    if (files && files.length > 0) {
      // Upload image to MinIO and get the path
      imageUrl = await this.minioService.uploadFile(
        'crestline-part-groups',
        files[0],
        true,
      );
    }

    // Process translations if needed
    let processedTranslations: any = createPartGroupDtoRaw.translations;
    if (processedTranslations && typeof processedTranslations === 'string') {
      processedTranslations = JSON.parse(processedTranslations);
    }

    // Create the part group DTO with processed data
    const createPartGroupDto = {
      ...createPartGroupDtoRaw,
      image: imageUrl,
      translations: processedTranslations,
    };

    return this.groupsService.createPartGroup(createPartGroupDto);
  }

  @Public()
  @Get()
  getAllGroups() {
    return this.groupsService.findAllGroups();
  }

  @Public()
  @Get('all')
  getAllGroupsAndSubgroups() {
    return this.groupsService.findAllGroupsAndSubgroups();
  }

  @Public()
  @Get('part-groups')
  getAllPartGroups() {
    return this.groupsService.findAllPartGroups();
  }

  @Public()
  @Get(':id')
  getGroupById(@Param('id') id: string) {
    return this.groupsService.findGroupById(id);
  }

  @Public()
  @Get(':id/subgroups')
  getSubgroupsByGroupId(@Param('id') id: string) {
    return this.groupsService.findSubgroupsByGroupId(id);
  }

  @Public()
  @Get('subgroup/:id')
  getSubgroupById(@Param('id') id: string) {
    return this.groupsService.findSubgroupById(id);
  }

  @Public()
  @Get('part-group/:id')
  getPartGroupById(@Param('id') id: string) {
    return this.groupsService.findPartGroupById(id);
  }

  @Public()
  @Get('subgroups/all')
  getAllSubgroups() {
    return this.groupsService.findAllSubgroups();
  }

  @Delete(':id')
  @Roles(UserRole.ADMIN)
  deleteGroup(@Param('id') id: string) {
    return this.groupsService.deleteGroup(id);
  }

  @Delete('subgroup/:id')
  @Roles(UserRole.ADMIN)
  deleteSubgroup(@Param('id') id: string) {
    return this.groupsService.deleteSubgroup(id);
  }

  @Delete('part-group/:id')
  @Roles(UserRole.ADMIN)
  deletePartGroup(@Param('id') id: string) {
    return this.groupsService.deletePartGroup(id);
  }

  @Put(':id')
  @Roles(UserRole.ADMIN)
  updateGroup(@Param('id') id: string, @Body() updateGroupDto: CreateGroupDto) {
    return this.groupsService.updateGroup(
      id,
      updateGroupDto.name,
      updateGroupDto.translations,
    );
  }

  @Put('subgroup/:id')
  @Roles(UserRole.ADMIN)
  updateSubgroup(
    @Param('id') id: string,
    @Body() updateSubgroupDto: CreateSubgroupDto,
  ) {
    return this.groupsService.updateSubgroup(
      id,
      updateSubgroupDto.name,
      updateSubgroupDto.translations,
    );
  }

  @Put('part-group/:id')
  @Roles(UserRole.ADMIN)
  updatePartGroup(
    @Param('id') id: string,
    @Body() updatePartGroupDto: CreatePartGroupDto,
  ) {
    return this.groupsService.updatePartGroup(
      id,
      updatePartGroupDto.name,
      updatePartGroupDto.translations,
    );
  }
}
