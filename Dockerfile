FROM node:18-alpine

WORKDIR $WORKDIR

COPY package.json ./

COPY . .

EXPOSE $PORT

RUN npm install

CMD npm run start
