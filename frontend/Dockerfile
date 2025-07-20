# Stage 1: Build React app
FROM node:18 as builder

WORKDIR /app

COPY package*.json ./
RUN npm install --force


COPY . .
RUN npm run build

# Stage 2: Serve with Nginx
FROM nginx:alpine

COPY --from=builder /app/build /usr/share/nginx/html
COPY nginx.conf /etc/nginx/nginx.conf

EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
