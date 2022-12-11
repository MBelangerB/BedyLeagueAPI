 # as XXXX => target Name
FROM node:lts-alpine3.16 as nodeBedyApi

# Create app directory
RUN mkdir -p /usr/src/api
RUN mkdir -p /usr/db

# Install sqlite
# RUN apk update 

# Volume DB folder
# VOLUME /usr/db

# Create app directory
WORKDIR /usr/src/api

# Install global dependancy
# RUN npm install pm2 -g
RUN npm install sqlite3@5.0.5 -g
RUN npm install sequelize-cli@6.4.1 -g

# Copy files
COPY docker/config.json /usr/src/api/src/db/config/
COPY .env               /usr/src/api/
COPY .sequelizerc       /usr/src/api/

# Install app dependencies
# A wildcard is used to ensure both package.json AND package-lock.json are copied
# where available (npm@5+)
COPY package*.json ./

RUN npm install
# If you are building your code for production
# RUN npm ci --only=production

# Bundle app source
# COPY . .
COPY src/ /usr/src/api/src/

# Copy entrypoint et donne les permission (local)
COPY docker/node/docker-entrypoint.sh /usr/local/bin/
RUN chmod +x /usr/local/bin/docker-entrypoint.sh

# ONBUILD RUN npm run migrate:up
# RUN npm run migrate:up

EXPOSE 8081

# Run server
ENTRYPOINT [ "docker-entrypoint.sh" ]
CMD ["node", "src/bin/www" ]
# CMD ["pm2-runtime", "src/bin/www"]