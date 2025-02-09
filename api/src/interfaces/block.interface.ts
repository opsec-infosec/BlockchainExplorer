export interface ITrasactionIn {
    txid: string
    index: number
    sequence: number
    coinbase: boolean
}

export interface ITrasactionOut {
    address: string
    BTC: number
}

export interface ITrasactions {
    pos: number
    txid: string
    size: number
    version: number
    locktime: number
    weight: number
    txos: ITrasactionOut[]
    txis: ITrasactionIn[]
}

export interface IBlockInfo {
    hash: string
    prevHash: string
    blockDate: Date
    txCount: number
}

export interface IBlockHeader {
    version: number
    prevHash: Buffer
    merkleRoot: Buffer
    timestamp: number
    bits: number
    nonce: number
}

export interface IBlockTransactionData {
    blockInfo: IBlockInfo
    block: string
}
