FROM node:lts-alpine3.16 as nodeAlpine

# Create app directory
RUN mkdir -p /usr/src/app
RUN mkdir -p /usr/src/db

# Volume DB folder
VOLUME /usr/src/db

# Create app directory
WORKDIR /usr/src/app

# Install global dependancy
RUN npm install sqlite3@5.0.5 -g
RUN npm install sequelize-cli@6.4.1 -g

# Copy files
COPY .env /usr/src/app/
COPY docker/config.json /usr/src/app/db/config/

# Install app dependencies
# A wildcard is used to ensure both package.json AND package-lock.json are copied
# where available (npm@5+)
COPY package*.json ./

RUN npm install
# If you are building your code for production
# RUN npm ci --only=production

# Bundle app source
COPY . .

# ONBUILD RUN npm run migrate:up
# RUN npm run migrate:up

EXPOSE 8081

# Run server
CMD ["node", "./bin/www" ]
