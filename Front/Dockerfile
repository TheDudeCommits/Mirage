FROM node:20-alpine AS builder

WORKDIR /app


COPY . .

RUN npm install --frozen-lockfile
RUN npm run build


FROM node:20-alpine AS runner

WORKDIR /app

COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/package*.json ./


EXPOSE 5000

CMD ["npm", "start"]