import { Module } from '@nestjs/common';
import { DiariesService } from './diaries.service';
import { DiariesController } from './diaries.controller';
import { DiariesCorrectionService } from './diaries-correction.service';
import { DiariesCorrectionController } from './diaries-correction.controller';

import { ChatModule } from '../chat/chat.module';

@Module({
  imports: [ChatModule],
  providers: [DiariesService, DiariesCorrectionService],
  controllers: [DiariesController, DiariesCorrectionController]
})
export class DiariesModule { }
