import { Injectable, Logger, OnModuleDestroy, OnModuleInit } from '@nestjs/common'
import { readdirSync } from 'fs'
import { QueueService } from '../services/queue/queue.service'
import { ConfigService } from '@nestjs/config'
import { FSWatcher, watch } from 'chokidar'

@Injectable()
export class BlocksyncService implements OnModuleInit, OnModuleDestroy {
    private logger = new Logger('BlockSync Service')
    private dataPath = this.configService.getOrThrow('DATA_PATH')
    private files: string[] = []
    private watcher: FSWatcher

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

        this.queueService.addBulkBlockJob(this.files).catch((ex) => {
            this.logger.fatal(`${ex}`)
        })
        this.logger.log(`Adding Block files to Processing Queue`)
    }

    async onModuleInit() {
        this.watcher = watch(this.dataPath, {
            ignoreInitial: true,
            ignored: /^(?=.*(\.\w+)$)(?!.*(?:blk.....\.dat?)$).*$/,
            cwd: this.dataPath,
        })

        this.watcher.on('change', (path, stats) => {
            if (stats?.size >= 133169152) {
                const find = this.files.find((file) => file === path)
                if (!find) {
                    this.queueService.addBlockJob(path)
                    this.files.push(path)
                    this.logger.log(`Add Block File ${path} to Processing Queue`)
                }
            }
        })
    }

    onModuleDestroy() {
        this.watcher.close()
    }
}
