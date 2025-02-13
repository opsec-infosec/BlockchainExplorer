export enum EJobQueue {
    BlockParse = 'block.parse',
    TransactionParse = 'transactions.parse',
}

export enum EQueue {
    Block = 'block',
    Transactions = 'transactions',
}

export enum EQueuePriority {
    Completed,
    Processed,
    Queue
}