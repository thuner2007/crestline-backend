import {
  Controller,
  Get,
  Body,
  Param,
  Patch,
  Delete,
  Post,
  UseInterceptors,
  UploadedFiles,
  BadRequestException,
  Query,
} from '@nestjs/common';
import { PartsService } from './parts.service';
import { Public } from 'src/auth/decorators/public.decorator';
import { FilesInterceptor } from '@nestjs/platform-express';
import { Roles } from 'src/auth/decorators/roles.decorator';
import { UserRole } from 'src/auth/role.enum';
import { MinioService } from 'src/storage/minio.service';
import {
  UpdateShippingReadyDto,
  UpdateShippingDateDto,
  UpdateOptionStockDto,
} from './dto/part.dto';
import { PowdercoatColorsService } from 'src/powdercoatColors/powdercoatColors.service';

// Multer file type declaration for compatibility with @types/express v5
// eslint-disable-next-line @typescript-eslint/no-namespace
declare global {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace Express {
    // eslint-disable-next-line @typescript-eslint/no-namespace
    namespace Multer {
      interface File {
        fieldname: string;
        originalname: string;
        encoding: string;
        mimetype: string;
        size: number;
        destination: string;
        filename: string;
        path: string;
        buffer: Buffer;
      }
    }
  }
}

// Type alias for Multer file uploads
type MulterFile = Express.Multer.File;

@Controller('parts')
export class PartsController {
  constructor(
    private readonly partsService: PartsService,
    private readonly minioService: MinioService,
    private readonly powdercoatColorsService: PowdercoatColorsService,
  ) {}

  @Post()
  @UseInterceptors(
    FilesInterceptor('files', 40, {
      limits: {
        fileSize: 500 * 1024 * 1024, // 500MB per file
        files: 40, // Maximum 40 files (images + videos)
        fieldSize: 100 * 1024 * 1024, // 100MB for other fields
      },
    }),
  )
  @Roles(UserRole.ADMIN)
  async create(
    @Body() createPartDtoRaw: any,
    @UploadedFiles() files: Array<MulterFile>,
  ): Promise<any> {
    if (!files || files.length === 0) {
      throw new BadRequestException('At least one image or video is required');
    }

    // Separate images and videos based on MIME type
    const imageFiles = files.filter((f) => f.mimetype.startsWith('image/'));
    const videoFiles = files.filter((f) => f.mimetype.startsWith('video/'));

    if (imageFiles.length === 0) {
      throw new BadRequestException('At least one image is required');
    }

    // Upload images to MinIO sequentially to avoid signature conflicts
    const imageUrls: string[] = [];
    const baseDelay =
      imageFiles.length > 6 ? 200 : imageFiles.length > 3 ? 100 : 50;

    for (let i = 0; i < imageFiles.length; i++) {
      const file = imageFiles[i];
      try {
        const delay = baseDelay + i * 50;
        const uploadedUrl = await this.minioService.uploadFile(
          'crestline-parts',
          file,
          true,
          delay,
        );
        imageUrls.push(uploadedUrl);
        console.log(
          `Successfully uploaded image ${i + 1}/${imageFiles.length}: ${file.originalname}`,
        );
      } catch (error) {
        console.error(`Failed to upload image ${file.originalname}:`, error);
        throw new BadRequestException(
          `Failed to upload image ${file.originalname}: ${error instanceof Error ? error.message : String(error)}`,
        );
      }
    }

    // Upload videos to MinIO sequentially
    const videoUrls: string[] = [];
    const videoBaseDelay =
      videoFiles.length > 6 ? 200 : videoFiles.length > 3 ? 100 : 50;

    for (let i = 0; i < videoFiles.length; i++) {
      const file = videoFiles[i];
      try {
        const delay = videoBaseDelay + i * 50;
        const uploadedUrl = await this.minioService.uploadFile(
          'crestline-parts',
          file,
          true,
          delay,
        );
        videoUrls.push(uploadedUrl);
        console.log(
          `Successfully uploaded video ${i + 1}/${videoFiles.length}: ${file.originalname}`,
        );
      } catch (error) {
        console.error(`Failed to upload video ${file.originalname}:`, error);
        throw new BadRequestException(
          `Failed to upload video ${file.originalname}: ${error instanceof Error ? error.message : String(error)}`,
        );
      }
    }

    // Process groups, translations, and keywords from form data
    const {
      groups,
      translations,
      keywords,
      shippingDate,
      links,
      ...restProps
    } = createPartDtoRaw;

    // Process groups
    let processedGroups: string[] | undefined = undefined;
    if (groups) {
      if (Array.isArray(groups)) {
        processedGroups = groups;
      } else if (typeof groups === 'string') {
        processedGroups = groups
          .split(',')
          .map((g) => g.trim())
          .filter(Boolean);
      }
    }

    // Process translations
    let processedTranslations: any = undefined;
    if (translations) {
      if (typeof translations === 'string') {
        processedTranslations = JSON.parse(translations);
      } else {
        processedTranslations = translations;
      }
    }

    // Process keywords
    let processedKeywords: string[] | undefined = undefined;
    if (keywords) {
      if (Array.isArray(keywords)) {
        processedKeywords = keywords;
      } else if (typeof keywords === 'string') {
        processedKeywords = keywords
          .split(',')
          .map((k) => k.trim())
          .filter(Boolean);
      }
    }

    // Process links
    let processedLinks: any = undefined;
    if (links) {
      if (typeof links === 'string') {
        processedLinks = JSON.parse(links);
      } else {
        processedLinks = links;
      }
    }

    // Explicitly convert numeric and boolean fields
    const processedData = {
      ...restProps,
      // Pass type field if provided
      ...(restProps.type !== undefined ? { type: restProps.type } : {}),
      // Convert numeric fields
      price: Number(restProps.price),
      ...(restProps.initialPrice !== undefined
        ? { initialPrice: Number(restProps.initialPrice) }
        : {}),
      quantity: Number(restProps.quantity),
      ...(restProps.sortingRank !== undefined
        ? { sortingRank: Number(restProps.sortingRank) }
        : {}),

      // Convert weight and dimensions
      ...(restProps.weight !== undefined
        ? { weight: Number(restProps.weight) }
        : {}),
      ...(restProps.width !== undefined
        ? { width: Number(restProps.width) }
        : {}),
      ...(restProps.height !== undefined
        ? { height: Number(restProps.height) }
        : {}),
      ...(restProps.length !== undefined
        ? { length: Number(restProps.length) }
        : {}),

      // Convert boolean fields
      ...(restProps.active !== undefined
        ? { active: restProps.active === 'true' || restProps.active === true }
        : {}),

      // Pass shipping ready status if provided
      ...(restProps.shippingReady !== undefined
        ? { shippingReady: restProps.shippingReady }
        : {}),

      // Pass shipping date if provided
      ...(shippingDate !== undefined ? { shippingDate } : {}),

      // Add keywords if provided
      ...(processedKeywords ? { keywords: processedKeywords } : {}),

      // Add images from uploaded files
      images: imageUrls,

      // Add videos from uploaded files
      ...(videoUrls.length > 0 ? { videos: videoUrls } : {}),
    };

    // Create the part DTO with processed data
    const createPartDto = {
      ...processedData,
      groups: processedGroups,
      translations: processedTranslations,
      links: processedLinks,
    };

    // Create the part through the service
    return this.partsService.create(createPartDto);
  }

