import { NestFactory } from '@nestjs/core'
import { ConfigModule, ConfigService } from '@nestjs/config'
import { WorkersModule } from './services/workers/workers.module'

async function bootstrap() {
    const app = await NestFactory.createApplicationContext(WorkersModule)
    const config = app.get(ConfigService)
    ConfigModule.forRoot({ isGlobal: true })

    app.useLogger(
        config.get<string>('NODE_ENV') === 'development'
            ? ['log', 'debug', 'error', 'verbose', 'warn']
            : ['log', 'error', 'warn'],
    )
}

bootstrap()
