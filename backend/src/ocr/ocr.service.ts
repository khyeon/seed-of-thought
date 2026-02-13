import { Injectable, HttpException, HttpStatus } from '@nestjs/common';
import { ImageAnnotatorClient } from '@google-cloud/vision';

@Injectable()
export class OcrService {
    private client: ImageAnnotatorClient;

    constructor() {
        if (process.env.GOOGLE_VISION_API_KEY) {
            this.client = new ImageAnnotatorClient({
                apiKey: process.env.GOOGLE_VISION_API_KEY,
            });
        }
    }

    async detectText(imageBuffer: Buffer) {
        if (!this.client) {
            // Mock for development if no API key
            return {
                text: '가장 중요한 것은 눈에 보이지 않아. 마음으로 보아야 잘 보인단다.',
                confidence: 0.98,
            };
        }

        try {
            const [result] = await this.client.textDetection(imageBuffer);
            const detections = result.textAnnotations;

            if (!detections || detections.length === 0) {
                throw new HttpException('No text found in image', HttpStatus.BAD_REQUEST);
            }

            // First entry is the full text
            return {
                text: detections[0].description,
                confidence: 0.95, // Simplified for MVP
            };
        } catch (error) {
            throw new HttpException(
                'OCR process failed',
                HttpStatus.INTERNAL_SERVER_ERROR,
            );
        }
    }
}
