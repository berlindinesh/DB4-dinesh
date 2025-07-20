# Stage 1: Build React app
FROM node:18 as builder

WORKDIR /app

# Set higher memory limit for Node.js (8GB)
ENV NODE_OPTIONS="--max-old-space-size=8192"

COPY package*.json ./
RUN npm install --force

COPY . .
RUN npm run build

# Stage 2: Serve with Nginx
FROM nginx:alpine

# Copy built React files
COPY --from=builder /app/build /usr/share/nginx/html

# Optional: custom Nginx config
COPY nginx.conf /etc/nginx/nginx.conf

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]

