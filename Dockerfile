# Dockerfile for Node.js Express + React Application
FROM node:20-alpine AS builder

WORKDIR /app

# Copy dependency manifests
COPY package.json package-lock.json* ./

# Install dependencies cleanly
RUN npm ci || npm install

# Copy source files
COPY . .

# Build client SPA and bundle server entry point into dist/
RUN npm run build

# Production Runner Stage
FROM node:20-alpine AS runner

WORKDIR /app

ENV NODE_ENV=production
ENV PORT=3000

# Copy dependencies and built dist output from builder
COPY --from=builder /app/package.json ./package.json
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/public ./public
COPY --from=builder /app/data ./data

EXPOSE 3000

CMD ["npm", "start"]
