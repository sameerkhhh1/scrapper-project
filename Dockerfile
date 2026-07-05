FROM node:22-bullseye

# Python install
RUN apt-get update && apt-get install -y python3 python3-pip

WORKDIR /app

# Backend dependencies
COPY backend/package*.json ./backend/
WORKDIR /app/backend
RUN npm install

# Python dependencies
WORKDIR /app
COPY scraper/requirements.txt ./scraper/
# RUN pip3 install --break-system-packages -r scraper/requirements.txt
RUN pip3 install -r scraper/requirements.txt

# Copy complete project
COPY . .

WORKDIR /app/backend

EXPOSE 10000

CMD ["npm", "start"]