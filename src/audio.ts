export class Sound {
  private context:AudioContext|null=null;
  enabled=true;
  unlock(){ if(!this.context)try{this.context=new AudioContext()}catch{}; if(this.context?.state==='suspended')void this.context.resume(); }
  private note(freq:number,start:number,length:number,volume=.08,type:OscillatorType='sine'){
    if(!this.enabled||!this.context)return;
    const c=this.context,o=c.createOscillator(),g=c.createGain();o.type=type;o.frequency.value=freq;
    g.gain.setValueAtTime(0,c.currentTime+start);g.gain.linearRampToValueAtTime(volume,c.currentTime+start+.012);g.gain.exponentialRampToValueAtTime(.001,c.currentTime+start+length);
    o.connect(g);g.connect(c.destination);o.start(c.currentTime+start);o.stop(c.currentTime+start+length+.02);
  }
  play(kind:'find'|'tap'|'hint'|'mechanism'|'win'|'miss',combo=1){
    if(kind==='find'){[523.25,659.25,783.99,1046.5].forEach((f,i)=>this.note(f*(1+Math.min(combo,5)*.035),i*.052,.32,.07));}
    if(kind==='tap')this.note(470,0,.09,.025);
    if(kind==='miss')this.note(220,0,.13,.018);
    if(kind==='hint'){[659,880].forEach((f,i)=>this.note(f,i*.12,.38,.045));}
    if(kind==='mechanism'){[294,440,587].forEach((f,i)=>this.note(f,i*.06,.22,.045,'triangle'));}
    if(kind==='win'){[523,659,784,1046,988,1175,1568].forEach((f,i)=>this.note(f,i*.105,.65,.065));}
  }
  ambient(level:number){if(!this.enabled)return; const chord=[[261.63,329.63,392],[220,293.66,349.23],[246.94,311.13,369.99],[196,261.63,293.66]][level];chord.forEach((f,i)=>this.note(f,i*.28,2.5,.009));}
}
