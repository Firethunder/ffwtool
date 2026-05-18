import { describe, it, expect, vi } from 'vitest';
import { syncGCalLogic } from './sync-gcal-headless.js';
import * as calParser from 'cal-parser';

vi.mock('cal-parser', () => ({
  parseString: vi.fn()
}));

describe('syncGCalLogic', () => {
  const localDataTemplate = {
    stand: "2026-05-17 10:00:00",
    termine: [
      {
        id: "1",
        datum: "2026-06-01 19:00:00",
        name: "Existing Event",
        veranstalter: "Alle",
        Gruppe: "Alle",
        ort: "Feuerwehrhaus Brittheim",
        dauer: 120,
        source: "manual"
      }
    ]
  };

  it('adds new events with unique IDs', async () => {
    // We use a specific date that we can predict the format of
    const startDate = new Date(2026, 5, 15, 18, 0, 0); // June 15, 18:00
    
    calParser.parseString.mockReturnValue({
      events: [
        {
          uid: { value: 'uid-2' },
          summary: { value: 'New GCal Event' },
          dtstart: { value: startDate },
          dtend: { value: new Date(startDate.getTime() + 2 * 3600000) },
          location: { value: 'Training Ground' }
        }
      ]
    });

    const { data, changed } = await syncGCalLogic(localDataTemplate, 'ics-string');
    
    expect(changed).toBe(true);
    expect(data.termine.length).toBe(2);
    const newEvent = data.termine.find(t => t.name === 'New GCal Event');
    expect(newEvent).toBeDefined();
    expect(newEvent.id).toBe('2');
    expect(newEvent.ort).toBe('Training Ground');
  });

  it('updates existing events matched by title and date', async () => {
    // Existing event is at 2026-06-01 19:00:00
    const startDate = new Date(2026, 5, 1, 19, 0, 0); 
    
    calParser.parseString.mockReturnValue({
      events: [
        {
          uid: { value: 'uid-updated' },
          summary: { value: 'Existing Event' },
          dtstart: { value: startDate },
          dtend: { value: new Date(startDate.getTime() + 3 * 3600000) }, // Changed duration
          location: { value: 'Updated Location' }
        }
      ]
    });

    const { data, changed } = await syncGCalLogic(localDataTemplate, 'ics-string');
    
    expect(changed).toBe(true);
    expect(data.termine.length).toBe(1);
    expect(data.termine[0].id).toBe('1');
    expect(data.termine[0].ort).toBe('Updated Location');
    expect(data.termine[0].dauer).toBe(180);
  });

  it('sorts appointments by date after merge', async () => {
    const dateLater = new Date(2026, 6, 1, 10, 0, 0);
    const dateEarlier = new Date(2026, 4, 1, 10, 0, 0);
    
    calParser.parseString.mockReturnValue({
      events: [
        {
          uid: { value: 'uid-later' },
          summary: { value: 'Later Event' },
          dtstart: { value: dateLater }
        },
        {
          uid: { value: 'uid-earlier' },
          summary: { value: 'Earlier Event' },
          dtstart: { value: dateEarlier }
        }
      ]
    });

    const { data, changed } = await syncGCalLogic(localDataTemplate, 'ics-string');
    
    expect(changed).toBe(true);
    expect(data.termine.length).toBe(3);
    expect(data.termine[0].name).toBe('Earlier Event');
    expect(data.termine[1].name).toBe('Existing Event');
    expect(data.termine[2].name).toBe('Later Event');
  });

  it('handles empty GCal feed gracefully (Task 3)', async () => {
    calParser.parseString.mockReturnValue({
      events: []
    });

    const { data, changed } = await syncGCalLogic(localDataTemplate, 'ics-string');
    
    expect(changed).toBe(false);
    expect(data.termine.length).toBe(1);
    expect(data.termine).toEqual(localDataTemplate.termine);
  });

  it('sanitizes external fields and prevents leakage', async () => {
    const startDate = new Date(2026, 7, 1, 10, 0, 0);
    
    calParser.parseString.mockReturnValue({
      events: [
        {
          uid: { value: 'uid-leak' },
          summary: { value: 'Clean Event' },
          dtstart: { value: startDate },
          secret_field: "should not be here",
          other_garbage: { stuff: 123 }
        }
      ]
    });

    const { data, changed } = await syncGCalLogic(localDataTemplate, 'ics-string');
    
    const leakedEvent = data.termine.find(t => t.name === 'Clean Event');
    expect(leakedEvent.secret_field).toBeUndefined();
    expect(leakedEvent.other_garbage).toBeUndefined();
    expect(leakedEvent.veranstalter).toBe('Alle');
    expect(leakedEvent.ort).toBe('Feuerwehrhaus Brittheim');
    expect(Object.keys(leakedEvent).sort()).toEqual([
      'Gruppe', 'datum', 'dauer', 'external_id', 'id', 'name', 'ort', 'source', 'veranstalter'
    ].sort());
  });
});
