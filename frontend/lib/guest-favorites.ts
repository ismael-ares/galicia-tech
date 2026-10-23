export const guestFavoritesKey='galicia-tech-guest-favorites-v1';
type FavoritesStorage=Pick<Storage,'getItem'|'setItem'>;

function validId(value:unknown):value is string{
 return typeof value==='string'&&/^[A-Za-z0-9_-]{1,100}$/.test(value);
}

export function readGuestFavorites(storage:FavoritesStorage):string[]{
 const raw=storage.getItem(guestFavoritesKey);
 if(!raw)return [];
 try{
  const value:unknown=JSON.parse(raw);
  return Array.isArray(value)?[...new Set(value.filter(validId))]:[];
 }catch{return [];}
}

// Read the latest persisted list at the time of the click, including changes
// from another tab. A failed write must never look like a successful save.
export function toggleGuestFavorite(storage:FavoritesStorage,id:string):string[]{
 if(!validId(id))throw new Error('Invalid event identifier');
 const current=readGuestFavorites(storage);
 const next=current.includes(id)?current.filter(value=>value!==id):[...current,id];
 storage.setItem(guestFavoritesKey,JSON.stringify(next));
 return next;
}
