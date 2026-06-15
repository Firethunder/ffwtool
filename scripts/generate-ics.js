import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { createEvents } from 'ics';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const JSON_PATH = path.resolve(__dirname, '../public/termine.json');
const ICS_PATH = path.resolve(__dirname, '../public/termine.ics');

const mapToIcalEvent = (termin) => {
  // Use explicit date components to avoid timezone issues during conversion
  // Input format: YYYY-MM-DD HH:mm:ss
  const date = new Date(termin.datum.replace(/-/g, '/'));
  
  if (isNaN(date.getTime())) {
    console.warn(`[Warning] Skipping event with invalid date: ${termin.id} - ${termin.name}`);
    return null;
  }

  return {
    start: [
      date.getUTCFullYear(),
      date.getUTCMonth() + 1,
      date.getUTCDate(),
      date.getUTCHours(),
      date.getUTCMinutes()
    ],
    duration: { minutes: termin.dauer || 120 },
    title: termin.name,
    description: `Veranstalter: ${termin.veranstalter}\nGruppe: ${termin.Gruppe}`,
    location: termin.ort || '',
    status: 'CONFIRMED',
    busyStatus: 'BUSY'
  };
};

async function main() {
  console.log(`Reading source data from: ${JSON_PATH}`);
  
  if (!fs.existsSync(JSON_PATH)) {
    console.error(`Error: ${JSON_PATH} not found.`);
    process.exit(1);
  }

  const rawData = fs.readFileSync(JSON_PATH, 'utf8');
  const data = JSON.parse(rawData);

  if (!data.termine || !Array.isArray(data.termine)) {
    console.error('Error: Invalid JSON structure (expected "termine" array).');
    process.exit(1);
  }

  const events = data.termine
    .map(mapToIcalEvent)
    .filter(event => event !== null);

  console.log(`Mapping ${events.length} events to iCal format...`);

  createEvents(events, (error, value) => {
    if (error) {
      console.error('Error creating iCal events:', error);
      process.exit(1);
    }

    console.log(`Writing iCal file to: ${ICS_PATH}`);
    fs.writeFileSync(ICS_PATH, value);
    console.log('Successfully generated termine.ics');
  });
}

main().catch(err => {
  console.error('Unhandled error:', err);
  process.exit(1);
});
