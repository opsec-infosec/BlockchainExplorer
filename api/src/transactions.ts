import { NestFactory } from '@nestjs/core'
import { ConfigModule, ConfigService } from '@nestjs/config'
import { TransactionModule } from './services/workers/transactions.module'

async function bootstrap() {
    const app = await NestFactory.createApplicationContext(TransactionModule)
    const config = app.get(ConfigService)
    ConfigModule.forRoot({ isGlobal: true })

    app.useLogger(
        config.get<string>('NODE_ENV') === 'development'
            ? ['log', 'debug', 'error', 'verbose', 'warn']
            : ['log', 'error', 'warn'],
    )
}

bootstrap()
