# --- Stage 1: Build Storybook ---
FROM node:24.11.1 AS builder

WORKDIR /app

COPY package*.json ./
RUN npm install

COPY . .
RUN npm run storybook:build


# --- Stage 2: Serve with Nginx ---
FROM nginx:stable

# Copy Storybook build into Nginx web root
COPY --from=builder /app/storybook-static /usr/share/nginx/html

# Custom nginx config
COPY ./.deploy/nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
