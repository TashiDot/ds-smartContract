FROM node:22-alpine AS base
WORKDIR /app
ENV NODE_ENV=production

# Install dependencies separately for caching
FROM base AS deps
COPY package*.json ./
RUN npm ci --omit=dev

FROM base AS build
COPY package*.json ./
RUN npm ci
COPY tsconfig.json ./
COPY src ./src
RUN npm run build

FROM base AS runner
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY package*.json ./
COPY dist ./dist
EXPOSE 4000
CMD ["node", "dist/index.js"]


