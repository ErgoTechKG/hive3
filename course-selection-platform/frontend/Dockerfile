# Multi-stage build for React frontend
FROM node:18-alpine AS builder

# Set working directory
WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm ci --legacy-peer-deps && npm cache clean --force

# Copy source code
COPY . .

# Build the application
RUN npm run build

# Production stage with nginx
FROM nginx:alpine AS production

# Install wget for health checks (as root before switching users)
RUN apk add --no-cache wget

# Copy custom nginx config
COPY nginx.conf /etc/nginx/nginx.conf

# Copy built application from builder stage
COPY --from=builder /app/build /usr/share/nginx/html

# Create non-root user for nginx (nginx group already exists in the base image)
RUN adduser -S nginxuser -u 1001 -G nginx

# Create directories nginx needs with proper permissions
RUN mkdir -p /var/cache/nginx/client_temp \
             /var/cache/nginx/proxy_temp \
             /var/cache/nginx/fastcgi_temp \
             /var/cache/nginx/uwsgi_temp \
             /var/cache/nginx/scgi_temp \
             /tmp/nginx \
    && chown -R nginxuser:nginx /var/cache/nginx /var/log/nginx /usr/share/nginx/html /tmp/nginx \
    && chmod -R 755 /var/cache/nginx /var/log/nginx /tmp/nginx

# Switch to non-root user
USER nginxuser

# Expose port
EXPOSE 3000

# Health check using wget
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD wget --no-verbose --tries=1 --spider http://localhost:3000 || exit 1

# Start nginx
CMD ["nginx", "-g", "daemon off;"]