const puppeteer = require('puppeteer');
const authorization_gmail = require('./authentication')
const getMessage = require('./get_messages');
const fs = require('fs');

function delay(time) {
    return new Promise(function(resolve) { 
        setTimeout(resolve, time)
    });
}
async function olr_scraper(url, operadora, client_data){
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
    let good_array
    if (fs.existsSync('./Cookies/cookies-orl.json')) {
        const cookies = JSON.parse(fs.readFileSync('./Cookies/cookies-orl.json'));
        await page.setCookie(...cookies);
    }
    await page.goto(url);
    await page.setViewport({width: 1480, height: 1024});

    try{ 
        /*
        await page.waitForSelector('.login-email-input', {timeout: 100000});
        await page.type('.login-email-input', 'loregalindo68@hotmail.com');

        await page.waitForSelector('.login-password-input');
        await page.type('.login-password-input', 'lore1202'); 
        await page.locator('.signin-button').click() 

        await page.waitForSelector('.c-modal-cookies-consent', { visible: true })
        await page.locator('.c-modal-cookies-consent .dev-accept-all').click()
        await page.waitForNavigation({waitUntil: 'domcontentloaded', timeout: 100000})

        const cookies = await page.cookies();
        fs.writeFileSync('./Cookies/cookies-orl.json', JSON.stringify(cookies, null, 2));
        */
        await page.waitForSelector('.dev-popup-disagree')
        await page.locator('.dev-popup-disagree').click()
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
        await page.waitForSelector('.modalCargando', { hidden: true, timeout: 100000 });
        await page.waitForSelector('.dev-incremental-completed', { visible: true, timeout: 100000 });
        const hotel_label_wraper = await page.$('#accomodationType')

        let resolved = false;

        const labels = await hotel_label_wraper.$$eval('label', labels => labels.map(label => label.textContent));
        for (let i = 0; i < labels.length; i++) {
            if (labels[i] === 'Hotel') {
                const labelElement = (await hotel_label_wraper.$$('label'))[i];
                await labelElement.click();
                await page.waitForSelector('.ui-blockui', { visible: true });
                await page.waitForSelector('.ui-blockui', { hidden: true });
            }
        }
        const meal_plan_type = await page.$('#mealPlanFilter')
        const labels_meal_plan = await meal_plan_type.$$eval('label', labels => labels.map(label => label.textContent.toLowerCase()));

        for (let i = 0; i < labels_meal_plan.length; i++) {
            if (labels_meal_plan[i].includes(client_data.type.toLowerCase())) {
                const labelElement = (await meal_plan_type.$$('label'))[i];
                await labelElement.click();
                await page.waitForSelector('.ui-blockui', { visible: true });
                await page.waitForSelector('.ui-blockui', { hidden: true });
                break
            }
            if(i + 1 == labels_meal_plan.length && !labels_meal_plan[i].includes(client_data.type.toLowerCase())){
                console.log(labels_meal_plan[i].includes(client_data.type))
                return {'Error': 'OLR, no tiene habitaciones tipo ' + client_data.type}
            }
        }

        await page.waitForSelector('.ui-dataview-column', { visible: true, timeout: 80000});
        if (await page.$('.ui-paginator-bottom')){
            while (true) {
                await page.waitForSelector('.ui-blockui-content__wrapper', { hidden: true });
                const hasClass = await page.evaluate((checkSelector, className) => {
                  const element = document.querySelector(checkSelector);
                  return element ? element.classList.contains(className) : false;
                }, '.ui-paginator-next', 'ui-state-disabled');
                if (hasClass) {
                    const text = await page.$$('.ui-dataview-column', {timeout: 100000})
                    await Promise.all(text.map(async (el) => {
                        const cancelacion =  await el.$('.c-extended__selected-combination .clr--success span')
                        const arrange_data = {
                            operadora: 'OLR',
                            hotel_title :  await el.$eval('.dev-hotel-title', h1 => h1.textContent.trim()),
                            score : await el.$$eval('.c-hotel-status__category.u-display--block .c-hotel-status__star:not(.hidden)', element => element.length),
                            hotel_details : await el.$eval('.c-extended__selected-combination .o-group--small span', room => room.textContent.trim().charAt(0).toUpperCase() + room.textContent.trim().slice(1).toLowerCase()),
                            price: await el.$eval('.c-price__primary', price => price.textContent.trim()),
                            link: await el.$eval(".dev-open-hotel", a => a.href.split("/")[4]),
                            cancelacion: cancelacion ? await el.$eval('.c-extended__selected-combination .clr--success span', cancelation_txt => cancelation_txt.textContent.trim()) : "Sin Cancelacion gratis"
                        }
                        return data.push(arrange_data)
                    }));
                    await page.$eval('.ui-dataview-column .dev-open-hotel', el => el.removeAttribute('target'))
                    await page.$eval('.ui-dataview-column .dev-open-hotel', el => el.click())
                    await page.waitForNavigation({ waitUntil: 'networkidle2' });
                    const product_id = page.url().split("=")[1]
                    good_array = data.map((x) => {
                        return  {...x, link: "https://motor.olrmayorista.com/accommodation/" + x.link + "/available/1?tripId=" + product_id}
                    });
                    break;
                } else {
                    const text = await page.$$('.ui-dataview-column', {timeout: 100000})
                    await Promise.all(text.map(async (el) => {
                        const cancelacion =  await el.$('.c-extended__selected-combination .clr--success span')
                        const arrange_data = {
                            operadora: 'OLR',
                            hotel_title :  await el.$eval('.dev-hotel-title', h1 => h1.textContent.trim()),
                            score : await el.$$eval('.c-hotel-status__category.u-display--block .c-hotel-status__star:not(.hidden)', element => element.length),
                            hotel_details : await el.$eval('.c-extended__selected-combination .o-group--small span', room => room.textContent.trim().charAt(0).toUpperCase() + room.textContent.trim().slice(1).toLowerCase()),
                            price: await el.$eval('.c-price__primary', price => price.textContent.trim()),
                            link: await el.$eval(".dev-open-hotel", a => a.href.split("/")[4]),
                            cancelacion: cancelacion ? await el.$eval('.c-extended__selected-combination .clr--success span', cancelation_txt => cancelation_txt.textContent.trim()) : "Sin Cancelacion gratis"
                        }
                        return data.push(arrange_data)
                    }));
                    await page.$eval('.ui-dataview-column .dev-open-hotel', el => el.removeAttribute('target'))
                    await page.$eval('.ui-dataview-column .dev-open-hotel', el => el.click())
                    await page.waitForNavigation({ waitUntil: 'networkidle2' });
                    const product_id = page.url().split("=")[1]
                    good_array = data.map((x) => {
                        return  {...x, link: "https://motor.olrmayorista.com/accommodation/" + x.link + "/available/1?tripId=" + product_id}
                    });

                    await page.waitForSelector('.ui-paginator-next', { timeout: 10000, visible: 'true' });
                    await page.$eval('.ui-paginator-next', el => el.click())
                    await delay(4000)
                }
              }
        }else{
            const text = await page.$$('.ui-dataview-column', {timeout: 100000})
            await Promise.all(text.map(async (el) => {
                const cancelacion =  await el.$('.c-extended__selected-combination .clr--success span')
                const arrange_data = {
                    operadora: 'OLR',
                    hotel_title :  await el.$eval('.dev-hotel-title', h1 => h1.textContent.trim()),
                    score : await el.$$eval('.c-hotel-status__category.u-display--block .c-hotel-status__star:not(.hidden)', element => element.length),
                    hotel_details : await el.$eval('.c-extended__selected-combination .o-group--small span', room => room.textContent.trim().charAt(0).toUpperCase() + room.textContent.trim().slice(1).toLowerCase()),
                    price: await el.$eval('.c-price__primary', price => price.textContent.trim()),
                    link: await el.$eval(".dev-open-hotel", a => a.href.split("/")[4]),
                    cancelacion: cancelacion ? await el.$eval('.c-extended__selected-combination .clr--success span', cancelation_txt => cancelation_txt.textContent.trim()) : "Sin Cancelacion gratis"
                }
                return data.push(arrange_data)
            }));
            await page.$eval('.ui-dataview-column .dev-open-hotel', el => el.removeAttribute('target'))
            await page.$eval('.ui-dataview-column .dev-open-hotel', el => el.click())
            await page.waitForNavigation({ waitUntil: 'networkidle2' });
            const product_id = page.url().split("=")[1]
            good_array = data.map((x) => {
                return  {...x, link: "https://motor.olrmayorista.com/accommodation/" + x.link + "/available/1?tripId=" + product_id}
            });
        }
        await browser.close();
        return good_array
    }
    catch(err){
        await browser.close();
        console.log(err)
        return {'Error': 'OLR'}
    }
}
module.exports = olr_scraper