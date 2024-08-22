const puppeteer = require('puppeteer');
const fs = require('fs');

(async () => {
    // Launch the browser
    const browser = await puppeteer.launch({ headless: false });
    const page = await browser.newPage();

    // Navigate to the webpage
    await page.goto('https://www.thecaverns.com/shows', { waitUntil: 'networkidle2' });

    await page.setViewport({
        width: 1200,
        height: 800
    });

    await autoScroll(page);

    // let previousHeight;
    // let currentHeight = await page.evaluate('document.body.scrollHeight');

    // while (previousHeight !== currentHeight) {
    //     previousHeight = currentHeight;

    //     // Scroll down by a certain amount
    //     await page.evaluate('window.scrollBy(0, window.innerHeight)');

    //     // Wait for new events to load
    //     //await page.waitForTimeout(2000); // Adjust the timeout as needed

    //     // Get the new height after scrolling
    //     currentHeight = await page.evaluate('document.body.scrollHeight');
    // }

    console.log('No more events to load.');

    // Wait for the events to load
    await page.waitForSelector('.eventColl-item');

    // Scrape the data
    const events = await page.evaluate(() => {
        // Get all event elements
        const eventElements = document.querySelectorAll('.eventColl-item');

        // Extract details from each event
        const eventList = [];
        eventElements.forEach(event => {
            const title = event.querySelector('.eventColl-mainTitles').innerText;
            //const artist = event.querySelector('.eventColl-artists').innerText;
            let date = event.querySelector('.eventColl-dateInfo').innerText;
            date = date.replace(/\n/g, " ");
            const time = event.querySelector('.eventColl-details')?.innerText || 'N/A'; // Time may not always be present
            const location = 'The Caverns';
            eventList.push({ title, date, time, location });
        });

        return eventList;
    });

    // Convert the events list to JSON
    const jsonContent = JSON.stringify(events, null, 2);

    // Write the JSON content to a file
    fs.writeFileSync('output/thecaverns.json', jsonContent, 'utf8');

    console.log('JSON file has been created: thecaverns.json');

    // Close the browser
    await browser.close();
})();

async function autoScroll(page){
    await page.evaluate(async () => {
        await new Promise((resolve) => {
            var totalHeight = 0;
            var distance = 100;
            var timer = setInterval(() => {
                var scrollHeight = document.body.scrollHeight;
                window.scrollBy(0, distance);
                totalHeight += distance;

                if(totalHeight >= scrollHeight - window.innerHeight){
                    clearInterval(timer);
                    resolve();
                }
            }, 100);
        });
    });
}