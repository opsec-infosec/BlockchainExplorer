# Bitcoin Explorer
Place to have fun and learn about decoding the bitcoin blockchain

The goal is to parse the block chain from a full bitcoin node, parse the files into block and transaction information, and push them into a ElasticSearch stack.

From there we have a full text search of the block chain.

Eventually a frontend for exploring the blockchain and the ability to do some basic analysis of the chain.

Warning: This repo can be resource heavy. As the bitcoin block chain is over 600 G, and elastic search needs around the same, the storage size is around 2 T. The processing time will be
long if you use one block worker and one transaction worker. See Workers Section

# Running the Project

You can use pm2 to run the workers. There are 3 worker pm2 json files for this purpose. See Workers Section for more details.

example of running pm2 blocks workers
```
pm2-runtime ./pm2.blocks.workers.json
```

You can also run a pm2 monitor with:
```
pm2 monit
```

### pm2.blocks.workers.json
Can be used to start the block wokers concurently. You can adjust the instances for the best setup for your machine, currently its set to 3 block workers.

### pm2.transaction.workers.json
Can be used to start the transaction workers concurently. You can adjust the instances for the best setup, currently the instances are set to 12 transaction workers.

### pm2.process.workers.json
This will start both the blocks and transactions workers as configured above with 3 block and 12 transaction workers.

### pm2.api.json
This will start the api to collect the full node .dat files and place then in the queue, only a single instance should be run.


# Containers
The project is setup to use devcontainers.

* REDIS
* API / Workers - NestJS
* bitcoind - Full Node
* elasticsearch - standalone
* kibana - frontend for elasticsearch

## Redis
REDIS is used to process the blocks and transactions, the block files are queued into redis using BullMQ.  Each block is parsed and then placed into a second queue to further process each block transaction

## API
The api is using the NestJS framework. Zeromq will be used to update elasticsearch after bitcoind syncs the entire block chain.

## bitcoind Full Node
This is the bitcoind full node. Be aware that the current blockchain is over 600 G in size, so make sure you have enough disk space for that. Recommend at least 2T disk space for both bitcoind and elasticsearch DB.

## Elasticsearch
This is a 3 node cluster elastic search instance with no security setup. It is advisable to setup the x-pack-security features if you plan on have a public instance. The queues will create 2 indicies called blocks and transactions.

### Blocks
Contain the block information, hash, previous hash, date (timestamp), and number of transactions, bits, size, weight, nonce, inputs, outputs and witness count. index id is the hash of the block

Blocks are store in elastic search document index as blocks-YYYY
#### Block data
```
_index: document index
_id: block hash (this block)
blockDate: Date of the block
hash: block hash (this block)
prevHash: previous blocks hash {previous block}
txCount: Number of transactions in this block
bits: compact representation of the target
size: size of the block
weight: measure of the size of the block in WU
nonce: Random number to satisfy PoW
inputs: number of input transactions
outputs: number of output transactions
witness: number of witnessed transactions
```

### Transactions
Contain the txins and txouts of the transactions. index id is the transaction id hash.

Transactions are stored in elastic search document index as transactions-YYYY.MM
#### Transactions data
```
block.hash: Block hash that is associated with the transactions
block.prevHash: Previous Block hash
blockDate: Date of the block
locktime: The transactions lock time
pos: position of this transaction within the block of transactions
size: Size of the transactions block
txid: Transaction hash
txis.coinbase: Whether the transactions were mined (Coinbase) [true | false]
txis.index: Index refers to the position of an output of the previous transaction
txis.sequence: Transaction sequence number
txis.txid: Previous transaction hash
txos.address: Transaction outputs address
txos.BTC: Amount of BTC
weight: Size of bitcoin blocks including the segwit discount
version: 1 | 2
```
Some txis and most txos have arrays, they are aligned by position.  For example:
```
txis.coinbase: [false, true]
txis.index: [0, 1]
txis.id: [aaaaaaaaaaaaa, bbbbbbbbbbbb]
```
The array index 0 refers to txis.index: 0, referes to txis.coinbase: false, and txis.id: aaaaaaaaaaaaa. The same is true for the txos values.

## Kibana
This is the frontend for exploring the data in elastic search with no security setup. It is advised to setup the x-pack-security features if you plan on having a public accessable instance.

## Workers
There are 2 workers setup to process the .dat files.

The main queue EQueue.Block parses the .dat file and pulls out each individual block, parses it, stores the blocks in ElasticSearch DB under the blocks index and passes it to a second queue called EQueue.Transactions
The EQueue.Transactions queue processes each transaction of the block and will store them in a ElasticSearch DB under the transactions index.

Minimum Recommended Queues are 1 block queue to 3 transaction queues.  So if you run two block queues, you should run at lease 6 transaction queues.  You can run 1 block queue to 1 transaction queue, but the processing will take awhile.

I run this setup with 24 cores, with 3 block queues and 12 transaction queues with 64G of ram and 4 TB disk storage.  The CPU utilization with these settings is around 90%.

You can play around with the blocks to transaction queues to get the optimal setting for your machine based on the CPU count and memory.

You can adjust the block and transaction workers by changing the settings in the pm2.blocks.workers and pm2.transaction.workers respectively.

# Frameworks

The api is built on NestJS using bullmq queues to parse and process the blockchain files.



## Packages
* bullmq
* bitcoinjs.lib
* NestJS
* elasticsearch / @nestjs/elasticsearch
* zeromq

## Status
This repo is a work in progress...

## Learning Points
Redis was running out of memory due to the fact that blocks were pusing the transactions to the second queue, then processing the next block and repeating.  This causes the second transaction queue to start to fill up before processing all the transactions.
This was solved by setting a wait variable that holds the job id, and delays any new blocks that come into the same queue, this prevents the new blocks from pushing transactions onto the transactions queue.

Split up the transactions and blocks to optimize the elastic search indexing and searching. Blocks are now stored with blocks-YYYY and Transactions-YYYY.MM, to keep the document indexes manageable.
