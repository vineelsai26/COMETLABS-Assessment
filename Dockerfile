FROM node:lts-bullseye

WORKDIR /usr/src/app

COPY . .

RUN yarn install
RUN npm i -g pm2

CMD [ "yarn", "start" ]