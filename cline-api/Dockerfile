# Use the official Node.js 18 image with Alpine for smaller size
FROM node:18-alpine

# Install yarn globally for faster package management
RUN npm install -g yarn

# Set the working directory in the container
WORKDIR /app

# Create a non-root user first (better security practice)
RUN addgroup -g 1001 -S nodejs && \
    adduser -S cline -u 1001 -G nodejs

# Copy package.json and yarn.lock for better caching
COPY package*.json yarn.lock ./

# Change ownership of package files
RUN chown -R cline:nodejs /app

# Switch to non-root user for dependency installation
USER cline

# Install dependencies using yarn (faster than npm)
# Use --frozen-lockfile for reproducible builds
# Use --production to skip dev dependencies
RUN yarn install --frozen-lockfile --production --silent

# Copy the rest of the application code
COPY --chown=cline:nodejs . .

# Expose the port the app runs on
EXPOSE 3000

# Add health check with improved configuration
# Use 0.0.0.0 instead of localhost for container networking
HEALTHCHECK --interval=30s --timeout=10s --start-period=15s --retries=3 \
  CMD node healthcheck.js

# Command to run the application
CMD ["yarn", "start"]