import {
    Controller,
    Post,
    UseInterceptors,
    UploadedFile,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { OcrService } from './ocr.service';

@Controller('ocr')
export class OcrController {
    constructor(private readonly ocrService: OcrService) { }

    @Post('detect')
    @UseInterceptors(FileInterceptor('image'))
    async detectText(@UploadedFile() file: any) {
        return this.ocrService.detectText(file.buffer);
    }
}
