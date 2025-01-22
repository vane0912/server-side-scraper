const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const { createServer } = require('node:http');
const { Server } = require('socket.io');
const urls = require('./routes/scraper_hoteles');
require('dotenv').config();
const app = express();
const port = process.env.PORT || 3004; 

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
    urls.forEach(async (url) =>{
      const results = await url.funct(url.url, url.operadora, data)
      io.emit('message', results)
      messagesSent++;
      if (messagesSent === urls.length) {
        io.disconnectSockets();
      }
    })
  })
  socket.on('disconnect', () => {
    console.log('A user disconnected');
  });
});
  
server.listen(port, () => {
    console.log(`Server is listening on port ${port}`);
})
