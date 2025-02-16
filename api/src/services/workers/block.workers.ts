import { InjectQueue, OnWorkerEvent, Processor, WorkerHost } from '@nestjs/bullmq'
import { DelayedError, Job, Queue, WaitingChildrenError } from 'bullmq'
import { Inject, Logger, OnModuleDestroy, OnModuleInit } from '@nestjs/common'
import { ConfigService } from '@nestjs/config'
import { readFileSync } from 'fs'
import { BlockInfo, ReadFileBlock } from '../utilities/block'
import { EJobQueue, EQueue, EQueuePriority } from '../../enum/queue.enum'
import { ElasticsearchService } from '@nestjs/elasticsearch'
import { EsSearchService } from '../elasticsearch/elasticsearch.service'
import { IBlockData } from '../../interfaces/queue.interface'
import { clearInterval, setInterval } from 'timers'

@Processor(EQueue.Block)
export class BlkProcessor extends WorkerHost implements OnModuleDestroy, OnModuleInit {
    private dataPath = this.configService.getOrThrow('DATA_PATH')
    private redisAllowedMem = Number(this.configService.get('REDIS_MEM', 5))
    private logger = new Logger(`BlockProcessor`)

    private redisMemoryConsumed: number
    private interval: NodeJS.Timeout

    constructor(
        private readonly configService: ConfigService,
        @Inject(EsSearchService) readonly esSearch: ElasticsearchService,
        @InjectQueue(EQueue.Transactions) private transactions: Queue,
    ) {
        super()
    }

    async process(job: Job<IBlockData, any, any>, token?: string) {
        const jobDependencies = await job.getDependenciesCount()

        if (!jobDependencies.unprocessed && jobDependencies.processed) {
            job.updateProgress(100)
            return
        }

        if (this.redisMemoryConsumed >= this.redisAllowedMem) {
            job.moveToDelayed(Date.now(), token)
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
        let txCount = 0

        for (const b of blk) {
            const blkInfo = BlockInfo.getInfo(b)

            await this.esSearch
                .update({
                    index: `blocks`,
                    id: blkInfo.hash,
                    doc: { ...blkInfo },
                    doc_as_upsert: true,
                    detect_noop: true,
                })
                .catch((ex) => {
                    this.logger.error('Failed to update Elastic Search: ', ex)
                    throw new Error(ex)
                })
                .then(async (data) => {
                    if (data?.result !== 'noop') {
                        if (
                            blkInfo.prevHash !==
                            '0000000000000000000000000000000000000000000000000000000000000000'
                        ) {
                            await this.esSearch
                                .update({
                                    index: `blocks`,
                                    id: blkInfo.prevHash,
                                    doc: { nextHash: blkInfo.hash },
                                    doc_as_upsert: true,
                                })
                                .catch((ex) => {
                                    this.logger.error(`Error Updating Document: ${ex.message}`)
                                })
                        }

                        this.transactions.add(
                            EJobQueue.TransactionParse,
                            {
                                blockInfo: {
                                    hash: blkInfo.hash,
                                    prevHash: blkInfo.prevHash,
                                    blockDate: blkInfo.blockDate,
                                },
                                block: b.toHex(),
                            },
                            {
                                jobId: b.getId(),
                                parent: {
                                    id: job.id,
                                    queue: job.queueQualifiedName,
                                },
                                removeOnComplete: true,
                                removeOnFail: 500,
                                delay: txCount ? 0 : 1000,
                            },
                        )

                        txCount++
                    }
                })
            job.updateProgress(((blk.length - recDone) / blk.length) * 100)
            recDone--
        }

        if (txCount) {
            await job.updateData({ file: job.data.file, workerId: this.worker.id })
            await job.changePriority({ priority: EQueuePriority.Processed })
            await job.moveToWaitingChildren(token)

            this.logger.log(
                `Job ${job.id} ${job.name.toUpperCase()} Waiting for Transactions to Complete`,
            )
            throw new WaitingChildrenError()
        }
    }

    private async checkRedisMem() {
        const redisClient = await this.transactions.client.catch((ex) => {
            throw ex
        })

        const clientMemory = await redisClient.info('memory').catch((ex) => {
            throw ex
        })

        const usedMemory = parseInt(clientMemory.match(/used_memory:(\d+)/)[1], 10)
        const sysMemory = parseInt(clientMemory.match(/system_memory:(\d+)/)[1], 10)
        const percentUsage = usedMemory / sysMemory

        return percentUsage * 100
    }

    @OnWorkerEvent('completed')
    onCompleted(job: Job<IBlockData, any, string>) {
        this.logger.log(`Job ${job.id} ${job.name.toUpperCase()} Transactions and Block Complete`)
    }

    @OnWorkerEvent('failed')
    onFailed(job: Job<IBlockData, any, string>) {
        job.changePriority({ priority: EQueuePriority.Failed })
        this.logger.error(`Job ${job.id} ${job.name.toUpperCase()} Failed`)
    }

    onModuleDestroy() {
        if (this.interval) {
            clearInterval(this.interval)
        }
    }

    async onModuleInit() {
        this.redisMemoryConsumed = await this.checkRedisMem()

        this.interval = setInterval(async () => {
            this.redisMemoryConsumed = await this.checkRedisMem().catch((ex) => {
                return this.redisAllowedMem
            })
        }, 30000)
    }
}
