const axios = require('axios');
const cheerio = require('cheerio');
const fs = require('fs');
const cron = require('node-cron');
import { supabase } from '../lib/supabase'

// Function to scrape data from the website
async function scrapeData(url) {
    try {
        const response = await axios.get(url);
        const html = response.data;

        const $ = cheerio.load(html);

        // Object to hold the structured menu data
        const menuData = {};

        // Select each menu section (ex. breakfast, lunch, dinner, etc.)
        $('.panel.s-wrapper.site-panel.site-panel--daypart').each((index, sectionElement) => {
            // Extract the meal title from the header
            const mealTitle = $(sectionElement).find('h2.panel__title.site-panel__daypart-panel-title').text().trim();
            menuData[mealTitle] = {}; // Initialize an object for this meal category

            // Find the wrapper that contains stations and dishes
            const daypartWrapper = $(sectionElement).find('div.site-panel__daypart-wrapper');
            const daypartWrapper1 = daypartWrapper.find('div.site-panel__daypart-tabs');
            const daypartWrapper2 = daypartWrapper1.find('div.c-tabs');
            const daypartWrapper3 = daypartWrapper2.find('div.c-tab__content-inner.site-panel__daypart-tab-content-inner').first(); // Only get first because we only want specials, not condiments and extras

            // Variable to keep track of the current station title
            let currentStationTitle = '';

            // This finds all the stations and dishes (since sometimes dishes are not inside the station for whatever reason)
            daypartWrapper3.find('div.station-title-inline-block, div.site-panel__daypart-item').each((index, itemElement) => {
                // If it is a station inline block, we just extract the station title
                if ($(itemElement).hasClass('station-title-inline-block')) {
                    // Extract the station title
                    currentStationTitle = $(itemElement).find('h3.site-panel__daypart-station-title').text().trim();
                    menuData[mealTitle][currentStationTitle] = []; // Initialize an array for dishes under this station

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
        console.log(JSON.stringify(menuData, null, 2));


        // Extract dining hall name from URL
        const diningHallName = url.split('/').slice(-2, -1)[0].replace(/-/g, ' '); // Convert to readable format

        // Insert data into Supabase
        for (const mealType in menuData) {
            for (const station in menuData[mealType]) {
                for (const dish of menuData[mealType][station]) {
                    const { data, error } = await supabase
                        .from('menus')
                        .upsert([
                            {
                                dining_hall_id: diningHallName, // You may need to map this to an actual ID
                                meal_type: mealType,
                                station: station,
                                dish: dish,
                                dish_upvote: 0,
                                dish_downvote: 0,
                                created_at: new Date()
                            }
                        ]);
                    if (error) {
                        console.error('Error inserting data:', error);
                    }
                }
            }
        }

    } catch (error) {
        console.error('Error scraping data:', error);
    }
}

async function main() {
    const urls = JSON.parse(fs.readFileSync('./scraper/urls.json')).urls;
    for (const url of urls) {
        await scrapeData(url);
    }
}

main();

// // Schedule the scraper to run at specific times
// cron.schedule('0 9,12,15 * * *', () => { // Runs at 9 AM, 12 PM, and 3 PM every day
//     console.log('Running the web scraper...');
//     scrapeData();
// });