FROM node:16-slim

# Set the working directory
WORKDIR /app

# Install required packages for Puppeteer
RUN apt-get update \
    && apt-get install -y wget gnupg \
    && apt-get install -y --no-install-recommends \
       libx11-xcb1 \
       libxcomposite1 \
       libxdamage1 \
       libxrandr2 \
       libasound2 \
       libatk1.0-0 \
       libcups2 \
       libnss3 \
       libxss1 \
       libxtst6 \
       fonts-liberation \
       libappindicator3-1 \
       libgtk-3-0 \
       libgbm-dev \
    && apt-get clean \
    && rm -rf /var/lib/apt/lists/*

# Copy package.json and package-lock.json
COPY package*.json ./

# Install dependencies, including Puppeteer
RUN npm install --omit=dev && npm cache clean --force

# Copy the app code to the container
COPY . .

# Set environment variables for Puppeteer
# Disable sandbox for Chromium (necessary for Render environments)
ENV PUPPETEER_SKIP_CHROMIUM_DOWNLOAD=false \
    PUPPETEER_EXECUTABLE_PATH=/usr/bin/google-chrome-stable \
    NODE_ENV=production

# Start the application
CMD ["node", "app.js"]