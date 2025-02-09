import { InjectFlowProducer } from '@nestjs/bullmq'
import { Injectable } from '@nestjs/common'
import { EJobQueue, EQueue, EQueuePriority } from '../../enum/queue.enum'
import { FlowJob, FlowProducer } from 'bullmq'
import { ConfigService } from '@nestjs/config'

@Injectable()
export class QueueService {
    private latestFirst =
        String(this.configService.get<boolean>('LATEST_FIRST', false)).toLowerCase() == 'true'

    constructor(
        @InjectFlowProducer(EQueue.Block) private blockFlowParse: FlowProducer,
        private configService: ConfigService,
    ) {}

    async addBlockJob(file: string) {
        this.blockFlowParse.add(
            {
                name: EJobQueue.BlockParse,
                data: { file: file, complete: false },
                queueName: EQueue.Block,
                opts: { jobId: file, priority: EQueuePriority.Queue },
                children: [],
            },
            {
                queuesOptions: {
                    [EQueue.Block]: {
                        defaultJobOptions: {
                            priority: EQueuePriority.Queue,
                            removeOnComplete: false,
                            removeOnFail: 500,
                            delay: 10000,
                            attempts: 10,
                            backoff: {
                                type: 'exponential',
                                delay: 1000,
                            },
                        },
                    },
                },
            },
        )
    }

    async addBulkBlockJob(files: string[]) {
        const bulkReq: FlowJob[] = []

        if (this.latestFirst) {
            files.sort((a, b) => b.localeCompare(a))
        }

        files.forEach((file) => {
            bulkReq.push({
                name: EJobQueue.BlockParse,
                data: { file: file, complete: false },
                queueName: EQueue.Block,
                children: [],
                opts: {
                    jobId: file,
                    priority: EQueuePriority.Queue,
                    removeOnComplete: false,
                    removeOnFail: 500,
                    delay: 30000,
                    attempts: 10,
                    backoff: {
                        type: 'exponential',
                        delay: 1000,
                    },
                },
            })
        })

        await this.blockFlowParse.addBulk(bulkReq).catch((ex) => {
            throw ex
        })
    }
}
