# Imagen base oficial de Node.js
FROM node:20-slim

# Establece el directorio de trabajo
WORKDIR /app

# Instala dependencias necesarias del sistema para Puppeteer
RUN apt-get update && apt-get install -y \
    wget \
    ca-certificates \
    fonts-liberation \
    libasound2 \
    libatk-bridge2.0-0 \
    libatk1.0-0 \
    libc6 \
    libcairo2 \
    libcups2 \
    libdbus-1-3 \
    libexpat1 \
    libfontconfig1 \
    libgbm1 \
    libgcc1 \
    libglib2.0-0 \
    libgtk-3-0 \
    libnspr4 \
    libnss3 \
    libpango-1.0-0 \
    libx11-6 \
    libx11-xcb1 \
    libxcb1 \
    libxcomposite1 \
    libxcursor1 \
    libxdamage1 \
    libxext6 \
    libxfixes3 \
    libxi6 \
    libxrandr2 \
    libxrender1 \
    libxss1 \
    libxtst6 \
    lsb-release \
    xdg-utils \
    --no-install-recommends && \
    rm -rf /var/lib/apt/lists/*

# Copia los archivos de dependencias primero (mejor para caché de Docker)
COPY package*.json ./

# Instala dependencias de Node.js
RUN npm install

# Copia el resto del código de la aplicación
COPY . .

# Expone el puerto que usa tu app (ajústalo si usas otro)
EXPOSE 3000

# Establece variable de entorno para Puppeteer (evita errores de sandbox)
ENV PUPPETEER_SKIP_CHROMIUM_DOWNLOAD=true
ENV PUPPETEER_EXECUTABLE_PATH=/usr/bin/google-chrome-stable

# Si usas Chromium empaquetado por Puppeteer, usa este CMD:
CMD ["npm", "start"]
