const puppeteer = require('puppeteer');
const expressWs = require('express-ws');
const regio_func = require('./functions/regio')
const vto_func = require('./functions/vto')
const azabache_func = require('./functions/azabache')
const checkhotel_func = require('./functions/check_hotel')
const bedsonline_func = require('./functions/bedsonline')
const express = require('express');
const router = express.Router();

expressWs(router); 

//async function scrapePage(url, operadora, client_data) {
//    const results_regio = await azabache_func(url, operadora, client_data)
//    return results_regio
//}
router.ws('/echo', (ws, req) => {
    const urls = [
        {
            operadora: 'Regio',
            url: 'https://b2b.regio.travel/login.xhtml?microsite=regioperadora&keepurl=true&url=%2Fhome',
            funct: regio_func
        },
        {
            operadora: 'VTO',
            url: 'https://vtoreservaciones.com/Default.aspx',
            funct: vto_func
        },
        {
            operadora: 'Check Hotel',
            url: 'https://checkhotel.mx/',
            funct: checkhotel_func
        },
        {
            operadora: 'Bedsonline',
            url: 'https://app.bedsonline.com/auth/login',
            funct: bedsonline_func
        },
        {
            operadora: 'Azabache',
            url: 'https://azabache.paquetedinamico.com/login.xhtml?microsite=azabache&keepurl=true&url=%2Fhome',
            funct: azabache_func
        }
        //{   
        //    operadora: 'OLR',
        //    url: 'https://motor.olrmayorista.com'
        //},
        //{
        //    operadora: 'Ruta Maya',
        //    url: 'https://www.rutamayatravel.com/sur4/user/login.html'
        //},
    ]
    let pendingMessages = urls.length; 
    let messagesSent = 0;
    ws.on('message', async (msg) => {
        urls.forEach(async (url) =>{
            const data = JSON.parse(msg);
            //const results = await scrapePage(url.url, url.operadora, data);
            const results = await url.funct(url.url, url.operadora, data)
            ws.send(JSON.stringify(results))
            messagesSent++;
            if (messagesSent === pendingMessages) {
                ws.close();
            }
        })
    });
})
module.exports = router