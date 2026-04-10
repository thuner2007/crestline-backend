import { Module } from '@nestjs/common';
import { LifeCheckController } from './life-check.controller';

@Module({
  controllers: [LifeCheckController],
})
export class LifeCheckModule {}
