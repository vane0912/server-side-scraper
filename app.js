const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const { createServer } = require('node:http');
const { Server } = require('socket.io');
const scraper_hoteles = require('./routes/scraper_hoteles');
const urls = require('./routes/scraper_hoteles');

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
  
    socket.on('message', (msg) => {
        let pendingMessages = urls.length; 
        let messagesSent = 0;
        scraper_hoteles.forEach(async (url) =>{
          const data = JSON.parse(msg);
          //const results = await scrapePage(url.url, url.operadora, data);
          const results = await url.funct(url.url, url.operadora, data)
          io.emit('message', results)
          messagesSent++;
          if (messagesSent === pendingMessages) {
            io.disconnectSockets()
          }
        })
    });
    socket.on('disconnect', () => {
      console.log('A user disconnected');
    });
});
  
server.listen(port, () => {
    console.log(`Server is listening on port ${port}`);
})
