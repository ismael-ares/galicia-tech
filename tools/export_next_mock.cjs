// Exporta la muestra existente, sin consultar fuentes ni ejecutar el colector.
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const root = path.resolve(__dirname, '..');
const context = vm.createContext({ window: {}, URL,
  document: { querySelectorAll: () => [], addEventListener: () => {} },
  localStorage: { getItem: () => null, setItem: () => {} } });
for (const name of ['eventos.js', 'more-samples.js', 'source-catalog.js', 'review-cases.js', 'management-state.js']) {
  vm.runInContext(fs.readFileSync(path.join(root, 'mock', name), 'utf8'), context);
}
const w = context.window;
const covers = JSON.parse(fs.readFileSync(path.join(root, 'mock/cover-manifest.json'), 'utf8'));
const output = path.join(root, 'mock-next');
fs.mkdirSync(path.join(output, 'lib'), { recursive: true });
fs.mkdirSync(path.join(output, 'public'), { recursive: true });
fs.writeFileSync(path.join(output, 'lib/sample.json'), JSON.stringify({
  capturedAt: '2026-10-20', events: w.GALICIA_EVENTS.events,
  ranking: w.GALICIA_EVENTS.ranking, sources: w.GaliciaManagement.sources,
  cases: w.GALICIA_REVIEW_CASES,
  covers: covers.events.map(({ id, selected }) => ({ id, selected: selected || null }))
}, null, 2));
const shellSvg = fs.readFileSync(path.join(root, 'mock/favicon.svg'), 'utf8')
  .replaceAll('Verde y menta', 'Pizarra y tinta')
  .replaceAll('#DDF3EA', '#E1E9F2').replaceAll('#175B4C', '#34597C').replaceAll('#12483D', '#294966')
  .replace('fill="none" stroke="#E1E9F2"', 'fill="none" stroke="#F2F8FF"');
fs.writeFileSync(path.join(output, 'lib/shell.ts'), 'export const shellSvg = ' + JSON.stringify(shellSvg) + ';\n');
fs.cpSync(path.join(root, 'mock/assets'), path.join(output, 'public/assets'), { recursive: true });
fs.writeFileSync(path.join(output, 'public/icon.svg'), shellSvg);
console.log('Muestra exportada: ' + w.GALICIA_EVENTS.events.length + ' eventos, ' + w.GaliciaManagement.sources.length + ' fuentes.');
