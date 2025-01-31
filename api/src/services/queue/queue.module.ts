import { BullModule } from '@nestjs/bullmq'
import { Module } from '@nestjs/common'
import { ConfigModule, ConfigService } from '@nestjs/config'
import { redisFactory } from '../../factories/redis.factory'
import { QueueService } from './queue.service'
import { EQueue } from '../../enum/queue.enum'

@Module({
    imports: [
        BullModule.forRootAsync({
            imports: [ConfigModule],
            useFactory: redisFactory,
            inject: [ConfigService],
        }),
        BullModule.registerFlowProducer({ name: EQueue.Block }),
    ],
    exports: [QueueService],
    providers: [QueueService],
})
export class QueueModule {}
