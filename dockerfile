FROM node:20-alpine

WORKDIR /app

COPY . .

RUN echo "Contents of /app:" && ls -la && \
    echo "Running npm run build..." && \
    npm run build && \
    echo "Build completed. Contents of /app/build:" && \
    ls -la build/

CMD ["node", "build/index.js"]