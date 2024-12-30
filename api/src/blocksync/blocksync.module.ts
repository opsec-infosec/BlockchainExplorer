import { Module } from '@nestjs/common'
import { BlocksyncService } from './blocksync.service'
import { QueueModule } from '../services/queue/queue.module'

@Module({
    imports: [QueueModule],
    providers: [BlocksyncService],
})
export class BlocksyncModule {}
