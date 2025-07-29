# Use Node.js 18 Alpine
FROM node:18-alpine AS base

# Install dependencies
RUN apk add --no-cache libc6-compat
WORKDIR /app

# Copy package files
COPY package*.json ./
COPY turbo.json ./

# Copy source code
COPY apps/api ./apps/api
COPY packages ./packages

# Install dependencies
RUN npm install

# Build the application
RUN npm run build

# Create production stage
FROM node:18-alpine AS runner
WORKDIR /app

ENV NODE_ENV production

# Create app user
RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 appuser

# Copy built application
COPY --from=base --chown=appuser:nodejs /app/apps/api/dist ./dist
COPY --from=base --chown=appuser:nodejs /app/apps/api/package.json ./package.json
COPY --from=base --chown=appuser:nodejs /app/node_modules ./node_modules

# Create necessary directories
RUN mkdir -p logs sessions data
RUN chown -R appuser:nodejs logs sessions data

USER appuser

EXPOSE 3000

CMD ["node", "dist/index.js"]
