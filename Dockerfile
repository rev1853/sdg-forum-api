FROM node:18-alpine AS base

WORKDIR /app

# Install dependencies (including dev packages for Prisma CLI)
COPY package.json package-lock.json ./
RUN npm ci

# Generate Prisma client
COPY prisma ./prisma
RUN npx prisma generate

# Copy application source
COPY src ./src
COPY jest.config.js ./jest.config.js

# Remove development-only dependencies for a slimmer final image
RUN npm prune --omit=dev

ENV NODE_ENV=production
ENV PORT=3000

EXPOSE 3000

CMD ["node", "src/server.js"]
