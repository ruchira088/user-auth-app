FROM node:6.9.4

WORKDIR /user/development/image-gallery-app
COPY ./package.json .

RUN npm install

COPY . .

EXPOSE 8000 5858

ENTRYPOINT ["npm", "run"]

CMD ["dev"]