FROM node:18-alpine AS base

RUN apk --no-cache add --update ffmpeg

WORKDIR /app

COPY package*.json ./
RUN npm install --production

COPY src ./src

CMD ["npm", "start"]
