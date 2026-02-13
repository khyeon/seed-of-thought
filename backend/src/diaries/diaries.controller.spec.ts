import { Test, TestingModule } from '@nestjs/testing';
import { DiariesController } from './diaries.controller';

describe('DiariesController', () => {
  let controller: DiariesController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [DiariesController],
    }).compile();

    controller = module.get<DiariesController>(DiariesController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
