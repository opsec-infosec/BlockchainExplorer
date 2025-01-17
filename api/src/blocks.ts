import { NestFactory } from '@nestjs/core'
import { ConfigModule, ConfigService } from '@nestjs/config'
import { BlockModule } from './services/workers/block.module'

async function bootstrap() {
    const app = await NestFactory.createApplicationContext(BlockModule)
    const config = app.get(ConfigService)
    ConfigModule.forRoot({ isGlobal: true })

    app.useLogger(
        config.get<string>('NODE_ENV') === 'development'
            ? ['log', 'debug', 'error', 'verbose', 'warn']
            : ['log', 'error', 'warn'],
    )
}

bootstrap()
