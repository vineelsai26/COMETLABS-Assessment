FROM node:lts-alpine

WORKDIR /usr/src/app

COPY . .

RUN yarn install
RUN npm i -g pm2

CMD [ "pm2", "start", "index.js -i max" ]