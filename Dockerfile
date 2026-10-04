FROM node:18-alpine

WORKDIR /app

# Install frontend dependencies & build
COPY package*.json ./
RUN npm install

COPY . .
RUN npm run build

# Install backend dependencies
WORKDIR /app/backend
RUN npm install

EXPOSE 3001
ENV PORT=3001
ENV NODE_ENV=production

CMD ["node", "server.js"]
