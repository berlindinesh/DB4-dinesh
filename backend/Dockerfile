FROM node:18

# Create app directory
WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm install

# Copy source code
COPY . .

# CRITICAL: Create uploads directory with proper permissions for volume mounting
RUN mkdir -p /app/uploads && chmod 755 /app/uploads

# Expose port
EXPOSE 5002

# Start the application
CMD ["npm", "run", "dev"]
