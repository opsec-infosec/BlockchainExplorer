import { Module } from '@nestjs/common'
import { AppController } from './app.controller'
import { AppService } from './app.service'
import { ZmqueueModule } from './services/zmqueue/zmqueue.module'
import { BlocksyncModule } from './blocksync/blocksync.module'
import { QueueModule } from './services/queue/queue.module'
import { ConfigModule } from '@nestjs/config'
import { ElastichModule } from './services/elasticsearch/elasticsearch.module'

const modules = [ZmqueueModule, BlocksyncModule, QueueModule, ElastichModule]

@Module({
    imports: [ConfigModule.forRoot({ isGlobal: true }), ...modules],
    controllers: [AppController],
    providers: [AppService],
})
export class AppModule {}
