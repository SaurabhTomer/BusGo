FROM node:22-slim

# Prisma ko openssl chahiye
RUN apt-get update -y && apt-get install -y openssl && rm -rf /var/lib/apt/lists/*

WORKDIR /app

COPY package*.json ./
RUN npm ci

COPY . .


RUN DATABASE_URL=postgresql://x:x@x/x DIRECT_URL=postgresql://x:x@x/x npx prisma generate

ENV NODE_ENV=production
EXPOSE 8000
CMD ["node", "index.js"]