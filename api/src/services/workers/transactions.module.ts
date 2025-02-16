import { Inject, Module } from '@nestjs/common'
import { BullModule } from '@nestjs/bullmq'
import { ConfigModule, ConfigService } from '@nestjs/config'
import { redisFactory } from '../../factories/redis.factory'
import { EQueue } from '../../enum/queue.enum'
import { TransactionsProcessor } from './transactions.worker'
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
        ElastichModule,
    ],
    providers: [TransactionsProcessor],
})
export class TransactionModule {
    constructor(@Inject(EsSearchService) readonly esSearch: ElasticsearchService) {
        esSearch.indices
            .putIndexTemplate({
                name: 'bitcoind.transactions',
                index_patterns: ['transactions-*'],
                template: {
                    aliases: { transactions: {} },
                    settings: {
                        number_of_shards: 2,
                        number_of_replicas: 1,
                    },
                    mappings: {
                        properties: {
                            block: {
                                properties: {
                                    date: {
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
                                    prevHash: {
                                        type: 'text',
                                        fields: {
                                            keyword: {
                                                type: 'keyword',
                                                ignore_above: 256,
                                            },
                                        },
                                    },
                                },
                            },
                            locktime: {
                                type: 'long',
                            },
                            pos: {
                                type: 'long',
                            },
                            size: {
                                type: 'long',
                            },
                            txid: {
                                type: 'text',
                                fields: {
                                    keyword: {
                                        type: 'keyword',
                                        ignore_above: 256,
                                    },
                                },
                            },
                            txis: {
                                properties: {
                                    coinbase: {
                                        type: 'boolean',
                                    },
                                    index: {
                                        type: 'long',
                                    },
                                    sequence: {
                                        type: 'long',
                                    },
                                    txid: {
                                        type: 'text',
                                        fields: {
                                            keyword: {
                                                type: 'keyword',
                                                ignore_above: 256,
                                            },
                                        },
                                    },
                                },
                            },
                            txos: {
                                properties: {
                                    BTC: {
                                        type: 'long',
                                    },
                                    address: {
                                        type: 'text',
                                        fields: {
                                            keyword: {
                                                type: 'keyword',
                                                ignore_above: 256,
                                            },
                                        },
                                    },
                                },
                            },
                            version: {
                                type: 'long',
                            },
                            weight: {
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
