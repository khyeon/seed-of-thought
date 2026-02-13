import { Module } from '@nestjs/common';
import { SeedsService } from './seeds.service';
import { SeedsController } from './seeds.controller';

@Module({
  providers: [SeedsService],
  controllers: [SeedsController]
})
export class SeedsModule {}
