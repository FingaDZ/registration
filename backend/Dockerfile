FROM node:18-alpine

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm ci --only=production

# Copy application files
COPY . .

# Create directories for generated documents
RUN mkdir -p /app/generated

# Expose port
EXPOSE 3000

# Start application
CMD ["node", "server.js"]
