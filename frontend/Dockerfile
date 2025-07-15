FROM node:18-slim AS builder

WORKDIR /app

COPY package*.json ./
RUN npm install --legacy-peer-deps

COPY . .

ENV NODE_OPTIONS=--max-old-space-size=8192
ENV GENERATE_SOURCEMAP=false

RUN npm run build

FROM nginx:alpine
RUN rm -rf /usr/share/nginx/html/*
COPY --from=builder /app/build /usr/share/nginx/html
COPY nginx.conf /etc/nginx/nginx.conf

EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]

# # --------- Stage 1: Build the frontend ------------
#     FROM node:18-alpine AS builder

#     WORKDIR /app
    
#     COPY package*.json ./
    
#     RUN npm install --legacy-peer-deps
    
#     COPY . .
    
#     # ✅ Increase Node.js heap size to 4GB for build
#     ENV NODE_OPTIONS="--max-old-space-size=8192"
    
#     # Build the production-ready static files
#     RUN npm run build
    
#     # --------- Stage 2: Serve using NGINX ------------
#     FROM nginx:alpine
    
#     # Remove default nginx static assets
#     RUN rm -rf /usr/share/nginx/html/*
    
#     # Copy built files from builder stage
#     COPY --from=builder /app/build /usr/share/nginx/html
    
#     # Copy custom nginx config for SPA routing support
#     COPY nginx.conf /etc/nginx/nginx.conf
    
#     # Expose default NGINX port
#     EXPOSE 80
    
#     CMD ["nginx", "-g", "daemon off;"]
    