  @Public()
  @Get('powdercoat-colors')
  async getPowdercoatColors(): Promise<string[]> {
    return this.powdercoatColorsService.getAllColors();
  }

  @Public()
  @Get()
  async findAll(
    @Query('status') status?: 'active' | 'inactive' | 'all',
    @Query('amount') amount?: string,
    @Query('start') start?: string,
    @Query('limit') limitParam?: string,
    @Query('skip') skipParam?: string,
    @Query('groupIds') groupIds?: string,
    @Query('bikeModelId') bikeModelId?: string,
    @Query('random') random?: boolean,
    @Query('sortBy') sortBy?: string,
    @Query('sortOrder') sortOrder?: 'asc' | 'desc',
  ) {
    // Parse groupIds from comma-separated strings to arrays
    const parsedGroupIds = groupIds ? groupIds.split(',') : undefined;

    // Parse numeric parameters — support both legacy (amount/start) and standard (limit/skip) names
    const limit = limitParam
      ? parseInt(limitParam, 10)
      : amount
        ? parseInt(amount, 10)
        : undefined;
    const skip = skipParam
      ? parseInt(skipParam, 10)
      : start
        ? parseInt(start, 10)
        : undefined;

    return this.partsService.findAll({
      status,
      limit,
      skip,
      groupIds: parsedGroupIds,
      bikeModelId,
      random: random === true,
      sortBy: sortBy || 'sortingRank',
      sortOrder: sortOrder || 'asc',
    });
  }

