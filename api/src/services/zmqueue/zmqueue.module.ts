import { Module } from '@nestjs/common'
import { ZmqueueService } from './zmqueue.service'

@Module({
    providers: [ZmqueueService],
})
export class ZmqueueModule {}
