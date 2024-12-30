##
## DEVELOPMENT -- From Built from nestjs base image
FROM registry.opinfosec.net/dfurneau/baseimages/nestbase
WORKDIR /home/node/api
COPY --chown=node:node api/ ./
USER node
