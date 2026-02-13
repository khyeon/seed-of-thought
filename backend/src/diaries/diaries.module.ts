import { Module } from '@nestjs/common';
import { DiariesService } from './diaries.service';
import { DiariesController } from './diaries.controller';

@Module({
  providers: [DiariesService],
  controllers: [DiariesController]
})
export class DiariesModule {}
