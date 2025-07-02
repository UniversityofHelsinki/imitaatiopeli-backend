FROM node:22-alpine

WORKDIR /home/node/app

COPY . .

RUN apk update && \
    apk add --no-cache tzdata && \
    npm prune --omit=dev

ENV NODE_ENV=production

EXPOSE 8080

CMD ["npm", "start"]
