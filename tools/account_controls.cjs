async function openAccountSettings(page){
 const details=page.locator('#portal-account-settings');
 await details.waitFor();
 if(await details.getAttribute('open')===null)await details.locator('summary').click();
}
module.exports={openAccountSettings};
