import { Module } from '@nestjs/common';
import { BlogController } from './blog.controller';
import { BlogService } from './blog.service';
import { PrismaService } from 'prisma/prisma.service';
import { MinioService } from 'src/storage/minio.service';

@Module({
  controllers: [BlogController],
  providers: [BlogService, PrismaService, MinioService],
  exports: [BlogService],
})
export class BlogModule {}
