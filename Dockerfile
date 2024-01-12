FROM node:16

WORKDIR /app

COPY ./package.json ./package.json

RUN npm install -g pnpm

RUN pnpm install

COPY . .

EXPOSE 7899

CMD ["node", "index.js"]