import { ConfigService } from '@nestjs/config'

export const redisFactory = async (config: ConfigService) => {
    return {
        connection: {
            host: config.get<string>('REDIS_HOST') || 'rds',
            port: Number(config.get<number>('REDIS_PORT', 6379)),
        },
        defaultJobOptions: {
            attempts: 10,
            removeOnComplete: true,
            removeonFailed: 500,
            backoff: {
                type: 'exponential',
                delay: 1000,
            },
        },
    }
}
