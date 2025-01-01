import { Module } from '@nestjs/common'
import { BullModule } from '@nestjs/bullmq'
import { ConfigModule, ConfigService } from '@nestjs/config'
import { redisFactory } from '../../factories/redis.factory'
import { BlkProcessor } from './block.workers'
import { EQueue } from '../../enum/queue.enum'
import { TransactionsProcessor } from './transactions.worker'
import { ElastichModule } from '../elasticsearch/elasticsearch.module'

@Module({
    imports: [
        ConfigModule.forRoot({ isGlobal: true }),
        BullModule.forRootAsync({
            imports: [ConfigModule],
            useFactory: redisFactory,
            inject: [ConfigService],
        }),
        BullModule.registerQueueAsync({ name: EQueue.Block }, { name: EQueue.Transactions }),
        ElastichModule,
    ],
    providers: [BlkProcessor, TransactionsProcessor],
})
export class WorkersModule {}
