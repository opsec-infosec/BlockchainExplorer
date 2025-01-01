import { ElasticsearchService } from '@nestjs/elasticsearch'
import { elasticSearchConfig } from '../../factories/elasticsearch.factory'
import { Injectable } from '@nestjs/common'

@Injectable()
export class EsSearchService extends ElasticsearchService {
    constructor() {
        super(new elasticSearchConfig().configure())
    }
}
