FROM node:24-alpine AS dependencies

WORKDIR /app

COPY package*.json ./

RUN npm ci --omit=dev


FROM node:24-alpine AS production

WORKDIR /app

ENV NODE_ENV=production

COPY --from=dependencies /app/node_modules ./node_modules

COPY package*.json ./
COPY src ./src
COPY migrations ./migrations
COPY server.js ./

EXPOSE 5000

USER node

CMD ["node", "server.js"]