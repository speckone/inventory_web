# Stage 1: Build
FROM node:20-alpine AS build

WORKDIR /app

ARG VITE_BASE_URL=http://localhost:5000
ENV VITE_BASE_URL=$VITE_BASE_URL

COPY package.json package-lock.json ./
RUN npm ci

COPY . .
RUN npm run build

# Stage 2: Serve
FROM nginx:alpine

COPY --from=build /app/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
