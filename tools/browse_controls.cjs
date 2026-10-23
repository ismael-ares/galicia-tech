// Browser helpers follow the public controls: open, edit, confirm, close.
async function searchFor(page,label,value){
 await page.getByRole('button',{name:'Abrir búsqueda',exact:true}).click();
 const input=page.getByRole('dialog').getByRole('searchbox',{name:label,exact:true});
 await input.fill(value);await input.press('Enter');await page.getByRole('dialog').waitFor({state:'detached'});
}
async function openFilters(page){await page.getByRole('button',{name:'Abrir filtros',exact:true}).click();return page.getByRole('dialog');}
async function setFilter(page,label,value){const panel=await openFilters(page);await panel.getByRole('combobox',{name:label,exact:true}).selectOption(value);await panel.getByRole('button',{name:'Aplicar filtros',exact:true}).click();await panel.waitFor({state:'detached'});}
async function readFilter(page,label){const panel=await openFilters(page),value=await panel.getByRole('combobox',{name:label,exact:true}).inputValue();await page.keyboard.press('Escape');await panel.waitFor({state:'detached'});return value;}
async function goToMonth(page,value){await page.locator('.calendar-month-title-button').click();const panel=page.getByRole('dialog');await panel.getByLabel('Ir a un mes',{exact:true}).fill(value);await panel.getByRole('button',{name:'Ir al mes',exact:true}).click();await panel.waitFor({state:'detached'});}
const currentQuery=page=>new URL(page.url()).searchParams.get('q')||'';
module.exports={searchFor,openFilters,setFilter,readFilter,goToMonth,currentQuery};
