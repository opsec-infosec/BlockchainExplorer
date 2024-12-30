import { BulkJobOptions } from 'bullmq'

export interface IBullMqJob {
    name: string
    data: any
    opts?: BulkJobOptions
}
