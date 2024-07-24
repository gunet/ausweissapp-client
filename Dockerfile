FROM node:alpine

WORKDIR /app

COPY . .


RUN yarn install && mv node_modules /node_modules

ENV NODE_PATH=/node_modules


EXPOSE 24727

CMD node src/index.js