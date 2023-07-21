FROM node:18 AS builder

COPY . .
RUN npm ci && npm run build

FROM node:18

COPY --chown=node:node --from=builder dist/ /runtime/dist/
COPY --chown=node:node --from=builder package.json /runtime
COPY --chown=node:node --from=builder package-lock.json /runtime

USER node
WORKDIR /runtime
ENV NODE_ENV=production

RUN npm ci --omit=dev

CMD [ "npm", "run", "exec" ]
