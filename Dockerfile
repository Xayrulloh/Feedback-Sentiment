FROM docker.io/node:lts-alpine

ENV HOST=0.0.0.0
ENV PORT=3000

WORKDIR /src

RUN addgroup --system src && \
          adduser --system -G src

COPY dist/src src/
RUN chown -R src:src .

RUN npm --prefix src --omit=dev -f install

CMD [ "node", "src" ]
