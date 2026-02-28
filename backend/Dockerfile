FROM node:18-alpine

WORKDIR /app

# Install PostgreSQL client (for pg_isready in entrypoint)
RUN apk add --no-cache postgresql-client

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm install --production

# Copy application files
COPY . .

# Create directories for generated documents
RUN mkdir -p /app/generated

# Make entrypoint executable
RUN chmod +x /app/docker-entrypoint.sh

# Expose port
EXPOSE 3000

# Use entrypoint that waits for database, then start Node.js
ENTRYPOINT ["/app/docker-entrypoint.sh"]
CMD ["node", "server.js"]
