FROM node:20-alpine as frontend-builder
WORKDIR /app/frontend
RUN npm install -g pnpm
COPY package.json pnpm-lock.yaml ./
RUN pnpm install --frozen-lockfile
COPY . .
# Set explicit API Base URL for build to ensure axios uses relative path
ENV VITE_API_BASE_URL=/api
RUN pnpm build

FROM node:20-alpine as backend-builder
WORKDIR /app/server
# We assume the build context is the project root, so we copy from server/ directory
COPY server/package.json ./
RUN npm install
COPY server/tsconfig.json ./
COPY server/src ./src
RUN npm run build

FROM node:20-alpine as production
WORKDIR /app

# Install production dependencies for backend and curl for healthcheck
RUN apk add --no-cache curl
COPY server/package.json ./
RUN npm install --production

# Copy compiled backend
COPY --from=backend-builder /app/server/dist ./dist

# Copy compiled frontend to a public folder
COPY --from=frontend-builder /app/frontend/dist ./public

# Expose port
EXPOSE 3000

# Healthcheck to ensure API is responsive
HEALTHCHECK --interval=30s --timeout=3s \
  CMD curl -f http://localhost:3000/api/health || exit 1

# Start server
CMD ["node", "dist/index.js"]
