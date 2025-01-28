import {
    BeforeApplicationShutdown,
    Injectable,
    Logger,
    OnApplicationShutdown,
} from '@nestjs/common'
import * as zmq from 'zeromq'
import { OnModuleInit } from '@nestjs/common'
import { address, Block, networks, Transaction, script } from 'bitcoinjs-lib'
import { readFile, readFileSync } from 'fs'

@Injectable()
export class ZmqueueService {
    // implements OnModuleInit, BeforeApplicationShutdown {
    private logger = new Logger('ZmqueueService')
    // private sock = new zmq.Subscriber()

    constructor() {
        // this.sock.connect('tcp://bitcoind:29000')
        // const tmp = this.sock.events
        // tmp.on('unknown', (data) => {
        //     console.log(data)
        // })
        // tmp.on('accept', (data) => {
        //     console.log(data)
        // })
        // tmp.on('connect', (data) => {
        //     console.log(data)
        // })
        // this.sock.subscribe('rawblock')
        // this.logger.log('Subscribe to ZeroMq Publisher')
    }

    // async onModuleInit() {
    //     // const tmp = readFile('/home/node/data/.bitcoin/blocks/blk00000.dat', (err, data) => {
    //     //     const magicId = data.readUInt32LE(0).toString(16)
    //     //     const length = data.readUint32LE(4)

    //     //     const tmp1 = data.subarray(8, length + 4 + 4)
    //     //     const tmp = Block.fromBuffer(tmp1)
    //     //     tmp.transactions.forEach((data) => {
    //     //         data.outs.forEach((out) => {
    //     //             try {
    //     //                 const addr = address.fromOutputScript(
    //     //                     Buffer.from(out.script),
    //     //                     networks.bitcoin,
    //     //                 )
    //     //                 console.log('ADDRESS: ', addr, ' VALUE: ', out.value / 100000000 + ' BTC')
    //     //             } catch (e) {
    //     //                 console.log(e)
    //     //             }
    //     //         })
    //     //     })

    //     //     console.log(data)
    //     // })

    //     // console.log()

    //     for await (const [topic, msg] of this.sock) {
    //         const txs: Transaction[] = []

    //         switch (topic.toString()) {
    //             case 'rawtx':
    //                 const tx = Transaction.fromBuffer(msg)

    //                 tx.outs.forEach((data) => {
    //                     try {
    //                         const addr = address.fromOutputScript(
    //                             Buffer.from(data.script),
    //                             networks.bitcoin,
    //                         )
    //                         console.log('ADDRESS: ', addr, ' VALUE: ', data.value / 100000000)
    //                     } catch (e) {}
    //                 })
    //                 // console.log(
    //                 //     'received a message related to:',
    //                 //     topic.toString(),
    //                 //     'containing message:',
    //                 //     msg,
    //                 // )
    //                 break

    //             case 'rawblock': {
    //                 console.log(msg)
    //                 const block = Block.fromBuffer(msg)

    //                 console.log('TIMESTAMP: ', block.getUTCDate())
    //                 const hash = Buffer.from(block.getHash()).reverse().toString('hex')
    //                 const prevHash = Buffer.from(block.prevHash).reverse().toString('hex')

    //                 console.log('PREV HASH: ', prevHash)
    //                 console.log('HASH: ', hash)

    //                 block.transactions.forEach((data) => {
    //                     data.outs.forEach((out) => {
    //                         try {
    //                             const addr = address.fromOutputScript(
    //                                 Buffer.from(out.script),
    //                                 networks.regtest,
    //                             )
    //                             console.log(
    //                                 'ADDRESS: ',
    //                                 addr,
    //                                 ' VALUE: ',
    //                                 out.value / 100000000 + ' BTC',
    //                             )
    //                         } catch (e) {}
    //                     })
    //                     txs.push(data)
    //                 })
    //                 // console.log(
    //                 //     'received a message related to:',
    //                 //     topic.toString(),
    //                 //     'containing message:',
    //                 //     msg,
    //                 // )
    //                 break
    //             }

    //             default:
    //                 console.log('received a message ', topic.toString())
    //                 break
    //         }
    //     }
    // }

    // async beforeApplicationShutdown(signal?: string) {
    //     this.sock.unsubscribe()
    //     this.sock.close()
    // }
}
