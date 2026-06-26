FROM node:22-alpine AS build

WORKDIR /app

COPY package.json ./
COPY scripts ./scripts
COPY src ./src
COPY index.html styles.css sw.js ./

RUN npm run build

FROM nginx:1.29-alpine

COPY nginx/default.conf /etc/nginx/conf.d/default.conf
COPY --from=build /app/index.html /usr/share/nginx/html/index.html
COPY --from=build /app/styles.css /usr/share/nginx/html/styles.css
COPY --from=build /app/sw.js /usr/share/nginx/html/sw.js
COPY --from=build /app/src/bundle.js /usr/share/nginx/html/src/bundle.js
