import { OnWorkerEvent, Processor, WorkerHost } from '@nestjs/bullmq'
import { EQueue } from '../../enum/queue.enum'
import { Job } from 'bullmq'
import { Logger } from '@nestjs/common'
import { Block } from 'bitcoinjs-lib'
import { BlockInfo } from './block'

@Processor(EQueue.Elastic)
export class ElasticProcessor extends WorkerHost {
    private logger = new Logger('ElasticProcessor')
    constructor() {
        super()
    }

    async process(job: Job<string, any, any>) {
        const blk = Block.fromHex(job.data)
        //this.logger.log(BlockInfo.getHash(blk).hash)
        // console.log(BlockInfo.getInfo(blk))
        // this.logger.log(BlockInfo.getTransactions(blk))
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
