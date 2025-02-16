import { Inject, Module, OnModuleDestroy } from '@nestjs/common'
import { BullModule } from '@nestjs/bullmq'
import { ConfigModule, ConfigService } from '@nestjs/config'
import { redisFactory } from '../../factories/redis.factory'
import { BlkProcessor } from './block.workers'
import { EQueue } from '../../enum/queue.enum'
import { ElastichModule } from '../elasticsearch/elasticsearch.module'
import { EsSearchService } from '../elasticsearch/elasticsearch.service'
import { ElasticsearchService } from '@nestjs/elasticsearch'

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
export class BlockModule {
    constructor(@Inject(EsSearchService) readonly esSearch: ElasticsearchService) {
        esSearch.indices
            .putIndexTemplate({
                name: 'bitcoind.blocks',
                index_patterns: 'blocks',
                template: {
                    settings: {
                        number_of_shards: 2,
                        number_of_replicas: 1,
                    },
                    mappings: {
                        properties: {
                            bits: {
                                type: 'long',
                            },
                            blockDate: {
                                type: 'date',
                            },
                            hash: {
                                type: 'text',
                                fields: {
                                    keyword: {
                                        type: 'keyword',
                                        ignore_above: 256,
                                    },
                                },
                            },
                            inputs: {
                                type: 'long',
                            },
                            nextHash: {
                                type: 'text',
                                fields: {
                                    keyword: {
                                        type: 'keyword',
                                        ignore_above: 256,
                                    },
                                },
                            },
                            nonce: {
                                type: 'long',
                            },
                            outputs: {
                                type: 'long',
                            },
                            prevHash: {
                                type: 'text',
                                fields: {
                                    keyword: {
                                        type: 'keyword',
                                        ignore_above: 256,
                                    },
                                },
                            },
                            size: {
                                type: 'long',
                            },
                            txCount: {
                                type: 'long',
                            },
                            weight: {
                                type: 'long',
                            },
                            witness: {
                                type: 'long',
                            },
                        },
                    },
                },
                allow_auto_create: true,
            })
            .catch((ex) => {
                throw ex
            })
    }
}
