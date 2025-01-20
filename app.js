const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const { createServer } = require('node:http');
const { Server } = require('socket.io');
const urls = require('./routes/scraper_hoteles');
require('dotenv').config();
const app = express();
const port = process.env.PORT || 3004; 
const pLimit = require('p-limit');
const limit = pLimit.default(2)

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
    urls.map(async (url) =>{
      await limit(() => 
        url.funct(url.url, url.operadora, data).then((results) => {
          io.emit('message', results);
          messagesSent++;
          if (messagesSent === urls.length) {
            io.disconnectSockets();
          }
        })
      )
    })
  });
  socket.on('disconnect', () => {
    console.log('A user disconnected');
  });
});
  
server.listen(port, () => {
    console.log(`Server is listening on port ${port}`);
})
