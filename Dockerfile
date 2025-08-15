FROM node:lts-alpine
ENV HOST=0.0.0.0
ENV PORT=3000

WORKDIR /src
RUN addgroup -S app && adduser -S -G app app

RUN corepack enable
COPY package.json pnpm-lock.yaml ./
RUN pnpm install --prod --frozen-lockfile

COPY dist/src ./dist

RUN chown -R app:app .
USER app

CMD ["node", "dist/main.js"]
