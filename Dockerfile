FROM node:24-bookworm-slim
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci --omit=dev --no-audit --no-fund
COPY index.html sw.js manifest.webmanifest icon.svg ./
COPY server ./server
COPY public ./public
RUN mkdir -p /app/.data && chown -R node:node /app
USER node
ENV HOST=0.0.0.0 PORT=4188 NODE_ENV=production
EXPOSE 4188
VOLUME ["/app/.data"]
CMD ["node", "server/server.mjs"]
