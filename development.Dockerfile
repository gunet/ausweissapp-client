FROM node:alpine

WORKDIR /app

COPY package.json .


RUN yarn install

CMD ["node", "src/index.js"]