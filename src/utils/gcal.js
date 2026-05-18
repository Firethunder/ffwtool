import { parseString } from "cal-parser";
import { formatDate } from "./date";

const GCAL_ICS_URL = "https://calendar.google.com/calendar/ical/florian.brittheim%40web.de/public/basic.ics";
const PROXY_URL = "https://corsproxy.io/?";

/**
 * Fetches the Google Calendar iCal feed and parses it into termin objects.
 */
export async function syncGoogleCalendar(defaultOrt, defaultDauer) {
  const url = `${PROXY_URL}${encodeURIComponent(GCAL_ICS_URL)}`;
  const response = await fetch(url);
  
  if (!response.ok) {
    throw new Error(`Failed to fetch Google Calendar: ${response.statusText}`);
  }
  
  const icsString = await response.text();
  const { events } = parseString(icsString);
  
  return events.map(event => {
    const title = event.summary ? event.summary.value : "Unbenannter Termin";
    const location = event.location ? event.location.value : (defaultOrt || "Feuerwehrhaus Rosenfeld");
    
    // Auto-tagging logic
    let gruppe = "Alle";
    const lowerTitle = title.toLowerCase();
    if (lowerTitle.includes("zugübung")) {

      gruppe = "Zug";
    } else if (lowerTitle.includes("absturzsicherung")) {
      gruppe = "Hosi";
    }
    
    // Date formatting (cal-parser provides native Date objects in event.dtstart.value)
    const startDate = event.dtstart ? event.dtstart.value : new Date();
    const endDate = event.dtend ? event.dtend.value : null;
    const duration = (endDate && startDate) ? Math.round((endDate.getTime() - startDate.getTime()) / 60000) : (parseInt(defaultDauer) || 120);
    
    return {
      datum: formatDate(startDate),
      name: title,
      veranstalter: "Feuerwehr Rosenfeld",
      Gruppe: gruppe,
      ort: location,
      dauer: duration,
      source: "gcal",
      external_id: event.uid ? event.uid.value : `gcal-${startDate.getTime()}-${title.substring(0, 10)}`
    };
  });
}

/**
 * Merges GCal events into the local list.
 * Strategy: UID match first, then normalized Title+Date match.
 */
export function mergeGCalTermine(local, external) {
  const merged = [...local];
  
  external.forEach(ext => {
    // 1. Try UID match (best for revision safety)
    let existingIndex = -1;
    if (ext.external_id) {
       existingIndex = merged.findIndex(l => l.external_id === ext.external_id);
    }
    
    // 2. Fallback to Title + Date match (normalized)
    if (existingIndex === -1) {
       const normalize = (s) => s.toLowerCase().replace(/\s/g, "");
       const extKey = `${ext.datum.substring(0, 16)}|${normalize(ext.name)}`;
       
       existingIndex = merged.findIndex(l => {
          const lKey = `${l.datum.substring(0, 16)}|${normalize(l.name)}`;
          return lKey === extKey;
       });
    }
    
    if (existingIndex !== -1) {
      // Overwrite, preserve local ID
      merged[existingIndex] = { 
         ...merged[existingIndex], 
         ...ext, 
         id: merged[existingIndex].id 
      };
    } else {
      merged.push(ext);
    }
  });
  
  return merged;
}
