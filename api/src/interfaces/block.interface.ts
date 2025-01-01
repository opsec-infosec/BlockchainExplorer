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
