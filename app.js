const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const path = require('path');
const expressWs = require('express-ws');

const app = express();
const port = process.env.PORT || 3002; 

expressWs(app);

const scraper_hoteles = require('./routes/scraper_hoteles');

app.use(bodyParser.json());
app.use(cors());


app.listen(port, () => {
    console.log(`Server is listening on port ${port}`);
})

// Route handling
app.use('/scraper-hoteles', scraper_hoteles);