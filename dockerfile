FROM node:20-slim

WORKDIR /app

# Copy package files and pre-installed dependencies
COPY package*.json ./
COPY node_modules ./node_modules

# Copy pre-built files
COPY build ./build

CMD ["node", "build/index.js"]