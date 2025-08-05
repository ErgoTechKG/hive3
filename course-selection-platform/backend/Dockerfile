# Multi-stage build for Node.js backend
FROM node:18-alpine AS builder

# Set working directory
WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies
# Install build tools for native dependencies
RUN apk add --no-cache python3 make g++ && \
    npm ci && \
    npm cache clean --force && \
    apk del python3 make g++

# Copy source code
COPY . .

# Build the application
RUN npm run build

# Production stage
FROM node:18-alpine AS production

# Create app directory
WORKDIR /app

# Create non-root user
RUN addgroup -g 1001 -S nodejs
RUN adduser -S nodeuser -u 1001

# Copy package files
COPY package*.json ./

# Install only production dependencies
# Skip optional dependencies like sharp if they fail
RUN apk add --no-cache python3 make g++ && \
    npm ci --only=production --no-optional || \
    npm ci --only=production --omit=optional && \
    npm cache clean --force && \
    apk del python3 make g++

# Copy built application from builder stage
COPY --from=builder /app/dist ./dist

# Copy necessary files
COPY --chown=nodeuser:nodejs . .

# Create uploads directory
RUN mkdir -p uploads logs && chown -R nodeuser:nodejs uploads logs

# Switch to non-root user
USER nodeuser

# Expose port
EXPOSE 3001

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD node healthcheck.js

# Start the application
CMD ["npm", "start"]