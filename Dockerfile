FROM node:16

WORKDIR /app

COPY package.json /app

RUN npm install

COPY . /app

ENV DATABASE_URL="file:/app/src/prisma/db/dev.db"

RUN npx prisma generate

RUN npx prisma migrate deploy

CMD [ "npm", "start" ]