FROM node:20-alpine

WORKDIR /app

# Contexte de build = racine du dépôt.
COPY backend/package*.json ./
RUN npm ci --omit=dev

COPY backend/ ./
COPY database/ ./database/

ENV NODE_ENV=production
EXPOSE 10000

CMD ["npm", "start"]
