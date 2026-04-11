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
  UploadedFiles,
  BadRequestException,
} from '@nestjs/common';
import { FilesInterceptor } from '@nestjs/platform-express';
import { PowdercoatColorsService } from 'src/powdercoatColors/powdercoatColors.service';
import { PowdercoatServiceService } from './powdercoatService.service';
import { CreatePowdercoatServiceDto } from './dto/create-powdercoat-service.dto';
import { UpdatePowdercoatServiceDto } from './dto/update-powdercoat-service.dto';
import { Roles } from '../auth/decorators/roles.decorator';
import { UserRole } from '../auth/role.enum';
import { Public } from '../auth/decorators/public.decorator';
import { MinioService } from '../storage/minio.service';

@Controller('powdercoatservice')
export class PowdercoatServiceController {
  constructor(
    private readonly colorsService: PowdercoatColorsService,
    private readonly powdercoatServiceService: PowdercoatServiceService,
    private readonly minioService: MinioService,
  ) {}

  @Post()
  @UseInterceptors(
    FilesInterceptor('images', 20, {
      limits: {
        fileSize: 500 * 1024 * 1024, // 500MB per file
        files: 20, // Maximum 20 files
        fieldSize: 100 * 1024 * 1024, // 100MB for other fields
      },
    }),
  )
  @Roles(UserRole.ADMIN)
  async create(
    @Body() createDto: any,
    @UploadedFiles() files: Array<Express.Multer.File>,
  ) {
    if (!files || files.length === 0) {
      throw new BadRequestException('At least one image is required');
    }

    // Upload images to MinIO sequentially to avoid signature conflicts
    const imageUrls: string[] = [];
    const baseDelay = files.length > 6 ? 200 : files.length > 3 ? 100 : 50;

    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      try {
        if (i > 0) {
          await new Promise((resolve) => setTimeout(resolve, baseDelay));
        }
        const imageUrl = await this.minioService.uploadFile(
          'crestline-powdercoat-services',
          file,
          true,
        );
        imageUrls.push(imageUrl);
      } catch (error) {
        console.error(`Error uploading file ${file.originalname}:`, error);
        throw new BadRequestException(
          `Failed to upload image: ${file.originalname}`,
        );
      }
    }

    // Process the DTO
    const processedDto: CreatePowdercoatServiceDto = {
      name: createDto.name,
      images: imageUrls,
      description: createDto.description,
      price: Number(createDto.price),
      active: createDto.active === 'true' || createDto.active === true,
    };

    return this.powdercoatServiceService.create(processedDto);
  }

  @Public()
  @Get()
  async findAll(@Query('includeInactive') includeInactive?: string) {
    const include = includeInactive === 'true';
    return this.powdercoatServiceService.findAll(include);
  }

  @Public()
  @Get('by-name/:name')
  async findOneByName(@Param('name') name: string) {
    const decodedName = decodeURIComponent(name);
    return this.powdercoatServiceService.findOneByName(decodedName);
  }

  @Public()
  @Get(':id')
  async findOne(@Param('id') id: string) {
    return this.powdercoatServiceService.findOne(id);
  }

  @Patch(':id')
  @UseInterceptors(
    FilesInterceptor('images', 20, {
      limits: {
        fileSize: 500 * 1024 * 1024, // 500MB per file
        files: 20, // Maximum 20 files
        fieldSize: 100 * 1024 * 1024, // 100MB for other fields
      },
    }),
  )
  @Roles(UserRole.ADMIN)
  async update(
    @Param('id') id: string,
    @Body() updateDto: any,
    @UploadedFiles() files?: Array<Express.Multer.File>,
  ) {
    // Handle image uploads if provided
    const newImageUrls: string[] = [];
    if (files && files.length > 0) {
      const baseDelay = files.length > 6 ? 200 : files.length > 3 ? 100 : 50;

      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        try {
          if (i > 0) {
            await new Promise((resolve) => setTimeout(resolve, baseDelay));
          }
          const imageUrl = await this.minioService.uploadFile(
            'crestline-powdercoat-services',
            file,
            true,
          );
          newImageUrls.push(imageUrl);
        } catch (error) {
          console.error(`Error uploading file ${file.originalname}:`, error);
          throw new BadRequestException(
            `Failed to upload image: ${file.originalname}`,
          );
        }
      }
    }

    // Process existing images (images to keep)
    let processedExistingImages: string[] = [];
    if (updateDto.existingImages) {
      try {
        processedExistingImages = Array.isArray(updateDto.existingImages)
          ? updateDto.existingImages
          : JSON.parse(updateDto.existingImages);
      } catch {
        processedExistingImages = [updateDto.existingImages];
      }
    }

    // Combine existing images with new uploaded images
    const finalImages = [...processedExistingImages, ...newImageUrls];

    // Process the DTO
    const processedDto: UpdatePowdercoatServiceDto = {
      ...(updateDto.name !== undefined && { name: updateDto.name }),
      ...(finalImages.length > 0 && { images: finalImages }),
      ...(updateDto.description !== undefined && {
        description: updateDto.description,
      }),
      ...(updateDto.price !== undefined && { price: Number(updateDto.price) }),
      ...(updateDto.active !== undefined && {
        active: updateDto.active === 'true' || updateDto.active === true,
      }),
    };

    return this.powdercoatServiceService.update(id, processedDto);
  }

  @Patch(':id/toggle-active')
  @Roles(UserRole.ADMIN)
  async toggleActive(@Param('id') id: string) {
    return this.powdercoatServiceService.toggleActive(id);
  }

  @Delete(':id')
  @Roles(UserRole.ADMIN)
  async remove(@Param('id') id: string) {
    return this.powdercoatServiceService.remove(id);
  }
}
