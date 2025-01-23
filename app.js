const express = require('express');
const puppeteer = require('puppeteer');
const bodyParser = require('body-parser');
const cors = require('cors');
const { createServer } = require('node:http');
const { Server } = require('socket.io');
const urls = require('./routes/scraper_hoteles');
require('dotenv').config();

const app = express();

// Middleware
app.use(cors());
app.use(bodyParser.json());

// Define HTTP route
app.get('/', (req, res) => {
  res.json({ message: 'Scraper Hoteles' });
});

// Create HTTP server
const server = createServer(app);

// Initialize WebSocket server
const io = new Server(server, {
  cors: {
    origin: '*',
  }
});


io.on('connection', async (socket) => {
  console.log('A user connected');
  socket.on('message', async (msg) => {
    const data = JSON.parse(msg);
    let messagesSent = 0;
    try {
      const browser = await puppeteer.launch({
        headless: true,
        args: [
          '--no-sandbox',
          '--disable-setuid-sandbox',
          '--disable-dev-shm-usage',
          '--disable-session-crashed-bubble',
          '--disable-accelerated-2d-canvas',
          '--no-first-run',
          '--no-zygote',
          '--single-process',
          '--noerrdialogs',
          '--disable-gpu',
        ],
      });
      for (const url of urls) {
        const results = await url.funct(browser, url.url, url.operadora, data);
        io.emit('message', results);
        messagesSent++;
        if (messagesSent === urls.length) {
          io.disconnectSockets();
        }
      }
    } catch (error) {
      io.emit('message', results);
      io.disconnectSockets();
      console.error('Error during scraping:', error);
    } finally {
      await browser.close();  // Close the browser after all scraping is done
    }
  });

  socket.on('disconnect', () => {
    console.log('A user disconnected');
  });
});

// Start the server
const PORT = process.env.PORT || 3004;
server.listen(PORT, () => {
  console.log(`Server is listening on port ${PORT}`);
});
