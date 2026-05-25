FROM node:24

WORKDIR /app

# copy dependency manifest first for better docker cache
COPY package.json package-lock.json* ./
RUN npm install --production

# copy app sources
COPY . .

EXPOSE 3000
CMD ["node", "app.js"]