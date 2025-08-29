FROM node:20-slim AS base
ENV PNPM_HOME="/pnpm"
ENV PATH="$PNPM_HOME:$PATH"
RUN corepack enable
COPY . /app
WORKDIR /app

FROM base
RUN pnpm install
EXPOSE 10888
CMD [ "pnpm", "run", "dev" ]