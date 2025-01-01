import { InjectQueue, OnWorkerEvent, Processor, WorkerHost } from '@nestjs/bullmq'
import { Job, Queue } from 'bullmq'
import { Inject, Logger } from '@nestjs/common'
import { ConfigService } from '@nestjs/config'
import { readFileSync } from 'fs'
import { BlockInfo, ReadFileBlock } from './block'
import { EQueue } from '../../enum/queue.enum'
import { ElasticsearchService } from '@nestjs/elasticsearch'
import { EsSearchService } from '../elasticsearch/elasticsearch.service'

@Processor(EQueue.Block)
export class BlkProcessor extends WorkerHost {
    private dataPath = this.configService.getOrThrow('DATA_PATH')
    private logger = new Logger('BlockProcessor')

    constructor(
        private readonly configService: ConfigService,
        @Inject(EsSearchService) readonly esSearch: ElasticsearchService,
        @InjectQueue(EQueue.Transactions) private transactions: Queue,
    ) {
        super()
    }

    async process(job: Job<string, any, any>) {
        this.logger.log(`Job ${job.data} ${EQueue.Block} Started`)
        const data = readFileSync(this.dataPath + job.data)

        // Parse the blkxxxx.dat file, if we encounder and error, we throw
        //  This could be because we have an incomplete .dat file with out all the blocks
        //  throwing the error will cause the queue to retry
        const blk = await new ReadFileBlock(data).parse().catch((ex) => {
            this.logger.error(`Failed to parse Block: ${ex.message}`)
            throw new Error(`Failed to parse Block: ${ex.message}`)
        })

        let recDone = blk.length

        for (const b of blk) {
            if (
                !(await this.esSearch
                    .create({
                        index: 'blocks',
                        id: BlockInfo.getHash(b).hash,
                        document: { ...BlockInfo.getInfo(b) },
                    })
                    .catch((ex) => {
                        // if we encounter a 409, it means that a block with this hash is already in elasticsearch
                        if (ex?.body?.status === 409) {
                            return undefined
                        }

                        this.logger.error('Failed to update Elastic Search: ', ex)
                        throw new Error(ex)
                    }))
            ) {
                break
            }

            await this.transactions
                .add(EQueue.Transactions, b.toHex(), { jobId: BlockInfo.getHash(b).hash })
                .catch((ex) => {
                    this.logger.error('Failed to add Transaction Queue: ', ex)
                    throw new Error(ex)
                })
            job.updateProgress(((blk.length - recDone) / blk.length) * 100)
            recDone--
        }
        job.updateProgress(100)
    }

    @OnWorkerEvent('completed')
    onCompleted(job: Job<string, any, string>) {
        this.logger.log(`Job ${job.id} ${job.name.toUpperCase()} Completed`)
    }

    @OnWorkerEvent('failed')
    onFailed(job: Job<string, any, string>) {
        this.logger.error(`Job ${job.id} ${job.name.toUpperCase()} Failed`)
    }
}
