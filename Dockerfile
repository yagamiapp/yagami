FROM node:16

WORKDIR /app

COPY package.json ./

RUN npm install

COPY . .

ENV DATABASE_URL="file:/db/db.sqlite"

RUN npx prisma generate

RUN npx prisma migrate dev

CMD [ "npm", "start" ]