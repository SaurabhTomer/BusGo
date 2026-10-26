# Step 1: React ko build karo
FROM node:22-slim AS build
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build

# Step 2: build hua folder Nginx me rakho
FROM nginx:alpine
COPY --from=build /app/dist /usr/share/nginx/html