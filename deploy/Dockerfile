FROM node:22-alpine AS build

WORKDIR /app

COPY package.json ./
COPY scripts ./scripts
COPY web ./web

RUN npm run build

FROM nginx:1.29-alpine

COPY deploy/nginx/default.conf /etc/nginx/conf.d/default.conf
COPY --from=build /app/web/index.html /usr/share/nginx/html/index.html
COPY --from=build /app/web/styles.css /usr/share/nginx/html/styles.css
COPY --from=build /app/web/sw.js /usr/share/nginx/html/sw.js
COPY --from=build /app/web/src/bundle.js /usr/share/nginx/html/src/bundle.js
