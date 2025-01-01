import { ConfigService } from '@nestjs/config'

export const elasticSearcFactory = async (config: ConfigService) => {
    return {
        nodes: config.getOrThrow<string>('ELASTIC_HOSTS').split(','),
        maxRetries: Number(config.get<number>('ELASTIC_RETRIES', 10)),
        requestTimeout: Number(config.get<number>('ELASTIC_REQ_TIMEOUT', 60000)),
        pingTimeout: Number(config.get<number>('ELASTIC_PING_TIMEOUT', 60000)),
        sniffOnStart:
            String(config.get<boolean>('ELASTIC_SNIFF', true)).toLocaleLowerCase() == 'true',
        sniffOnConnectionFault:
            String(config.get<boolean>('ELASTIC_SNIFF_FAULT', true)).toLocaleLowerCase() == 'true',
    }
}

export class elasticSearchConfig {
    private esConfig: any
    private config = new ConfigService()

    constructor() {
        this.esConfig = {
            nodes: this.config.getOrThrow<string>('ELASTIC_HOSTS').split(','),
            maxRetries: Number(this.config.get<number>('ELASTIC_RETRIES', 10)),
            requestTimeout: Number(this.config.get<number>('ELASTIC_REQ_TIMEOUT', 60000)),
            pingTimeout: Number(this.config.get<number>('ELASTIC_PING_TIMEOUT', 60000)),
            sniffOnStart:
                String(this.config.get<boolean>('ELASTIC_SNIFF', true)).toLocaleLowerCase() ==
                'true',
            sniffOnConnectionFault:
                String(this.config.get<boolean>('ELASTIC_SNIFF_FAULT', true)).toLocaleLowerCase() ==
                'true',
        }
    }

    configure() {
        return this.esConfig
    }
}
