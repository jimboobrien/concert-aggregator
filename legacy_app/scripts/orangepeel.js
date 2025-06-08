const puppeteer = require('puppeteer');
const fs = require('fs');

(async () => {
    // Launch the browser
    const browser = await puppeteer.launch({ headless: true });
    const page = await browser.newPage();

    // Navigate to the webpage
    await page.goto('https://theorangepeel.net/events/', { waitUntil: 'networkidle2' });

    // Wait for the events to load
    await page.waitForSelector('.eventMainWrapper');


    // Scrape the data
    const events = await page.evaluate(() => {
        // Get all event elements
        const eventElements = document.querySelectorAll('.eventMainWrapper');

        // Extract details from each event
        const eventList = [];
        eventElements.forEach(event => {
            const title = event.querySelector('#eventTitle').innerText;
            const date = event.querySelector('#eventDate').innerText;
            const time = event.querySelector('.eventDateDetails')?.innerText || 'N/A'; // Time may not always be present
            const location = 'The Orange Peel';
            eventList.push({ title, date, time, location });
        });

        return eventList;
    });

    // Convert the events list to JSON
    const jsonContent = JSON.stringify(events, null, 2);

    // Write the JSON content to a file
    fs.writeFileSync('output/orangepeel.json', jsonContent, 'utf8');

    console.log('JSON file has been created: orangepeel.json');

    // Close the browser
    await browser.close();
})();