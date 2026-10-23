export function artUrl(id:string):string {
 const inline=(window as Window & {__INLINE_ART__?:Record<string,string>}).__INLINE_ART__;
 return inline?.[id] ?? `${import.meta.env.BASE_URL}art/${id}.webp`;
}
