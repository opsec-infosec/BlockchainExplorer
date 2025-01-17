import { InjectQueue, OnWorkerEvent, Processor, WorkerHost } from '@nestjs/bullmq'
import { DelayedError, Job, Queue, WaitingChildrenError } from 'bullmq'
import { Inject, Logger } from '@nestjs/common'
import { ConfigService } from '@nestjs/config'
import { readFileSync } from 'fs'
import { BlockInfo, ReadFileBlock } from '../utilities/block'
import { EJobQueue, EQueue } from '../../enum/queue.enum'
import { ElasticsearchService } from '@nestjs/elasticsearch'
import { EsSearchService } from '../elasticsearch/elasticsearch.service'
import { IBlockData } from '../../interfaces/queue.interface'

@Processor(EQueue.Block)
export class BlkProcessor extends WorkerHost {
    private dataPath = this.configService.getOrThrow('DATA_PATH')
    private logger = new Logger('BlockProcessor')
    private wait = undefined

    constructor(
        private readonly configService: ConfigService,
        @Inject(EsSearchService) readonly esSearch: ElasticsearchService,
        @InjectQueue(EQueue.Transactions) private transactions: Queue,
    ) {
        super()
    }

    async process(job: Job<IBlockData, any, any>, token?: string) {
        if (job.data.complete) {
            if (this.wait === job.id) {
                this.logger.log(
                    `Job ${job.id} ${job.name.toUpperCase()} Transactions and Block Complete`,
                )
                job.updateProgress(100)
                return
            } else if (this.wait !== undefined) {
                await job.changePriority({ priority: 0 })
                job.moveToDelayed(Date.now())
                throw new DelayedError()
            }
        }

        if (this.wait) {
            job.moveToDelayed(Date.now() + 30000, token)
            throw new DelayedError()
        }

        this.logger.log(`Job ${job.data.file} ${job.name.toUpperCase()} Started`)
        const data = readFileSync(this.dataPath + job.data.file)

        // Parse the blkxxxx.dat file, if we encounder and error, we throw
        //  This could be because we have an incomplete .dat file with out all the blocks
        //  throwing the error will cause the queue to retry
        const blk = await new ReadFileBlock(data).parse().catch((ex) => {
            this.logger.error(`Failed to parse Block: ${ex.message}`)
            throw new Error(`Failed to parse Block: ${ex.message}`)
        })

        let recDone = blk.length

        for (const b of blk) {
            await this.esSearch
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
                })
                .then(async (data) => {
                    if (data) {
                        this.transactions.add(EJobQueue.TransactionParse, b.toHex(), {
                            jobId: b.getId(),
                            parent: {
                                id: job.id,
                                queue: job.queueQualifiedName,
                            },
                            removeOnComplete: true,
                            removeOnFail: 500,
                        })
                    }
                })
            job.updateProgress(((blk.length - recDone) / blk.length) * 100)
            recDone--
        }

        await job.updateData({ complete: true, file: job.data.file })

        await job.moveToWaitingChildren(token)
        this.wait = job.id

        this.logger.log(
            `Job ${job.id} ${job.name.toUpperCase()} Waiting for Transactions to Complete`,
        )
        throw new WaitingChildrenError()
    }

    @OnWorkerEvent('completed')
    onCompleted(job: Job<IBlockData, any, string>) {
        this.logger.log(`Job ${job.id} ${job.name.toUpperCase()} Completed`)
        this.wait = undefined
    }

    @OnWorkerEvent('failed')
    onFailed(job: Job<IBlockData, any, string>) {
        this.logger.error(`Job ${job.id} ${job.name.toUpperCase()} Failed`)
        this.wait = undefined
    }
}
