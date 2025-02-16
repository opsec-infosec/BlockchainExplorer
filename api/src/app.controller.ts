import { Controller, Get } from '@nestjs/common'
import { AppService } from './app.service'

@Controller()
export class AppController {
    constructor(private readonly appService: AppService) {}

    @Get()
    getHello(): string {
        return this.appService.getHello()
    }
}

/*
GET transactions-*._search
{
    "from": 0,
    "size": 20,
    "_source": ["txos.BTC", "block.date", "txos.address", "block.hash", "block.prevHash", "txis.txid", "txis.index"],
    "query": {
    "match": {
      "txid.keyword": "66e62b38cfe818057c5998fa1c7fc1be4f8191d92f180a6a591e61d8bbf30169"
    }
  }
}
  */
