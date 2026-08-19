FROM node:20-alpine

# Install Python 3, C++ (g++, gcc, libc-dev, nlohmann-json), and Java (OpenJDK 17)
RUN apk add --no-cache \
    python3 \
    g++ \
    gcc \
    libc-dev \
    libstdc++ \
    nlohmann-json \
    openjdk17

WORKDIR /app

COPY package*.json ./
RUN npm install

COPY . .

CMD ["node", "judge.js"]
