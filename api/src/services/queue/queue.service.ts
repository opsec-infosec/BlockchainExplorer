import { InjectQueue } from '@nestjs/bullmq'
import { Injectable } from '@nestjs/common'
import { EJobQueue, EQueue } from '../../enum/queue.enum'
import { Queue } from 'bullmq'
import { IBullMqJob } from '../../interfaces/queue.interface'

@Injectable()
export class QueueService {
    constructor(@InjectQueue(EQueue.Block) private blockParse: Queue) {}

    async addBlockJob(file: string) {
        this.blockParse.add(EJobQueue.BlockParse, file, { jobId: file })
    }

    async addBulkBlockJob(files: string[]) {
        const bulkReq: IBullMqJob[] = []

        files.forEach((file) => {
            bulkReq.push({ name: EJobQueue.BlockParse, data: file, opts: { jobId: file } })
        })

        this.blockParse.addBulk(bulkReq)
    }
}