  @Public()
  @Get('with-stock')
  async findAllWithStock(
    @Query('status') status?: 'active' | 'inactive' | 'all',
    @Query('amount') amount?: string,
    @Query('start') start?: string,
    @Query('groupIds') groupIds?: string,
    @Query('bikeModelId') bikeModelId?: string,
    @Query('random') random?: boolean,
    @Query('sortBy') sortBy?: string,
    @Query('sortOrder') sortOrder?: 'asc' | 'desc',
  ) {
    // Parse groupIds from comma-separated strings to arrays
    const parsedGroupIds = groupIds ? groupIds.split(',') : undefined;

    // Parse numeric parameters
    const limit = amount ? parseInt(amount, 10) : undefined;
    const skip = start ? parseInt(start, 10) : undefined;

    return this.partsService.findAllWithStock({
      status,
      limit,
      skip,
      groupIds: parsedGroupIds,
      bikeModelId,
      random: random === true,
      sortBy: sortBy || 'sortingRank',
      sortOrder: sortOrder || 'asc',
    });
  }

  @Patch(':id/toggle-active')
  @Roles(UserRole.ADMIN)
  async toggleActive(@Param('id') id: string): Promise<any> {
    return this.partsService.toggleActive(id);
  }

  @Patch(':id/shipping-ready')
  @Roles(UserRole.ADMIN)
  async updateShippingReady(
    @Param('id') id: string,
    @Body() updateShippingReadyDto: UpdateShippingReadyDto,
  ): Promise<any> {
    return this.partsService.updateShippingReady(
      id,
      updateShippingReadyDto.shippingReady,
    );
  }

  @Patch(':id/shipping-date')
  @Roles(UserRole.ADMIN)
  async updateShippingDate(
    @Param('id') id: string,
    @Body() updateShippingDateDto: UpdateShippingDateDto,
  ): Promise<any> {
    return this.partsService.updateShippingDate(
      id,
      updateShippingDateDto.shippingDate,
    );
  }

  @Public()
  @Get('by-name/:name/with-stock')
  findOneByNameWithStock(@Param('name') name: string): Promise<any> {
    // Decode the URL-encoded name and pass it to the service
    const decodedName = decodeURIComponent(name);
    return this.partsService.findOneByName(decodedName, true);
  }

  @Public()
  @Get('by-name/:name')
  findOneByName(@Param('name') name: string): Promise<any> {
    // Decode the URL-encoded name and pass it to the service
    const decodedName = decodeURIComponent(name);
    return this.partsService.findOneByName(decodedName);
  }

  @Public()
  @Get(':id')
  findOne(@Param('id') id: string): Promise<any> {
    return this.partsService.findOne(id);
  }

  @Public()
  @Get('partGroup/by-name/:groupName')
  async findAllByGroupName(@Param('groupName') groupName: string) {
    const decodedName = decodeURIComponent(groupName);
    return this.partsService.findAllByGroupName(decodedName);
  }

  @Public()
  @Get('partGroup/:groupId')
  async findAllByGroupId(@Param('groupId') groupId: string) {
    return this.partsService.findAllByGroupId(groupId);
  }

  @Public()
  @Get('bike-model/:bikeModelId')
  async findAllByBikeModelId(@Param('bikeModelId') bikeModelId: string) {
    return this.partsService.findAllByBikeModelId(bikeModelId);
  }

  @Roles(UserRole.ADMIN)
  @Delete(':id')
  async delete(@Param('id') id: string): Promise<{ message: string }> {
    await this.partsService.remove(id);
    return { message: 'Part deleted successfully' };
  }

