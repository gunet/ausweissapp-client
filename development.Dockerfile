FROM node:alpine

WORKDIR /app

COPY package.json .


RUN yarn install && mv node_modules /node_modules

ENV NODE_PATH=/node_modules

CMD node src/index.js