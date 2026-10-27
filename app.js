'use strict';
const NOTES = ['C','B#','C#','Db','D','C##','D#','Eb','E','Fb','F','E#','F#','Gb','G','F##','G#','Ab','A','G##','A#','Bb','B','Cb'];
const STORAGE_KEY = 'mapa-acordes:v1';
const container = document.querySelector('#chords-container');
const title = document.querySelector('#title');
const subtitle = document.querySelector('#subtitle');
const status = document.querySelector('#status');
function announce(message) { status.textContent = message; }
function readMap() {
  return { title: title.value, subtitle: subtitle.value, rows: [...container.children].map(row => ({
    chord: row.querySelector('.chord-box').value,
    degrees: [...row.querySelectorAll('.degree')].map(input => input.value),
    notes: [...row.querySelectorAll('.note-select')].map(select => select.value)
  })) };
}
function save() {
  try { localStorage.setItem(STORAGE_KEY, JSON.stringify(readMap())); announce('Guardado en este navegador.'); }
  catch { announce('No se pudo guardar en este navegador. Puedes descargar tu mapa.'); }
}
function updateCount() {
  const count = container.children.length;
  document.querySelector('#row-count').textContent = `${count} ${count === 1 ? 'acorde' : 'acordes'}`;
  [...container.children].forEach((row, index) => {
    row.querySelector('.chord-box').setAttribute('aria-label', `Acorde ${index + 1}`);
    row.querySelector('.remove-row').setAttribute('aria-label', `Eliminar acorde ${index + 1}`);
  });
}
function addRow(data = {}, focus = false) {
  const row = document.createElement('div'); row.className = 'chord-row';
  const chord = document.createElement('input'); chord.className = 'chord-box';
  chord.placeholder = 'Ej. Cmaj7'; chord.maxLength = 32; chord.value = typeof data.chord === 'string' ? data.chord : '';
  row.append(chord);
  for (let i = 0; i < 6; i++) {
    const cell = document.createElement('div'); cell.className = 'note-container';
    const degree = document.createElement('input'); degree.className = 'degree'; degree.maxLength = 8;
    degree.placeholder = String(i + 1); degree.setAttribute('aria-label', `Grado de la nota ${i + 1}`);
    degree.value = typeof data.degrees?.[i] === 'string' ? data.degrees[i] : '';
    const select = document.createElement('select'); select.className = 'note-select'; select.setAttribute('aria-label', `Nota ${i + 1}`);
    select.add(new Option('—', '')); NOTES.forEach(note => select.add(new Option(note, note)));
    select.value = NOTES.includes(data.notes?.[i]) ? data.notes[i] : '';
    cell.append(degree, select); row.append(cell);
  }
  const remove = document.createElement('button'); remove.className = 'remove-row'; remove.type = 'button'; remove.textContent = '×';
  remove.addEventListener('click', () => {
    const next = row.nextElementSibling || row.previousElementSibling;
    row.remove(); updateCount(); save(); (next?.querySelector('.chord-box') || document.querySelector('#add-row')).focus();
  });
  row.append(remove); container.append(row); updateCount(); if (focus) chord.focus();
}
function restore() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const data = JSON.parse(raw);
      if (!data || !Array.isArray(data.rows) || !data.rows.every(row => row && typeof row === 'object')) throw new Error('Invalid saved map');
      title.value = typeof data.title === 'string' ? data.title : 'Mapa de Acordes';
      subtitle.value = typeof data.subtitle === 'string' ? data.subtitle : '';
      data.rows.forEach(row => addRow(row)); updateCount(); announce('Tu mapa se ha recuperado.'); return;
    }
  } catch { announce('No se pudo recuperar el mapa guardado.'); }
  for (let i = 0; i < 3; i++) addRow();
}
function downloadPNG() {
  const button = document.querySelector('#export-png'); button.disabled = true;
  try {
    const data = readMap(); const width = 1600; const height = 300 + Math.max(data.rows.length, 1) * 130;
    if (height > 16000) throw new Error('El mapa es demasiado largo para PNG. Usa Imprimir / PDF.');
    const canvas = document.createElement('canvas'); canvas.width = width; canvas.height = height;
    const ctx = canvas.getContext('2d'); if (!ctx) throw new Error('Tu navegador no permite crear imágenes.');
    ctx.fillStyle = '#fffefb'; ctx.fillRect(0, 0, width, height); ctx.fillStyle = '#263e37';
    ctx.font = '48px Georgia'; ctx.fillText(data.title || 'Mapa de Acordes', 70, 95, width - 140);
    ctx.font = '22px sans-serif'; ctx.fillStyle = '#737c70'; ctx.fillText(data.subtitle, 70, 145, width - 140);
    data.rows.forEach((row, index) => {
      const y = 210 + index * 130;
      ctx.fillStyle = '#f0f3eb'; ctx.fillRect(70, y, 230, 78); ctx.fillStyle = '#263e37';
      ctx.textAlign = 'center'; ctx.font = 'bold 28px sans-serif'; ctx.fillText(row.chord, 185, y + 49, 210);
      row.notes.forEach((note, i) => {
        const x = 400 + i * 210; ctx.fillStyle = '#718064'; ctx.font = '18px sans-serif'; ctx.fillText(row.degrees[i], x, y + 20, 180);
        ctx.fillStyle = '#263e37'; ctx.font = '28px sans-serif'; ctx.fillText(note || '—', x, y + 62, 180);
      });
      ctx.strokeStyle = '#e0e5db'; ctx.beginPath(); ctx.moveTo(70, y + 100); ctx.lineTo(width - 70, y + 100); ctx.stroke();
    });
    canvas.toBlob(blob => {
      try {
        if (!blob) throw new Error('No se pudo crear la imagen.');
        const url = URL.createObjectURL(blob); const link = document.createElement('a');
        link.href = url; link.download = 'MapaAcordes.png'; link.click(); setTimeout(() => URL.revokeObjectURL(url), 1000);
        announce('Imagen PNG creada.');
      } catch (error) { announce(error.message); }
      finally { button.disabled = false; }
    }, 'image/png');
  } catch (error) { announce(error.message); button.disabled = false; }
}
document.querySelector('#add-row').addEventListener('click', () => { addRow({}, true); save(); });
document.querySelector('#workspace').addEventListener('input', save);
document.querySelector('#export-png').addEventListener('click', downloadPNG);
document.querySelector('#export-pdf').addEventListener('click', () => { announce('Selecciona «Guardar como PDF» en el diálogo de impresión.'); window.print(); });
restore();
