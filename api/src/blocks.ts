import { NestFactory } from '@nestjs/core'
import { ConfigModule, ConfigService } from '@nestjs/config'
import { BlockModule } from './services/workers/block.module'
import { Logger, LogLevel } from '@nestjs/common'

async function bootstrap() {
    const app = await NestFactory.createApplicationContext(BlockModule)
    const config = app.get(ConfigService)
    ConfigModule.forRoot({ isGlobal: true })

    const logLevels =
        config.get<string>('NODE_ENV') === 'development'
            ? (['log', 'debug', 'error', 'verbose', 'warn'] as LogLevel[])
            : (['log', 'error', 'warn'] as LogLevel[])

    app.useLogger(logLevels)
    Logger.overrideLogger(logLevels)
}

bootstrap()
