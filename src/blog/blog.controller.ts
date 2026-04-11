import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Query,
  UseInterceptors,
  UploadedFile,
  UploadedFiles,
  BadRequestException,
} from '@nestjs/common';
import { BlogService } from './blog.service';
import { CreateBlogDto, UpdateBlogDto } from './dto/blog.dto';
import { Public } from 'src/auth/decorators/public.decorator';
import { Roles } from 'src/auth/decorators/roles.decorator';
import { UserRole } from 'src/auth/role.enum';
import { FileInterceptor, FilesInterceptor } from '@nestjs/platform-express';
import { MinioService } from 'src/storage/minio.service';

@Controller('blog')
export class BlogController {
  constructor(
    private readonly blogService: BlogService,
    private readonly minioService: MinioService,
  ) {}

  @Post('upload-images')
  @Roles(UserRole.ADMIN, UserRole.MODERATOR)
  @UseInterceptors(FilesInterceptor('images'))
  async uploadBlogImages(
    @UploadedFiles() files: Array<Express.Multer.File>,
  ): Promise<{ imageUrls: string[] }> {
    if (!files || files.length === 0) {
      throw new BadRequestException('At least one image is required');
    }

    // Upload images to MinIO and get their paths
    const imageUrls = await Promise.all(
      files.map((file) =>
        this.minioService.uploadFile('crestline-blog', file, true),
      ),
    );

    return { imageUrls };
  }

  @Post('upload-image')
  @Roles(UserRole.ADMIN, UserRole.MODERATOR)
  @UseInterceptors(FileInterceptor('image'))
  async uploadBlogImage(
    @UploadedFile() file: Express.Multer.File,
  ): Promise<{ imageUrl: string }> {
    if (!file) {
      throw new BadRequestException('Image file is required');
    }

    // Upload image to MinIO public bucket 'crestline-blog' and get the URL
    const imageUrl = await this.minioService.uploadFile(
      'crestline-blog',
      file,
      true,
    );

    return { imageUrl };
  }

  @Post()
  @Roles(UserRole.ADMIN, UserRole.MODERATOR)
  create(@Body() createBlogDto: CreateBlogDto) {
    return this.blogService.create(createBlogDto);
  }

  @Get()
  @Public()
  findAll(
    @Query('activeOnly') activeOnly?: string,
    @Query('language') language?: string,
  ) {
    const isActiveOnly = activeOnly === 'true';
    return this.blogService.findAll(isActiveOnly, language);
  }

  @Get('by-title/:title')
  @Public()
  findOneByTitle(
    @Param('title') title: string,
    @Query('language') language?: string,
  ) {
    const decodedTitle = decodeURIComponent(title);
    return this.blogService.findOneByTitle(decodedTitle, language);
  }

  @Get(':id')
  @Public()
  findOne(@Param('id') id: string, @Query('language') language?: string) {
    return this.blogService.findOne(id, language);
  }

  @Patch(':id')
  @Roles(UserRole.ADMIN, UserRole.MODERATOR)
  update(@Param('id') id: string, @Body() updateBlogDto: UpdateBlogDto) {
    return this.blogService.update(id, updateBlogDto);
  }

  @Delete(':id')
  @Roles(UserRole.ADMIN, UserRole.MODERATOR)
  remove(@Param('id') id: string) {
    return this.blogService.remove(id);
  }

  @Patch(':id/activate')
  @Roles(UserRole.ADMIN, UserRole.MODERATOR)
  activate(@Param('id') id: string) {
    return this.blogService.activate(id);
  }

  @Patch(':id/deactivate')
  @Roles(UserRole.ADMIN, UserRole.MODERATOR)
  deactivate(@Param('id') id: string) {
    return this.blogService.deactivate(id);
  }

  @Patch(':id/read')
  @Public()
  incrementReadCount(@Param('id') id: string) {
    return this.blogService.incrementReadCount(id);
  }
}
