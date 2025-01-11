const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const { createServer } = require('node:http');
const { Server } = require('socket.io');
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
  
    socket.on('message', async (msg) => {
      const data = JSON.parse(msg);
      let messagesSent = 0;
      
      for (const url of urls) {
          try {
              const results = await url.funct(url.url, url.operadora, data); // Wait for each URL to complete
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
              console.error(`Error processing ${url.url}:`, error);
          }
      }
      if (messagesSent === urls.length) {
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