  @Patch('/update/:id')
  @UseInterceptors(
    FilesInterceptor('files', 40, {
      limits: {
        fileSize: 1000 * 1024 * 1024, // 1GB per file
        files: 40, // Maximum 40 files (images + videos)
        fieldSize: 100 * 1024 * 1024, // 100MB for other fields
      },
    }),
  )
  @Roles(UserRole.ADMIN)
  async update(
    @Param('id') id: string,
    @Body() updatePartDtoRaw: any,
    @UploadedFiles() files?: Array<MulterFile>,
  ): Promise<any> {
    console.log('PATCH update endpoint hit with ID:', id);
    console.log('Raw body received:', updatePartDtoRaw);
    console.log('Body type:', typeof updatePartDtoRaw);
    console.log('Body keys:', Object.keys(updatePartDtoRaw || {}));
    console.log('Files received:', files ? files.length : 0);

    if (!updatePartDtoRaw || Object.keys(updatePartDtoRaw).length === 0) {
      throw new BadRequestException('Request body is empty or invalid');
    }

    // Handle image and video uploads if provided - upload sequentially
    const newImageUrls: string[] = [];
    const newVideoUrls: string[] = [];

    if (files && files.length > 0) {
      // Separate images and videos based on MIME type
      const imageFiles = files.filter((f) => f.mimetype.startsWith('image/'));
      const videoFiles = files.filter((f) => f.mimetype.startsWith('video/'));

      // Upload images
      const imageBaseDelay =
        imageFiles.length > 6 ? 200 : imageFiles.length > 3 ? 100 : 50;
      for (let i = 0; i < imageFiles.length; i++) {
        const file = imageFiles[i];
        try {
          const delay = imageBaseDelay + i * 50;
          const uploadedUrl = await this.minioService.uploadFile(
            'crestline-parts',
            file,
            true,
            delay,
          );
          newImageUrls.push(uploadedUrl);
          console.log(
            `Successfully uploaded image ${i + 1}/${imageFiles.length}: ${file.originalname}`,
          );
        } catch (error) {
          console.error(`Failed to upload image ${file.originalname}:`, error);
          throw new BadRequestException(
            `Failed to upload image ${file.originalname}: ${error instanceof Error ? error.message : String(error)}`,
          );
        }
      }

      // Upload videos
      const videoBaseDelay =
        videoFiles.length > 6 ? 200 : videoFiles.length > 3 ? 100 : 50;
      for (let i = 0; i < videoFiles.length; i++) {
        const file = videoFiles[i];
        try {
          const delay = videoBaseDelay + i * 50;
          const uploadedUrl = await this.minioService.uploadFile(
            'crestline-parts',
            file,
            true,
            delay,
          );
          newVideoUrls.push(uploadedUrl);
          console.log(
            `Successfully uploaded video ${i + 1}/${videoFiles.length}: ${file.originalname}`,
          );
        } catch (error) {
          console.error(`Failed to upload video ${file.originalname}:`, error);
          throw new BadRequestException(
            `Failed to upload video ${file.originalname}: ${error instanceof Error ? error.message : String(error)}`,
          );
        }
      }

      console.log('New image URLs:', newImageUrls);
      console.log('New video URLs:', newVideoUrls);
    }

    // Process groups, translations, and keywords from form data
    const {
      groups,
      translations,
      keywords,
      existingImages,
      existingVideos,
      shippingDate,
      links,
      ...restProps
    } = updatePartDtoRaw;

    // Process existing images (images to keep)
    let processedExistingImages: string[] = [];
    if (existingImages) {
      if (Array.isArray(existingImages)) {
        processedExistingImages = existingImages;
      } else if (typeof existingImages === 'string') {
        processedExistingImages = existingImages
          .split(',')
          .map((img) => img.trim())
          .filter(Boolean);
      }
    }

    // Process existing videos (videos to keep)
    let processedExistingVideos: string[] = [];
    if (existingVideos) {
      if (Array.isArray(existingVideos)) {
        processedExistingVideos = existingVideos;
      } else if (typeof existingVideos === 'string') {
        processedExistingVideos = existingVideos
          .split(',')
          .map((video) => video.trim())
          .filter(Boolean);
      }
    }

    // Combine existing images with new uploaded images
    const finalImages = [...processedExistingImages, ...newImageUrls];
    console.log('Existing images to keep:', processedExistingImages);
    console.log('New images added:', newImageUrls);
    console.log('Final images array:', finalImages);

    // Combine existing videos with new uploaded videos
    const finalVideos = [...processedExistingVideos, ...newVideoUrls];
    console.log('Existing videos to keep:', processedExistingVideos);
    console.log('New videos added:', newVideoUrls);
    console.log('Final videos array:', finalVideos);

    // Process groups
    let processedGroups: string[] | undefined = undefined;
    if (groups) {
      if (Array.isArray(groups)) {
        processedGroups = groups;
      } else if (typeof groups === 'string') {
        processedGroups = groups
          .split(',')
          .map((g) => g.trim())
          .filter(Boolean);
      }
    }

    // Process translations
    let processedTranslations: any = undefined;
    if (translations) {
      if (typeof translations === 'string') {
        processedTranslations = JSON.parse(translations);
      } else {
        processedTranslations = translations;
      }
    }

    // Process keywords
    let processedKeywords: string[] | undefined = undefined;
    if (keywords) {
      if (Array.isArray(keywords)) {
        processedKeywords = keywords;
      } else if (typeof keywords === 'string') {
        processedKeywords = keywords
          .split(',')
          .map((k) => k.trim())
          .filter(Boolean);
      }
    }

    // Process links
    let processedLinks: any = undefined;
    if (links) {
      if (typeof links === 'string') {
        processedLinks = JSON.parse(links);
      } else {
        processedLinks = links;
      }
    }

    // Explicitly convert numeric and boolean fields
    const processedData = {
      ...restProps,
      // Convert numeric fields
      ...(restProps.price !== undefined
        ? { price: Number(restProps.price) }
        : {}),
      ...(restProps.initialPrice !== undefined
        ? { initialPrice: Number(restProps.initialPrice) }
        : {}),
      ...(restProps.quantity !== undefined
        ? { quantity: Number(restProps.quantity) }
        : {}),
      ...(restProps.sortingRank !== undefined
        ? { sortingRank: Number(restProps.sortingRank) }
        : {}),

      // Convert weight and dimensions
      ...(restProps.weight !== undefined
        ? { weight: Number(restProps.weight) }
        : {}),
      ...(restProps.width !== undefined
        ? { width: Number(restProps.width) }
        : {}),
      ...(restProps.height !== undefined
        ? { height: Number(restProps.height) }
        : {}),
      ...(restProps.length !== undefined
        ? { length: Number(restProps.length) }
        : {}),

      // Convert boolean fields
      ...(restProps.active !== undefined
        ? { active: restProps.active === 'true' || restProps.active === true }
        : {}),

      // Pass shipping ready status if provided
      ...(restProps.shippingReady !== undefined
        ? { shippingReady: restProps.shippingReady }
        : {}),

      // Pass shipping date if provided
      ...(shippingDate !== undefined ? { shippingDate } : {}),
    };

    // Create the update DTO with processed arrays and converted data
    const updatePartDto = {
      ...processedData,
      groups: processedGroups,
      translations: processedTranslations,
      links: processedLinks,
      ...(processedKeywords ? { keywords: processedKeywords } : {}),
      // Use combined images (existing + new) if any images are provided
      ...(finalImages.length > 0 ? { images: finalImages } : {}),
      // Use combined videos (existing + new) if any videos are provided
      ...(finalVideos.length > 0 ? { videos: finalVideos } : {}),
    };

    console.log('Processed DTO being sent to service:', updatePartDto);

    return this.partsService.update(id, updatePartDto);
  }

