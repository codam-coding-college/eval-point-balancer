FROM node:22-bullseye as deps
# RUN apt-get update && apt-get install
WORKDIR /app

COPY package.json ./
RUN npm install

FROM node:22-bullseye as builder
WORKDIR /app

COPY --from=deps /app/node_modules ./node_modules
COPY --from=deps /app/package.json ./package.json
COPY tsconfig.json ./tsconfig.json
COPY src/ ./src/
RUN npm install -g typescript
RUN tsc

FROM node:22-bullseye as runner
WORKDIR /app

ENV NODE_ENV production

COPY --from=builder /app/build ./build
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/package.json ./package.json

EXPOSE 4000

CMD ["npm", "run", "start"]
