import { address, Block, networks, payments } from 'bitcoinjs-lib'
import { ITrasactionIn, ITrasactionOut, ITrasactions } from '../../interfaces/block.interface'

export class ReadFileBlock {
    private blocks: Block[] = []
    private blockOffset: number = 0
    private buff: Buffer

    constructor(buffer: Buffer) {
        this.buff = buffer
    }

    async parse() {
        while (this.blockOffset < this.buff.length) {
            await this.getMagicId().catch((ex) => {
                throw ex
            })

            const length = await this.getLength()

            // get block 8 byte offset (magicId + length) to version
            //  length of the buffer include magicId and length
            const blockBuff = this.buff.subarray(
                8 + this.blockOffset,
                length + this.blockOffset + 4 + 4,
            )
            const blk = Block.fromBuffer(blockBuff)
            this.blocks.push(blk)

            // Point to end of block for next block
            this.blockOffset += length + 4 + 4
        }

        return this.blocks
    }

    private async getMagicId() {
        const magicId = this.buff.readUInt32LE(this.blockOffset).toString(16)

        if (magicId === '0') {
            throw new Error(`Incomplete Block @${this.blockOffset}`)
        }

        if (magicId !== 'd9b4bef9') {
            throw new Error(`Invalid Magic ID @${this.blockOffset}`)
        }

        return magicId
    }

    private async getLength() {
        return this.buff.readUInt32LE(this.blockOffset + 4)
    }
}

export class BlockInfo {
    static getHash(blk: Block) {
        const hash = Buffer.from(blk.getHash()).reverse().toString('hex')
        const prevHash = Buffer.from(blk.prevHash).reverse().toString('hex')

        return { hash, prevHash }
    }

    static getDate(blk: Block) {
        return blk.getUTCDate()
    }

    static getInfo(blk: Block) {
        const hashes = this.getHash(blk)
        const blockDate = blk.getUTCDate()
        const txCount = blk.transactions.length
        const nonce = blk.nonce
        const bits = blk.bits
        const size = blk.byteLength()
        const weight = size * 3 + size

        let inputs = 0
        let outputs = 0
        let witness = 0

        blk.transactions.forEach((data) => {
            inputs += data.ins.length
            outputs += data.outs.length
            if (data.hasWitnesses()) {
                witness++
            }
        })

        return {
            ...hashes,
            blockDate,
            txCount,
            nonce,
            bits,
            size,
            weight,
            inputs,
            outputs,
            witness,
        }
    }

    static getTransactions(blk: Block) {
        let transactions: ITrasactions[] = []

        transactions = blk.transactions.map((data, index) => {
            let txos: ITrasactionOut[] = []
            let txis: ITrasactionIn[] = []

            const pos = index
            const txid = Buffer.from(data.getHash()).reverse().toString('hex')
            const size = data.byteLength()
            const version = data.version
            const locktime = data.locktime
            const weight = data.weight()

            txis = data.ins.map((ins) => {
                return {
                    txid: Buffer.from(ins.hash).reverse().toString('hex'),
                    index: ins.index,
                    sequence: ins.sequence,
                    coinbase: data.isCoinbase(),
                }
            })

            txos = data.outs.map((outs) => {
                let addr: string = undefined
                let value: number

                try {
                    value = outs.value / 100000000
                    addr = address.fromOutputScript(Buffer.from(outs.script), networks.bitcoin)
                } catch (e) {
                    try {
                        const length = outs.script[0]
                        const pubkey = Buffer.from(outs.script).subarray(1, length + 1)
                        addr = payments.p2pkh({ pubkey }).address
                    } catch (e) {
                        try {
                            const length = outs.script[2]
                            const pubkey = Buffer.from(outs.script).subarray(3, length + 3)
                            addr = payments.p2pkh({ pubkey }).address
                        } catch (e) {
                            // if we get here, its an unknown address
                        }
                    }
                }

                return { address: addr, BTC: value }
            })

            return { txid, pos, size, version, locktime, weight, txis, txos }
        })

        return transactions
    }
}
