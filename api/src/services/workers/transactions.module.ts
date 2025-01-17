import { Module } from '@nestjs/common'
import { BullModule } from '@nestjs/bullmq'
import { ConfigModule, ConfigService } from '@nestjs/config'
import { redisFactory } from '../../factories/redis.factory'
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
        BullModule.registerQueue({ name: EQueue.Transactions }),
        ElastichModule,
    ],
    providers: [TransactionsProcessor],
})
export class TransactionModule {}
