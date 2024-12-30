import { Injectable } from '@nestjs/common'
import { readdirSync } from 'fs'
import { QueueService } from '../services/queue/queue.service'
import { ConfigService } from '@nestjs/config'

@Injectable()
export class BlocksyncService {
    private dataPath = this.configService.getOrThrow('DATA_PATH')
    private files: string[] = []

    constructor(
        private queueService: QueueService,
        private configService: ConfigService,
    ) {
        this.files = readdirSync(this.dataPath).filter((files) => {
            if (RegExp(/\bblk[^\\]*\.dat$/).test(files)) {
                return true
            }
            return false
        })
        this.queueService.addBulkBlockJob(this.files)
    }
}
