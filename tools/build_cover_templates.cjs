// Catálogo de portadas vectoriales. No descarga imágenes ni utiliza un LLM.
const fs=require('node:fs');const path=require('node:path');const crypto=require('node:crypto');
const root=path.resolve(__dirname,'..'),target=path.join(root,'mock-next/public/cover-templates');
fs.mkdirSync(target,{recursive:true});
const seq=(n,fn)=>Array.from({length:n},(_,i)=>fn(i)).join('');
const circle=(x,y,r)=>`<circle cx="${x}" cy="${y}" r="${r}"/>`;
const designs=[
 ['orbits','Órbitas','ink','editorial',`<g transform="translate(245 105) rotate(-25)">${seq(5,i=>`<ellipse rx="${35+i*22}" ry="${20+i*13}"/>`)}</g>`],
 ['tiles','Módulos','paper','corner',`<g transform="translate(150 -35) rotate(18 90 90)">${seq(9,i=>`<rect x="${i%3*65}" y="${Math.floor(i/3)*65}" width="52" height="52" rx="${i%3?9:26}" fill="currentColor" opacity="${.2+i*.06}"/>`)}</g>`],
 ['waves','Ondas','steel','stripe',seq(8,i=>`<path d="M-20 ${15+i*17}C90 ${-30+i*17} 180 ${200+i*17} 390 ${40+i*17}"/>`)],
 ['rays','Radios','ink','center',`<g transform="translate(255 100)">${seq(16,i=>`<path d="M26 0H120" transform="rotate(${i*22.5})"/>`)}${circle(0,0,15)}</g>`],
 ['steps','Trama escalonada','paper','rule',`<g transform="translate(140 -40) rotate(32 100 100)">${seq(5,i=>`<rect x="${i*23}" y="${i*23}" width="120" height="120" rx="14"/>`)}</g>`],
 ['network','Conexiones','steel','editorial','<path d="M85 45 170 20 280 65 325 150 215 172 130 125 85 45 215 172 280 65 170 20 130 125 325 150"/>'+[[85,45],[170,20],[280,65],[325,150],[215,172],[130,125]].map(([x,y],i)=>`<circle cx="${x}" cy="${y}" r="${i%2?8:5}" fill="currentColor"/>`).join('')],
 ['contours','Topografía','ink','rule',seq(7,i=>`<path d="M${130+i*10} ${-20+i*7}C${50+i*10} ${70+i*10} ${350-i*7} ${35+i*7} ${310-i*3} ${140+i*12}S${140+i*8} ${240-i*4} ${205+i*8} ${110-i*4}"/>`)],
 ['circuit','Circuito','paper','editorial','<path d="M110 15H220V60H300V130H350M135 40H195V90H270V165H330M160 0V115H235V190M300 0V35H340V90M90 80H150V150H200"/>'+[[220,15],[300,60],[350,130],[270,90],[235,190],[200,150]].map(([x,y])=>circle(x,y,5)).join('')],
 ['portals','Pórticos','ink','corner',seq(6,i=>`<path d="M${145+i*17} 190V80a${100-i*13} ${100-i*13} 0 0 1 ${200-i*26} 0V190"/>`)],
 ['horizon','Horizonte','steel','rule',seq(7,i=>`<path d="M-15 ${60+i*17}Q180 ${-80+i*27} 375 ${60+i*17}"/>`)],
 ['checker','Tablero','paper','corner',`<g transform="translate(165 5) rotate(-8 75 75)">${seq(16,i=>`<${i%2?'circle':'rect'} ${i%2?`cx="${i%4*47+19}" cy="${Math.floor(i/4)*47+19}" r="16"`:`x="${i%4*47}" y="${Math.floor(i/4)*47}" width="38" height="38" rx="4"`} fill="currentColor" opacity="${(i+Math.floor(i/4))%2?.55:.18}"/>`)}</g>`],
 ['constellation','Constelación','ink','center','<path d="M110 80 165 35 230 75 292 30 335 110 267 164 180 135 110 80M230 75 267 164M165 35 180 135"/>'+[[110,80],[165,35],[230,75],[292,30],[335,110],[267,164],[180,135]].map(([x,y])=>`<path d="M${x-5} ${y}h10m-5-5v10"/>`).join('')],
 ['ribbons','Cintas','steel','stripe',`<g transform="translate(90 -70) rotate(33 100 100)">${seq(5,i=>`<rect x="${i*48}" y="0" width="22" height="270" rx="11" fill="currentColor" opacity="${.2+i*.12}"/>`)}</g>`],
 ['frame','Encuadre','paper','rule','<path d="M130 20h190v145M150 40h150v105M170 60h110v65M130 70V20h50M270 165h50v-50"/><rect x="213" y="82" width="29" height="29" rx="6" fill="currentColor"/>'],
 ['sunrise','Amanecer','ink','editorial',seq(6,i=>`<path d="M${240-(28+i*19)} 155a${28+i*19} ${28+i*19} 0 0 1 ${(28+i*19)*2} 0"/>`)+'<path d="M85 169h280M100 184h250"/>'],
 ['dotmatrix','Matriz','steel','corner',seq(48,i=>`<circle cx="${125+i%8*29}" cy="${15+Math.floor(i/8)*29}" r="${2+(i%8)/2}" fill="currentColor" opacity="${.2+Math.floor(i/8)*.12}"/>`)],
 ['helix','Hélice','paper','stripe','<path d="M100 10C330 0 80 185 330 185M330 10C100 0 350 185 100 185"/>'+seq(10,i=>`<path d="M${150+Math.sin(i*.7)*65} ${i*19}H${280-Math.sin(i*.7)*65}"/>`)],
 ['chevrons','Vectores','ink','rule',`<g transform="translate(110 -10)">${seq(6,i=>`<path d="M${i*32} 15l50 70-50 70"/>`)}</g>`],
 ['folds','Pliegues','paper','editorial','<path d="M130 15 305 45 250 185Z" fill="currentColor" opacity=".15"/><path d="m130 15 85 87 90-57-55 140-35-83Z"/><path d="m215 102 55-80 65 107-85 56" fill="currentColor" opacity=".2"/>'],
 ['diagonals','Diagonales','steel','center','<path d="M110 0h65L25 200h-65ZM230 0h44L124 200H80ZM335 0h28L213 200h-28Z" fill="currentColor" opacity=".4"/><path d="M175 0 25 200M274 0 124 200M363 0 213 200"/>']
];
const tones={ink:{bg:'#263c54',fg:'#f4f8ff',muted:'#d2e0ef',art:'#9cbddd'},paper:{bg:'#dce7ef',fg:'#18334b',muted:'#35566d',art:'#467594'},steel:{bg:'#40566c',fg:'#ffffff',muted:'#e0eaf4',art:'#b1cce3'}};
const templates=designs.map(([id,name,tone,layout,artwork],i)=>({id,name,number:i+1,tone,layout,artwork,file:`${String(i+1).padStart(2,'0')}-${id}.svg`}));
const escape=s=>s.replaceAll('&','&amp;').replaceAll('<','&lt;').replaceAll('>','&gt;');
for(const t of templates){const c=tones[t.tone];const align=t.layout==='center'?'middle':'start',x=align==='middle'?180:24;
 const svg=`<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="1067" viewBox="0 0 360 320" role="img" aria-labelledby="title desc"><title id="title">Plantilla ${t.number}: ${escape(t.name)}</title><desc id="desc">Plantilla editable. Sustituir los textos event-title, event-subtitle y event-date.</desc><defs><linearGradient id="veil" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="${c.bg}" stop-opacity="0"/><stop offset=".42" stop-color="${c.bg}"/></linearGradient></defs><rect width="360" height="320" rx="20" fill="${c.bg}"/><g fill="none" stroke="${c.art}" stroke-width="1.8" opacity=".55">${t.artwork}</g><rect y="155" width="360" height="165" fill="url(#veil)"/><g fill="${c.fg}" font-family="Segoe UI,Arial,sans-serif"><text x="24" y="35" font-size="9" letter-spacing="2">GALICIA TECH</text><text id="event-title" x="${x}" y="230" text-anchor="${align}" font-size="30" font-weight="700">Título del evento</text><text id="event-subtitle" x="${x}" y="256" text-anchor="${align}" font-size="14">Comunidad · Localidad</text><text id="event-date" x="24" y="290" font-size="10" fill="${c.muted}">Fecha del evento</text><text x="336" y="307" text-anchor="end" font-size="7" fill="${c.muted}">Portada automática</text></g></svg>\n`;
 fs.writeFileSync(path.join(target,t.file),svg);t.sha256=crypto.createHash('sha256').update(svg).digest('hex');
}
fs.writeFileSync(path.join(root,'mock-next/lib/cover-templates.json'),JSON.stringify(templates,null,2)+'\n');
fs.writeFileSync(path.join(target,'index.json'),JSON.stringify({version:1,templates:templates.map(({artwork,...rest})=>rest)},null,2)+'\n');
fs.writeFileSync(path.join(target,'README.md'),'# 20 plantillas de portada · Pizarra y tinta\n\nArchivos SVG independientes y editables. Cada archivo tiene título, comunidad/localidad y fecha como textos con IDs event-title, event-subtitle y event-date. Sustituye esos textos y ajusta sus saltos de línea al exportar. No representan convocatorias nuevas.\n\nEl mock utiliza los motivos del catálogo con los títulos y fechas reales, ajustados mediante CSS. Una plantilla conserva identidad, tono y composición.\n\nRegenerar desde la raíz: node tools/build_cover_templates.cjs\n\nindex.json registra IDs, nombres, tonos y huellas SHA-256.\n');
console.log(`Guardadas ${templates.length} plantillas SVG y su catálogo.`);
