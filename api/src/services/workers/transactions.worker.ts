import { OnWorkerEvent, Processor, WorkerHost } from '@nestjs/bullmq'
import { EQueue } from '../../enum/queue.enum'
import { Job } from 'bullmq'
import { Inject, Logger } from '@nestjs/common'
import { Block } from 'bitcoinjs-lib'
import { EsSearchService } from '../elasticsearch/elasticsearch.service'
import { ElasticsearchService } from '@nestjs/elasticsearch'
import { BlockInfo } from '../utilities/block'
import { IBlockTransactionData } from '../../interfaces/block.interface'

@Processor(EQueue.Transactions)
export class TransactionsProcessor extends WorkerHost {
    private logger = new Logger('TransactionProcessor')
    constructor(@Inject(EsSearchService) readonly esSearch: ElasticsearchService) {
        super()
    }

    async process(job: Job<IBlockTransactionData, any, any>) {
        const blk = Block.fromHex(job.data.block)

        const txs = BlockInfo.getTransactions(blk)

        const blkDate = new Date(job.data.blockInfo.blockDate)
        const month = blkDate.getUTCMonth() + 1
        const year = blkDate.getUTCFullYear()

        let txDone = txs.length
        await this.esSearch.helpers
            .bulk({
                datasource: txs,
                concurrency: 1,
                onDocument(doc) {
                    job.updateProgress(((txs.length - txDone) / txs.length) * 100)
                    txDone--

                    return [
                        {
                            create: {
                                _index: `transactions-${year}.${month < 10 ? '0' + month : '' + month}`,
                                _id: doc.txid,
                            },
                        },
                        {
                            ...doc,
                            block: {
                                hash: job.data.blockInfo.hash,
                                prevHash: job.data.blockInfo.prevHash,
                                date: job.data.blockInfo.blockDate,
                            },
                        },
                    ]
                },
            })
            .catch((ex) => {
                this.logger.error(`Failed to update Elastic Search: ${ex.message}`)
                throw new Error(ex)
            })

        job.updateProgress(100)
    }

    // @OnWorkerEvent('completed')
    // onComplete(job: Job<string, any, string>) {
    //     this.logger.log(`Job ${job.id} ${job.name.toUpperCase()} Completed`)
    // }

    @OnWorkerEvent('failed')
    onFailed(job: Job<string, any, string>) {
        this.logger.error(`Job ${job.id} ${job.name.toUpperCase()} Failed`)
    }
}