  // Stock management endpoints for dropdown options
  @Patch(':id/option-stock')
  // @Roles(UserRole.ADMIN)
  @Public()
  async updateOptionStock(
    @Param('id') partId: string,
    @Body() updateOptionStockDto: UpdateOptionStockDto,
  ): Promise<any> {
    const { optionId, optionItemId, quantity } = updateOptionStockDto;
    return this.partsService.updateOptionStock(
      partId,
      optionId,
      optionItemId,
      quantity,
    );
  }

  @Get(':id/option-stock')
  @Roles(UserRole.ADMIN)
  async getOptionStock(
    @Param('id') partId: string,
    @Query('optionId') optionId?: string,
    @Query('optionItemId') optionItemId?: string,
  ): Promise<any[]> {
    return this.partsService.getOptionStock(partId, optionId, optionItemId);
  }

  @Get(':id/with-stock')
  @Public()
  async getPartWithStock(@Param('id') partId: string): Promise<any> {
    return this.partsService.findOne(partId, true);
  }

  @Post(':id/accessories')
  @Roles(UserRole.ADMIN)
  async setAccessories(
    @Param('id') partId: string,
    @Body() body: { accessoryIds: string[] },
  ): Promise<any> {
    if (!body.accessoryIds || !Array.isArray(body.accessoryIds)) {
      throw new BadRequestException(
        'accessoryIds must be provided as an array',
      );
    }
    return this.partsService.setAccessories(partId, body.accessoryIds);
  }

  @Post(':id/bike-models')
  @Roles(UserRole.ADMIN)
  async setBikeModels(
    @Param('id') partId: string,
    @Body() body: { bikeModelIds: string[] },
  ): Promise<any> {
    if (!body.bikeModelIds || !Array.isArray(body.bikeModelIds)) {
      throw new BadRequestException(
        'bikeModelIds must be provided as an array',
      );
    }
    return this.partsService.setBikeModels(partId, body.bikeModelIds);
  }

  @Post(':id/filament-types')
  @Roles(UserRole.ADMIN)
  async setFilamentTypes(
    @Param('id') partId: string,
    @Body() body: { filamentTypeIds: string[] },
  ): Promise<any> {
    if (!body.filamentTypeIds || !Array.isArray(body.filamentTypeIds)) {
      throw new BadRequestException(
        'filamentTypeIds must be provided as an array',
      );
    }
    return this.partsService.setFilamentTypes(partId, body.filamentTypeIds);
  }

  @Get(':id/available-colors')
  @Public()
  async getAvailableColorsForPart(@Param('id') partId: string): Promise<any> {
    return this.partsService.getAvailableColorsForPart(partId);
  }
}
