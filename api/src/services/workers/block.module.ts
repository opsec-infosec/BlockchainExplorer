import { Module } from '@nestjs/common'
import { BullModule } from '@nestjs/bullmq'
import { ConfigModule, ConfigService } from '@nestjs/config'
import { redisFactory } from '../../factories/redis.factory'
import { BlkProcessor } from './block.workers'
import { EQueue } from '../../enum/queue.enum'
import { ElastichModule } from '../elasticsearch/elasticsearch.module'

@Module({
    imports: [
        ConfigModule.forRoot({ isGlobal: true }),
        BullModule.forRootAsync({
            imports: [ConfigModule],
            useFactory: redisFactory,
            inject: [ConfigService],
        }),
        BullModule.registerQueue({ name: EQueue.Transactions }),
        BullModule.registerFlowProducerAsync({ name: EQueue.Block }),
        ElastichModule,
    ],
    providers: [BlkProcessor],
})
export class BlockModule {}
