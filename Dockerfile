# ---- Build stage ----
FROM node:20-slim AS builder
WORKDIR /app

# openssl is required by Prisma's query engine on Debian-based images
RUN apt-get update -y && apt-get install -y --no-install-recommends openssl \
    && rm -rf /var/lib/apt/lists/*

COPY package.json package-lock.json ./
RUN npm ci

COPY . .

# Generate the Prisma client for this container's platform, then build Next.js.
# DATABASE_URL only needs to look like a valid Postgres URL at build time (no DB
# connection is made by `prisma generate`) — the real value is supplied at runtime.
ENV DATABASE_URL="postgresql://user:password@localhost:5432/postgres"
RUN npx prisma generate
RUN npm run build

# ---- Runtime stage ----
FROM node:20-slim AS runner
WORKDIR /app

ENV NODE_ENV=production

RUN apt-get update -y && apt-get install -y --no-install-recommends openssl \
    && rm -rf /var/lib/apt/lists/*

COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/.next ./.next
COPY --from=builder /app/public ./public
COPY --from=builder /app/prisma ./prisma
COPY --from=builder /app/prisma.config.ts ./prisma.config.ts
COPY --from=builder /app/next.config.ts ./next.config.ts
COPY --from=builder /app/package.json ./package.json

EXPOSE 30006

# Apply pending migrations, then start the production server.
CMD ["sh", "-c", "npx prisma migrate deploy && npm run start"]
