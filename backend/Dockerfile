FROM node:18-alpine

WORKDIR /app

COPY package*.json ./
RUN npm install --production

COPY . .

ENV NODE_ENV=production
# Port configuré dans render.yaml et utilisé par server.js
EXPOSE 3000

CMD ["npm", "start"]