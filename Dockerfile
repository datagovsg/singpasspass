FROM node:10.11-alpine

RUN apk update && apk upgrade

COPY . .
RUN npm install --info && npm cache clean -f && npm install -g nodemon

EXPOSE 3000

CMD ["nodemon","--config","nodemon.json","src/index.js"]