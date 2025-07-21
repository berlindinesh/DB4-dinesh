FROM node:18

WORKDIR /app

# Cache npm install step
COPY package*.json ./
RUN npm install

# Copy only app code (changing this will invalidate cache from here down)
COPY . .

EXPOSE 5002
CMD ["node", "server.js"]
