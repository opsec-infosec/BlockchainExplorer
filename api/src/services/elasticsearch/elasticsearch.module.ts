import { Module } from '@nestjs/common'
import { elasticSearcFactory } from '../../factories/elasticsearch.factory'
import { ConfigService } from '@nestjs/config'
import { ElasticsearchModule } from '@nestjs/elasticsearch'
import { EsSearchService } from './elasticsearch.service'

@Module({
    imports: [
        ElasticsearchModule.registerAsync({
            imports: [],
            useFactory: elasticSearcFactory,
            inject: [ConfigService],
        }),
    ],
    exports: [EsSearchService, ElasticsearchModule],
    providers: [EsSearchService],
})
export class ElastichModule {}
