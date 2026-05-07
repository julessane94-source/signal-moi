FROM node:18-alpine

WORKDIR /app

COPY package*.json ./

# Utiliser npm install au lieu de npm ci
RUN npm install

COPY . .

EXPOSE 3000

CMD ["npm", "run", "dev"]