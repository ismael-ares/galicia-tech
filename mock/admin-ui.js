(()=>{
const model=window.GaliciaManagement,$=id=>document.getElementById(id),sources=model.sources,pending=model.pending().length,included=sources.filter(source=>source.enabled).length;
$('admin-source-total').textContent=sources.length;
$('admin-source-selection').textContent=`${included} incluidas${included<sources.length?` · ${sources.length-included} en pausa`:''}`;
$('admin-review-total').textContent=pending;
$('admin-review-label').textContent=pending===1?'asunto pendiente':pending?'asuntos pendientes':'Sin asuntos pendientes';
$('admin-event-total').textContent=window.GALICIA_EVENTS.events.length;
const readings=sources.filter(source=>source.snapshot&&/^\d{4}-\d{2}-\d{2}$/.test(source.checkedAt||'')).map(source=>source.checkedAt).sort();
$('admin-last-reading').textContent=readings.length?new Intl.DateTimeFormat('es',{day:'numeric',month:'short',year:'numeric',timeZone:'UTC'}).format(new Date(readings.at(-1)+'T12:00:00Z')):'Sin lecturas';
})();
