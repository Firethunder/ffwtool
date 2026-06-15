import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { parseString } from 'cal-parser';

// Constants
const GCAL_ICS_URL = "https://calendar.google.com/calendar/ical/florian.brittheim%40web.de/public/basic.ics";

// Re-implementing necessary date logic with Europe/Berlin timezone alignment
/**
 * Formats a date to 'YYYY-MM-DD HH:mm:ss' in Europe/Berlin timezone.
 * @param {Date|string} date - UTC Date or ISO string
 * @returns {string}
 */
export const formatBerlinDate = (date) => {
  if (!date) return '';
  const d = new Date(date);
  
  const formatter = new Intl.DateTimeFormat('en-GB', {
    timeZone: 'Europe/Berlin',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false
  });

  const parts = formatter.formatToParts(d);
  const p = Object.fromEntries(parts.map(part => [part.type, part.value]));
  
  return `${p.year}-${p.month}-${p.day} ${p.hour}:${p.minute}:${p.second}`;
};

/**
 * Sanitizes and maps a GCal event to the local termin format.
 */
function sanitizeEvent(event) {
  const title = event.summary ? event.summary.value : "Unbenannter Termin";
  const location = event.location ? event.location.value : "Feuerwehrhaus Brittheim";
  
  let gruppe = "Alle";
  const lowerTitle = title.toLowerCase();
  if (lowerTitle.includes("zugübung")) gruppe = "Zug";
  else if (lowerTitle.includes("absturzsicherung")) gruppe = "Hosi";
  
  const startDate = event.dtstart ? event.dtstart.value : new Date();
  const endDate = event.dtend ? event.dtend.value : null;
  const duration = (endDate && startDate) ? Math.round((endDate.getTime() - startDate.getTime()) / 60000) : 120;
  
  // Return ONLY allowed fields to prevent leakage
  return {
    datum: formatBerlinDate(startDate),
    name: title,
    veranstalter: "Alle",
    Gruppe: gruppe,
    ort: location,
    dauer: duration,
    source: "gcal",
    external_id: event.uid ? event.uid.value : `gcal-${new Date(startDate).getTime()}-${title.substring(0, 10)}`
  };
}

/**
 * Core sync logic, extracted for testability.
 */
export async function syncGCalLogic(localData, icsString) {
  const data = { ...localData };
  const localTermine = data.termine || [];
  
  console.log(`[Fetch] Parsing iCal string...`);
  const { events } = parseString(icsString);
  console.log(`[Fetch] Fetched external events: ${events.length}`);

  if (events.length === 0) {
    console.warn('[Fetch] GCal feed is empty. Skipping merge to prevent data loss.');
    return { data, changed: false };
  }

  // 3. Map and Sanitize GCal events
  const externalTermine = events.map(sanitizeEvent);

  // 4. Merge logic
  console.log(`[Merge] Starting merge with ${localTermine.length} local appointments...`);
  let addedCount = 0;
  let updatedCount = 0;
  const merged = [...localTermine];
  let currentMaxId = Math.max(0, ...localTermine.map((t) => parseInt(t.id) || 0));

  externalTermine.forEach(ext => {
    let existingIndex = -1;
    
    // UID match
    if (ext.external_id) {
      existingIndex = merged.findIndex(l => l.external_id === ext.external_id);
    }
    
    // Title + Date match fallback
    if (existingIndex === -1) {
      const normalize = (s) => s.toLowerCase().replace(/\s/g, "");
      const extKey = `${ext.datum.substring(0, 16)}|${normalize(ext.name)}`;
      
      existingIndex = merged.findIndex(l => {
        const lKey = `${l.datum.substring(0, 16)}|${normalize(l.name)}`;
        return lKey === extKey;
      });
    }

    if (existingIndex !== -1) {
      const l = merged[existingIndex];
      const hasChanged = l.ort !== ext.ort || 
                         l.dauer !== ext.dauer || 
                         l.Gruppe !== ext.Gruppe || 
                         l.veranstalter !== ext.veranstalter || 
                         l.datum !== ext.datum ||
                         l.name !== ext.name;
      
      if (hasChanged) {
        updatedCount++;
        merged[existingIndex] = { ...l, ...ext, id: l.id };
      }
    } else {
      addedCount++;
      currentMaxId++;
      merged.push({ ...ext, id: currentMaxId.toString() });
    }
  });

  console.log(`[Merge] Complete: ${addedCount} added, ${updatedCount} updated.`);

  if (addedCount > 0 || updatedCount > 0) {
    // 5. Sort by date
    console.log(`[Sort] Sorting ${merged.length} appointments by date...`);
    merged.sort((a, b) => new Date(a.datum) - new Date(b.datum));
    
    data.termine = merged;
    data.stand = formatBerlinDate(new Date());
    return { data, changed: true };
  }

  return { data, changed: false };
}

async function run() {
  console.log('--- GCal Headless Sync Started ---');
  
  const __filename = fileURLToPath(import.meta.url);
  const __dirname = path.dirname(__filename);
  const DATA_FILE = path.resolve(__dirname, '../public/termine.json');

  try {
    // 1. Read local data
    console.log(`[Read] Loading local data from ${DATA_FILE}`);
    const rawData = fs.readFileSync(DATA_FILE, 'utf8');
    const localData = JSON.parse(rawData);

    // 2. Fetch GCal
    console.log(`[Fetch] Fetching GCal from: ${GCAL_ICS_URL}`);
    const response = await fetch(GCAL_ICS_URL);
    if (!response.ok) {
       console.error(`[Fetch] Failed: ${response.status} ${response.statusText}`);
       process.exit(1);
    }
    
    const icsString = await response.text();
    
    // 3. Sync Logic
    const { data, changed } = await syncGCalLogic(localData, icsString);

    // 4. Save back
    if (changed) {
      console.log(`[Save] Writing updates to ${DATA_FILE}`);
      fs.writeFileSync(DATA_FILE, JSON.stringify(data, null, 2), 'utf8');
      console.log(`[Save] Done.`);
    } else {
      console.log('[Save] No changes detected. Skipping write.');
    }

    console.log('--- GCal Headless Sync Finished Successfully ---');
    process.exit(0);

  } catch (error) {
    console.error('--- GCal Headless Sync FAILED ---');
    console.error(error);
    process.exit(1);
  }
}

// Only run if called directly
if (process.argv[1] === fileURLToPath(import.meta.url)) {
  run();
}
