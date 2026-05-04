FROM oven/bun:1.1.0-alpine as base
WORKDIR /app

# Install dependencies into temp directory
# This will cache them and speed up future builds
FROM base AS install
RUN mkdir -p /temp/dev
COPY package.json bun.lock /temp/dev/
RUN cd /temp/dev && bun install --frozen-lockfile

# Install with --production (exclude devDependencies)
RUN mkdir -p /temp/prod
COPY package.json bun.lock /temp/prod/
RUN cd /temp/prod && bun install --frozen-lockfile --production

# Copy node_modules from temp directory
# Then copy all (non-ignored) project files into the image
FROM base AS prerelease
COPY --from=install /temp/dev/node_modules node_modules
COPY . .

# [Optional] tests & build
ENV NODE_ENV=production
RUN bun run build

# Final image
FROM base AS release
COPY --from=install /temp/prod/node_modules node_modules
COPY --from=prerelease /app/dist dist
COPY --from=prerelease /app/package.json .
COPY --from=prerelease /app/.env .

# Run the app
USER bun
EXPOSE 5000/tcp
ENTRYPOINT [ "bun", "run", "start" ]
