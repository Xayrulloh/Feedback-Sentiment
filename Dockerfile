FROM node:lts-alpine
ENV HOST=0.0.0.0
ENV PORT=3000

WORKDIR /src
RUN addgroup -S app && adduser -S -G app app

COPY . .

RUN npm install -g pnpm

RUN pnpm install --frozen-lockfile --prefer-offline --ignore-scripts

EXPOSE 3000

CMD ["pnpm", "start"]