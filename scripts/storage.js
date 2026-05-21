const Storage = (() => {
  const KEYS = {
    events: 'mm_events',
    fields: 'mm_fields',
    templates: 'mm_templates',
    responses: 'mm_responses',
    trash: 'mm_trash',
    onboarded: 'mm_onboarded',
    prefs: 'mm_prefs'
  };

  /* ─── Helpers ─── */
  function get(key, fallback = []) {
    try { return JSON.parse(localStorage.getItem(key)) || fallback; }
    catch { return fallback; }
  }
  function set(key, val) { localStorage.setItem(key, JSON.stringify(val)); }

  /* ─── XSS Sanitizer ─── */
  function sanitize(str) {
    if (typeof str !== 'string') return '';
    return str
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;')
      .replace(/`/g, '&#96;');
  }

  /* ─── Events CRUD ─── */
  function getEvents() { return get(KEYS.events, []); }
  function setEvents(arr) { set(KEYS.events, arr); }
  function addEvent(ev) { const all = getEvents(); all.push(ev); setEvents(all); return all; }
  function updateEvent(id, updates) {
    const all = getEvents();
    const idx = all.findIndex(e => e.id === id);
    if (idx === -1) return null;
    all[idx] = { ...all[idx], ...updates, modified: new Date().toISOString() };
    setEvents(all);
    return all[idx];
  }
  function deleteEvent(id) {
    const all = getEvents();
    const idx = all.findIndex(e => e.id === id);
    if (idx === -1) return;
    const removed = all.splice(idx, 1)[0];
    setEvents(all);
    // Soft delete — move to trash with expiry (E2)
    const trash = getTrash();
    removed._deletedAt = Date.now();
    trash.push(removed);
    set(KEYS.trash, trash);
    return removed;
  }
  function getEvent(id) { return getEvents().find(e => e.id === id) || null; }
  function duplicateEvent(id, overrides = {}) {
    const src = getEvent(id);
    if (!src) return null;
    const copy = JSON.parse(JSON.stringify(src));
    copy.id = Date.now();
    copy.title = overrides.title || ('Copy of ' + copy.title);
    copy.date = overrides.date || copy.date;
    copy.created = new Date().toISOString();
    delete copy.modified;
    return addEvent(copy);
  }

  /* ─── Trash / Undo (E2) ─── */
  function getTrash() { return get(KEYS.trash, []); }
  function undoDelete() {
    const trash = getTrash();
    if (!trash.length) return null;
    const restored = trash.pop();
    delete restored._deletedAt;
    set(KEYS.trash, trash);
    const all = getEvents();
    all.push(restored);
    setEvents(all);
    return restored;
  }
  function clearExpiredTrash() {
    const trash = getTrash();
    const cutoff = Date.now() - 30000; // 30s window
    set(KEYS.trash, trash.filter(t => t._deletedAt > cutoff));
  }

  /* ─── Analytics Fields ─── */
  function getFields() { return get(KEYS.fields, []); }
  function setFields(arr) { set(KEYS.fields, arr); }
  function addField(field) { const all = getFields(); all.push(field); setFields(all); return all; }
  function removeField(idx) { const all = getFields(); all.splice(idx, 1); setFields(all); return all; }

  /* ─── Field Templates (D5) ─── */
  function getTemplates() { return get(KEYS.templates, []); }
  function saveTemplate(name, fields) {
    const all = getTemplates();
    all.push({ name, fields: JSON.parse(JSON.stringify(fields)), created: new Date().toISOString() });
    set(KEYS.templates, all);
    return all;
  }
  function deleteTemplate(idx) { const all = getTemplates(); all.splice(idx, 1); set(KEYS.templates, all); return all; }
  function applyTemplate(idx) {
    const all = getTemplates();
    if (!all[idx]) return null;
    const fields = JSON.parse(JSON.stringify(all[idx].fields));
    setFields(fields);
    return fields;
  }

  /* ─── Attendee Responses (C3) ─── */
  function getResponses(eventId) {
    const all = get(KEYS.responses, {});
    return all[eventId] || [];
  }
  function addResponse(eventId, data) {
    const all = get(KEYS.responses, {});
    if (!all[eventId]) all[eventId] = [];
    all[eventId].push({ ...data, submittedAt: new Date().toISOString() });
    set(KEYS.responses, all);
    return all[eventId];
  }
  function getAllResponses() { return get(KEYS.responses, {}); }

  /**
   * Returns responses for an event with the custom identifier value
   * surfaced as the first entry in each response object.
   */
  function getResponsesWithIdentifier(eventId) {
    const ev = getEvent(eventId);
    const responses = getResponses(eventId);
    if (!ev?.customIdentifier?.label) return responses;
    const idLabel = ev.customIdentifier.label;
    return responses.map(r => {
      const { [idLabel]: idVal, submittedAt, ...rest } = r;
      const ordered = {};
      if (idVal !== undefined) ordered[idLabel] = idVal;
      Object.assign(ordered, rest);
      if (submittedAt !== undefined) ordered.submittedAt = submittedAt;
      return ordered;
    });
  }

  /* ─── Onboarding ─── */
  function hasOnboarded() { return localStorage.getItem(KEYS.onboarded) === 'true'; }
  function setOnboarded() { localStorage.setItem(KEYS.onboarded, 'true'); }
  function resetOnboarding() { localStorage.removeItem(KEYS.onboarded); }

  /* ─── Preferences ─── */
  function getPrefs() { return get(KEYS.prefs, {}); }
  function setPref(key, val) { const p = getPrefs(); p[key] = val; set(KEYS.prefs, p); }

  /* ─── Data Validation (E3) ─── */
  function validate(value, type) {
    if (!value || !value.trim()) return { valid: false, msg: 'This field is required' };
    const v = value.trim();
    switch (type) {
      case 'email':
        return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v)
          ? { valid: true } : { valid: false, msg: 'Enter a valid email address' };
      case 'url':
        return /^https?:\/\/.+\..+/.test(v)
          ? { valid: true } : { valid: false, msg: 'Enter a valid URL (https://...)' };
      case 'phone':
        return /^[\d\s\-+()]{7,}$/.test(v)
          ? { valid: true } : { valid: false, msg: 'Enter a valid phone number' };
      case 'number':
        return !isNaN(v) ? { valid: true } : { valid: false, msg: 'Enter a number' };
      case 'date':
        return !isNaN(new Date(v).getTime()) ? { valid: true } : { valid: false, msg: 'Enter a valid date' };
      default:
        return v.length > 0 ? { valid: true } : { valid: false, msg: 'This field is required' };
    }
  }

  /* ─── CSV Export (G6) ─── */
  function exportAll() {
    const events = getEvents();
    const fields = getFields();
    const responses = getAllResponses();
    
    let csv = 'MyMeet Data Export\n';
    csv += 'Exported:,' + new Date().toISOString() + '\n\n';
    
    // Events section
    csv += 'EVENTS\n';
    csv += 'ID,Title,Date,Description,Location Type,Location Details,Category,Created,Modified\n';
    events.forEach(ev => {
      const locDetails = ev.location?.type === 'online' 
        ? ev.location?.meetLink || ev.location?.zoomLink || ''
        : `${ev.location?.name || ''} ${ev.location?.address || ''}`.trim();
      csv += `${ev.id},"${ev.title}","${ev.date || ''}","${ev.desc || ''}","${ev.location?.type || ''}","${locDetails}","${ev.category || ''}","${ev.created}","${ev.modified || ''}"\n`;
    });
    
    // Fields section
    csv += '\nFIELDS\n';
    csv += 'Name,Type,Options\n';
    fields.forEach(field => {
      csv += `"${field.name}","${field.type}","${field.options?.join(';') || ''}"\n`;
    });
    
    // Responses section
    csv += '\nRESPONSES\n';
    csv += 'Event ID,Field Name,Response,Timestamp\n';
    Object.entries(responses).forEach(([eventId, eventResponses]) => {
      eventResponses.forEach(response => {
        Object.entries(response).forEach(([fieldName, value]) => {
          csv += `${eventId},"${fieldName}","${value}","${new Date().toISOString()}"\n`;
        });
      });
    });
    
    return csv;
  }
  function importAll(jsonStr) {
    try {
      // Size guard: reject files over 2MB
      if (jsonStr.length > 2 * 1024 * 1024) {
        return { success: false, error: 'File too large (max 2MB)' };
      }

      const data = JSON.parse(jsonStr);

      // Must be a plain object, not an array or primitive
      if (!data || typeof data !== 'object' || Array.isArray(data)) {
        return { success: false, error: 'Invalid backup format' };
      }

      // Strip prototype pollution keys
      delete data.__proto__;
      delete data.constructor;
      delete data.prototype;

      // Validate events array
      if (data.events) {
        if (!Array.isArray(data.events)) return { success: false, error: 'Events must be an array' };
        if (data.events.length > 500) return { success: false, error: 'Too many events (max 500)' };
        for (const ev of data.events) {
          if (!ev || typeof ev !== 'object') return { success: false, error: 'Invalid event entry' };
          if (typeof ev.id !== 'number') return { success: false, error: 'Event missing valid ID' };
          if (typeof ev.title !== 'string' || ev.title.length > 500) return { success: false, error: 'Event title invalid or too long' };
          if (ev.desc && typeof ev.desc !== 'string') ev.desc = '';
          if (ev.desc && ev.desc.length > 5000) ev.desc = ev.desc.slice(0, 5000);
          // Sanitize customIdentifier
          if (ev.customIdentifier) {
            if (typeof ev.customIdentifier !== 'object') { ev.customIdentifier = null; }
            else {
              if (typeof ev.customIdentifier.label !== 'string') ev.customIdentifier.label = '';
              ev.customIdentifier.label = ev.customIdentifier.label.slice(0, 100);
              ev.customIdentifier.required = !!ev.customIdentifier.required;
            }
          }
        }
        setEvents(data.events);
      }

      // Validate fields array
      if (data.fields) {
        if (!Array.isArray(data.fields)) return { success: false, error: 'Fields must be an array' };
        if (data.fields.length > 50) return { success: false, error: 'Too many fields (max 50)' };
        for (const f of data.fields) {
          if (!f || typeof f !== 'object') return { success: false, error: 'Invalid field entry' };
          if (typeof f.name !== 'string' || !f.name.trim()) return { success: false, error: 'Field missing name' };
          if (!['text', 'select', 'number', 'email', 'phone'].includes(f.type)) f.type = 'text';
          if (f.options && !Array.isArray(f.options)) f.options = [];
        }
        setFields(data.fields);
      }

      // Validate templates
      if (data.templates) {
        if (!Array.isArray(data.templates)) return { success: false, error: 'Templates must be an array' };
        if (data.templates.length > 20) return { success: false, error: 'Too many templates (max 20)' };
        set(KEYS.templates, data.templates);
      }

      // Validate responses
      if (data.responses) {
        if (typeof data.responses !== 'object' || Array.isArray(data.responses)) {
          return { success: false, error: 'Responses must be an object' };
        }
        set(KEYS.responses, data.responses);
      }

      return {
        success: true, counts: {
          events: (data.events || []).length,
          fields: (data.fields || []).length,
          templates: (data.templates || []).length
        }
      };
    } catch (e) {
      return { success: false, error: 'Corrupted file: ' + e.message };
    }
  }
  function downloadExport() {
    const data = {
      _format: 'MyMeet Backup',
      _version: 1,
      _exported: new Date().toISOString(),
      events: getEvents(),
      fields: getFields(),
      templates: get(KEYS.templates) || [],
      responses: getAllResponses()
    };
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `MyMeet_backup_${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
  }
  function triggerImport() {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.json';
    input.onchange = e => {
      const file = e.target.files[0];
      if (!file) return;
      const reader = new FileReader();
      reader.onload = ev => {
        const result = importAll(ev.target.result);
        if (result.success) {
          window.App?.toast(`Imported ${result.counts.events} events, ${result.counts.fields} fields`, 'success');
          setTimeout(() => location.reload(), 800);
        } else {
          window.App?.toast('Import failed: ' + result.error, 'error');
        }
      };
      reader.readAsText(file);
    };
    input.click();
  }

  /* ─── Storage Size Warning (E4) ─── */
  function getStorageSize() {
    let total = 0;
    for (let key in localStorage) {
      if (localStorage.hasOwnProperty(key)) {
        total += localStorage[key].length * 2; // UTF-16
      }
    }
    return total;
  }
  function getStoragePct() {
    return (getStorageSize() / (5 * 1024 * 1024) * 100).toFixed(1);
  }
  function checkStorageWarning() {
    const pct = parseFloat(getStoragePct());
    if (pct > 80) {
      window.App?.toast(`Storage ${pct}% full. Consider exporting a backup.`, 'warning');
    }
  }

  /* ─── Mock Data Generator ─── */
  function genMock(fields) {
    return fields.map(f => {
      if (f.type === 'select' && f.options?.length) {
        const dist = {};
        f.options.forEach(o => { dist[o] = Math.floor(Math.random() * 80) + 10; });
        return { label: f.name, type: f.type, distribution: dist };
      }
      if (f.type === 'number') {
        return { label: f.name, type: f.type, entries: Array.from({ length: 30 }, () => Math.floor(Math.random() * 50) + 18) };
      }
      return { label: f.name, type: f.type, entries: [] };
    });
  }

  // Clean up expired trash on load
  clearExpiredTrash();

  return {
    getEvents, setEvents, addEvent, updateEvent, deleteEvent, getEvent, duplicateEvent,
    getTrash, undoDelete, clearExpiredTrash,
    getFields, setFields, addField, removeField,
    getTemplates, saveTemplate, deleteTemplate, applyTemplate,
    getResponses, addResponse, getAllResponses, getResponsesWithIdentifier,
    hasOnboarded, setOnboarded, resetOnboarding,
    getPrefs, setPref,
    validate,
    exportAll, importAll, downloadExport, triggerImport,
    getStorageSize, getStoragePct, checkStorageWarning,
    genMock,
    sanitize
  };
})();

window.Storage = Storage;