FROM node:18-alpine

WORKDIR .

COPY package.json ./

COPY . .

EXPOSE 4000

CMD npm run start