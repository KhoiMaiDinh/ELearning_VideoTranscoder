FROM node:23-alpine AS base

RUN apk --no-cache add --update ffmpeg

WORKDIR /app

COPY package*.json ./
RUN npm install -g npm@11.4.2
RUN npm install --production

COPY src ./src

CMD ["npm", "start"]
