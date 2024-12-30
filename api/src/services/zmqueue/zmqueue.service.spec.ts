import { Test, TestingModule } from '@nestjs/testing';
import { ZmqueueService } from './zmqueue.service';

describe('ZmqueueService', () => {
  let service: ZmqueueService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [ZmqueueService],
    }).compile();

    service = module.get<ZmqueueService>(ZmqueueService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
