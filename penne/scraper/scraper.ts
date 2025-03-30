import dotenv from 'dotenv';
dotenv.config();

import axios from 'axios';
import * as cheerio from 'cheerio';
import fs from 'fs';
// import cron from 'node-cron';
import { createClient } from '@supabase/supabase-js';

// Supabase client setup
const supabaseUrl = "https://ipauncndlsorzwoiizqu.supabase.co";
const supabaseServiceKey = process.env.SUPABASE_SERVICE_KEY;
if (!supabaseServiceKey) {
  throw new Error('SUPABASE_SERVICE_KEY is not defined in environment variables');
}
const supabase = createClient(supabaseUrl, supabaseServiceKey);

// Define types for the menu data structure
interface DishData {
  dining_hall_name: string;
  meal_type: string;
  station: string;
  dish: string;
  dish_upvote: number;
  dish_downvote: number;
  created_at: Date;
}

interface MenuData {
  [mealType: string]: {
    [station: string]: string[];
  };
}

// Function to scrape data from the website
async function scrapeData(url: string): Promise<MenuData | null> {
  try {
    const response = await axios.get(url);
    const html = response.data;

    // Check that cheerio is properly imported
    if (!cheerio || typeof cheerio.load !== 'function') {
      console.error('Cheerio is not properly loaded');
      return null;
    }
    
    const $ = cheerio.load(html);

    // Object to hold the structured menu data
    const menuData: MenuData = {};

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
    
    return menuData;

  } catch (error) {
    console.error('Error scraping data:', error);
    return null;
  }
}

// Function to insert scraped data into Supabase
async function insertMenuData(menuData: MenuData, diningHallName: string): Promise<void> {
  try {
    console.log(`Inserting menu data for ${diningHallName}...`);
    
    const dishesToInsert: DishData[] = [];
    
    for (const mealType in menuData) {
      for (const station in menuData[mealType]) {
        for (const dish of menuData[mealType][station]) {
          dishesToInsert.push({
            dining_hall_name: diningHallName,
            meal_type: mealType,
            station: station,
            dish: dish,
            dish_upvote: 0,
            dish_downvote: 0,
            created_at: new Date()
          });
        }
      }
    }
    
    // Batch insert for better performance
    if (dishesToInsert.length > 0) {
      // Option 1: Just use insert instead of upsert if you don't need to update existing records
      const { data, error } = await supabase
        .from('menus')
        .insert(dishesToInsert);
      
      // Option 2: Or first create a unique constraint in your database and then use upsert
      // const { data, error } = await supabase
      //   .from('menus')
      //   .upsert(dishesToInsert, { onConflict: 'dining_hall_name,meal_type,station,dish' });
        
      if (error) {
        console.error('Error inserting menu data:', error);
      } else {
        console.log(`Successfully inserted ${dishesToInsert.length} dishes for ${diningHallName}`);
      }
    } else {
      console.log(`No dishes found for ${diningHallName}`);
    }
    
  } catch (error) {
    console.error('Error in insertMenuData:', error);
  }
}

// Function to process URL and extract dining hall name
function extractDiningHallName(url: string): string {
  // Get the raw name from the URL
  const rawName = url.split('/').slice(-2, -1)[0].replace(/-/g, ' ');
  
  // Capitalize each word in the dining hall name
  return rawName
    .split(' ')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(' ');
}

async function processUrl(url: string): Promise<void> {
  const menuData = await scrapeData(url);
  if (menuData) {
    const diningHallName = extractDiningHallName(url);
    await insertMenuData(menuData, diningHallName);
  }
}

async function main(): Promise<void> {
  try {
    const urlsFile = './scraper/urls.json';
    const fileContent = fs.readFileSync(urlsFile, 'utf-8');
    const { urls } = JSON.parse(fileContent);
    
    for (const url of urls) {
      await processUrl(url);
    }
    
    console.log('All dining hall data scraped and inserted!');
  } catch (error) {
    console.error('Error in main function:', error);
  }
}

// Run the main function
main();

// Uncomment to enable scheduled scraping
// Schedule the scraper to run at specific times
// cron.schedule('0 9,12,15 * * *', () => { // Runs at 9 AM, 12 PM, and 3 PM every day
//   console.log('Running the web scraper...');
//   main();
// });