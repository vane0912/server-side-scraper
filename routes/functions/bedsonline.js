const puppeteer = require('puppeteer');
function delay(time) {
    return new Promise(function(resolve) { 
        setTimeout(resolve, time)
    });
}
async function bedsonline_scraper(url, operadora, client_data){
    const browser = await puppeteer.launch({
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
          '--disable-gpu',
        ],
    });
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
    const data = []
    await page.goto(url);
    await page.setViewport({width: 1480, height: 1024});
    try{
        await page.waitForSelector('#username', {visible: true})
        await page.type('#username', 'LGALINDO8')
        await page.waitForSelector('#password', {visible: true})
        await page.type('#password', 'Ventas12021968.')
        await page.locator('.login-button').click()
        await page.waitForNavigation({waitUntil: 'networkidle0', timeout:100000})

        await page.locator('#dropDownInput').fill(client_data.destiny)
        await page.waitForSelector(".hb-dropdown__wrapper", {visible: true})
        await page.waitForSelector(".fts-dropdown__fts", {visible: true})
        await page.$$eval(".fts-dropdown__fts", el => el[0].click())

        const date_start = page.locator('::-p-xpath(//input[@formcontrolname="init"])')
        await date_start.fill(client_data.checkin.slice(8, 10) + '/' + client_data.checkin.slice(5, 7) + '/' + client_data.checkin.slice(0, 4))
        await delay(4000)
        const date_end = page.locator('::-p-xpath(//input[@formcontrolname="end"])')
        await date_end.fill(client_data.checkout.slice(8, 10) + '/' + client_data.checkout.slice(5, 7) + '/' + client_data.checkout.slice(0, 4))

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
        await page.waitForSelector('.loader__main', {hidden: true, timeout: 100000})
        await page.waitForSelector('::-p-xpath(//hb-tree[@data-qa="filter_checkbox"])')
        
        const get_filter = await page.$$('::-p-xpath(//hb-tree[@data-qa="filter_checkbox"])')
        const see_more_filter = await get_filter[0].$$('button')
        if(see_more_filter.length > 0){
            await see_more_filter[0].click()
        }
        const filters_checkboxes = await get_filter[0].$$eval('.checkbox-filter .hb-checkbox__label', labels => labels.map(label => label.textContent.toLowerCase()))
        let typevalue;
        client_data.type === 'Solo alojamiento' ? typevalue = 'Sólo habitación (hoteles)' : typevalue = client_data.type
        for (let i = 0; i < filters_checkboxes.length; i++) {
            if (filters_checkboxes[i].includes(typevalue.toLowerCase())) {
                const labelElement = (await get_filter[0].$$('label'))[i];
                await labelElement.click();
                await page.waitForSelector('clientb2b-front-skeleton-action-box', {visible: true})
                await page.waitForSelector('clientb2b-front-skeleton-action-box', { hidden: true });
                break
            }
            if(i + 1 == filters_checkboxes.length && !filters_checkboxes[i].includes(typevalue.toLowerCase())){
                await browser.close()
                return {'Error': 'Bedsonline, no tiene habitaciones tipo ' + typevalue}
            }
        }

        while (true) {
            const see_more = await page.$$('.hb-divider__content button')
            if (see_more.length > 0) {
                await see_more[0].click()
                await delay(2000)
            }else{
                await delay(3000)
                break
            }
        }
        await page.waitForSelector('.hb-card__body', {visible: true})
        const text = await page.$$('clientb2b-front-feature-card-layout')
        await Promise.all(text.map(async (el) => {
            const arrange_data = {
                operadora: 'Bedsonline',
                price: await el.$eval('.tooltip-markup-commission__price__container__integer', price => price.textContent.trim()),
                score: (await el.$$('.hb-base-icon-star')).length,
                hotel_title: await el.$eval('.card-content-header__name__title', h1 => h1.textContent.trim()),
                hotel_details: await el.$eval('.card-price__product__price__room-info__group__code', (h1) => {
                    switch (h1.textContent.trim()) {
                        case 'SH': return 'Solo habitación';
                        case 'TI': return 'Todo incluido';
                        case 'AD': return 'Alojamiento y desayuno';
                        case 'DC': return 'Desayuno continental';
                        case 'MP': return 'Media pension';
                        case 'PC': return 'Pension completa';
                        case 'DB': return 'Desayuno buffet';
                        default: return h1.textContent.trim();
                    }
                }).catch(() => typevalue), // Fallback to `typevalue` if the selector is not found
                cancelacion: await el.$eval('.card-price__product__cancellation .card-price__product__detail span', cancel => cancel.textContent.trim()).catch(() => 'Desconocido')
            };
            data.push(arrange_data);
        }));
        await browser.close()
        return data
    }
    catch(err){
        await browser.close()
        console.log(err)
        return {'Error': 'Bedsonline'}
    }
}
module.exports = bedsonline_scraper