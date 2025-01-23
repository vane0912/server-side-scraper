const vto_func = require('./functions/vto')
const azabache_func = require('./functions/azabache')
const checkhotel_func = require('./functions/check_hotel')
const bedsonline_func = require('./functions/bedsonline')
const regio_func = require('./functions/regio')

const urls = [
    {
        operadora: 'Regio',
        url: 'https://b2b.regio.travel/home',
        funct: regio_func
    },
    {
        operadora: 'VTO',
        url: 'https://vtoreservaciones.com/Hotel/Hotel.aspx',
        funct: vto_func
    },
    //https://vtoreservaciones.com/Hotel/Hotel.aspx
    {
        operadora: 'Check Hotel',
        url: 'https://checkhotel.mx/',
        funct: checkhotel_func
    },
    {
        operadora: 'Bedsonline',
        url: 'https://app.bedsonline.com/main',
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
module.exports = urls;