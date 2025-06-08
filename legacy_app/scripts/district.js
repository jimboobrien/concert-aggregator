const puppeteer = require('puppeteer');
const fs = require('fs');

(async () => {
    // Launch the browser
    const browser = await puppeteer.launch({ headless: true });
    const page = await browser.newPage();

    // Navigate to the webpage
    await page.goto('https://districtatlanta.com/events/index.php', { waitUntil: 'networkidle2' });

    // Wait for the events to load
    await page.waitForSelector('.de-event-item');


    // Scrape the data
    const events = await page.evaluate(() => {
        // Get all event elements
        const eventElements = document.querySelectorAll('.de-event-item');

        // Extract details from each event
        const eventList = [];
        eventElements.forEach(event => {
            const title = event.querySelector('.d-text a h3').innerText;
            let date = event.querySelector('.d-date').innerText;
            date = date.replace(/\n/g, " ");
            //const time = event.querySelector('.eventDateDetails')?.innerText || 'N/A'; // Time may not always be present
            const location = 'District Atlanta';
            eventList.push({ title, date, location });
        });

        return eventList;
    });

    // Convert the events list to JSON
    const jsonContent = JSON.stringify(events, null, 2);

    // Write the JSON content to a file
    fs.writeFileSync('output/district.json', jsonContent, 'utf8');

    console.log('JSON file has been created: district.json');

    // Close the browser
    await browser.close();
})();