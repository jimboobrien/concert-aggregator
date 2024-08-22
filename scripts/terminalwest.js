const puppeteer = require('puppeteer');
const fs = require('fs');

(async () => {
    // Launch the browser
    const browser = await puppeteer.launch({ headless: true });
    const page = await browser.newPage();

    // Navigate to the webpage
    await page.goto('https://terminalwestatl.com/calendar/', { waitUntil: 'networkidle2' });

    // Wait for the events to load
    await page.waitForSelector('.c-axs-event-card__wrapper');


    // Scrape the data
    const events = await page.evaluate(() => {
        // Get all event elements
        const eventElements = document.querySelectorAll('.c-axs-event-card__wrapper');

        // Extract details from each event
        const eventList = [];
        eventElements.forEach(event => {
            const title = event.querySelector('.c-axs-event-card__title').innerText;
            const date = event.querySelector('.c-axs-event-card__date').innerText;
            //const time = event.querySelector('.eventDateDetails')?.innerText || 'N/A'; // Time may not always be present
            const location = 'Terminal West';
            eventList.push({ title, date, location });
        });

        return eventList;
    });

    // Convert the events list to JSON
    const jsonContent = JSON.stringify(events, null, 2);

    // Write the JSON content to a file
    fs.writeFileSync('output/terminalwest.json', jsonContent, 'utf8');

    console.log('JSON file has been created: terminalwest.json');

    // Close the browser
    await browser.close();
})();