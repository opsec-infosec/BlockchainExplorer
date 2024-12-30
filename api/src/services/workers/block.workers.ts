import { InjectQueue, OnWorkerEvent, Processor, WorkerHost } from '@nestjs/bullmq'
import { Job, Queue } from 'bullmq'
import { Logger } from '@nestjs/common'
import { ConfigService } from '@nestjs/config'
import { readFileSync } from 'fs'
import { BlockInfo, ReadFileBlock } from './block'
import { EQueue } from '../../enum/queue.enum'

@Processor(EQueue.Block)
export class BlkProcessor extends WorkerHost {
    private dataPath = this.configService.getOrThrow('DATA_PATH')
    private logger = new Logger('BlockProcessor')

    constructor(
        private readonly configService: ConfigService,
        @InjectQueue(EQueue.Elastic) private elasticStore: Queue,
    ) {
        super()
    }

    async process(job: Job<string, any, any>) {
        const data = readFileSync(this.dataPath + job.data)

        const blk = await new ReadFileBlock(data).parse().catch((ex) => {
            throw Error('Failed to parse Block')
        })

        let recDone = blk.length
        blk.forEach((b) => {
            this.elasticStore.add(EQueue.Elastic, b.toHex(), {
                jobId: BlockInfo.getHash(b).hash,
            })
            job.updateProgress(((blk.length - recDone) / blk.length) * 100)
            recDone--
        })
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
