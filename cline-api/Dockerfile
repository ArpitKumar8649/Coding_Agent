# Multi-stage build for optimized final image
FROM node:18-alpine AS base

# Install yarn globally and setup base dependencies
RUN npm install -g yarn && \
    apk add --no-cache dumb-init

# Set the working directory
WORKDIR /app

# Create non-root user
RUN addgroup -g 1001 -S nodejs && \
    adduser -S cline -u 1001 -G nodejs

# Dependencies stage
FROM base AS deps

# Copy package files
COPY package*.json yarn.lock ./
RUN chown -R cline:nodejs /app

# Switch to non-root user for dependency installation
USER cline

# Install ALL dependencies (including dev for build stage)
RUN yarn install --frozen-lockfile --silent

# Production dependencies stage
FROM base AS production-deps

# Copy package files
COPY package*.json yarn.lock ./
RUN chown -R cline:nodejs /app

USER cline

# Install only production dependencies
RUN yarn install --frozen-lockfile --production --silent && \
    yarn cache clean

# Final production stage
FROM base AS production

# Copy production dependencies
COPY --from=production-deps --chown=cline:nodejs /app/node_modules ./node_modules
COPY --from=production-deps --chown=cline:nodejs /app/package.json ./package.json
COPY --from=production-deps --chown=cline:nodejs /app/yarn.lock ./yarn.lock

# Copy application source code
COPY --chown=cline:nodejs ./src ./src
COPY --chown=cline:nodejs ./healthcheck.js ./healthcheck.js

# Switch to non-root user
USER cline

# Expose the port the app runs on
EXPOSE 3000

# Add health check with improved configuration
HEALTHCHECK --interval=30s --timeout=10s --start-period=15s --retries=3 \
  CMD node healthcheck.js

# Use dumb-init to handle signals properly
ENTRYPOINT ["dumb-init", "--"]

# Command to run the application
CMD ["yarn", "start"]