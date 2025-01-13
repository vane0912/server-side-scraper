FROM ghcr.io/puppeteer/puppeteer:23.11.1

# Set environment variables for Puppeteer
ENV PUPPETEER_SKIP_CHROMIUM_DOWNLOAD=true \
    PUPPETEER_EXECUTABLE_PATH=/usr/bin/google-chrome-stable

# Install Google Chrome
RUN apt-get update && apt-get install -y wget gnupg \
    && wget -qO - https://dl.google.com/linux/linux_signing_key.pub | apt-key add - \
    && sh -c 'echo "deb [arch=amd64] http://dl.google.com/linux/chrome/deb/ stable main" >> /etc/apt/sources.list.d/google-chrome.list' \
    && apt-get update && apt-get install -y google-chrome-stable \
    && apt-get clean && rm -rf /var/lib/apt/lists/*

# Set up app
WORKDIR /usr/src/app
COPY package*.json ./
RUN npm ci
COPY . .

CMD ["node", "app.js"]
