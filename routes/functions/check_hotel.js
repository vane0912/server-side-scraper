const puppeteer = require('puppeteer');
function delay(time) {
    return new Promise(function(resolve) { 
        setTimeout(resolve, time)
    });
}
async function checkhotel_scrape(url, operadora, client_data){
    const browser = await puppeteer.launch({
        headless: true,
        args: ['--no-sandbox', '--disable-setuid-sandbox'],
    });
    const page = await browser.newPage();
    await page.setRequestInterception(true);
    const data = []
    page.on('request', (request) => {
        const blockedResources = ['image', 'font', 'media'];
        if (blockedResources.includes(request.resourceType())) {
            request.abort();
        } else {
            request.continue();
        }
    });
    await page.goto(url);
    await page.setViewport({width: 1480, height: 1024});
    try{
        await page.waitForSelector('#user');
        await page.type('#user', 'mxtravel1a');

        await page.waitForSelector('#pass');
        await page.type('#pass', 'mxtravel1a1'); 
        
        await page.waitForSelector('.send', { visible: true});
        await page.$eval('.send', element => element.click())
        await page.waitForNavigation({waitUntil: 'networkidle0', timeout:0})
        
        await page.locator('.swal-button--confirm').click()
        await page.waitForSelector('#destino', {visible: true})
        await page.locator('#destino').fill(client_data.destiny)
        await delay(2000)
        await page.keyboard.press('ArrowDown')
        await page.keyboard.press('Enter')

        await page.$eval('#startDate', (el, data) => {
            el.value = data.checkin.slice(8, 10) + '-' + data.checkin.slice(5, 7) + '-' + data.checkin.slice(0, 4)}, client_data);
        await page.$eval('#endDate', (el, data) => {
            el.value = data.checkout.slice(8, 10) + '-' + data.checkout.slice(5, 7) + '-' + data.checkout.slice(0, 4)}, client_data);
        await page.select("#rooms", `${client_data.room_numbers}`)
        for(let i = 0; i < client_data.room_numbers; i++){
            await page.select(`#r${i + 1}a`, `${client_data.rooms_details[i].adults}`)
            if(client_data.rooms_details[i].kids > 0){
                await page.select(`#r${i + 1}k`, `${client_data.rooms_details[i].kids}`)
                for(let kid_age = 0; kid_age < client_data.rooms_details[i].ages.length; kid_age++){
                    await page.waitForSelector(`#r${i + 1}k${kid_age + 1}a`, {visible: true})
                    await page.select(`#r${i + 1}k${kid_age + 1}a`, `${client_data.rooms_details[i].ages[kid_age]}`)
                }
            }
        }
        await page.locator("#ver_precios").click()
        await page.waitForNavigation({waitUntil: 'networkidle0', timeout:60000})
        if(await page.$('#pagenavi .paginator')){
            const paginator = await page.$('#pagenavi .paginator')
            const paginator_el = await paginator.$$eval('a', el => el.length)
            for(let pag = 0; pag < paginator_el - 1; pag++){
                await delay(2000)
                if (pag <= 1){
                    await page.$$eval('.paginator a', (el, index) => el[index].click(), pag);
                }else{
                    await page.$$eval('.paginator a', (el, index) => el[index + 1].click(), pag);
                }
                await page.waitForSelector('.blockPage', {visible: true})
                await page.waitForSelector('.blockPage', {hidden: true})
                await page.waitForSelector('article', {visible: true})
                const text = await page.$$('article')
                for(let i = 0; i < text.length; i++){
                    const arrange_data = {
                        operadora: 'Check Hotel',
                        price: await text[i].$$eval('.hotel--prices > p', price => price[1].textContent.trim()),
                        score: await text[i].$$eval('.fa-star:not(.hidden-print)', element => element.length),
                        hotel_title: await text[i].$eval('h3', h1 => h1.textContent.trim()),
                        hotel_details: "Desconocido",
                        img_hotel : await text[i].$eval('.img-responsive', element => element.src),
                        cancelacion: "Desconocido" 
                    }
                    data.push(arrange_data)
                }
            }
        }else{
            await page.waitForSelector('article', {visible: true})
            const text = await page.$$('article')
            for(let i = 0; i < text.length; i++){
                const arrange_data = {
                    operadora: 'Check Hotel',
                    price: await text[i].$$eval('.hotel--prices > p', price => price[1].textContent.trim()),
                    score: await text[i].$$eval('.fa-star:not(.hidden-print)', element => element.length),
                    hotel_title: await text[i].$eval('h3', h1 => h1.textContent.trim()),
                    hotel_details: "Desconocido",
                    img_hotel : await text[i].$eval('.img-responsive', element => element.src),
                    cancelacion: "Desconocido" 
                }
                data.push(arrange_data)
            }
        }
        browser.close()
        return data
    }catch{
        await browser.close()
        console.log(err)
        return {'Error': 'Check Hotel'}
    }
}

module.exports = checkhotel_scrape