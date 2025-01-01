##
##
## NestJS Base Image Builder

FROM node:lts-bookworm AS base
WORKDIR /home/node/api

ENV APT_KEY_DONT_WARN_ON_DANGEROUS_USAGE=DontWarn
ENV DEBIAN_FRONTEND=noninteractive
RUN apt-get update && apt-get install \
    git \
    iputils-ping \
    procps \
    sudo \
    awscli \
    dialog \
    curl \
    -y \
    && mkdir -p /etc/sudoers.d/ && echo "node ALL=(ALL) NOPASSWD: ALL" > /etc/sudoers.d/node \
    && chmod 0440 /etc/sudoers.d/node \
    && apt-get clean autoclean && apt-get autoremove --yes \
    && rm -rf /var/lib/{apt,dpkg,cache,log}/ \
    && echo "git config --global --add safe.directory /home/node/api" >> /home/node/.bashrc

RUN mkdir -p dist && mkdir -p node_modules && npm install -g npm@latest  && chown -R node:node node_modules && chown -R node:node dist && npm i -g @nestjs/cli
USER node

# Reset dialog frontend
ENV DEBIAN_FRONTEND=dialog

##
## DEVELOPMENT -- From Built from nestjs base image
FROM base
WORKDIR /home/node/api
COPY --chown=node:node api/ ./
USER node
