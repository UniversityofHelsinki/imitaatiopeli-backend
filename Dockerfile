FROM node:22-alpine
RUN apk update && \
    apk add --no-cache tzdata && \
    adduser node root

COPY . /home/node/app
RUN chmod -R 755 /home/node/app && \
    chown -R node:node /home/node/app


WORKDIR /home/node/app

# Remove devDependencies to reduce image size
RUN npm prune --omit=dev && npm cache clean --force

# EXPOSE PORT 8080
EXPOSE 8080

# START APPLICATION
CMD [ "npm", "start" ]
