
FROM node:18-alpine
 
 
WORKDIR /app
 
 
COPY package*.json ./
 
 
RUN npm install --legacy-peer-deps
 
 
COPY . .
 
 
EXPOSE 3000
 
# Start the Node.js app
CMD ["npm", "start"]