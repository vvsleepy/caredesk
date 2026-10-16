FROM node:22-alpine3.24 AS build

WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build

FROM nginxinc/nginx-unprivileged:1.31-alpine

# envsubst renders BACKEND_HOST at container start so the same image
# works in Compose (backend:8000) and Kubernetes (caredesk-backend:8000).
COPY nginx.conf.template /etc/nginx/templates/default.conf.template
COPY --from=build /app/dist /usr/share/nginx/html

EXPOSE 8080

CMD ["sh", "-c", "export BACKEND_HOST=${BACKEND_HOST:-backend:8000}; envsubst '$BACKEND_HOST' < /etc/nginx/templates/default.conf.template > /etc/nginx/conf.d/default.conf && nginx -g 'daemon off;'"]
