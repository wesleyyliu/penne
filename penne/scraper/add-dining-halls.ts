import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config();

// run this script with npx ts-node scraper/add-dining-halls.ts

const supabaseUrl = "https://ipauncndlsorzwoiizqu.supabase.co";
const supabaseServiceKey = process.env.SUPABASE_SERVICE_KEY;
if (!supabaseServiceKey) {
  throw new Error('SUPABASE_SERVICE_KEY is not defined in environment variables');
}
const supabase = createClient(supabaseUrl, supabaseServiceKey);

// Define the structure of operating hours
interface OperatingHours {
  open: string;
  close: string;
}

// Define the structure of a dining hall
interface DiningHall {
  name: string;
  operating_hours: {
    monday: OperatingHours;
    tuesday: OperatingHours;
    wednesday: OperatingHours;
    thursday: OperatingHours;
    friday: OperatingHours;
    saturday: OperatingHours;
    sunday: OperatingHours;
  };
}

// Hard-coded dining hall data with operating hours
const diningHalls: DiningHall[] = [
  {
    name: "1920 Commons",
    operating_hours: {
      monday: { open: "7:30", close: "20:00" },
      tuesday: { open: "7:30", close: "20:00" },
      wednesday: { open: "7:30", close: "20:00" },
      thursday: { open: "7:30", close: "20:00" },
      friday: { open: "7:30", close: "20:00" },
      saturday: { open: "9:00", close: "19:00" },
      sunday: { open: "9:00", close: "19:00" }
    }
  },
  {
    name: "Hill House",
    operating_hours: {
      monday: { open: "7:30", close: "21:00" },
      tuesday: { open: "7:30", close: "21:00" },
      wednesday: { open: "7:30", close: "21:00" },
      thursday: { open: "7:30", close: "21:00" },
      friday: { open: "7:30", close: "19:00" },
      saturday: { open: "10:00", close: "19:00" },
      sunday: { open: "10:00", close: "19:00" }
    }
  },
  {
    name: "Lauder College House",
    operating_hours: {
      monday: { open: "8:00", close: "20:00" },
      tuesday: { open: "8:00", close: "20:00" },
      wednesday: { open: "8:00", close: "20:00" },
      thursday: { open: "8:00", close: "20:00" },
      friday: { open: "8:00", close: "19:00" },
      saturday: { open: "9:00", close: "19:00" },
      sunday: { open: "9:00", close: "19:00" }
    }
  },
  {
    name: "Kings Court English House",
    operating_hours: {
      monday: { open: "8:00", close: "20:00" },
      tuesday: { open: "8:00", close: "20:00" },
      wednesday: { open: "8:00", close: "20:00" },
      thursday: { open: "8:00", close: "20:00" },
      friday: { open: "8:00", close: "19:00" },
      saturday: { open: "9:00", close: "19:00" },
      sunday: { open: "9:00", close: "19:00" }
    }
  },
  {
    name: "Falk Dining Commons",
    operating_hours: {
      monday: { open: "11:00", close: "14:00" },
      tuesday: { open: "11:00", close: "14:00" },
      wednesday: { open: "11:00", close: "14:00" },
      thursday: { open: "11:00", close: "14:00" },
      friday: { open: "11:00", close: "14:00" },
      saturday: { open: "closed", close: "closed" },
      sunday: { open: "closed", close: "closed" }
    }
  },
  {
    name: "Quaker Kitchen",
    operating_hours: {
      monday: { open: "11:00", close: "14:00" },
      tuesday: { open: "11:00", close: "14:00" },
      wednesday: { open: "11:00", close: "14:00" },
      thursday: { open: "11:00", close: "14:00" },
      friday: { open: "11:00", close: "14:00" },
      saturday: { open: "closed", close: "closed" },
      sunday: { open: "closed", close: "closed" }
    }
  },
  {
    name: "Houston Market",
    operating_hours: {
      monday: { open: "8:00", close: "20:00" },
      tuesday: { open: "8:00", close: "20:00" },
      wednesday: { open: "8:00", close: "20:00" },
      thursday: { open: "8:00", close: "20:00" },
      friday: { open: "8:00", close: "18:00" },
      saturday: { open: "11:00", close: "16:00" },
      sunday: { open: "11:00", close: "16:00" }
    }
  },
  {
    name: "1920 Gourmet Grocer",
    operating_hours: {
      monday: { open: "8:00", close: "20:00" },
      tuesday: { open: "8:00", close: "20:00" },
      wednesday: { open: "8:00", close: "20:00" },
      thursday: { open: "8:00", close: "20:00" },
      friday: { open: "8:00", close: "18:00" },
      saturday: { open: "11:00", close: "16:00" },
      sunday: { open: "11:00", close: "16:00" }
    }
  }
];

// Function to insert dining hall data into Supabase
async function insertDiningHalls(): Promise<void> {
  console.log('Inserting dining hall data into Supabase...');
  
  for (const hall of diningHalls) {
    try {
      const { data, error } = await supabase
        .from('dining_halls')
        .upsert(
          {
            name: hall.name,
            operating_hours: hall.operating_hours
          },
          { onConflict: 'name' } // Assuming "name" is the primary key
        );
      
      if (error) {
        console.error(`Error inserting data for ${hall.name}:`, error);
      } else {
        console.log(`Successfully inserted data for ${hall.name}`);
      }
    } catch (err) {
      console.error(`Exception when inserting ${hall.name}:`, err);
    }
  }
  
  console.log('Dining hall data insertion complete!');
}

// Run the insertion function
insertDiningHalls()
  .catch(err => console.error('An error occurred:', err));