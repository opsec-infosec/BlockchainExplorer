import { InjectQueue } from '@nestjs/bullmq'
import { Injectable } from '@nestjs/common'
import { EJobQueue, EQueue } from '../../enum/queue.enum'
import { Queue } from 'bullmq'
import { IBullMqJob } from '../../interfaces/queue.interface'
import { ConfigService } from '@nestjs/config'

@Injectable()
export class QueueService {
    private latestFirst =
        String(this.configService.get<boolean>('LATEST_FIRST', false)).toLowerCase() == 'true'

    constructor(
        @InjectQueue(EQueue.Block) private blockParse: Queue,
        private configService: ConfigService,
    ) {}

    async addBlockJob(file: string) {
        this.blockParse.add(EJobQueue.BlockParse, file, { jobId: file, lifo: true })
    }

    async addBulkBlockJob(files: string[]) {
        const bulkReq: IBullMqJob[] = []

        if (this.latestFirst) {
            files.sort((a, b) => b.localeCompare(a))
        }

        files.forEach((file) => {
            bulkReq.push({
                name: EJobQueue.BlockParse,
                data: file,
                opts: { jobId: file },
            })
        })

        this.blockParse.addBulk(bulkReq)
    }
}
