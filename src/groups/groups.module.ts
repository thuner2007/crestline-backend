import { Module } from '@nestjs/common';
import { GroupsController } from './groups.controller';
import { GroupsService } from './groups.service';
import { PrismaService } from 'prisma/prisma.service';
import { MinioService } from 'src/storage/minio.service';

@Module({
  controllers: [GroupsController],
  providers: [GroupsService, PrismaService, MinioService],
  exports: [GroupsService],
})
export class GroupsModule {}
