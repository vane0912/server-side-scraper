const puppeteer = require('puppeteer');
function delay(time) {
    return new Promise(function(resolve) { 
        setTimeout(resolve, time)
    });
}

async function azabache_scraper(url, operadora, client_data){
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
        await page.waitForSelector('.login-email-input', {timeout: 0});
        await page.type('.login-email-input', 'ventas.mxtravel2@gmail.com');

        await page.waitForSelector('.login-password-input');
        await page.type('.login-password-input', 'Ventas1202.'); 
        await page.locator('.signin-button').click() 
        
        // Two step Validation
        /*
            await page.waitForSelector('.dev-sendUsingEmailAddress', {visible: true, timeout:0})
            await page.$eval('.dev-sendUsingEmailAddress', el => el.click())
            await page.waitForSelector('#twoStepValidationMailAlert', {visible: true, timeout:0})

            const authorize = await authorization_gmail()
            const get_two_step = await getMessage(authorize)
            await page.waitForSelector('.dev-two-validation-input', {visible: true})
            await page.type('.dev-two-validation-input', get_two_step)
            await page.locator('.signin-button').click()
        */

        await page.waitForSelector('.c-modal-cookies-consent', { visible: true })
        await page.locator('.c-modal-cookies-consent .dev-accept-all').click()
        await page.waitForNavigation({waitUntil: 'domcontentloaded', timeout: 0})
        await page.waitForSelector('::-p-xpath(//a[@id="j_id_6v:init-compositor-all:homeTab:0:onlyHotel"])')
        await page.locator('::-p-xpath(//a[@id="j_id_6v:init-compositor-all:homeTab:0:onlyHotel"])').click()
        await delay(3000)
        await page.waitForSelector('::-p-xpath(//input[@data-p-label="Destino"])', { visible: true })
        await page.locator('::-p-xpath(//input[@data-p-label="Destino"])').fill(client_data.destiny)
        await page.waitForSelector('::-p-xpath(//tr[@id="j_id_6v:init-compositor-all:destinationOnlyAccommodation_item_0"])')
        await page.locator('::-p-xpath(//tr[@id="j_id_6v:init-compositor-all:destinationOnlyAccommodation_item_0"])').click()
        
        await page.locator('.departure-date').fill(client_data.checkin.slice(8, 10) + '/' + client_data.checkin.slice(5, 7) + '/' + client_data.checkin.slice(0, 4))
        await delay(2000)
        await page.keyboard.press('Enter')
        await page.locator('.arrival-date').fill(client_data.checkout.slice(8, 10) + '/' + client_data.checkout.slice(5, 7) + '/' + client_data.checkout.slice(0, 4))
        await delay(2000)
        await page.keyboard.press('Enter')  
        await page.waitForSelector('::-p-xpath(//button[@data-content="Habitaciones y distribución"])', { visible: true })
        await page.locator('::-p-xpath(//button[@data-content="Habitaciones y distribución"])').click()
        if(client_data.room_numbers > 1){
            for(let i = 0; i < client_data.room_numbers - 1 ; i++){
                await page.waitForSelector('.dropdown-choose-rooms')
                await page.waitForSelector('.add-room-button', { visible: true });
                await page.locator('.add-room-button').click()
                await page.waitForSelector('::-p-xpath(//div[@id="j_id_6v:init-compositor-all:blockFormContent_page-home_blocker"])', { visible: true });
                await page.waitForSelector('::-p-xpath(//div[@id="j_id_6v:init-compositor-all:blockFormContent_page-home_blocker"])', { hidden: true });
            }
        }
        for(let i = 0; i < client_data.rooms_details.length; i++){
            await page.select('::-p-xpath(//select[@id="j_id_6v:init-compositor-all:roomsSH:distri:' + i + ':adults"])', client_data.rooms_details[i].adults.toString())
            await page.waitForSelector('::-p-xpath(//div[@id="j_id_6v:init-compositor-all:blockFormContent_page-home_blocker"])', { visible: true });
            await page.waitForSelector('::-p-xpath(//div[@id="j_id_6v:init-compositor-all:blockFormContent_page-home_blocker"])', { hidden: true });
            await page.select('::-p-xpath(//select[@id="j_id_6v:init-compositor-all:roomsSH:distri:' + i + ':children"])', client_data.rooms_details[i].kids.toString())
            await page.waitForSelector('::-p-xpath(//div[@id="j_id_6v:init-compositor-all:blockFormContent_page-home_blocker"])', { visible: true });
            await page.waitForSelector('::-p-xpath(//div[@id="j_id_6v:init-compositor-all:blockFormContent_page-home_blocker"])', { hidden: true });
            for(let ages = 0; ages < client_data.rooms_details[i].kids; ages++){
                await page.waitForSelector('::-p-xpath(//select[@id="j_id_6v:init-compositor-all:roomsSH:distri:' + i + ':childAges:' + ages + ':age"])')
                await page.select('::-p-xpath(//select[@id="j_id_6v:init-compositor-all:roomsSH:distri:' + i + ':childAges:' + ages + ':age"])', client_data.rooms_details[i].ages[ages].toString())
                await page.waitForSelector('::-p-xpath(//div[@id="j_id_6v:init-compositor-all:blockFormContent_page-home_blocker"])', { visible: true });
                await page.waitForSelector('::-p-xpath(//div[@id="j_id_6v:init-compositor-all:blockFormContent_page-home_blocker"])', { hidden: true });
            }
        }
        await page.locator('.accept-distributions').click()
        await page.locator('.dev-button-startTrip').click()
        await page.waitForSelector('.modalCargando', { visible: true });
        await page.waitForSelector('.modalCargando', { hidden: true, timeout: 0 });
        await page.waitForSelector('.dev-incremental-completed', { visible: true, timeout: 0 });
        const hotel_label_wraper = await page.$('#accomodationType')
        const labels = await hotel_label_wraper.$$eval('label', labels => labels.map(label => label.textContent));
        for (let i = 0; i < labels.length; i++) {
            if (labels[i] === 'Hotel') {
                const labelElement = (await hotel_label_wraper.$$('label'))[i];
                await labelElement.click();
                await page.waitForSelector('.ui-blockui', { visible: true });
                await page.waitForSelector('.ui-blockui', { hidden: true });
            }
        }
        await page.waitForSelector('.ui-dataview-column', { visible: true, timeout: 8000 });
        if (await page.$('.ui-paginator-bottom')){
            while (true) {
                await page.waitForSelector('.ui-blockui-content__wrapper', { hidden: true });
                const hasClass = await page.evaluate((checkSelector, className) => {
                  const element = document.querySelector(checkSelector);
                  return element ? element.classList.contains(className) : false;
                }, '.ui-paginator-next', 'ui-state-disabled');
                if (hasClass) {
                    const text = await page.$$('.ui-dataview-column', {timeout: 0})
                    await Promise.all(text.map(async (el) => {
                        const cancelacion =  await el.$('.c-extended__selected-combination .clr--success span')
                        const arrange_data = {
                            operadora: 'Azabache',
                            hotel_title :  await el.$eval('.dev-hotel-title', h1 => h1.textContent.trim()),
                            score : await el.$$eval('.c-hotel-status__category.u-display--block .c-hotel-status__star:not(.hidden)', element => element.length),
                            hotel_details : await el.$eval('.c-extended__selected-combination .o-group--small span', room => room.textContent.trim().charAt(0).toUpperCase() + room.textContent.trim().slice(1).toLowerCase()),
                            price: await el.$eval('.c-price__primary', price => price.textContent.trim()),
                            cancelacion: cancelacion ? await el.$eval('.c-extended__selected-combination .clr--success span', cancelation_txt => cancelation_txt.textContent.trim()) : "Sin Cancelacion gratis"
                        }
                        return data.push(arrange_data)
                    }));
                    break;
                } else {
                    const text = await page.$$('.ui-dataview-column', {timeout: 0})
                    await Promise.all(text.map(async (el) => {
                        const cancelacion =  await el.$('.c-extended__selected-combination .clr--success span')
                        const arrange_data = {
                            operadora: 'Azabache',
                            hotel_title :  await el.$eval('.dev-hotel-title', h1 => h1.textContent.trim()),
                            score : await el.$$eval('.c-hotel-status__category.u-display--block .c-hotel-status__star:not(.hidden)', element => element.length),
                            hotel_details : await el.$eval('.c-extended__selected-combination .o-group--small span', room => room.textContent.trim().charAt(0).toUpperCase() + room.textContent.trim().slice(1).toLowerCase()),
                            price: await el.$eval('.c-price__primary', price => price.textContent.trim()),
                            cancelacion: cancelacion ? await el.$eval('.c-extended__selected-combination .clr--success span', cancelation_txt => cancelation_txt.textContent.trim()) : "Sin Cancelacion gratis"
                        }
                        return data.push(arrange_data)
                    }));
                    await page.waitForSelector('.ui-paginator-next', { timeout: 10_000, visible: 'true' });
                    await page.$eval('.ui-paginator-next', el => el.click())
                    await delay(4000)
                }
              }
        }else{
            const text = await page.$$('.ui-dataview-column', {timeout: 0})
            await Promise.all(text.map(async (el) => {
                const cancelacion =  await el.$('.c-extended__selected-combination .clr--success span')
                const arrange_data = {
                    operadora: 'Azabache',
                    hotel_title :  await el.$eval('.dev-hotel-title', h1 => h1.textContent.trim()),
                    score : await el.$$eval('.c-hotel-status__category.u-display--block .c-hotel-status__star:not(.hidden)', element => element.length),
                    hotel_details : await el.$eval('.c-extended__selected-combination .o-group--small span', room => room.textContent.trim().charAt(0).toUpperCase() + room.textContent.trim().slice(1).toLowerCase()),
                    price: await el.$eval('.c-price__primary', price => price.textContent.trim()),
                    cancelacion: cancelacion ? await el.$eval('.c-extended__selected-combination .clr--success span', cancelation_txt => cancelation_txt.textContent.trim()) : "Sin Cancelacion gratis"
                }
                return data.push(arrange_data)
            }));
        }
        await browser.close()
        return data
    }catch(err){
        await browser.close()
        console.log(err)
        return {'Error': 'Azabache'}
    }
}
module.exports = azabache_scraper