const puppeteer = require('puppeteer');

async function vto_scrape(url, operadora, client_data){
    const browser = await puppeteer.launch({
        headless: true,
        args: ['--no-sandbox', '--disable-setuid-sandbox'],
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
    await page.goto(url);
    await page.setViewport({width: 1480, height: 1024});
    let data = []
    try{ 
        await page.waitForSelector('#txtUser');
        await page.type('#txtUser', 'david_gonzalez');

        await page.waitForSelector('#txtPassword');
        await page.type('#txtPassword', 'gonzalez123'); 

        await page.locator('#btnAccept').click() 

        await page.waitForNavigation({waitUntil: 'networkidle0', timeout: 0})
        await page.waitForSelector('#txCiudadNombre', { visible: true })
        await page.locator('#txCiudadNombre').fill(client_data.destiny)
        await page.waitForSelector('.tt-dropdown-menu', { visible: true })
        await page.keyboard.press('ArrowDown')
        await page.keyboard.press('Enter')

        await page.locator('#txHotelStartDate').fill(client_data.checkin.slice(8, 10) + '-' + client_data.checkin.slice(5, 7) + '-' + client_data.checkin.slice(0, 4))
        await page.locator('#txHotelEndDate').fill(client_data.checkout.slice(8, 10) + '-' + client_data.checkout.slice(5, 7) + '-' + client_data.checkout.slice(0, 4))

        if(client_data.room_numbers > 1){   
            await page.waitForSelector('#slcRooms', { visible: true })
            await page.locator('#slcRooms').click()
            await page.keyboard.type(`${client_data.room_numbers}`)
            await page.locator('#slcRooms').click()
        }   
        for(let i = 0; i < client_data.rooms_details.length; i++){
            let div_locator = `//div[@data-rph="${i + 1}"]`
            await page.waitForSelector(`::-p-xpath(${div_locator})`);
            const select_2 = await page.$(`::-p-xpath(${div_locator})`)
            const div_select = await select_2.$('.num-adults')
            const input_select = await div_select.$$('label')
            if (client_data.rooms_details[i].adults > 3){
                await input_select[3].click()
                await select_2.waitForSelector('.slAdults')
                const adults_num = await select_2.$('.slAdults')
                await adults_num.click()
                await page.keyboard.type(client_data.rooms_details[i].adults.toString())
                await adults_num.click()
            }else{
                await input_select[client_data.rooms_details[i].adults - 1].click()
            }
            if (client_data.rooms_details[i].kids > 0){
                const div_select = await select_2.$('.num-childs')
                const input_select = await div_select.$$('label')
                if(client_data.rooms_details[i].kids > 2){
                    await input_select[3].click()
                    for(let ages = 0; ages < client_data.rooms_details[i].kids; ages++){
                        const kids_num = await select_2.$(`.slChild${ages + 1}`)
                        await kids_num.click()
                        await page.keyboard.type(client_data.rooms_details[i].ages[ages].toString())
                        await kids_num.click()
                    }
                }else{
                    await input_select[client_data.rooms_details[i].kids].click()
                    for(let ages = 0; ages < client_data.rooms_details[i].kids; ages++){
                        const kids_num = await select_2.$(`.slChild${ages + 1}`)
                        await kids_num.click()
                        await page.keyboard.type(client_data.rooms_details[i].ages[ages].toString())
                        await kids_num.click()
                    }
                }
            }
        }
        await page.locator('.btn.btn-primary.btn-lg').click()
        await page.waitForNavigation({waitUntil: 'networkidle0', timeout: 60000})
        const items = await page.$$(".booking-item")
        for (const el of items) {
            const arrange_data = {
                operadora: 'VTO',
                price: await el.$eval('.booking-item-price', price => price.textContent),
                hotel_title: await el.$eval('.booking-item-title', title => title.textContent),
                score: await el.$$eval('.booking-item-rating ul li .fa-star', element => element.length),
                hotel_details: 'Desconocido',
                img_hotel : await el.$eval('.booking-item-img-wrap img', element => element.src),
                cancelacion: 'Desconocido'
            }
            data.push(arrange_data);
        }
        await browser.close()
        return data
    }
    catch(err){
        await browser.close()
        console.log(err)
        return {'Error': 'VTO'}
    }
}
module.exports = vto_scrape