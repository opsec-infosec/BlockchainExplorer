import { OnWorkerEvent, Processor, WorkerHost } from '@nestjs/bullmq'
import { EQueue } from '../../enum/queue.enum'
import { Job } from 'bullmq'
import { Inject, Logger } from '@nestjs/common'
import { Block } from 'bitcoinjs-lib'
import { EsSearchService } from '../elasticsearch/elasticsearch.service'
import { ElasticsearchService } from '@nestjs/elasticsearch'
import { BlockInfo } from '../utilities/block'

@Processor(EQueue.Transactions)
export class TransactionsProcessor extends WorkerHost {
    private logger = new Logger('TransactionProcessor')
    constructor(@Inject(EsSearchService) readonly esSearch: ElasticsearchService) {
        super()
    }

    async process(job: Job<string, any, any>) {
        const blk = Block.fromHex(job.data)

        const txs = BlockInfo.getTransactions(blk)

        let txDone = txs.length
        await this.esSearch.helpers
            .bulk({
                datasource: txs,
                concurrency: 10,
                onDocument(doc) {
                    job.updateProgress(((txs.length - txDone) / txs.length) * 100)
                    txDone--

                    const month = blk.getUTCDate().getUTCMonth() + 1
                    const year = blk.getUTCDate().getUTCFullYear()

                    return [
                        {
                            create: {
                                _index: `transactions-${year}.${month < 10 ? '0' + month : '' + month}`,
                                _id: doc.txid,
                            },
                        },
                        {
                            ...doc,
                            block: { ...BlockInfo.getHash(blk) },
                            blockDate: BlockInfo.getDate(blk),
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
