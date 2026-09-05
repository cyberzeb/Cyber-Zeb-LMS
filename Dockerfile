# Frontend production image: build Vite app, serve with nginx.
FROM node:22-alpine AS build

WORKDIR /app

COPY package.json package-lock.json ./
RUN npm ci

COPY . .

ARG VITE_API_BASE_URL=/api/v1
ENV VITE_API_BASE_URL=$VITE_API_BASE_URL

RUN npm run build

FROM nginx:1.27-alpine

COPY deploy/nginx.conf /etc/nginx/templates/http.conf
COPY deploy/nginx-https.conf /etc/nginx/templates/https.conf
COPY deploy/nginx-entrypoint.sh /nginx-entrypoint.sh
COPY --from=build /app/dist /usr/share/nginx/html

RUN chmod +x /nginx-entrypoint.sh

EXPOSE 80 443

CMD ["/nginx-entrypoint.sh"]
