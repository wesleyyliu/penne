const axios = require('axios');
const cheerio = require('cheerio');
const cron = require('node-cron');

// Function to scrape data from the website
async function scrapeData() {
    try {
        const response = await axios.get('https://university-of-pennsylvania.cafebonappetit.com/cafe/hill-house/'); // Replace with the target URL
        const html = response.data;

        const $ = cheerio.load(html);

        // Object to hold the structured menu data
        const menuData = {};

        // Select each menu section
        $('.panel.s-wrapper.site-panel.site-panel--daypart').each((index, sectionElement) => {
            // Extract the meal title from the header
            const mealTitle = $(sectionElement).find('h2.panel__title.site-panel__daypart-panel-title').text().trim();
            menuData[mealTitle] = {}; // Initialize an object for this meal category

            // Find the wrapper that contains stations and dishes
            const daypartWrapper = $(sectionElement).find('div.site-panel__daypart-wrapper');
            const daypartWrapper1 = daypartWrapper.find('div.site-panel__daypart-tabs');
            const daypartWrapper2 = daypartWrapper1.find('div.c-tabs  ');
            const daypartWrapper3 = daypartWrapper2.find('div.c-tab__content-inner site-panel__daypart-tab-content-inner');

            // Variable to keep track of the current station title
            let currentStationTitle = '';

            // Iterate through all relevant divs
            daypartWrapper3.find('div.station-title-inline-block, div.site-panel__daypart-item').each((index, itemElement) => {
                // Check if the current div is a station title
                if ($(itemElement).hasClass('station-title-inline-block')) {
                    // Extract the station title
                    currentStationTitle = $(itemElement).find('h3.site-panel__daypart-station-title').text().trim();
                    menuData[mealTitle][currentStationTitle] = []; // Initialize an array for dishes under this station

                    // Extract dishes from this station's inline block
                    $(itemElement).find('div.site-panel__daypart-item button.h4.site-panel__daypart-item-title').each((dishIndex, dishElement) => {
                        const dishName = $(dishElement).text().trim(); // Get the dish name
                        menuData[mealTitle][currentStationTitle].push(dishName); // Add the dish name to the array
                    });
                } else if ($(itemElement).hasClass('site-panel__daypart-item')) {
                    // If it's a dish item and we have a current station, extract the dish name
                    if (currentStationTitle) {
                        $(itemElement).find('button.h4.site-panel__daypart-item-title').each((dishIndex, dishElement) => {
                            const dishName = $(dishElement).text().trim(); // Get the dish name
                            menuData[mealTitle][currentStationTitle].push(dishName); // Add the dish name to the array
                        });
                    }
                }
            });
        });

        // Log the structured menu data
        console.log(JSON.stringify(menuData, null, 2)); // Pretty print the menu data

    } catch (error) {
        console.error('Error scraping data:', error);
    }
}

scrapeData();

// // Schedule the scraper to run at specific times
// cron.schedule('0 9,12,15 * * *', () => { // Runs at 9 AM, 12 PM, and 3 PM every day
//     console.log('Running the web scraper...');
//     scrapeData();
// });