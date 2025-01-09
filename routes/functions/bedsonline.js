const puppeteer = require('puppeteer');
function delay(time) {
    return new Promise(function(resolve) { 
        setTimeout(resolve, time)
    });
}
async function bedsonline_scrape(url, operadora, client_data){
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
        await page.waitForSelector('#username', {visible: true})
        await page.type('#username', 'LGALINDO8')
        await page.waitForSelector('#password', {visible: true})
        await page.type('#password', 'Ventas12021968.')
        await page.locator('.login-button').click()
        await page.waitForNavigation({waitUntil: 'networkidle0', timeout:0})
        await page.locator('#dropDownInput').fill(client_data.destiny)
        await page.waitForSelector(".hb-dropdown__wrapper", {visible: true})
        await page.waitForSelector(".fts-dropdown__fts", {visible: true})
        await page.$$eval(".fts-dropdown__fts", el => el[0].click())
        const date_inputs = await page.$$('.hb-date-picker-input__field input')
        await date_inputs[0].type(client_data.checkin.slice(8, 10) + '/' + client_data.checkin.slice(5, 7) + '/' + client_data.checkin.slice(0, 4))
        await date_inputs[1].type(client_data.checkout.slice(8, 10) + '-' + client_data.checkout.slice(5, 7) + '-' + client_data.checkout.slice(0, 4))
        await page.$$eval('.cdk-text-field-autofill-monitored', el => el[1].click())
        await page.waitForSelector(".travellers-dropdown__more", {visible: true})
        if(client_data.room_numbers > 1){
            for (let i = 0; i < client_data.room_numbers - 1; i++){
                await page.$eval('.travellers-dropdown__more', el => el.click())
                await delay(2000)
            }
        } 
        await page.waitForSelector('::-p-xpath(//input[@formcontrolname="adults"])', {visible: true})
        const get_modal = await page.$$('.travellers-dropdown__line')
        for(let i = 0; i < client_data.rooms_details.length; i++){
            if(client_data.rooms_details[i].adults > 2){
                for(let adult = 0; adult < client_data.rooms_details[i].adults - 2; adult++){
                    await get_modal[i + i].$$eval('hb-form-field hb-form-suffix .hb-button-base', element => element[0].click())
                }
            }
            if(client_data.rooms_details[i].adults < 2){
                await get_modal[i + i].$$eval('hb-form-field hb-form-prefix .hb-button-base', element => element[0].click())
            }
            if(client_data.rooms_details[i].kids > 0){
                for(let kid = 0; kid < client_data.rooms_details[i].kids; kid++){
                    await get_modal[i + i + 1].$$eval('hb-form-field hb-form-suffix .hb-button-base', element => element[0].click())
                    await page.waitForSelector('::-p-xpath(//div[@formarrayname="childrenAges"])', {visible: true})
                    const get_kids = await page.$$('::-p-xpath(//div[@formarrayname="childrenAges"])')
                    await page.waitForSelector('hb-form-field', {visible: true})
                    await get_kids[i].$$eval('hb-form-field hb-select', (elements, index) => elements[index].click(), kid)
                    const ages_container = await page.$$('.cdk-overlay-pane')
                    await ages_container[1].$$eval('hb-option', (elements, index) => elements[index].click(), client_data.rooms_details[i].ages[kid])
                    await delay(1000)
                }   
            }
        }
        await page.$eval('.travellers-dropdown .hb-raised-button', element => element.click())
        await page.locator('::-p-xpath(//button[@data-qa="btn_search_stay_themepark"])').click()
        await page.waitForSelector('.loader__main', {visible: true})
        await page.waitForSelector('.loader__main', {hidden: true, timeout: 0})
        while (true) {
            const see_more = await page.$$('.hb-divider__content button')
            if (see_more.length > 0) {
                await see_more[0].click()
                await delay(2000)
            }else{
                await page.waitForSelector('.hb-card__body', {visible: true})
                const text = await page.$$('.hb-card__body')
                for(let i = 0; i < text.length; i++){
                    const arrange_data = {
                        operadora: 'Bedsonline',
                        price: await text[i].$eval('::-p-xpath(//span[@class="tooltip-markup-commission__price__container__integer"])', price => price.textContent.trim()),
                        score: await text[i].$$eval('.hb-base-icon-star', element => element.length),
                        hotel_title: await text[i].$eval('::-p-xpath(//span[@class="card-content-header__name__title"])', h1 => h1.textContent.trim()),
                        hotel_details: await text[i].$$eval('.card-price__product__price__room-info__group__code', element => element.length) === 0 ? 'Desconocido' : await text[i].$eval('.card-price__product__price__room-info__group__code', (h1) => {
                            switch(h1.textContent.trim()){
                                case 'SH':
                                    return 'Solo habitación'
                                case 'TI':
                                    return 'Todo incluido'
                                case 'AD':
                                    return 'Alojamiento y desayuno'
                                case 'DC':
                                    return 'Desayuno continental'
                                case 'MP':
                                    return 'Media pension'
                                case 'PC':
                                    return 'Pension completa'
                                case 'DB':
                                    return 'Desayuno buffet'
                                default:
                                    return h1.textContent.trim()
                            }
                        }),
                        cancelacion : await text[i].$$eval('.card-price__product__cancellation .card-price__product__detail span', cancel => cancel.length > 0 ? cancel[0].textContent : 'Desconocido')  
                    }
                    data.push(arrange_data)
                }
                break;
            }
        }
        browser.close()
        return data
    }
    catch (err) {
        await browser.close()
        console.log(err)
        return {'Error': 'Bedsonline'}
    }
}
module.exports = bedsonline_scrape