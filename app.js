const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const { createServer } = require('node:http');
const puppeteer = require('puppeteer');
const { Server } = require('socket.io');
const urls = require('./routes/scraper_hoteles');
require('dotenv').config();
const app = express();
const port = process.env.PORT || 3002; 

const server = createServer(app);
app.use(cors());
const io = new Server(server, {
    cors: {
        origin: '*',
    }
});

app.use(bodyParser.json());
app.get('/', (req, res) => {
    res.json({ message: 'Scraper Hoteles' })
})

io.on('connection', (socket) => {
    console.log('A user connected');
  
    socket.on('message', async (msg) => {
      const data = JSON.parse(msg);
      let messagesSent = 0;
      const browser = await puppeteer.launch({
        executablePath:
            process.env.NODE_ENV === 'production' 
                ? process.env.PUPPETEER_EXECUTABLE_PATH 
                : puppeteer.executablePath(),
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
            '--disable-gpu'
        ]
     }
    );
      const page = await browser.newPage();
      await page.setRequestInterception(true);
      page.on('request', (request) => {
        const blockedResources = ['image', 'font', 'media'];
        if (blockedResources.includes(request.resourceType())) {
            request.abort();
        } else {
            request.continue();
        }
    });
      for (const url of urls) {
          const results = await url.funct(page, url.url, url.operadora, data);
          try { 
              if (results.length > 30){
                    const sliced_array = results.slice(0, 30);
                    io.emit('message', sliced_array);
                    const final_array = results.slice(30);
                    io.emit('message', final_array);
                    messagesSent++;
              }else{
                    io.emit('message', results);
                    messagesSent++;
              }
          } catch (error) {
              io.emit('message', results);
              messagesSent++;
              console.error(`Error processing ${url.url}:`, error);
          }
      }
      if (messagesSent === urls.length) {
          await browser.close();
          io.disconnectSockets();
      }
  });
  
    socket.on('disconnect', () => {
      console.log('A user disconnected');
    });
});
  
server.listen(port, () => {
    console.log(`Server is listening on port ${port}`);
})
