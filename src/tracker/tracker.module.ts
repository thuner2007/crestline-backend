import { Logger, Module } from '@nestjs/common';
import { TrackerGateway } from './websocket/tracker.gateway';
import { TrackerService } from './tracker.service';
import { TrackerController } from './tracker.controller';
import { PrismaService } from 'prisma/prisma.service';

@Module({
  providers: [TrackerGateway, TrackerService, PrismaService, Logger],
  controllers: [TrackerController],
})
export class TrackerModule {}
