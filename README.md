# Bitcoin Explorer
Place to have fun with deconding and learning about the bitcoin blockchain

The goal is to parse the block chain from a full bitcoin node, parse the files, and push them into a ElasticSearch stack.

From there we have a full text search of the block chain.


# Containers
* REDIS
* API / Workers - NestJS
* bitcoind - Full Node
* elasticsearch - standalone
* kibana - frontend for elasticsearch

## Redis
REDIS is used to process the blocks and transactions, the block files are queued into redis using BullMQ.  Each block is parsed and then placed into a second queue to further process each block transaction

## API
The api is using the NestJS framework

## bitcoind Full Node
This is the bitcoind full node. Be aware that the current blockchain is over 600 G in size, so make sure you have enough disk space for that.

## Elasticsearch
This is a standalone elastic search instance (non clustered) and no security setup. It is advisable to setup the x-pack-security features if you plan on have a public instance. The queues will create 2 indicies called blocks and transactions.
### blocks
Contain the block information, hash, previous hash, date (timestamp), and number of transactions. index id is the hash of the block
### transactions
Contain the txins and txouts of the transactions. index id is the transaction id hash.

## Kibana
This is the frontend for exploring the data in elastic search with no security setup. It is advised to setup the x-pack-security features if you plan on having a public accessable instance.

## Workers
There are 2 workers setup to process the .dat files. The main queue EQueue.Block parses the the .dat file and pulls out each individual block, parses it and passes it to a second queue called EQueue.Elastic
The EQueue.Elastic queue processes each transaction of the block and will store them in a ElasticSearch DB.

# Frameworks

The api is built on NestJS using bullmq queues to parse and process the blockchain files.



## Packages
* bullmq
* bitcoinjs.lib
* NestJS

## Status
This repo is a work in progress
