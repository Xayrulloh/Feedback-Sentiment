FROM node:lts-alpine

ENV HOST=0.0.0.0
ENV PORT=3000

WORKDIR /src
RUN addgroup -S app && adduser -S -G app app

COPY package.json pnpm-lock.yaml* ./

RUN npm install -g pnpm \
    && pnpm install --frozen-lockfile --prefer-offline

COPY . .

COPY entrypoint.sh .
RUN chmod +x entrypoint.sh

EXPOSE 3000

CMD ["./entrypoint.sh"]
