export type MechanismKind = 'shutter' | 'breeze' | 'fog' | 'valve' | 'crate' | 'lamp' | 'telescope' | 'stars';
export interface Target { x:number;y:number;color:string;pose:number;rotation?:number;requires?:string;clue:string;name:string }
export interface Mechanism {id:string;kind:MechanismKind;x:number;y:number;w:number;h:number;label:string;message:string}
export interface Level {id:string;name:string;subtitle:string;chapter:string;accent:string;phases:string[];weather:string[];intro:string;targets:Target[];mechanisms:Mechanism[]}
export const levels:Level[] = [
 {id:'courtyard',name:'Cozy Courtyard',subtitle:'A little afternoon magic',chapter:'THE FIRST LITTLE WORLD',accent:'#4e8876',phases:['Afternoon','Golden hour'],weather:['Sunshine','Breezy'],intro:'Tap the shutters. Even the flowers have secrets.',targets:[
 {x:132,y:1030,color:'#76885b',pose:2,rotation:-24,clue:'A tiny leaf has arms. Look in the lower-left greenery.',name:'Leaf Peeker'},
 {x:566,y:774,color:'#bd8857',pose:1,rotation:14,clue:'Not every curve by the café furniture is made of wood.',name:'Chair Hugger'},
 {x:706,y:440,color:'#d8bd7f',pose:3,rotation:42,clue:'A little golden shape is resting high on the right.',name:'Sun Snoozer'},
 {x:478,y:327,color:'#78a39a',pose:0,requires:'shutters',clue:'Tap the mint shutters. Someone is taking a quiet break.',name:'Window Dreamer'},
 {x:805,y:1165,color:'#a99360',pose:2,requires:'breeze',clue:'Tap the little wind spinner to rustle the flower bed.',name:'Petal Pal'},
 {x:150,y:450,color:'#d2a08a',pose:1,requires:'phase:1',clue:'Try Golden hour. The little sun button changes the light.',name:'Golden Guest'}],mechanisms:[
 {id:'shutters',kind:'shutter',x:478,y:327,w:148,h:140,label:'Open shutters',message:'A window into a tiny secret.'},
 {id:'breeze',kind:'breeze',x:805,y:1165,w:90,h:100,label:'Rustle the flowers',message:'A little breeze. A little surprise.'}]},
 {id:'greenhouse',name:'Rainy Glasshouse',subtitle:'Good things grow slowly',chapter:'A SECRET IN THE RAIN',accent:'#4b838b',phases:['Rainy morning','Soft evening'],weather:['Rain','After rain'],intro:'Wipe the misted glass. Turn the valve. Follow the rain.',targets:[
 {x:734,y:251,color:'#688c77',pose:3,rotation:70,clue:'Look high on the right, where green shapes overlap.',name:'Fern Friend'},
 {x:159,y:1110,color:'#b08561',pose:2,rotation:-30,clue:'A little terracotta friend is hiding low on the left.',name:'Pot Peeper'},
 {x:275,y:455,color:'#a3c3ac',pose:0,requires:'mist',clue:'Rub your finger across the misted window to clear it.',name:'Misty Mate'},
 {x:680,y:1110,color:'#9ab080',pose:1,requires:'water',clue:'Turn the brass valve to lower the water.',name:'Puddle Buddy'},
 {x:397,y:589,color:'#b8bf82',pose:3,rotation:20,requires:'weather:1',clue:'Wait for a break in the rain, or tap the weather button.',name:'Raindrop Rover'},
 {x:581,y:1210,color:'#9baf80',pose:0,requires:'phase:1',clue:'Soft evening brings one last secret out of hiding.',name:'Evening Sprout'}],mechanisms:[
 {id:'mist',kind:'fog',x:275,y:455,w:112,h:142,label:'Wipe the glass',message:'Clear skies, clear glass, clear little secret.'},
 {id:'water',kind:'valve',x:657,y:912,w:100,h:100,label:'Turn the water valve',message:'The water settles. Something was hiding underneath.'}]},
 {id:'market',name:'Lantern Market',subtitle:'When the village starts to glow',chapter:'FOLLOW THE WARM LIGHT',accent:'#b0795c',phases:['Dusk','Lantern hour'],weather:['Still air','Evening breeze'],intro:'Move a crate. Light a lantern. Let the evening surprise you.',targets:[
 {x:139,y:345,color:'#ca9b81',pose:1,rotation:-40,clue:'A little rose-colored shape blends into the upper-left roses.',name:'Canopy Camper'},
 {x:743,y:752,color:'#ba975e',pose:2,rotation:24,clue:'Something beside the right-hand baskets has tiny feet.',name:'Basket Buddy'},
 {x:263,y:1145,color:'#8a986e',pose:3,rotation:-60,clue:'Look through the low greenery on the left.',name:'Herb Hider'},
 {x:310,y:790,color:'#bd8f62',pose:0,requires:'crate',clue:'Slide the wooden crate aside with a tap.',name:'Crate Keeper'},
 {x:686,y:385,color:'#d5b57d',pose:1,requires:'lantern',clue:'Tap the unlit lantern. Warm light reveals a warm little friend.',name:'Lantern Lounger'},
 {x:643,y:445,color:'#e1b57c',pose:3,requires:'weather:1',clue:'An evening breeze rustles the canopy.',name:'Ribbon Rider'}],mechanisms:[
 {id:'crate',kind:'crate',x:310,y:790,w:150,h:136,label:'Slide the crate',message:'One little crate. One very little secret.'},
 {id:'lantern',kind:'lamp',x:686,y:385,w:95,h:150,label:'Light the lantern',message:'Let there be a little light.'}]},
 {id:'moon',name:'Moonflower Garden',subtitle:'Little secrets after dark',chapter:'UNDER THE SAME LITTLE MOON',accent:'#727d9c',phases:['Moonrise','Silver midnight'],weather:['Clear skies','Drifting clouds'],intro:'Follow the telescope. Connect three stars. Search by moonlight.',targets:[
 {x:145,y:770,color:'#91a293',pose:2,rotation:-28,clue:'Moonflowers are not the only pale shapes on the left.',name:'Moonflower Mate'},
 {x:731,y:1160,color:'#a6a18c',pose:1,rotation:50,clue:'Look low on the right, beside the quiet garden path.',name:'Sleepy Stone'},
 {x:275,y:1200,color:'#6d998c',pose:3,rotation:28,clue:'A little leafy shape is resting in the lower garden.',name:'Night Sprout'},
 {x:697,y:900,color:'#c8b17d',pose:0,requires:'scope',clue:'Turn the brass telescope toward the moon.',name:'Star Gazer'},
 {x:360,y:340,color:'#b6b5b4',pose:1,requires:'stars',clue:'Tap each of the three twinkling stars to join the constellation.',name:'Constellation Kid'},
 {x:565,y:579,color:'#b9bf97',pose:2,requires:'phase:1',clue:'Silver midnight changes what the moonlight reveals.',name:'Midnight Mouse'}],mechanisms:[
 {id:'scope',kind:'telescope',x:697,y:900,w:150,h:140,label:'Aim the telescope',message:'A new perspective on a very small universe.'},
 {id:'stars',kind:'stars',x:360,y:340,w:240,h:150,label:'Connect three stars',message:'Three little stars. One new friend.'}]}
];
export const worldSize={width:900,height:1350};
