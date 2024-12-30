import { Test, TestingModule } from '@nestjs/testing';
import { BlocksyncService } from './blocksync.service';

describe('BlocksyncService', () => {
  let service: BlocksyncService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [BlocksyncService],
    }).compile();

    service = module.get<BlocksyncService>(BlocksyncService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
