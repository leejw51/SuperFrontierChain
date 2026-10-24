var At=(n=>(n[n.VOID=0]="VOID",n[n.BIT=1]="BIT",n[n.BYTE=2]="BYTE",n[n.BYTE_2=3]="BYTE_2",n[n.BYTE_4=4]="BYTE_4",n[n.BYTE_8=5]="BYTE_8",n[n.POINTER=6]="POINTER",n[n.COMPOSITE=7]="COMPOSITE",n))(At||{}),dp=new DataView(new ArrayBuffer(8));new Uint16Array(dp.buffer)[0]=258;var io=4096,so=64<<20,pp=7,ux=8192,hx=2147483647,fx=4294967295,sh=4096,zt=dp.getUint8(0)===2,mp=2,dx=4,gp=3,$a=hx,rh=fx,Xa="CAPNP-TS000 Unreachable code detected.";function ro(n){throw new Error(Xa+` (never block hit with: ${n})`)}var oh="CAPNP-TS001 Attempted to parse an invalid message frame header; are you sure this is a Cap'n Proto message?",_p="CAPNP-TS003 Attempted to pack a message that was not word-aligned.",ah="CAPNP-TS004 Segment ID %X is out of bounds for message %s.",ch="CAPNP-TS005 First segment must have at least enough room to hold the root pointer (8 bytes).";var px="CAPNP-TS008 Attempted to adopt %s into a pointer in a different message %s.",mx="CAPNP-TS009 Attempted to adopt %s more than once.",gx="CAPNP-TS010 Attempted to set a composite list without providing a composite element size.",lh="CAPNP-TS011 Nesting depth limit exceeded for %s.",_x="CAPNP-TS013 Attempted to initialize a struct member from a composite list (%s).",xx="CAPNP-TS015 Target of a far pointer (%s) is another far pointer.",Va="CAPNP-TS016 Invalid list element size: %x.",za="CAPNP-TS017 Invalid pointer type: %x.",yx="CAPNP-TS018 Attempted to access getter on %s for union field %s that is not currently set (wanted: %d, found: %d).",vx="CAPNP-TS019 Pointer offset %a is out of bounds for underlying buffer.",Sx="CAPNP-TS020 Attempted to access out-of-bounds struct data (struct: %s, %d bytes at %a, data words: %d).",bx="CAPNP-TS021 Attempted to access out-of-bounds struct pointer (%s, index: %d, length: %d).",Mx="CAPNP-TS022 Traversal limit exceeded! Slow down! %s",Tx="CAPNP-TS023 Cannot convert %s to a %s list.",wx="CAPNP-TS024 Attempted to convert pointer %s to a %s type.",xp="CAPNP-TS035 Attempted to get a segment other than 0 (%d) from a single segment arena.",yp="CAPNP-TS036 Attempted to get an out-of-bounds segment (%d).",uh="CAPNP-TS037 Segment buffer length %d is not a multiple of 8.",vp="CAPNP-TS038 Attempted to replace a segment buffer with one that is smaller than the allocated space.",Sp=`CAPNP-TS039 Requested size %x exceeds maximum value (${rh}).`,Ex="CAPNP-TS040 Must provide a composite element size for composite list pointers.",_s="CAPNP-TS045: Cannot call mutative methods on an immutable list.",jr="CAPNP-TS046: Search is not supported for list.",hh="CAPNP-TS100 Call on null client.";function Ax(n){let t=new Uint8Array(n),e=[];for(let i=0;i<t.byteLength;i++)e.push(Ga(t[i].toString(16),2));return`[${e.join(" ")}]`}function bp(n){let t=n instanceof ArrayBuffer?new Uint8Array(n):new Uint8Array(n.buffer,n.byteOffset,n.byteLength),e=Math.min(t.byteLength,ux),i=qt(`
=== buffer[%d] ===`,e);for(let s=0;s<e;s+=16){i+=`
${Ga(s.toString(16),8)}: `;let r="",o;for(o=0;o<16&&s+o<t.byteLength;o++){let a=t[s+o];i+=`${Ga(a.toString(16),2)} `,r+=a>31&&a<255?String.fromCharCode(a):"\xB7",o===7&&(i+=" ")}i+=`${" ".repeat((17-o)*3)}${r}`}return i+=`
`,e!==t.byteLength&&(i+=qt(`=== (truncated %d bytes) ===
`,t.byteLength-e)),i}function qt(n,...t){let e=n.length,i,s=0,r,o=!1,a=0,l=!1,c,u="";function f(){return t[s++]}function h(){let m="";for(;/\d/.test(n[a]);)m+=n[a++],r=n[a];return m.length>0?Number.parseInt(m,10):null}for(;a<e;++a)if(r=n[a],o)switch(o=!1,r==="."?(l=!1,r=n[++a]):r==="0"&&n[a+1]==="."?(l=!0,a+=2,r=n[a]):l=!0,c=h(),r){case"a":{u+="0x"+Ga(Number.parseInt(String(f()),10).toString(16),8);break}case"b":{u+=Number.parseInt(String(f()),10).toString(2);break}case"c":{i=f(),u+=typeof i=="string"||i instanceof String?i:String.fromCharCode(Number.parseInt(String(i),10));break}case"d":{u+=Number.parseInt(String(f()),10);break}case"f":{let m=Number.parseFloat(String(f())).toFixed(c||6);u+=l?m:m.replace(/^0/,"");break}case"j":{u+=JSON.stringify(f());break}case"o":{u+="0"+Number.parseInt(String(f()),10).toString(8);break}case"s":{u+=f();break}case"x":{u+="0x"+Number.parseInt(String(f()),10).toString(16);break}case"X":{u+="0x"+Number.parseInt(String(f()),10).toString(16).toUpperCase();break}default:{u+=r;break}}else r==="%"?o=!0:u+=r;return u}function Ga(n,t,e="0"){return n.length>=t?n:Array.from({length:t-n.length+1}).join(e)+n}function an(n){return n+7&-8}var ve=class{constructor(t,e){this.dataByteLength=t,this.pointerLength=e}toString(){return qt("ObjectSize_dw:%d,pc:%d",to(this),this.pointerLength)}};function wn(n){return n.dataByteLength+n.pointerLength*8}function to(n){return n.dataByteLength/8}function Js(n){return n.dataByteLength/8+n.pointerLength}function fh(n){return new ve(an(n.dataByteLength),n.pointerLength)}var nh=class{_capnp;byteOffset;segment;constructor(t){let e=Ot(t);switch(this.segment=e.segment,this.byteOffset=e.byteOffset,this._capnp={},this._capnp.type=pn(t),this._capnp.type){case jt.STRUCT:{this._capnp.size=mi(t);break}case jt.LIST:{this._capnp.length=bs(t),this._capnp.elementSize=Fi(t),this._capnp.elementSize===At.COMPOSITE&&(this._capnp.size=co(t));break}case jt.OTHER:{this._capnp.capId=mh(t);break}default:throw new Error(za)}oo(t)}_moveTo(t){if(this._capnp===void 0)throw new Error(qt(mx,this));if(this.segment.message!==t.segment.message)throw new Error(qt(px,this,t));En(t);let e=An(this.segment,this.byteOffset,t);switch(this._capnp.type){case jt.STRUCT:{Bi(e.offsetWords,this._capnp.size,e.pointer);break}case jt.LIST:{let{offsetWords:i}=e;this._capnp.elementSize===At.COMPOSITE&&i--,vs(i,this._capnp.elementSize,this._capnp.length,e.pointer,this._capnp.size);break}case jt.OTHER:{Za(this._capnp.capId,e.pointer);break}default:throw new Error(za)}this._capnp=void 0}dispose(){if(this._capnp!==void 0){switch(this._capnp.type){case jt.STRUCT:{this.segment.fillZeroWords(this.byteOffset,Js(this._capnp.size));break}case jt.LIST:{let t=ph(this._capnp.elementSize,this._capnp.length,this._capnp.size);this.segment.fillZeroWords(this.byteOffset,t);break}}this._capnp=void 0}}[Symbol.for("nodejs.util.inspect.custom")](){return qt("Orphan_%d@%a,type:%s",this.segment.id,this.byteOffset,this._capnp&&this._capnp.type)}};function Mp(n,t){n._moveTo(t)}function Tp(n){return new nh(n)}function dh(n){return Ax(n.segment.buffer.slice(n.byteOffset,n.byteOffset+8))}function ph(n,t,e){switch(n){case At.BIT:return an(t+7>>>3);case At.BYTE:case At.BYTE_2:case At.BYTE_4:case At.BYTE_8:case At.POINTER:case At.VOID:return an(Qs(n)*t);case At.COMPOSITE:{if(e===void 0)throw new Error(qt(Va,Number.NaN));return t*an(wn(e))}default:throw new Error(Va)}}function Qs(n){switch(n){case At.BIT:return Number.NaN;case At.BYTE:return 1;case At.BYTE_2:return 2;case At.BYTE_4:return 4;case At.BYTE_8:case At.POINTER:return 8;case At.COMPOSITE:return Number.NaN;case At.VOID:return 0;default:throw new Error(qt(Va,n))}}function Ha(n,t){return new he(t.segment,t.byteOffset+n,t._capnp.depthLimit)}function cn(n,t){if(!(t.segment===n.segment&&t.byteOffset===n.byteOffset)&&(En(t),!Cn(n)))switch(pn(n)){case jt.STRUCT:{bh(n,t);break}case jt.LIST:{Sh(n,t);break}case jt.OTHER:{vh(n,t);break}default:throw new Error(qt(za,pn(t)))}}function En(n){if(Cn(n))return;let t;switch(pn(n)){case jt.STRUCT:{let e=mi(n);t=Ot(n),t.segment.fillZeroWords(t.byteOffset,e.dataByteLength/8);for(let i=0;i<e.pointerLength;i++)En(Ha(i*8,t));break}case jt.LIST:{let e=Fi(n),i=bs(n),s=an(i*Qs(e));if(t=Ot(n),e===At.POINTER){for(let r=0;r<i;r++)En(new he(t.segment,t.byteOffset+r*8,n._capnp.depthLimit-1));break}else if(e===At.COMPOSITE){let r=Ha(-8,t),o=Ss(r),a=wn(o);s=ys(r),t.segment.setWordZero(t.byteOffset-8);for(let l=0;l<i;l++)for(let c=0;c<o.pointerLength;c++)En(new he(t.segment,t.byteOffset+l*a+c*8,n._capnp.depthLimit-1))}t.segment.fillZeroWords(t.byteOffset,s);break}case jt.OTHER:break;default:throw new Error(qt(za,pn(n)))}oo(n)}function oo(n){if(tr(n)===jt.FAR){let t=ao(n);lo(n)&&t.segment.setWordZero(t.byteOffset+8),t.segment.setWordZero(t.byteOffset)}n.segment.setWordZero(n.byteOffset)}function ao(n){let t=n.segment.message.getSegment(n.segment.getUint32(n.byteOffset+4)),e=n.segment.getUint32(n.byteOffset)>>>3;return new he(t,e*8,n._capnp.depthLimit-1)}function Dn(n){if(tr(n)===jt.FAR){let t=ao(n);return lo(n)&&(t.byteOffset+=8),t}return n}function mh(n){return n.segment.getUint32(n.byteOffset+4)}function Cx(n){return pn(n)===jt.LIST&&Fi(n)===At.COMPOSITE}function Ot(n,t){let e;if(lo(n)){let i=ao(n);e=new he(n.segment.message.getSegment(gh(i)),ys(i)*8)}else{let i=Dn(n);e=new he(i.segment,i.byteOffset+8+ys(i)*8)}return Cx(n)&&(e.byteOffset+=8),!t&&n._capnp.compositeIndex!==void 0&&(e.byteOffset-=8,e.byteOffset+=8+n._capnp.compositeIndex*wn(fh(Ss(e)))),e}function gh(n){return n.segment.getUint32(n.byteOffset+4)}function qa(n){return n.segment.getUint32(n.byteOffset+4)&pp}function _h(n){return n.segment.getUint32(n.byteOffset+4)>>>3}function ys(n){let t=n.segment.getInt32(n.byteOffset);return t&2?t>>3:t>>2}function tr(n){return n.segment.getUint32(n.byteOffset)&gp}function xh(n){return n.segment.getUint16(n.byteOffset+4)}function yh(n){return n.segment.getUint16(n.byteOffset+6)}function Ss(n){return new ve(xh(n)*8,yh(n))}function Ya(n){let t=Ot(n);return t.byteOffset-=8,t}function co(n){return Ss(Ya(n))}function Fi(n){return qa(Dn(n))}function bs(n){let t=Dn(n);return qa(t)===At.COMPOSITE?ys(Ya(n)):_h(t)}function pn(n){let t=tr(Dn(n));if(t===jt.FAR)throw new Error(qt(xx,n));return t}function mi(n){return Ss(Dn(n))}function An(n,t,e){if(e.segment!==n){if(!n.hasCapacity(8)){let s=e.segment.allocate(16);return Qr(!0,s.byteOffset/8,s.segment.id,e),Qr(!1,t/8,n.id,s),s.byteOffset+=8,new xs(s,0)}let i=n.allocate(8);if(i.segment.id!==n.id)throw new Error(Xa);return Qr(!1,i.byteOffset/8,i.segment.id,e),new xs(i,(t-i.byteOffset-8)/8)}return new xs(e,(t-e.byteOffset-8)/8)}function lo(n){return tr(n)===jt.FAR&&(n.segment.getUint32(n.byteOffset)&dx)!==0}function Cn(n){return n.segment.isWordZero(n.byteOffset)}function wp(n,t){let e=Dn(t),i=e.segment.getUint8(e.byteOffset)&3,s=e.segment.getUint32(e.byteOffset+4);En(n);let r=An(e.segment,e.byteOffset+8+ys(e)*8,n);r.pointer.segment.setUint32(r.pointer.byteOffset,i|r.offsetWords<<2),r.pointer.segment.setUint32(r.pointer.byteOffset+4,s),oo(t)}function Qr(n,t,e,i){let s=jt.FAR,r=n?1:0,o=t,a=e;i.segment.setUint32(i.byteOffset,s|r<<2|o<<3),i.segment.setUint32(i.byteOffset+4,a)}function Za(n,t){t.segment.setUint32(t.byteOffset,jt.OTHER),t.segment.setUint32(t.byteOffset+4,n)}function Ka(n){return n.segment.getUint32(n.byteOffset+4)}function vs(n,t,e,i,s){let r=jt.LIST,o=n,a=t,l=e;if(t===At.COMPOSITE){if(s===void 0)throw new TypeError(Ex);l*=Js(s)}i.segment.setUint32(i.byteOffset,r|o<<2),i.segment.setUint32(i.byteOffset+4,a|l<<3)}function Bi(n,t,e){let i=jt.STRUCT,s=n,r=to(t),o=t.pointerLength;e.segment.setUint32(e.byteOffset,i|s<<2),e.segment.setUint16(e.byteOffset+4,r),e.segment.setUint16(e.byteOffset+6,o)}function Ms(n,t,e){if(Cn(t))return;let i=Dn(t);if((i.segment.getUint32(i.byteOffset)&gp)!==n)throw new Error(qt(wx,t,n));if(e!==void 0&&(i.segment.getUint32(i.byteOffset+4)&pp)!==e)throw new Error(qt(Tx,t,At[e]))}function vh(n,t){let e=Ka(n);if(e<0)return;let i=n.segment.message._capnp.capTable;if(!i)return;let s=i[e];if(!s)return;let r=t.segment.message.addCap(s);Za(r,t)}function Sh(n,t){if(t._capnp.depthLimit<=0)throw new Error(lh);let e=Ot(n),i=Fi(n),s=bs(n),r,o,a;if(i===At.POINTER){a=t.segment.allocate(s<<3);for(let c=0;c<s;c++){let u=new he(e.segment,e.byteOffset+(c<<3),n._capnp.depthLimit-1),f=new he(a.segment,a.byteOffset+(c<<3),t._capnp.depthLimit-1);cn(u,f)}}else if(i===At.COMPOSITE){if(r=fh(co(n)),o=wn(r),a=t.segment.allocate(wn(r)*s+8),a.segment.copyWord(a.byteOffset,e.segment,e.byteOffset-8),r.dataByteLength>0){let c=Js(r)*s;a.segment.copyWords(a.byteOffset+8,e.segment,e.byteOffset,c)}for(let c=0;c<s;c++)for(let u=0;u<r.pointerLength;u++){let f=c*o+r.dataByteLength+(u<<3),h=new he(e.segment,e.byteOffset+f,n._capnp.depthLimit-1),m=new he(a.segment,a.byteOffset+f+8,t._capnp.depthLimit-1);cn(h,m)}}else{let c=an(i===At.BIT?s+7>>>3:Qs(i)*s),u=c>>>3;a=t.segment.allocate(c),a.segment.copyWords(a.byteOffset,e.segment,e.byteOffset,u)}let l=An(a.segment,a.byteOffset,t);vs(l.offsetWords,i,s,l.pointer,r)}function bh(n,t){if(t._capnp.depthLimit<=0)throw new Error(lh);let e=Ot(n),i=mi(n),s=to(i),r=t.segment.allocate(wn(i));r.segment.copyWords(r.byteOffset,e.segment,e.byteOffset,s);for(let a=0;a<i.pointerLength;a++){let l=i.dataByteLength+a*8,c=new he(e.segment,e.byteOffset+l,n._capnp.depthLimit-1),u=new he(r.segment,r.byteOffset+l,t._capnp.depthLimit-1);cn(c,u)}if(t._capnp.compositeList)return;let o=An(r.segment,r.byteOffset,t);Bi(o.offsetWords,i,o.pointer)}function Mh(n,t){if(n._capnp.traversalLimit-=8,n._capnp.traversalLimit<=0)throw new Error(qt(Mx,t))}var xs=class{constructor(t,e){this.pointer=t,this.offsetWords=e}},jt=(n=>(n[n.STRUCT=0]="STRUCT",n[n.LIST=1]="LIST",n[n.FAR=2]="FAR",n[n.OTHER=3]="OTHER",n))(jt||{}),he=class{static _capnp={displayName:"Pointer"};_capnp;byteOffset;segment;constructor(t,e,i=$a){if(this._capnp={compositeList:!1,depthLimit:i},this.segment=t,this.byteOffset=e,i<1)throw new Error(qt(lh,this));if(Mh(t.message,this),e<0||e>t.byteLength)throw new Error(qt(vx,e))}[Symbol.toStringTag](){return qt("Pointer_%d",this.segment.id)}toString(){return qt("->%d@%a%s",this.segment.id,this.byteOffset,dh(this))}},Le=class n extends he{static _capnp={displayName:"List<Generic>",size:At.VOID};constructor(t,e,i){return super(t,e,i),new Proxy(this,n.#t)}static#t={get(t,e,i){let s=Reflect.get(t,e,i);if(s!==void 0)return s;if(typeof e=="string")return t.get(+e)}};get length(){return bs(this)}toArray(){let{length:t}=this,e=Array.from({length:t});for(let i=0;i<t;i++)e[i]=this.at(i);return e}get(t){throw new TypeError("Cannot get from a generic list.")}set(t,e){throw new TypeError("Cannot set on a generic list.")}at(t){return this.get(t<0?this.length+t:t)}concat(t){let{length:e}=this,i=t.length,s=Array.from({length:e+i});for(let r=0;r<e;r++)s[r]=this.at(r);for(let r=0;r<i;r++)s[r+e]=t.at(r);return s}some(t,e){for(let i=0;i<this.length;i++)if(t.call(e,this.at(i),i,this))return!0;return!1}filter(t,e){let i=[];for(let s=0;s<this.length;s++){let r=this.at(s);t.call(e,r,s,this)&&i.push(r)}return i}find(t,e){for(let i=0;i<this.length;i++){let s=this.at(i);if(t.call(e,s,i,this))return s}}findIndex(t,e){for(let i=0;i<this.length;i++){let s=this.at(i);if(t.call(e,s,i,this))return i}return-1}forEach(t,e){for(let i=0;i<this.length;i++)t.call(e,this.at(i),i,this)}map(t,e){let{length:i}=this,s=Array.from({length:i});for(let r=0;r<i;r++)s[r]=t.call(e,this.at(r),r,this);return s}flatMap(t,e){let i=[];for(let s=0;s<this.length;s++){let r=t.call(e,this.at(s),s,this);i.push(...Array.isArray(r)?r:[r])}return i}every(t,e){for(let i=0;i<this.length;i++)if(!t.call(e,this.at(i),i,this))return!1;return!0}reduce(t,e){let i=0,s;for(e===void 0?(s=this.at(0),i++):s=e;i<this.length;i++)s=t(s,this.at(i),i,this);return s}reduceRight(t,e){let i=this.length-1,s;for(e===void 0?(s=this.at(i),i--):s=e;i>=0;i--)s=t(s,this.at(i),i,this);return s}slice(t=0,e){let i=e?Math.min(this.length,e):this.length,s=Array.from({length:i-t});for(let r=t;r<i;r++)s[r]=this.at(r);return s}join(t){return this.toArray().join(t)}toReversed(){return this.toArray().reverse()}toSorted(t){return this.toArray().sort(t)}toSpliced(t,e,...i){return this.toArray().splice(t,e,...i)}fill(t,e,i){let{length:s}=this,r=Math.max(e??0,0),o=Math.min(i??s,s);for(let a=r;a<o;a++)this.set(a,t);return this}copyWithin(t,e,i){let{length:s}=this,r=i??s,o=e<0?Math.max(s+e,0):e,a=t<0?Math.max(s+t,0):t,l=Math.min(r-o,s-a);for(let c=0;c<l;c++)this.set(a+c,this.at(o+c));return this}keys(){return Array.from({length:this.length},(t,e)=>e)[Symbol.iterator]()}values(){return this.toArray().values()}entries(){return this.toArray().entries()}flat(t){return this.toArray().flat(t)}with(t,e){return this.toArray().with(t,e)}includes(t,e){throw new Error(jr)}findLast(t,e){throw new Error(jr)}findLastIndex(t,e){throw new Error(jr)}indexOf(t,e){throw new Error(jr)}lastIndexOf(t,e){throw new Error(jr)}pop(){throw new Error(_s)}push(...t){throw new Error(_s)}reverse(){throw new Error(_s)}shift(){throw new Error(_s)}unshift(...t){throw new Error(_s)}splice(t,e,...i){throw new Error(_s)}sort(t){throw new Error(_s)}get[Symbol.unscopables](){return Array.prototype[Symbol.unscopables]}[Symbol.iterator](){return this.values()}toJSON(){return this.toArray()}toString(){return this.join(",")}toLocaleString(t,e){return this.toString()}[Symbol.toStringTag](){return"[object Array]"}static[Symbol.toStringTag](){return this._capnp.displayName}};function uo(n,t,e,i){let s;switch(n){case At.BIT:{s=e.segment.allocate(Math.ceil(t/8));break}case At.BYTE:case At.BYTE_2:case At.BYTE_4:case At.BYTE_8:case At.POINTER:{s=e.segment.allocate(t*Qs(n));break}case At.COMPOSITE:{if(i===void 0)throw new Error(qt(gx));i=fh(i);let o=wn(i)*t;s=e.segment.allocate(o+8),Bi(t,i,s);break}case At.VOID:{vs(0,n,t,e);return}default:throw new Error(qt(Va,n))}let r=An(s.segment,s.byteOffset,e);vs(r.offsetWords,n,t,r.pointer,i)}var js=class extends Le{static fromPointer(t){return Ms(jt.LIST,t,At.BYTE),this._fromPointerUnchecked(t)}static _fromPointerUnchecked(t){return new this(t.segment,t.byteOffset,t._capnp.depthLimit)}copyBuffer(t){let e=Ot(this),i=this.length,s=t.byteLength,r=t instanceof ArrayBuffer?new Uint8Array(t):new Uint8Array(t.buffer,t.byteOffset,Math.min(i,s)),o=new Uint8Array(e.segment.buffer,e.byteOffset,this.length);o.set(r),i>s&&o.fill(0,s,i)}get(t){let e=Ot(this);return e.segment.getUint8(e.byteOffset+t)}set(t,e){let i=Ot(this);i.segment.setUint8(i.byteOffset+t,e)}toArrayBuffer(){let t=Ot(this);return t.segment.buffer.slice(t.byteOffset,t.byteOffset+this.length)}toDataView(){let t=Ot(this);return new DataView(t.segment.buffer,t.byteOffset,this.length)}[Symbol.toStringTag](){return`Data_${super.toString()}`}toUint8Array(){let t=Ot(this);return new Uint8Array(t.segment.buffer,t.byteOffset,this.length)}},Rx=new TextEncoder,Px=new TextDecoder,Oi=class extends Le{static fromPointer(t){return Ms(jt.LIST,t,At.BYTE),Ix(t)}get(t=0){if(Cn(this))return"";let e=Ot(this);return Px.decode(new Uint8Array(e.segment.buffer,e.byteOffset+t,this.length-t))}get length(){return super.length-1}set(t,e){let i=Rx.encode(e),s=i.byteLength+t,r,o;if(!Cn(this)){r=Ot(this);let l=Math.min(this.length,t);o=new Uint8Array(r.segment.buffer.slice(r.byteOffset,r.byteOffset+l)),En(this)}uo(At.BYTE,s+1,this),r=Ot(this);let a=new Uint8Array(r.segment.buffer,r.byteOffset,s);o&&a.set(o),a.set(i,t)}toString(){return this.get()}toJSON(){return this.get()}[Symbol.toPrimitive](){return this.get()}[Symbol.toStringTag](){return`Text_${super.toString()}`}};function Ix(n){return new Oi(n.segment,n.byteOffset,n._capnp.depthLimit)}var Te=class extends he{static _capnp={displayName:"Struct"};constructor(t,e,i=$a,s){super(t,e,i),this._capnp.compositeIndex=s,this._capnp.compositeList=s!==void 0}static[Symbol.toStringTag](){return this._capnp.displayName}[Symbol.toStringTag](){return`Struct_${super.toString()}${this._capnp.compositeIndex===void 0?"":`,ci:${this._capnp.compositeIndex}`} > ${Ot(this).toString()}`}},ih=class extends Te{static _capnp={displayName:"AnyStruct",id:"0",size:new ve(0,0)}},eo=class{struct(){return Promise.resolve(this.structSync())}},no=class extends eo{constructor(t){super(),this.err=t}structSync(){throw this.err}pipelineCall(t,e){return this}pipelineClose(t){throw this.err}},Wa=class{constructor(t){this.err=t}call(t){return new no(this.err)}close(){throw this.err}};function Lx(n){return n??new Wa(new Error(hh))}var ee=new DataView(new ArrayBuffer(8));function Ts(n,t){if(t._capnp.compositeIndex!==void 0)throw new Error(qt(_x,t));En(t);let e=t.segment.allocate(wn(n)),i=An(e.segment,e.byteOffset,t);Bi(i.offsetWords,n,i.pointer)}function Ep(n,t,e){let i=ja(n,t,e);return Ts(t._capnp.size,i),i}function ki(n,t){let{pointerLength:e}=nr(t);if(n<0||n>=e)throw new Error(qt(bx,t,n,e))}function Ap(n,t){return Ja(er(n,t))}function Ja(n){let t=null,e=Ka(n),{capTable:i}=n.segment.message._capnp;return i&&e>=0&&e<i.length&&(t=i[e]),Lx(t)}function ho(n,t){let e=nr(t),i=Ot(t),s=t.segment.allocate(wn(n));s.segment.copyWords(s.byteOffset,i.segment,i.byteOffset,Math.min(to(e),to(n)));let r=An(s.segment,s.byteOffset,t);Bi(r.offsetWords,n,r.pointer);for(let o=0;o<Math.min(e.pointerLength,n.pointerLength);o++){let a=new he(i.segment,i.byteOffset+e.dataByteLength+o*8);if(Cn(a))continue;let l=Dn(a),c=Ot(a),u=new he(s.segment,s.byteOffset+n.dataByteLength+o*8);pn(a)===jt.LIST&&Fi(a)===At.COMPOSITE&&(c.byteOffset-=8);let f=An(c.segment,c.byteOffset,u),h=l.segment.getUint8(l.byteOffset)&3,m=l.segment.getUint32(l.byteOffset+4);f.pointer.segment.setUint32(f.pointer.byteOffset,h|f.offsetWords<<2),f.pointer.segment.setUint32(f.pointer.byteOffset+4,m)}i.segment.fillZeroWords(i.byteOffset,Js(e))}function Th(n,t){return new n(t.segment,t.byteOffset,t._capnp.depthLimit,t._capnp.compositeIndex)}function Cp(n,t,e){let i=Math.floor(n/8),s=1<<n%8;be(i,1,t);let r=Se(t),o=r.segment.getUint8(r.byteOffset+i);if(e===void 0)return(o&s)!==0;let a=e.getUint8(0);return((o^a)&s)!==0}function Rp(n,t,e){ki(n,t);let i=Vi(t);i.byteOffset+=n*8;let s=new js(i.segment,i.byteOffset,t._capnp.depthLimit-1);return Cn(s)&&(e?cn(e,s):uo(At.BYTE,0,s)),s}function Se(n){return Ot(n)}function Pp(n,t,e){be(n,4,t);let i=Se(t);if(e===void 0)return i.segment.getFloat32(i.byteOffset+n);let s=i.segment.getUint32(i.byteOffset+n)^e.getUint32(0,!0);return ee.setUint32(0,s,zt),ee.getFloat32(0,zt)}function Ip(n,t,e){be(n,8,t);let i=Se(t);if(e!==void 0){let s=i.segment.getUint32(i.byteOffset+n)^e.getUint32(0,!0),r=i.segment.getUint32(i.byteOffset+n+4)^e.getUint32(4,!0);return ee.setUint32(0,s,zt),ee.setUint32(4,r,zt),ee.getFloat64(0,zt)}return i.segment.getFloat64(i.byteOffset+n)}function Lp(n,t,e){be(n,2,t);let i=Se(t);if(e===void 0)return i.segment.getInt16(i.byteOffset+n);let s=i.segment.getUint16(i.byteOffset+n)^e.getUint16(0,!0);return ee.setUint16(0,s,zt),ee.getInt16(0,zt)}function Np(n,t,e){be(n,4,t);let i=Se(t);if(e===void 0)return i.segment.getInt32(i.byteOffset+n);let s=i.segment.getUint32(i.byteOffset+n)^e.getUint16(0,!0);return ee.setUint32(0,s,zt),ee.getInt32(0,zt)}function Up(n,t,e){be(n,8,t);let i=Se(t);if(e!==void 0){let s=i.segment.getUint32(i.byteOffset+n)^e.getUint32(0,!0),r=i.segment.getUint32(i.byteOffset+n+4)^e.getUint32(4,!0);return ee.setUint32(zt?0:4,s,zt),ee.setUint32(zt?4:0,r,zt),ee.getBigInt64(0,zt)}return i.segment.getInt64(i.byteOffset+n)}function Dp(n,t,e){be(n,1,t);let i=Se(t);if(e===void 0)return i.segment.getInt8(i.byteOffset+n);let s=i.segment.getUint8(i.byteOffset+n)^e.getUint8(0);return ee.setUint8(0,s),ee.getInt8(0)}function Op(n,t,e,i){ki(n,e);let s=Vi(e);s.byteOffset+=n*8;let r=new t(s.segment,s.byteOffset,e._capnp.depthLimit-1);if(Cn(r))i?cn(i,r):uo(t._capnp.size,0,r,t._capnp.compositeSize);else if(t._capnp.compositeSize!==void 0){let o=co(r),a=t._capnp.compositeSize;if(a.dataByteLength>o.dataByteLength||a.pointerLength>o.pointerLength){let l=Ot(r),c=bs(r),u=r.segment.allocate(wn(a)*c+8),f=An(u.segment,u.byteOffset,r);vs(f.offsetWords,t._capnp.size,c,f.pointer,a),Bi(c,a,u),u.byteOffset+=8;for(let h=0;h<c;h++){let m=l.byteOffset+h*wn(o),_=u.byteOffset+h*wn(a);u.segment.copyWords(_,l.segment,m,Js(o));for(let S=0;S<o.pointerLength;S++){let p=new he(l.segment,m+o.dataByteLength+S*8),d=new he(u.segment,_+a.dataByteLength+S*8),M=Dn(p),P=Ot(p);pn(p)===jt.LIST&&Fi(p)===At.COMPOSITE&&(P.byteOffset-=8);let b=An(P.segment,P.byteOffset,d),E=M.segment.getUint8(M.byteOffset)&3,w=M.segment.getUint32(M.byteOffset+4);b.pointer.segment.setUint32(b.pointer.byteOffset,E|b.offsetWords<<2),b.pointer.segment.setUint32(b.pointer.byteOffset+4,w)}}l.segment.fillZeroWords(l.byteOffset,Js(o)*c)}}return r}function er(n,t){ki(n,t);let e=Vi(t);return e.byteOffset+=n*8,new he(e.segment,e.byteOffset,t._capnp.depthLimit-1)}function ja(n,t,e){ki(n,e);let i=Vi(e);return i.byteOffset+=n*8,new t(i.segment,i.byteOffset,e._capnp.depthLimit-1)}function Vi(n){let t=Ot(n);return t.byteOffset+=an(nr(n).dataByteLength),t}function nr(n){if(n._capnp.compositeIndex!==void 0){let t=Ot(n,!0);return t.byteOffset-=8,Ss(t)}return mi(n)}function Fp(n,t,e,i){let s=ja(n,t,e);if(Cn(s))i?cn(i,s):Ts(t._capnp.size,s);else{Ms(jt.STRUCT,s);let r=mi(s);(r.dataByteLength<t._capnp.size.dataByteLength||r.pointerLength<t._capnp.size.pointerLength)&&ho(t._capnp.size,s)}return s}function Bp(n,t,e){let i=Oi.fromPointer(er(n,t));return Cn(i)&&e&&i.set(0,e),i.get(0)}function kp(n,t,e){be(n,2,t);let i=Se(t);return e===void 0?i.segment.getUint16(i.byteOffset+n):i.segment.getUint16(i.byteOffset+n)^e.getUint16(0,!0)}function Vp(n,t,e){be(n,4,t);let i=Se(t);return e===void 0?i.segment.getUint32(i.byteOffset+n):i.segment.getUint32(i.byteOffset+n)^e.getUint32(0,!0)}function zp(n,t,e){be(n,8,t);let i=Se(t);if(e!==void 0){let s=i.segment.getUint32(i.byteOffset+n)^e.getUint32(0,!0),r=i.segment.getUint32(i.byteOffset+n+4)^e.getUint32(4,!0);return ee.setUint32(zt?0:4,s,zt),ee.setUint32(zt?4:0,r,zt),ee.getBigUint64(0,zt)}return i.segment.getUint64(i.byteOffset+n)}function Gp(n,t,e){be(n,1,t);let i=Se(t);return e===void 0?i.segment.getUint8(i.byteOffset+n):i.segment.getUint8(i.byteOffset+n)^e.getUint8(0)}function Hp(n,t,e){ki(n,e);let i=Vi(e);i.byteOffset+=n*8;let s=new js(i.segment,i.byteOffset,e._capnp.depthLimit-1);return En(s),uo(At.BYTE,t,s),s}function Wp(n,t,e,i){ki(n,i);let s=Vi(i);s.byteOffset+=n*8;let r=new t(s.segment,s.byteOffset,i._capnp.depthLimit-1);return En(r),uo(t._capnp.size,e,r,t._capnp.compositeSize),r}function $p(n,t,e,i){let s=Math.floor(n/8),r=1<<n%8;be(s,1,e);let o=Se(e),a=o.segment.getUint8(o.byteOffset+s);i!==void 0&&(t=(i.getUint8(0)&r)===0?t:!t),o.segment.setUint8(o.byteOffset+s,t?a|r:a&~r)}function Xp(n,t,e,i){be(n,4,e);let s=Se(e);if(i!==void 0){ee.setFloat32(0,t,zt);let r=ee.getUint32(0,zt)^i.getUint32(0,!0);s.segment.setUint32(s.byteOffset+n,r);return}s.segment.setFloat32(s.byteOffset+n,t)}function qp(n,t,e,i){be(n,8,e);let s=Se(e);if(i!==void 0){ee.setFloat64(0,t,zt);let r=ee.getUint32(0,zt)^i.getUint32(0,!0),o=ee.getUint32(4,zt)^i.getUint32(4,!0);s.segment.setUint32(s.byteOffset+n,r),s.segment.setUint32(s.byteOffset+n+4,o);return}s.segment.setFloat64(s.byteOffset+n,t)}function Yp(n,t,e,i){be(n,2,e);let s=Se(e);if(i!==void 0){ee.setInt16(0,t,zt);let r=ee.getUint16(0,zt)^i.getUint16(0,!0);s.segment.setUint16(s.byteOffset+n,r);return}s.segment.setInt16(s.byteOffset+n,t)}function Zp(n,t,e,i){be(n,4,e);let s=Se(e);if(i!==void 0){ee.setInt32(0,t,zt);let r=ee.getUint32(0,zt)^i.getUint32(0,!0);s.segment.setUint32(s.byteOffset+n,r);return}s.segment.setInt32(s.byteOffset+n,t)}function Kp(n,t,e,i){be(n,8,e);let s=Se(e);if(i!==void 0){ee.setBigInt64(0,t,zt);let r=ee.getUint32(zt?0:4,zt)^i.getUint32(0,!0),o=ee.getUint32(zt?4:0,zt)^i.getUint32(4,!0);s.segment.setUint32(s.byteOffset+n,r),s.segment.setUint32(s.byteOffset+n+4,o);return}s.segment.setInt64(s.byteOffset+n,t)}function Jp(n,t,e,i){be(n,1,e);let s=Se(e);if(i!==void 0){ee.setInt8(0,t);let r=ee.getUint8(0)^i.getUint8(0);s.segment.setUint8(s.byteOffset+n,r);return}s.segment.setInt8(s.byteOffset+n,t)}function jp(n,t,e){Oi.fromPointer(er(n,e)).set(0,t)}function Qp(n,t,e,i){be(n,2,e);let s=Se(e);i!==void 0&&(t^=i.getUint16(0,!0)),s.segment.setUint16(s.byteOffset+n,t)}function tm(n,t,e,i){be(n,4,e);let s=Se(e);i!==void 0&&(t^=i.getUint32(0,!0)),s.segment.setUint32(s.byteOffset+n,t)}function em(n,t,e,i){be(n,8,e);let s=Se(e);if(i!==void 0){ee.setBigUint64(0,t,zt);let r=ee.getUint32(zt?0:4,zt)^i.getUint32(0,!0),o=ee.getUint32(zt?4:0,zt)^i.getUint32(4,!0);s.segment.setUint32(s.byteOffset+n,r),s.segment.setUint32(s.byteOffset+n+4,o);return}s.segment.setUint64(s.byteOffset+n,t)}function nm(n,t,e,i){be(n,1,e);let s=Se(e);i!==void 0&&(t^=i.getUint8(0)),s.segment.setUint8(s.byteOffset+n,t)}function im(n,t,e,i){if(t!==e)throw new Error(qt(yx,i,n,t,e))}function be(n,t,e){let{dataByteLength:i}=nr(e);if(n<0||t<0||n+t>i)throw new Error(qt(Sx,e,t,n,i))}var On=(n=>(n[n.SINGLE_SEGMENT=0]="SINGLE_SEGMENT",n[n.MULTI_SEGMENT=1]="MULTI_SEGMENT",n))(On||{}),Qa=class{buffer;id;constructor(t,e){this.id=t,this.buffer=e}},ws=class{constructor(t=[new ArrayBuffer(io)]){this.buffers=t;let e=t.length;for(;--e>=0;)if((t[e].byteLength&7)!==0)throw new Error(qt(uh,t[e].byteLength))}static allocate=Nx;static getBuffer=Ux;static getNumSegments=sm;kind=On.MULTI_SEGMENT;toString(){return qt("MultiSegmentArena_segments:%d",sm(this))}};function Nx(n,t){let e=new ArrayBuffer(an(Math.max(n,io)));return t.buffers.push(e),new Qa(t.buffers.length-1,e)}function Ux(n,t){if(n<0||n>=t.buffers.length)throw new Error(qt(yp,n));return t.buffers[n]}function sm(n){return n.buffers.length}var zi=class{static allocate=Dx;static getBuffer=Ox;static getNumSegments=Fx;buffer;kind=On.SINGLE_SEGMENT;constructor(t=new ArrayBuffer(io)){if((t.byteLength&7)!==0)throw new Error(qt(uh,t.byteLength));this.buffer=t}toString(){return qt("SingleSegmentArena_len:%x",this.buffer.byteLength)}};function Dx(n,t,e){let i=t.length>0?t[0].buffer:e.buffer;return n=n<sh?sh:an(n),e.buffer=new ArrayBuffer(i.byteLength+n),new Float64Array(e.buffer).set(new Float64Array(i)),new Qa(0,e.buffer)}function Ox(n,t){if(n!==0)throw new Error(qt(xp,n));return t.buffer}function Fx(){return 1}var gi=class{static allocate=Bx;static copy=kx;static getBuffer=Vx;static getNumSegments=zx};function Bx(n,t,e){switch(e.kind){case On.MULTI_SEGMENT:return ws.allocate(n,e);case On.SINGLE_SEGMENT:return zi.allocate(n,t,e);default:return ro(e)}}function kx(n){switch(n.kind){case On.MULTI_SEGMENT:{let t=n.buffers.length,e=Array.from({length:t});for(;--t>=0;)e[t]=n.buffers[t].slice(0);return new ws(e)}case On.SINGLE_SEGMENT:return new zi(n.buffer.slice(0));default:return ro(n)}}function Vx(n,t){switch(t.kind){case On.MULTI_SEGMENT:return ws.getBuffer(n,t);case On.SINGLE_SEGMENT:return zi.getBuffer(n,t);default:return ro(t)}}function zx(n){switch(n.kind){case On.MULTI_SEGMENT:return ws.getNumSegments(n);case On.SINGLE_SEGMENT:return zi.getNumSegments();default:return ro(n)}}function Gx(n){let t=n-(n>>1&1431655765);return t=(t&858993459)+(t>>2&858993459),(t+(t>>4)&252645135)*16843009>>24}function Hx(n,t,e,i,s,r,o,a){return(n===0?0:1)|(t===0?0:2)|(e===0?0:4)|(i===0?0:8)|(s===0?0:16)|(r===0?0:32)|(o===0?0:64)|(a===0?0:128)}function Wx(n){let t=new Uint8Array(n),e=0,i=119;for(let s=0;s<t.byteLength;){let r=t[s];i===0?(e+=r,s++,i=119):i===255?(e+=r,s+=r*8+1,i=119):(e++,s+=Gx(r)+1,i=r)}return e*8}function $x(n,t,e,i,s,r,o,a){return(n===0?1:0)+(t===0?1:0)+(e===0?1:0)+(i===0?1:0)+(s===0?1:0)+(r===0?1:0)+(o===0?1:0)+(a===0?1:0)}function rm(n,t=0,e){if(n.byteLength%8!==0)throw new Error(_p);let i=new Uint8Array(n,t,e),s=[],r=119,o=0,a=0;for(let l=0;l<i.byteLength;l+=8){let c=i[l],u=i[l+1],f=i[l+2],h=i[l+3],m=i[l+4],_=i[l+5],S=i[l+6],p=i[l+7],d=Hx(c,u,f,h,m,_,S,p),M=!0;switch(r){case 0:{d!==0||a>=255?(s.push(a),a=0,M=!1):a++;break}case 255:{$x(c,u,f,h,m,_,S,p)>=mp||a>=255?(s[o]=a,a=0,M=!1):(s.push(c,u,f,h,m,_,S,p),a++);break}default:{M=!1;break}}M||(s.push(d),r=d,c!==0&&s.push(c),u!==0&&s.push(u),f!==0&&s.push(f),h!==0&&s.push(h),m!==0&&s.push(m),_!==0&&s.push(_),S!==0&&s.push(S),p!==0&&s.push(p),d===255&&(o=s.length,s.push(0)))}return r===0?s.push(a):r===255&&(s[o]=a),new Uint8Array(s).buffer}function Xx(n){let t=new Uint8Array(n),e=new Uint8Array(new ArrayBuffer(Wx(n))),i=119;for(let s=0,r=0;s<t.byteLength;){let o=t[s];if(i===0)r+=o*8,s++,i=119;else if(i===255){let a=o*8;e.set(t.subarray(s+1,s+1+a),r),r+=a,s+=1+a,i=119}else{s++;for(let a=1;a<=128;a<<=1)(o&a)!==0&&(e[r]=t[s++]),r++;i=o}}return e.buffer}var fo=class{constructor(t,e,i,s=0){this.id=t,this.message=e,this.message=e,this.buffer=i,this._dv=new DataView(i),this.byteOffset=0,this.byteLength=s}buffer;byteLength;byteOffset;[Symbol.toStringTag]="Segment";_dv;allocate(t){let e=this;if(t=an(t),t>rh-8)throw new Error(qt(Sp,t));e.hasCapacity(t)||(e=e.message.allocateSegment(t));let i=e.byteLength;return e.byteLength+=t,new he(e,i)}copyWord(t,e,i){let s=e._dv.getFloat64(i,zt);this._dv.setFloat64(t,s,zt)}copyWords(t,e,i,s){let r=new Float64Array(this.buffer,t,s),o=new Float64Array(e.buffer,i,s);r.set(o)}fillZeroWords(t,e){new Float64Array(this.buffer,t,e).fill(0)}getBigInt64(t,e){return this._dv.getBigInt64(t,e)}getBigUint64(t,e){return this._dv.getBigUint64(t,e)}getCapacity(){return this.buffer.byteLength}getFloat16(t){throw new Error("Not implemented")}getFloat32(t){return this._dv.getFloat32(t,!0)}getFloat64(t){return this._dv.getFloat64(t,!0)}getInt16(t){return this._dv.getInt16(t,!0)}getInt32(t){return this._dv.getInt32(t,!0)}getInt64(t){return this._dv.getBigInt64(t,!0)}getInt8(t){return this._dv.getInt8(t)}getUint16(t){return this._dv.getUint16(t,!0)}getUint32(t){return this._dv.getUint32(t,!0)}getUint64(t){return this._dv.getBigUint64(t,!0)}getUint8(t){return this._dv.getUint8(t)}hasCapacity(t){return this.buffer.byteLength-this.byteLength>=t}isWordZero(t){return this._dv.getFloat64(t,zt)===0}replaceBuffer(t){if(this.buffer!==t){if(t.byteLength<this.byteLength)throw new Error(vp);this._dv=new DataView(t),this.buffer=t}}setBigInt64(t,e,i){this._dv.setBigInt64(t,e,i)}setBigUint64(t,e,i){this._dv.setBigUint64(t,e,i)}setFloat16(t,e){throw new Error("Not implemented")}setFloat32(t,e){this._dv.setFloat32(t,e,!0)}setFloat64(t,e){this._dv.setFloat64(t,e,!0)}setInt16(t,e){this._dv.setInt16(t,e,!0)}setInt32(t,e){this._dv.setInt32(t,e,!0)}setInt8(t,e){this._dv.setInt8(t,e)}setInt64(t,e){this._dv.setBigInt64(t,e,!0)}setUint16(t,e){this._dv.setUint16(t,e,!0)}setUint32(t,e){this._dv.setUint32(t,e,!0)}setUint64(t,e){this._dv.setBigUint64(t,e,!0)}setUint8(t,e){this._dv.setUint8(t,e)}setWordZero(t){this._dv.setFloat64(t,0,zt)}toString(){return qt("Segment_id:%d,off:%a,len:%a,cap:%a",this.id,this.byteLength,this.byteOffset,this.buffer.byteLength)}},Es=class{static allocateSegment=wh;static dump=om;static getRoot=am;static getSegment=Eh;static initRoot=cm;static readRawPointer=jx;static toArrayBuffer=lm;static toPackedArrayBuffer=um;_capnp;constructor(t,e=!0,i=!1){this._capnp=qx(t,e,i),t&&Zx(this)}allocateSegment(t){return wh(t,this)}copy(){return ty(this)}dump(){return om(this)}getRoot(t){return am(t,this)}getSegment(t){return Eh(t,this)}initRoot(t){return cm(t,this)}setRoot(t){Qx(t,this)}toArrayBuffer(){return lm(this)}toPackedArrayBuffer(){return um(this)}addCap(t){this._capnp.capTable||(this._capnp.capTable=[]);let e=this._capnp.capTable.length;return this._capnp.capTable.push(t),e}toString(){return`Message_arena:${this._capnp.arena}`}};function qx(n,t=!0,e=!1){if(n===void 0)return{arena:new zi,segments:[],traversalLimit:so};if(Jx(n))return{arena:n,segments:[],traversalLimit:so};let i=n;return Kx(i)&&(i=i.buffer.slice(i.byteOffset,i.byteOffset+i.byteLength)),t&&(i=Xx(i)),e?{arena:new zi(i),segments:[],traversalLimit:so}:{arena:new ws(Yx(i)),segments:[],traversalLimit:so}}function Yx(n){let t=new DataView(n),e=t.getUint32(0,!0)+1,i=Array.from({length:e}),s=4+e*4;if(s+=s%8,s+e*4>n.byteLength)throw new Error(oh);for(let r=0;r<e;r++){let o=t.getUint32(4+r*4,!0)*8;if(s+o>n.byteLength)throw new Error(oh);i[r]=n.slice(s,s+o),s+=o}return i}function Zx(n){let t=gi.getNumSegments(n._capnp.arena);n._capnp.segments=Array.from({length:t});for(let e=0;e<t;e++){if(e===0&&gi.getBuffer(e,n._capnp.arena).byteLength<8)throw new Error(ch);let i=gi.getBuffer(e,n._capnp.arena),s=new fo(e,n,i,i.byteLength);n._capnp.segments[e]=s}}function Kx(n){return n.byteOffset!==void 0}function Jx(n){return n.kind!==void 0}function wh(n,t){let e=gi.allocate(n,t._capnp.segments,t._capnp.arena),i;if(e.id===t._capnp.segments.length)i=new fo(e.id,t,e.buffer),t._capnp.segments.push(i);else{if(e.id<0||e.id>t._capnp.segments.length)throw new Error(qt(ah,e.id,t));i=t._capnp.segments[e.id],i.replaceBuffer(e.buffer)}return i}function om(n){let t="";if(n._capnp.segments.length===0)return`================
No Segments
================
`;for(let e=0;e<n._capnp.segments.length;e++){t+=`================
Segment #${e}
================
`;let{buffer:i,byteLength:s}=n._capnp.segments[e],r=new Uint8Array(i,0,s);t+=bp(r)}return t}function am(n,t){let e=new n(t.getSegment(0),0);Ms(jt.STRUCT,e);let i=mi(e);return(i.dataByteLength<n._capnp.size.dataByteLength||i.pointerLength<n._capnp.size.pointerLength)&&ho(n._capnp.size,e),e}function Eh(n,t){let e=t._capnp.segments.length;if(n===0&&e===0){if(gi.getNumSegments(t._capnp.arena)===0?wh(io,t):t._capnp.segments[0]=new fo(0,t,gi.getBuffer(0,t._capnp.arena)),!t._capnp.segments[0].hasCapacity(8))throw new Error(ch);return t._capnp.segments[0].allocate(8),t._capnp.segments[0]}if(n<0||n>=e)throw new Error(qt(ah,n,t));return t._capnp.segments[n]}function cm(n,t){let e=new n(t.getSegment(0),0);return Ts(n._capnp.size,e),e}function jx(n){return new he(new Es(n).getSegment(0),0)}function Qx(n,t){cn(n,new he(t.getSegment(0),0))}function lm(n){let t=hm(n);n._capnp.segments.length===0&&Eh(0,n);let{segments:e}=n._capnp,i=t.byteLength+e.reduce((o,a)=>o+an(a.byteLength),0),s=new Uint8Array(new ArrayBuffer(i)),r=t.byteLength;s.set(new Uint8Array(t));for(let o of e){let a=an(o.byteLength);s.set(new Uint8Array(o.buffer,0,a),r),r+=a}return s.buffer}function um(n){let t=rm(hm(n));n._capnp.segments.length===0&&n.getSegment(0);let e=n._capnp.segments.map(o=>rm(o.buffer,0,an(o.byteLength))),i=t.byteLength+e.reduce((o,a)=>o+a.byteLength,0),s=new Uint8Array(new ArrayBuffer(i)),r=t.byteLength;s.set(new Uint8Array(t));for(let o of e)s.set(new Uint8Array(o),r),r+=o.byteLength;return s.buffer}function hm(n){let{length:t}=n._capnp.segments;if(t===0)return new Float64Array(1).buffer;let e=4+t*4+(1-t%2)*4,i=new DataView(new ArrayBuffer(e));i.setUint32(0,t-1,!0);for(let[s,r]of n._capnp.segments.entries())i.setUint32(s*4+4,r.byteLength/8,!0);return i.buffer}function ty(n){return new Es(gi.copy(n._capnp.arena))}function ir(n){return class extends Le{static _capnp={compositeSize:n._capnp.size,displayName:`List<${n._capnp.displayName}>`,size:At.COMPOSITE};get(t){return new n(this.segment,this.byteOffset,this._capnp.depthLimit-1,t)}set(t,e){cn(e,this.get(t))}[Symbol.toStringTag](){return`Composite_${super.toString()},cls:${n.toString()}`}}}function Qn(n,t){return e=>{let i=new DataView(new ArrayBuffer(n));return t.call(i,0,e,!0),i}}var ey=Qn(4,DataView.prototype.setFloat32),ny=Qn(8,DataView.prototype.setFloat64),iy=Qn(2,DataView.prototype.setInt16),sy=Qn(4,DataView.prototype.setInt32),ry=Qn(8,DataView.prototype.setBigInt64),oy=Qn(1,DataView.prototype.setInt8),tc=Qn(2,DataView.prototype.setUint16),ay=Qn(4,DataView.prototype.setUint32),Ah=Qn(8,DataView.prototype.setBigUint64),cy=Qn(1,DataView.prototype.setUint8);var po=class extends he{static _capnp={displayName:"Interface"};static getCapID=Ch;static getAsInterface=fm;static isInterface=uy;static getClient=dm;constructor(t,e,i=$a){super(t,e,i)}static fromPointer(t){return fm(t)}getCapId(){return Ch(this)}getClient(){return dm(this)}[Symbol.for("nodejs.util.inspect.custom")](){return qt("Interface_%d@%a,%d,limit:%x",this.segment.id,this.byteOffset,this.getCapId(),this._capnp.depthLimit)}};function fm(n){return pn(n)===jt.OTHER?new po(n.segment,n.byteOffset,n._capnp.depthLimit):null}function uy(n){return pn(n)===jt.OTHER}function Ch(n){return n.segment.getUint32(n.byteOffset)!==jt.OTHER?-1:n.segment.getUint32(n.byteOffset+4)}function dm(n){let t=Ch(n),{capTable:e}=n.segment.message._capnp;return e?e[t]:null}var Rh=class extends Te{static _capnp={displayName:"Void",id:"0",size:new ve(0,0)}},y={__proto__:null,PointerAllocationResult:xs,add:Ha,adopt:Mp,checkDataBounds:be,checkPointerBounds:ki,copyFrom:cn,copyFromInterface:vh,copyFromList:Sh,copyFromStruct:bh,disown:Tp,dump:dh,erase:En,erasePointer:oo,followFar:ao,followFars:Dn,getAs:Th,getBit:Cp,getCapabilityId:mh,getContent:Ot,getData:Rp,getDataSection:Se,getFarSegmentId:gh,getFloat32:Pp,getFloat64:Ip,getInt16:Lp,getInt32:Np,getInt64:Up,getInt8:Dp,getInterfaceClientOrNull:Ja,getInterfaceClientOrNullAt:Ap,getInterfacePointer:Ka,getList:Op,getListByteLength:ph,getListElementByteLength:Qs,getListElementSize:qa,getListLength:_h,getOffsetWords:ys,getPointer:er,getPointerAs:ja,getPointerSection:Vi,getPointerType:tr,getSize:nr,getStruct:Fp,getStructDataWords:xh,getStructPointerLength:yh,getStructSize:Ss,getTargetCompositeListSize:co,getTargetCompositeListTag:Ya,getTargetListElementSize:Fi,getTargetListLength:bs,getTargetPointerType:pn,getTargetStructSize:mi,getText:Bp,getUint16:kp,getUint32:Vp,getUint64:zp,getUint8:Gp,initData:Hp,initList:Wp,initPointer:An,initStruct:Ts,initStructAt:Ep,isDoubleFar:lo,isNull:Cn,relocateTo:wp,resize:ho,setBit:$p,setFarPointer:Qr,setFloat32:Xp,setFloat64:qp,setInt16:Yp,setInt32:Zp,setInt64:Kp,setInt8:Jp,setInterfacePointer:Za,setListPointer:vs,setStructPointer:Bi,setText:jp,setUint16:Qp,setUint32:tm,setUint64:em,setUint8:nm,testWhich:im,trackPointerAllocation:Mh,validate:Ms};function ec(n){return class extends Le{static _capnp={displayName:`List<${n._capnp.displayName}>`,size:At.POINTER};get(t){let e=Ot(this);return new n(e.segment,e.byteOffset+t*8,this._capnp.depthLimit-1)}set(t,e){cn(e,this.get(t))}[Symbol.toStringTag](){return`Pointer_${super.toString()},cls:${n.toString()}`}}}var lA=ec(he),pm=class extends Le{static _capnp={displayName:"List<boolean>",size:At.BIT};get(t){let e=1<<t%8,i=t>>>3,s=Ot(this);return(s.segment.getUint8(s.byteOffset+i)&e)!==0}set(t,e){let i=1<<t%8,s=Ot(this),r=s.byteOffset+(t>>>3),o=s.segment.getUint8(r);s.segment.setUint8(r,e?o|i:o&~i)}[Symbol.toStringTag](){return`Bool_${super.toString()}`}},Ph=ec(js),mm=class extends Le{static _capnp={displayName:"List<Float32>",size:At.BYTE_4};get(t){let e=Ot(this);return e.segment.getFloat32(e.byteOffset+t*4)}set(t,e){let i=Ot(this);i.segment.setFloat32(i.byteOffset+t*4,e)}[Symbol.toStringTag](){return`Float32_${super.toString()}`}},gm=class extends Le{static _capnp={displayName:"List<Float64>",size:At.BYTE_8};get(t){let e=Ot(this);return e.segment.getFloat64(e.byteOffset+t*8)}set(t,e){let i=Ot(this);i.segment.setFloat64(i.byteOffset+t*8,e)}[Symbol.toStringTag](){return`Float64_${super.toString()}`}},_m=class extends Le{static _capnp={displayName:"List<Int8>",size:At.BYTE};get(t){let e=Ot(this);return e.segment.getInt8(e.byteOffset+t)}set(t,e){let i=Ot(this);i.segment.setInt8(i.byteOffset+t,e)}[Symbol.toStringTag](){return`Int8_${super.toString()}`}},xm=class extends Le{static _capnp={displayName:"List<Int16>",size:At.BYTE_2};get(t){let e=Ot(this);return e.segment.getInt16(e.byteOffset+t*2)}set(t,e){let i=Ot(this);i.segment.setInt16(i.byteOffset+t*2,e)}[Symbol.toStringTag](){return`Int16_${super.toString()}`}},ym=class extends Le{static _capnp={displayName:"List<Int32>",size:At.BYTE_4};get(t){let e=Ot(this);return e.segment.getInt32(e.byteOffset+t*4)}set(t,e){let i=Ot(this);i.segment.setInt32(i.byteOffset+t*4,e)}[Symbol.toStringTag](){return`Int32_${super.toString()}`}},vm=class extends Le{static _capnp={displayName:"List<Int64>",size:At.BYTE_8};get(t){let e=Ot(this);return e.segment.getInt64(e.byteOffset+t*8)}set(t,e){let i=Ot(this);i.segment.setInt64(i.byteOffset+t*8,e)}[Symbol.toStringTag](){return`Int64_${super.toString()}`}},uA=ec(po),Sm=class extends Le{static _capnp={displayName:"List<Text>",size:At.POINTER};get(t){let e=Ot(this);return e.byteOffset+=t*8,Oi.fromPointer(e).get(0)}set(t,e){let i=Ot(this);i.byteOffset+=t*8,Oi.fromPointer(i).set(0,e)}[Symbol.toStringTag](){return`Text_${super.toString()}`}},bm=class extends Le{static _capnp={displayName:"List<Uint8>",size:At.BYTE};get(t){let e=Ot(this);return e.segment.getUint8(e.byteOffset+t)}set(t,e){let i=Ot(this);i.segment.setUint8(i.byteOffset+t,e)}[Symbol.toStringTag](){return`Uint8_${super.toString()}`}},Mm=class extends Le{static _capnp={displayName:"List<Uint16>",size:At.BYTE_2};get(t){let e=Ot(this);return e.segment.getUint16(e.byteOffset+t*2)}set(t,e){let i=Ot(this);i.segment.setUint16(i.byteOffset+t*2,e)}[Symbol.toStringTag](){return`Uint16_${super.toString()}`}},Tm=class extends Le{static _capnp={displayName:"List<Uint32>",size:At.BYTE_4};get(t){let e=Ot(this);return e.segment.getUint32(e.byteOffset+t*4)}set(t,e){let i=Ot(this);i.segment.setUint32(i.byteOffset+t*4,e)}[Symbol.toStringTag](){return`Uint32_${super.toString()}`}},wm=class extends Le{static _capnp={displayName:"List<Uint64>",size:At.BYTE_8};get(t){let e=Ot(this);return e.segment.getUint64(e.byteOffset+t*8)}set(t,e){let i=Ot(this);i.segment.setUint64(i.byteOffset+t*8,e)}[Symbol.toStringTag](){return`Uint64_${super.toString()}`}},hA=ec(Rh);var fA=globalThis.FinalizationRegistry?new FinalizationRegistry(n=>n()):void 0;var Gi={NULL:0,BOOLEAN:1,UNSIGNED:2,SIGNED:3,REAL:4,TEXT:5,LIST:6,OBJECT:7},_i=class n extends Te{static NULL=Gi.NULL;static BOOLEAN=Gi.BOOLEAN;static UNSIGNED=Gi.UNSIGNED;static SIGNED=Gi.SIGNED;static REAL=Gi.REAL;static TEXT=Gi.TEXT;static LIST=Gi.LIST;static OBJECT=Gi.OBJECT;static _capnp={displayName:"Value",id:"84204ba503002dff",size:new ve(16,1)};static _List;static _Object;get _isNull(){return y.getUint16(0,this)===0}set null(t){y.setUint16(0,0,this)}get boolean(){return y.testWhich("boolean",y.getUint16(0,this),1,this),y.getBit(16,this)}get _isBoolean(){return y.getUint16(0,this)===1}set boolean(t){y.setUint16(0,1,this),y.setBit(16,t,this)}get unsigned(){return y.testWhich("unsigned",y.getUint16(0,this),2,this),y.getUint64(8,this)}get _isUnsigned(){return y.getUint16(0,this)===2}set unsigned(t){y.setUint16(0,2,this),y.setUint64(8,t,this)}get signed(){return y.testWhich("signed",y.getUint16(0,this),3,this),y.getInt64(8,this)}get _isSigned(){return y.getUint16(0,this)===3}set signed(t){y.setUint16(0,3,this),y.setInt64(8,t,this)}get real(){return y.testWhich("real",y.getUint16(0,this),4,this),y.getFloat64(8,this)}get _isReal(){return y.getUint16(0,this)===4}set real(t){y.setUint16(0,4,this),y.setFloat64(8,t,this)}get text(){return y.testWhich("text",y.getUint16(0,this),5,this),y.getText(0,this)}get _isText(){return y.getUint16(0,this)===5}set text(t){y.setUint16(0,5,this),y.setText(0,t,this)}_adoptList(t){y.setUint16(0,6,this),y.adopt(t,y.getPointer(0,this))}_disownList(){return y.disown(this.list)}get list(){return y.testWhich("list",y.getUint16(0,this),6,this),y.getList(0,n._List,this)}_hasList(){return!y.isNull(y.getPointer(0,this))}_initList(t){return y.setUint16(0,6,this),y.initList(0,n._List,t,this)}get _isList(){return y.getUint16(0,this)===6}set list(t){y.setUint16(0,6,this),y.copyFrom(t,y.getPointer(0,this))}_adoptObject(t){y.setUint16(0,7,this),y.adopt(t,y.getPointer(0,this))}_disownObject(){return y.disown(this.object)}get object(){return y.testWhich("object",y.getUint16(0,this),7,this),y.getList(0,n._Object,this)}_hasObject(){return!y.isNull(y.getPointer(0,this))}_initObject(t){return y.setUint16(0,7,this),y.initList(0,n._Object,t,this)}get _isObject(){return y.getUint16(0,this)===7}set object(t){y.setUint16(0,7,this),y.copyFrom(t,y.getPointer(0,this))}toString(){return"Value_"+super.toString()}which(){return y.getUint16(0,this)}},Ih=class extends Te{static _capnp={displayName:"Field",id:"bb1b82dd55e9401c",size:new ve(0,2)};get key(){return y.getText(0,this)}set key(t){y.setText(0,t,this)}_adoptValue(t){y.adopt(t,y.getPointer(1,this))}_disownValue(){return y.disown(this.value)}get value(){return y.getStruct(1,_i,this)}_hasValue(){return!y.isNull(y.getPointer(1,this))}_initValue(){return y.initStructAt(1,_i,this)}set value(t){y.copyFrom(t,y.getPointer(1,this))}toString(){return"Field_"+super.toString()}},Lh=class n extends Te{static _capnp={displayName:"RecoveryRequest",id:"d06103d1077dba1d",size:new ve(16,2)};static _Cases;get id(){return y.getUint64(0,this)}set id(t){y.setUint64(0,t,this)}_adoptCases(t){y.adopt(t,y.getPointer(0,this))}_disownCases(){return y.disown(this.cases)}get cases(){return y.getList(0,n._Cases,this)}_hasCases(){return!y.isNull(y.getPointer(0,this))}_initCases(t){return y.initList(0,n._Cases,t,this)}set cases(t){y.copyFrom(t,y.getPointer(0,this))}_adoptPacked(t){y.adopt(t,y.getPointer(1,this))}_disownPacked(){return y.disown(this.packed)}get packed(){return y.getData(1,this)}_hasPacked(){return!y.isNull(y.getPointer(1,this))}_initPacked(t){return y.initData(1,t,this)}set packed(t){y.copyFrom(t,y.getPointer(1,this))}get count(){return y.getUint32(8,this)}set count(t){y.setUint32(8,t,this)}get packedResults(){return y.getBit(96,this)}set packedResults(t){y.setBit(96,t,this)}toString(){return"RecoveryRequest_"+super.toString()}},Nh=class extends Te{static _capnp={displayName:"RecoveryInput",id:"aa5fb33a100b69c0",size:new ve(8,2)};_adoptDigest(t){y.adopt(t,y.getPointer(0,this))}_disownDigest(){return y.disown(this.digest)}get digest(){return y.getData(0,this)}_hasDigest(){return!y.isNull(y.getPointer(0,this))}_initDigest(t){return y.initData(0,t,this)}set digest(t){y.copyFrom(t,y.getPointer(0,this))}_adoptSignature(t){y.adopt(t,y.getPointer(1,this))}_disownSignature(){return y.disown(this.signature)}get signature(){return y.getData(1,this)}_hasSignature(){return!y.isNull(y.getPointer(1,this))}_initSignature(t){return y.initData(1,t,this)}set signature(t){y.copyFrom(t,y.getPointer(1,this))}get parity(){return y.getUint8(0,this)}set parity(t){y.setUint8(0,t,this)}toString(){return"RecoveryInput_"+super.toString()}},Em=class extends Te{static _capnp={displayName:"RecoveryResponse",id:"8f9525ca045bff80",size:new ve(24,2)};get protocol(){return y.getUint32(0,this)}set protocol(t){y.setUint32(0,t,this)}get id(){return y.getUint64(8,this)}set id(t){y.setUint64(8,t,this)}get ready(){return y.getBit(32,this)}set ready(t){y.setBit(32,t,this)}_adoptKeys(t){y.adopt(t,y.getPointer(0,this))}_disownKeys(){return y.disown(this.keys)}get keys(){return y.getList(0,Ph,this)}_hasKeys(){return!y.isNull(y.getPointer(0,this))}_initKeys(t){return y.initList(0,Ph,t,this)}set keys(t){y.copyFrom(t,y.getPointer(0,this))}_adoptPackedResults(t){y.adopt(t,y.getPointer(1,this))}_disownPackedResults(){return y.disown(this.packedResults)}get packedResults(){return y.getData(1,this)}_hasPackedResults(){return!y.isNull(y.getPointer(1,this))}_initPackedResults(t){return y.initData(1,t,this)}set packedResults(t){y.copyFrom(t,y.getPointer(1,this))}get count(){return y.getUint32(16,this)}set count(t){y.setUint32(16,t,this)}toString(){return"RecoveryResponse_"+super.toString()}},Am=class extends Te{static _capnp={displayName:"UIntRecord",id:"bbfdd084979cc9ad",size:new ve(8,0)};get value(){return y.getUint64(0,this)}set value(t){y.setUint64(0,t,this)}toString(){return"UIntRecord_"+super.toString()}},nc=class extends Te{static _capnp={displayName:"SignerIdentity",id:"f23c933c1cfb3f0c",size:new ve(8,1)};get chainId(){return y.getUint64(0,this)}set chainId(t){y.setUint64(0,t,this)}_adoptValidator(t){y.adopt(t,y.getPointer(0,this))}_disownValidator(){return y.disown(this.validator)}get validator(){return y.getData(0,this)}_hasValidator(){return!y.isNull(y.getPointer(0,this))}_initValidator(t){return y.initData(0,t,this)}set validator(t){y.copyFrom(t,y.getPointer(0,this))}toString(){return"SignerIdentity_"+super.toString()}},ic=class extends Te{static _capnp={displayName:"NodeConfig",id:"ac980bce1954df1c",size:new ve(32,10)};get dataDir(){return y.getText(0,this)}set dataDir(t){y.setText(0,t,this)}get genesis(){return y.getText(1,this)}set genesis(t){y.setText(1,t,this)}get rpcListen(){return y.getText(2,this)}set rpcListen(t){y.setText(2,t,this)}get peerListen(){return y.getText(3,this)}set peerListen(t){y.setText(3,t,this)}get capnpListen(){return y.getText(4,this)}set capnpListen(t){y.setText(4,t,this)}get tlsCert(){return y.getText(5,this)}set tlsCert(t){y.setText(5,t,this)}get tlsKey(){return y.getText(6,this)}set tlsKey(t){y.setText(6,t,this)}get hasSyncPeer(){return y.getBit(0,this)}set hasSyncPeer(t){y.setBit(0,t,this)}_adoptSyncPeer(t){y.adopt(t,y.getPointer(7,this))}_disownSyncPeer(){return y.disown(this.syncPeer)}get syncPeer(){return y.getStruct(7,sc,this)}_hasSyncPeer(){return!y.isNull(y.getPointer(7,this))}_initSyncPeer(){return y.initStructAt(7,sc,this)}set syncPeer(t){y.copyFrom(t,y.getPointer(7,this))}get blockIntervalMs(){return y.getUint64(8,this)}set blockIntervalMs(t){y.setUint64(8,t,this)}get maxPending(){return y.getUint64(16,this)}set maxPending(t){y.setUint64(16,t,this)}get maxBlockTransactions(){return y.getUint64(24,this)}set maxBlockTransactions(t){y.setUint64(24,t,this)}get development(){return y.getBit(1,this)}set development(t){y.setBit(1,t,this)}_adoptRetention(t){y.adopt(t,y.getPointer(8,this))}_disownRetention(){return y.disown(this.retention)}get retention(){return y.getStruct(8,rc,this)}_hasRetention(){return!y.isNull(y.getPointer(8,this))}_initRetention(){return y.initStructAt(8,rc,this)}set retention(t){y.copyFrom(t,y.getPointer(8,this))}_adoptVerification(t){y.adopt(t,y.getPointer(9,this))}_disownVerification(){return y.disown(this.verification)}get verification(){return y.getStruct(9,oc,this)}_hasVerification(){return!y.isNull(y.getPointer(9,this))}_initVerification(){return y.initStructAt(9,oc,this)}set verification(t){y.copyFrom(t,y.getPointer(9,this))}toString(){return"NodeConfig_"+super.toString()}},sc=class extends Te{static _capnp={displayName:"SyncPeer",id:"82789d90075fe866",size:new ve(8,3)};get transport(){return y.getUint16(0,this)}set transport(t){y.setUint16(0,t,this)}get address(){return y.getText(0,this)}set address(t){y.setText(0,t,this)}get serverName(){return y.getText(1,this)}set serverName(t){y.setText(1,t,this)}get certificate(){return y.getText(2,this)}set certificate(t){y.setText(2,t,this)}toString(){return"SyncPeer_"+super.toString()}};var Cm={ARCHIVE:0,PRUNED_SECONDS:1},rc=class extends Te{static ARCHIVE=Cm.ARCHIVE;static PRUNED_SECONDS=Cm.PRUNED_SECONDS;static _capnp={displayName:"Retention",id:"ee279fdcd0dc4156",size:new ve(16,0)};get _isArchive(){return y.getUint16(0,this)===0}set archive(t){y.setUint16(0,0,this)}get prunedSeconds(){return y.testWhich("prunedSeconds",y.getUint16(0,this),1,this),y.getUint64(8,this)}get _isPrunedSeconds(){return y.getUint16(0,this)===1}set prunedSeconds(t){y.setUint16(0,1,this),y.setUint64(8,t,this)}toString(){return"Retention_"+super.toString()}which(){return y.getUint16(0,this)}};var oc=class n extends Te{static _capnp={displayName:"Verification",id:"ecec4f97815db1fb",size:new ve(16,2),defaultBackend:tc(1),defaultTimeoutSeconds:Ah(0x1en),defaultGpuRuntime:tc(0)};get backend(){return y.getUint16(0,this,n._capnp.defaultBackend)}set backend(t){y.setUint16(0,t,this,n._capnp.defaultBackend)}get python(){return y.getText(0,this)}set python(t){y.setText(0,t,this)}get worker(){return y.getText(1,this)}set worker(t){y.setText(1,t,this)}get timeoutSeconds(){return y.getUint64(8,this,n._capnp.defaultTimeoutSeconds)}set timeoutSeconds(t){y.setUint64(8,t,this,n._capnp.defaultTimeoutSeconds)}get gpuRuntime(){return y.getUint16(2,this,n._capnp.defaultGpuRuntime)}set gpuRuntime(t){y.setUint16(2,t,this,n._capnp.defaultGpuRuntime)}toString(){return"Verification_"+super.toString()}},ac=class extends Te{static _capnp={displayName:"RoundLock",id:"8a9e648b2a198f10",size:new ve(32,1)};get chain(){return y.getUint64(0,this)}set chain(t){y.setUint64(0,t,this)}get height(){return y.getUint64(8,this)}set height(t){y.setUint64(8,t,this)}get hasLock(){return y.getBit(128,this)}set hasLock(t){y.setBit(128,t,this)}get lockedRound(){return y.getUint32(20,this)}set lockedRound(t){y.setUint32(20,t,this)}_adoptLockedHash(t){y.adopt(t,y.getPointer(0,this))}_disownLockedHash(){return y.disown(this.lockedHash)}get lockedHash(){return y.getData(0,this)}_hasLockedHash(){return!y.isNull(y.getPointer(0,this))}_initLockedHash(t){return y.initData(0,t,this)}set lockedHash(t){y.copyFrom(t,y.getPointer(0,this))}get hasCertificateRound(){return y.getBit(129,this)}set hasCertificateRound(t){y.setBit(129,t,this)}get certificateRound(){return y.getUint32(24,this)}set certificateRound(t){y.setUint32(24,t,this)}toString(){return"RoundLock_"+super.toString()}},sr={CONFIG:0,GENESIS:1,UNSIGNED:2,VOTE:3,IDENTITY:4,ROUND_LOCK:5},cc=class extends Te{static CONFIG=sr.CONFIG;static GENESIS=sr.GENESIS;static UNSIGNED=sr.UNSIGNED;static VOTE=sr.VOTE;static IDENTITY=sr.IDENTITY;static ROUND_LOCK=sr.ROUND_LOCK;static _capnp={displayName:"Record",id:"d391d300be753975",size:new ve(24,1)};get magic(){return y.getUint64(0,this)}set magic(t){y.setUint64(0,t,this)}get version(){return y.getUint16(8,this)}set version(t){y.setUint16(8,t,this)}_adoptConfig(t){y.setUint16(10,0,this),y.adopt(t,y.getPointer(0,this))}_disownConfig(){return y.disown(this.config)}get config(){return y.testWhich("config",y.getUint16(10,this),0,this),y.getStruct(0,ic,this)}_hasConfig(){return!y.isNull(y.getPointer(0,this))}_initConfig(){return y.setUint16(10,0,this),y.initStructAt(0,ic,this)}get _isConfig(){return y.getUint16(10,this)===0}set config(t){y.setUint16(10,0,this),y.copyFrom(t,y.getPointer(0,this))}_adoptGenesis(t){y.setUint16(10,1,this),y.adopt(t,y.getPointer(0,this))}_disownGenesis(){return y.disown(this.genesis)}get genesis(){return y.testWhich("genesis",y.getUint16(10,this),1,this),y.getStruct(0,mo,this)}_hasGenesis(){return!y.isNull(y.getPointer(0,this))}_initGenesis(){return y.setUint16(10,1,this),y.initStructAt(0,mo,this)}get _isGenesis(){return y.getUint16(10,this)===1}set genesis(t){y.setUint16(10,1,this),y.copyFrom(t,y.getPointer(0,this))}get unsigned(){return y.testWhich("unsigned",y.getUint16(10,this),2,this),y.getUint64(16,this)}get _isUnsigned(){return y.getUint16(10,this)===2}set unsigned(t){y.setUint16(10,2,this),y.setUint64(16,t,this)}_adoptVote(t){y.setUint16(10,3,this),y.adopt(t,y.getPointer(0,this))}_disownVote(){return y.disown(this.vote)}get vote(){return y.testWhich("vote",y.getUint16(10,this),3,this),y.getStruct(0,lc,this)}_hasVote(){return!y.isNull(y.getPointer(0,this))}_initVote(){return y.setUint16(10,3,this),y.initStructAt(0,lc,this)}get _isVote(){return y.getUint16(10,this)===3}set vote(t){y.setUint16(10,3,this),y.copyFrom(t,y.getPointer(0,this))}_adoptIdentity(t){y.setUint16(10,4,this),y.adopt(t,y.getPointer(0,this))}_disownIdentity(){return y.disown(this.identity)}get identity(){return y.testWhich("identity",y.getUint16(10,this),4,this),y.getStruct(0,nc,this)}_hasIdentity(){return!y.isNull(y.getPointer(0,this))}_initIdentity(){return y.setUint16(10,4,this),y.initStructAt(0,nc,this)}get _isIdentity(){return y.getUint16(10,this)===4}set identity(t){y.setUint16(10,4,this),y.copyFrom(t,y.getPointer(0,this))}_adoptRoundLock(t){y.setUint16(10,5,this),y.adopt(t,y.getPointer(0,this))}_disownRoundLock(){return y.disown(this.roundLock)}get roundLock(){return y.testWhich("roundLock",y.getUint16(10,this),5,this),y.getStruct(0,ac,this)}_hasRoundLock(){return!y.isNull(y.getPointer(0,this))}_initRoundLock(){return y.setUint16(10,5,this),y.initStructAt(0,ac,this)}get _isRoundLock(){return y.getUint16(10,this)===5}set roundLock(t){y.setUint16(10,5,this),y.copyFrom(t,y.getPointer(0,this))}toString(){return"Record_"+super.toString()}which(){return y.getUint16(10,this)}},mo=class n extends Te{static _capnp={displayName:"GenesisRecord",id:"f22ca49eaeff3841",size:new ve(24,1)};static _Alloc;get chainId(){return y.getUint64(0,this)}set chainId(t){y.setUint64(0,t,this)}get timestamp(){return y.getUint64(8,this)}set timestamp(t){y.setUint64(8,t,this)}get gasLimit(){return y.getUint64(16,this)}set gasLimit(t){y.setUint64(16,t,this)}_adoptAlloc(t){y.adopt(t,y.getPointer(0,this))}_disownAlloc(){return y.disown(this.alloc)}get alloc(){return y.getList(0,n._Alloc,this)}_hasAlloc(){return!y.isNull(y.getPointer(0,this))}_initAlloc(t){return y.initList(0,n._Alloc,t,this)}set alloc(t){y.copyFrom(t,y.getPointer(0,this))}toString(){return"GenesisRecord_"+super.toString()}},Uh=class extends Te{static _capnp={displayName:"Allocation",id:"f2f85eb54368ae5f",size:new ve(0,2)};get key(){return y.getText(0,this)}set key(t){y.setText(0,t,this)}get value(){return y.getText(1,this)}set value(t){y.setText(1,t,this)}toString(){return"Allocation_"+super.toString()}},fy={PREVOTE:0,PRECOMMIT:1},lc=class extends Te{static Phase=fy;static _capnp={displayName:"VoteRecord",id:"8152a83058f408e1",size:new ve(24,3)};get chainId(){return y.getUint64(0,this)}set chainId(t){y.setUint64(0,t,this)}get height(){return y.getUint64(8,this)}set height(t){y.setUint64(8,t,this)}get round(){return y.getUint32(16,this)}set round(t){y.setUint32(16,t,this)}get phase(){return y.getUint16(20,this)}set phase(t){y.setUint16(20,t,this)}_adoptBlockHash(t){y.adopt(t,y.getPointer(0,this))}_disownBlockHash(){return y.disown(this.blockHash)}get blockHash(){return y.getData(0,this)}_hasBlockHash(){return!y.isNull(y.getPointer(0,this))}_initBlockHash(t){return y.initData(0,t,this)}set blockHash(t){y.copyFrom(t,y.getPointer(0,this))}_adoptValidator(t){y.adopt(t,y.getPointer(1,this))}_disownValidator(){return y.disown(this.validator)}get validator(){return y.getData(1,this)}_hasValidator(){return!y.isNull(y.getPointer(1,this))}_initValidator(t){return y.initData(1,t,this)}set validator(t){y.copyFrom(t,y.getPointer(1,this))}_adoptSignature(t){y.adopt(t,y.getPointer(2,this))}_disownSignature(){return y.disown(this.signature)}get signature(){return y.getData(2,this)}_hasSignature(){return!y.isNull(y.getPointer(2,this))}_initSignature(t){return y.initData(2,t,this)}set signature(t){y.copyFrom(t,y.getPointer(2,this))}toString(){return"VoteRecord_"+super.toString()}};_i._List=ir(_i);_i._Object=ir(Ih);Lh._Cases=ir(Nh);mo._Alloc=ir(Uh);function Dh(n,t=0){if(t>=64)throw Error("Record nesting exceeded");if(n._isNull)return null;if(n._isBoolean)return n.boolean;if(n._isUnsigned||n._isSigned){let e=n._isUnsigned?n.unsigned:n.signed;return e<=BigInt(Number.MAX_SAFE_INTEGER)&&e>=BigInt(Number.MIN_SAFE_INTEGER)?Number(e):e}if(n._isReal){if(!Number.isFinite(n.real))throw Error("Non-finite number");return n.real}if(n._isText)return n.text;if(n._isList)return Array.from(n.list,e=>Dh(e,t+1));if(n._isObject){let e=Object.create(null);for(let i of n.object){if(Object.hasOwn(e,i.key))throw Error("Duplicate key");e[i.key]=Dh(i.value,t+1)}return e}throw Error("Unknown record type")}var dy=0x5346435245433031n,py={data_dir:"dataDir",genesis:"genesis",rpc_listen:"rpcListen",peer_listen:"peerListen",capnp_listen:"capnpListen",tls_cert:"tlsCert",tls_key:"tlsKey",block_interval_ms:"blockIntervalMs",max_pending:"maxPending",max_block_transactions:"maxBlockTransactions",development:"development"},my=new Set(["block_interval_ms","max_pending","max_block_transactions"]),As=n=>n<=BigInt(Number.MAX_SAFE_INTEGER)?Number(n):n;function gy(n){if(n.version!==1)throw Error("Unsupported typed record version");if(n._isConfig){let t=n.config,e=Object.fromEntries(Object.entries(py).map(([s,r])=>[s,my.has(s)?As(t[r]):t[r]]));e.capnp_listen||=null,e.sync_peer=t.hasSyncPeer?{transport:["http3","tcp"][t.syncPeer.transport],address:t.syncPeer.address,server_name:t.syncPeer.serverName,certificate:t.syncPeer.certificate}:null,e.retention=t.retention._isArchive?{mode:"archive"}:{mode:"pruned",seconds:As(t.retention.prunedSeconds)};let i=t.verification;return e.verification={backend:["cpu","gpu","hybrid"][i.backend],gpu_runtime:["metal","mlx","mlx-native"][i.gpuRuntime],python:i.python,worker:i.worker,timeout_seconds:As(i.timeoutSeconds)},e}if(n._isGenesis){let t=n.genesis,e=Object.create(null);for(let i of t.alloc){if(Object.hasOwn(e,i.key))throw Error("Duplicate genesis key");e[i.key]=i.value}return{chain_id:As(t.chainId),timestamp:As(t.timestamp),gas_limit:As(t.gasLimit),alloc:e}}if(n._isUnsigned)return As(n.unsigned);throw Error("Unsupported typed record")}function Rm(n){if(n.byteLength>256*1024*1024||n.byteLength<8)throw Error("Invalid record size");let t=ArrayBuffer.isView(n)?new DataView(n.buffer,n.byteOffset,n.byteLength):new DataView(n),e=t.getUint32(0,!0)+1,i=Math.ceil((e+1)/2)*8;if(e>512||i>t.byteLength)throw Error("Invalid segment table");let s=i;for(let a=0;a<e;a++)s+=t.getUint32(4+a*4,!0)*8;if(s!==t.byteLength)throw Error("Truncated or trailing Cap\u2019n Proto data");let r=new Es(n,!1),o=r.getRoot(cc);return o.magic===dy?gy(o):Dh(r.getRoot(_i))}function Oh(n,t){n.indexOf(t)===-1&&n.push(t)}function xi(n,t){let e=n.indexOf(t);e>-1&&n.splice(e,1)}var He=(n,t,e)=>e>t?t:e<n?n:e;var Fn=()=>{},en=()=>{};var Ye={};var go=n=>/^-?(?:\d+(?:\.\d+)?|\.\d+)$/u.test(n);var Cs=n=>typeof n=="object"&&n!==null;var _o=n=>/^0[^.\s]+$/u.test(n);function xo(n){let t;return()=>(t===void 0&&(t=n()),t)}var Bn=n=>n;var Rs=(...n)=>n.reduce((t,e)=>i=>e(t(i)));var ti=(n,t,e)=>{let i=t-n;return i?(e-n)/i:1};var rr=class{constructor(){this.subscriptions=[]}add(t){return Oh(this.subscriptions,t),()=>this.remove(t)}remove(t){xi(this.subscriptions,t)}notify(t,e,i){let s=this.subscriptions.length;if(s)if(s===1)this.subscriptions[0](t,e,i);else for(let r=0;r<s;r++){let o=this.subscriptions[r];o&&o(t,e,i)}}getSize(){return this.subscriptions.length}clear(){this.subscriptions.length=0}};var We=n=>n*1e3,Fe=n=>n/1e3;var yo=(n,t)=>t?n*(1e3/t):0;var Pm=(n,t,e)=>{let i=t-n;return((e-n)%i+i)%i+n};var Fh=(n,t,e)=>n*(3*(1-n)*((1-n)*t+n*e)+n*n);function Hi(n,t,e,i){return n===t&&e===i?Bn:s=>{let r=0,o=1,a=s;for(let l=0;;l++){a>=r&&a<=o||(a=(r+o)/2);let c=Fh(a,n,e)-s;if(c*c<1e-28||l===40)break;c>0?o=a:r=a,a-=c*1e-7/(Fh(a+1e-7,n,e)-s-c)}return Fh(a,t,i)}}var uc=n=>t=>t<=.5?n(2*t)/2:(2-n(2*(1-t)))/2;var Ps=n=>t=>1-n(1-t);var hc=Hi(.33,1.53,.69,.99),or=Ps(hc),vo=uc(or);var So=n=>n>=1?1:(n*=2)<1?.5*or(n):.5*(2-Math.pow(2,-10*(n-1)));var bo=n=>1-Math.sin(Math.acos(n)),Bh=Ps(bo),Mo=uc(bo);var kh=Hi(.42,0,1,1),Vh=Hi(0,0,.58,1),ar=Hi(.42,0,.58,1);var To=n=>Array.isArray(n)&&typeof n[0]!="number";function wo(n,t){return To(n)?n[Pm(0,n.length,t)]:n}var Is=n=>Array.isArray(n)&&typeof n[0]=="number";var Im={linear:Bn,easeIn:kh,easeInOut:ar,easeOut:Vh,circIn:bo,circInOut:Mo,circOut:Bh,backIn:or,backInOut:vo,backOut:hc,anticipate:So},_y=n=>typeof n=="string",fc=n=>{if(Is(n)){en(n.length===4,"Cubic bezier arrays must contain four numerical values.","cubic-bezier-length");let[t,e,i,s]=n;return Hi(t,e,i,s)}else if(_y(n))return en(Im[n]!==void 0,`Invalid easing type '${n}'`,"invalid-easing-type"),Im[n];return n};var mn={delta:0,timestamp:0,isProcessing:!1};var dc;function xy(){dc=void 0}var ge={now:()=>(dc===void 0&&ge.set(mn.isProcessing||Ye.useManualTiming?mn.timestamp:performance.now()),dc),set:n=>{dc=n,queueMicrotask(xy)}};var ei=n=>Math.round(n*1e5)/1e5;var yy=n=>t=>typeof t=="string"&&t.startsWith(n);var vy=yy("var(--"),cr=n=>vy(n)?Sy.test(n.split("/*")[0].trim()):!1,Sy=/var\(--(?:[\w-]+\s*|[\w-]+\s*,(?:\s*[^)(\s]|\s*\((?:[^)(]|\([^)(]*\))*\))+\s*)\)$/iu;function pc(n){return typeof n!="string"?!1:n.split("/*")[0].includes("var(--")}var ni={test:n=>typeof n=="number",parse:parseFloat,transform:n=>n},yi={...ni,transform:n=>He(0,1,n)},Eo={...ni,default:1};var lr=/-?(?:\d+(?:\.\d+)?|\.\d+)/gu;function Lm(n){return n==null}var Nm=/^(?:#[\da-f]{3,8}|(?:rgb|hsl)a?\((?:-?[\d.]+%?[,\s]+){2}-?[\d.]+%?\s*(?:[,/]\s*)?(?:\b\d+(?:\.\d+)?|\.\d+)?%?\))$/iu;var ur=(n,t)=>e=>!!(typeof e=="string"&&Nm.test(e)&&e.startsWith(n)||t&&!Lm(e)&&Object.prototype.hasOwnProperty.call(e,t)),mc=(n,t,e)=>i=>{if(typeof i!="string")return i;let[s,r,o,a]=i.match(lr);return{[n]:parseFloat(s),[t]:parseFloat(r),[e]:parseFloat(o),alpha:a!==void 0?parseFloat(a):1}};var by=n=>He(0,255,n),zh={...ni,transform:n=>Math.round(by(n))},ii={test:ur("rgb","red"),parse:mc("red","green","blue"),transform:({red:n,green:t,blue:e,alpha:i=1})=>"rgba("+zh.transform(n)+", "+zh.transform(t)+", "+zh.transform(e)+", "+ei(yi.transform(i))+")"};function My(n){let t="",e="",i="",s="";return n.length>5?(t=n.substring(1,3),e=n.substring(3,5),i=n.substring(5,7),s=n.substring(7,9)):(t=n.substring(1,2),e=n.substring(2,3),i=n.substring(3,4),s=n.substring(4,5),t+=t,e+=e,i+=i,s+=s),{red:parseInt(t,16),green:parseInt(e,16),blue:parseInt(i,16),alpha:s?parseInt(s,16)/255:1}}var Ao={test:ur("#"),parse:My,transform:ii.transform};var Co=n=>({test:t=>typeof t=="string"&&t.endsWith(n)&&t.split(" ").length===1,parse:parseFloat,transform:t=>`${t}${n}`}),kn=Co("deg"),Wi=Co("%"),bt=Co("px"),Um=Co("vh"),Dm=Co("vw"),Gh={...Wi,parse:n=>Wi.parse(n)/100,transform:n=>Wi.transform(n*100)};var $i={test:ur("hsl","hue"),parse:mc("hue","saturation","lightness"),transform:({hue:n,saturation:t,lightness:e,alpha:i=1})=>"hsla("+Math.round(n)+", "+Wi.transform(ei(t))+", "+Wi.transform(ei(e))+", "+ei(yi.transform(i))+")"};var Ae={test:n=>ii.test(n)||Ao.test(n)||$i.test(n),parse:n=>ii.test(n)?ii.parse(n):$i.test(n)?$i.parse(n):Ao.parse(n),transform:n=>typeof n=="string"?n:n.hasOwnProperty("red")?ii.transform(n):$i.transform(n),getAnimatableNone:n=>{let t=Ae.parse(n);return t.alpha=0,Ae.transform(t)}};var Om=/(?:#[\da-f]{3,8}|(?:rgb|hsl)a?\((?:-?[\d.]+%?[,\s]+){2}-?[\d.]+%?\s*(?:[,/]\s*)?(?:\b\d+(?:\.\d+)?|\.\d+)?%?\))/giu;var Bm=new RegExp(lr.source),km=new RegExp(Om.source,"i");function Ty(n){return isNaN(n)&&typeof n=="string"&&(Bm.test(n)||km.test(n))}var Vm="number",zm="color",wy="var",Ey="var(",Fm="${}",Ay=/var\s*\(\s*--(?:[\w-]+\s*|[\w-]+\s*,(?:\s*[^)(\s]|\s*\((?:[^)(]|\([^)(]*\))*\))+\s*)\)|#[\da-f]{3,8}|(?:rgb|hsl)a?\((?:-?[\d.]+%?[,\s]+){2}-?[\d.]+%?\s*(?:[,/]\s*)?(?:\b\d+(?:\.\d+)?|\.\d+)?%?\)|-?(?:\d+(?:\.\d+)?|\.\d+)(?![a-z]*\()/giu;function Gm(n){let t=n.toString();return Bm.test(t)||km.test(t)}function hr(n){let t=n.toString(),e=[],i={color:[],number:[],var:[]},s=[],r=0,a=t.replace(Ay,l=>(Ae.test(l)?(i.color.push(r),s.push(zm),e.push(Ae.parse(l))):l.startsWith(Ey)?(i.var.push(r),s.push(wy),e.push(l)):(i.number.push(r),s.push(Vm),e.push(parseFloat(l))),++r,Fm)).split(Fm);return{values:e,split:a,indexes:i,types:s}}function Cy(n){return hr(n).values}function Hm({split:n,types:t}){let e=n.length;return i=>{let s="";for(let r=0;r<e;r++)if(s+=n[r],i[r]!==void 0){let o=t[r];o===Vm?s+=ei(i[r]):o===zm?s+=Ae.transform(i[r]):s+=i[r]}return s}}function Ry(n){return Hm(hr(n))}var Py=n=>typeof n=="number"?0:Ae.test(n)?Ae.getAnimatableNone(n):n,Iy=(n,t)=>typeof n=="number"?t?.trim().endsWith("/")?n:0:Py(n);function Ly(n){let t=hr(n);return Hm(t)(t.values.map((i,s)=>Iy(i,t.split[s])))}var nn={test:Ty,parse:Cy,createTransformer:Ry,getAnimatableNone:Ly};function Hh(n,t,e){return e<0&&(e+=1),e>1&&(e-=1),e<1/6?n+(t-n)*6*e:e<1/2?t:e<2/3?n+(t-n)*(2/3-e)*6:n}function Wm({hue:n,saturation:t,lightness:e,alpha:i}){n/=360,t/=100,e/=100;let s=0,r=0,o=0;if(!t)s=r=o=e;else{let a=e<.5?e*(1+t):e+t-e*t,l=2*e-a;s=Hh(l,a,n+1/3),r=Hh(l,a,n),o=Hh(l,a,n-1/3)}return{red:Math.round(s*255),green:Math.round(r*255),blue:Math.round(o*255),alpha:i}}function fr(n,t){return e=>e>0?t:n}var ln=(n,t,e)=>n+(t-n)*e;var Wh=(n,t,e)=>{let i=n*n,s=e*(t*t-i)+i;return s<0?0:Math.sqrt(s)},Ny=[Ao,ii,$i],Uy=n=>Ny.find(t=>t.test(n));function $m(n){let t=Uy(n);if(!t)return Fn(!1,`'${n}' is not an animatable color. Use the equivalent color code instead.`,"color-not-animatable"),!1;let e=t.parse(n);return t===$i&&(e=Wm(e)),e}var $h=(n,t)=>{let e=$m(n),i=$m(t);if(!e||!i)return fr(n,t);let s={...e};return r=>(s.red=Wh(e.red,i.red,r),s.green=Wh(e.green,i.green,r),s.blue=Wh(e.blue,i.blue,r),s.alpha=ln(e.alpha,i.alpha,r),ii.transform(s))};var gc=new Set(["none","hidden"]);function Xm(n,t){return gc.has(n)?e=>e<=0?n:t:e=>e>=1?t:n}function Dy(n,t){return e=>ln(n,t,e)}function _c(n){return typeof n=="number"?Dy:typeof n=="string"?cr(n)?fr:Ae.test(n)?$h:By:Array.isArray(n)?qm:typeof n=="object"?Ae.test(n)?$h:Oy:fr}function qm(n,t){let e=[...n],i=e.length,s=n.map((r,o)=>_c(r)(r,t[o]));return r=>{for(let o=0;o<i;o++)e[o]=s[o](r);return e}}function Oy(n,t){let e={...n,...t},i={};for(let s in e)n[s]!==void 0&&t[s]!==void 0&&(i[s]=_c(n[s])(n[s],t[s]));return s=>{for(let r in i)e[r]=i[r](s);return e}}function Fy(n,t){let e=[],i={color:0,var:0,number:0};for(let s=0;s<t.values.length;s++){let r=t.types[s],o=n.indexes[r][i[r]],a=n.values[o]??0;e[s]=a,i[r]++}return e}var By=(n,t)=>{let e=nn.createTransformer(t),i=hr(n),s=hr(t);return i.indexes.var.length===s.indexes.var.length&&i.indexes.color.length===s.indexes.color.length&&i.indexes.number.length>=s.indexes.number.length?gc.has(n)&&!s.values.length||gc.has(t)&&!i.values.length?Xm(n,t):Rs(qm(Fy(i,s),s.values),e):(Fn(!0,`Complex values '${n}' and '${t}' too different to mix. Ensure all colors are of the same type, and that each contains the same quantity of number and color values. Falling back to instant transition.`,"complex-values-different"),fr(n,t))};var Ym=/^(-?(?:\d+(?:\.\d*)?|\.\d+))([a-z%]*)$/iu;function ky(n,t){let e=Ym.exec(n);if(!e)return;let i=Ym.exec(t);if(!i||e[2]!==i[2])return;let s=e[2],r=parseFloat(e[1]),o=parseFloat(i[1]);return a=>ei(ln(r,o,a))+s}function dr(n,t,e){if(typeof n=="number"&&typeof t=="number"&&typeof e=="number")return ln(n,t,e);if(typeof n=="string"&&typeof t=="string"){let s=ky(n,t);if(s)return s}return _c(n)(n,t)}var Ro=["setup","read","resolveKeyframes","preUpdate","update","preRender","render","postRender"];function Zm(n){let t=new Set,e=new Set,i=!1,s=!1,r=new Set,o={delta:0,timestamp:0,isProcessing:!1};function a(c){r.has(c)&&(e.add(c),n()),c(o)}let l={schedule:(c,u=!1,f=!1)=>{let m=f&&i?t:e;return u&&r.add(c),m.add(c),c},cancel:c=>{e.delete(c),r.delete(c)},process:c=>{if(o=c,i){s=!0;return}i=!0;let u=t;t=e,e=u,t.forEach(a),t.clear(),i=!1,s&&(s=!1,l.process(c))}};return l}var Vy=40;function Km(n,t,e={delta:0,timestamp:0,isProcessing:!1}){let i=!1,s=!0,r=()=>i=!0,o=Ro.reduce((P,b)=>(P[b]=Zm(r),P),{}),{setup:a,read:l,resolveKeyframes:c,preUpdate:u,update:f,preRender:h,render:m,postRender:_}=o,S=()=>{let P=Ye.useManualTiming,b=P?e.timestamp:performance.now();i=!1,P||(e.delta=s?1e3/60:Math.max(Math.min(b-e.timestamp,Vy),1)),e.timestamp=b,e.isProcessing=!0,a.process(e),l.process(e),c.process(e),u.process(e),f.process(e),h.process(e),m.process(e),_.process(e),e.isProcessing=!1,i&&t&&(s=!1,n(S))},p=()=>{i=!0,s=!0,e.isProcessing||n(S)};return{schedule:Ro.reduce((P,b)=>{let E=o[b];return P[b]=(w,A=!1,x=!1)=>(i||p(),E.schedule(w,A,x)),P},{}),cancel:P=>{for(let b=0;b<Ro.length;b++)o[Ro[b]].cancel(P)},state:e,steps:o}}var{schedule:Be,cancel:Jm,steps:tR}=Km(typeof requestAnimationFrame<"u"?requestAnimationFrame:Bn,!0,mn);var xc=n=>{let t=({timestamp:e})=>n(e);return{start:(e=!0)=>Be.update(t,e),stop:()=>Jm(t),now:()=>mn.isProcessing?mn.timestamp:ge.now()}};var yc=(n,t,e=10)=>{let i="",s=Math.max(Math.round(t/e),2);for(let r=0;r<s;r++)i+=Math.round(n(r/(s-1))*1e4)/1e4+", ";return`linear(${i.substring(0,i.length-2)})`};function pr(n,t=50,e=2e4,i){let s=0,r=n.next(s);for(i?.push(r.value);!r.done&&s<e;)s+=t,r=n.next(s),i?.push(r.value);return s>=e?1/0:s}function Po(n,t=100,e){let{keyframes:i,velocity:s}=n,r=i&&i[i.length-1]-i[0],o=e({...n,velocity:s&&r?s*t/r:s,keyframes:[0,t]}),a=Math.min(pr(o),2e4);return{type:"keyframes",ease:l=>o.next(a*l).value/t,duration:Fe(a)}}var ke={stiffness:100,damping:10,mass:1,duration:800,bounce:.3,visualDuration:.3,restSpeed:{granular:.01,default:2},restDelta:{granular:.005,default:.5},minDuration:.01,maxDuration:10,minDamping:.05},jm=n=>n<0?1/Math.max(1+n,ke.minDamping):Math.max(1-n,ke.minDamping);function Qm(n,t){if(!(n>1))return 1;let e=Math.sqrt(n*n-1),i=n-e,s=n+e,r=2*e*Math.exp(-t)*(1+t);return tg(o=>s*Math.exp(-i*o)-i*Math.exp(-s*o)-r,o=>Math.exp(-s*o)-Math.exp(-i*o),t)/t}function Zh(n,t){return n*Math.sqrt(1-t*t)}var zy=12;function tg(n,t,e){let i=e;for(let s=1;s<zy;s++)i=i-n(i)/t(i);return i}var qh=.001;function Gy({duration:n=ke.duration,bounce:t=ke.bounce}){let e,i;Fn(n<=We(ke.maxDuration),"Spring duration must be 10 seconds or less","spring-duration-limit");let s=jm(t);n=He(ke.minDuration,ke.maxDuration,Fe(n)),s<1?(e=c=>{let u=c*s,f=u*n,h=Zh(c,s),m=Math.exp(-f);return qh-u/h*m},i=c=>{let f=c*s*n,h=s*s*c*c*n,m=Math.exp(-f),_=Zh(c*c,s);return(-e(c)+qh>0?-1:1)*-h*m/_}):(e=c=>{let u=Math.exp(-c*n),f=c*n+1;return-qh+u*f},i=c=>{let u=Math.exp(-c*n),f=-c*(n*n);return u*f});let r=5/n,o=tg(e,i,r),a=o*Qm(s,o*n),l=a*a;return{stiffness:l,damping:s*2*Math.sqrt(l),duration:We(n)}}var Kh=(n,t)=>(t?n>=0:n>0)&&n<1/0;function Yh(n,t){if(Kh(n,t))return n}function Hy(n){let t=Yh(n.stiffness),e=Yh(n.damping,!0),i=Yh(n.mass),s={...n,stiffness:t??ke.stiffness,damping:e??ke.damping,mass:i??ke.mass,isResolvedFromDuration:!1,isTimeDefined:(t??e??i)===void 0&&(n.duration!==void 0||n.bounce!==void 0)};if(s.isTimeDefined){if(n.visualDuration){let r=jm(n.bounce||0),o=2*Math.PI/(n.visualDuration*1.2)*Qm(r,2*Math.PI/1.2);s.stiffness=o*o,s.damping=2*r*Math.sqrt(s.stiffness)}else Object.assign(s,Gy(s)),s.isResolvedFromDuration=!0;(!Kh(s.stiffness)||!Kh(s.damping,!0))&&(s.stiffness=ke.stiffness,s.damping=ke.damping)}return s}function vi(n=ke.visualDuration,t=ke.bounce){let e=typeof n!="object"?{visualDuration:n,keyframes:[0,1],bounce:t}:n,i=e.keyframes[0],s=e.keyframes[e.keyframes.length-1],r={done:!1,value:i},{stiffness:o,damping:a,mass:l,duration:c,isResolvedFromDuration:u,isTimeDefined:f}=Hy({...e}),h=A=>f?0:-Fe(A),m=a/(2*Math.sqrt(o*l)),_=Fe(Math.sqrt(o/l)),S=m*_,p={target:s,delta:s-i,velocity:h(e.velocity||0)||0,restSpeed:0,restDelta:0},d=()=>{let A=Math.abs(p.delta)<5;p.restSpeed=e.restSpeed||(A?ke.restSpeed.granular:ke.restSpeed.default),p.restDelta=e.restDelta||(A?ke.restDelta.granular:ke.restDelta.default)};d();let M,P,b;if(m<1){let A=Zh(_,m),x={A:0,sinC:0,cosC:0,t:-1,env:0,sin:0,cos:0};b=()=>{x.A=(p.velocity+S*p.delta)/A,x.sinC=S*x.A+p.delta*A,x.cosC=S*p.delta-x.A*A};let T=L=>{L!==x.t&&(x.t=L,x.env=Math.exp(-S*L),x.sin=Math.sin(A*L),x.cos=Math.cos(A*L))};M=L=>(T(L),p.target-x.env*(x.A*x.sin+p.delta*x.cos)),P=L=>(T(L),x.env*(x.sinC*x.sin+x.cosC*x.cos))}else if(m===1){M=x=>p.target-Math.exp(-_*x)*(p.delta+(p.velocity+_*p.delta)*x);let A={C:0};b=()=>{A.C=p.velocity+_*p.delta},P=x=>Math.exp(-_*x)*(_*A.C*x-p.velocity)}else{let A=_*Math.sqrt(m*m-1),x=S-A,T=S+A,L=f?1/0:300/A,F=(I,R)=>Math.exp(R>L?-I*L-S*(R-L):-I*R),V={S:0,F:0};b=()=>{let I=(p.velocity+S*p.delta)/A;V.S=(p.delta+I)/2,V.F=(p.delta-I)/2},M=I=>p.target-V.S*F(x,I)-V.F*F(T,I),P=I=>x*V.S*F(x,I)+T*V.F*F(T,I)}b();let E=u&&c||null,w={calculatedDuration:E,retarget:(A,x)=>{p.target=A[A.length-1],p.delta=p.target-A[0],p.velocity=h(x),e.restSpeed&&e.restDelta||d(),w.calculatedDuration=E,r.done=!1,b()},velocity:A=>We(P(A)),next:A=>{let x=M(A);if(u)r.done=A>=c;else{let T=We(P(A));r.done=Math.abs(T)<=p.restSpeed&&Math.abs(p.target-x)<=p.restDelta}return r.value=r.done?p.target:x,r},toString:()=>{let A=Math.min(pr(w),2e4),x=yc(T=>w.next(A*T).value,A,30);return A+"ms "+x},toTransition:()=>{}};return w}vi.applyToOptions=n=>{let t=Po(n,100,vi);return n.ease=t.ease,n.duration=We(t.duration),n.type="keyframes",n};function mr({keyframes:n,velocity:t=0,power:e=.8,timeConstant:i=325,bounceDamping:s=10,bounceStiffness:r=500,modifyTarget:o,min:a,max:l,restDelta:c=.5,restSpeed:u}){let f=n[0],h={done:!1,value:f},m=A=>A<a||A>l,_=A=>a===void 0?l:l===void 0||Math.abs(a-A)<Math.abs(l-A)?a:l,S=e*t,p=f+S,d=o===void 0?p:o(p);d!==p&&(S=d-f);let M=A=>-S*Math.exp(-A/i),P=A=>{let x=M(A);h.done=Math.abs(x)<=c,h.value=h.done?d:d+x},b,E,w=A=>{m(h.value)&&(b=A,E=vi({keyframes:[h.value,_(h.value)],velocity:-M(A)/i*1e3,damping:s,stiffness:r,restDelta:c,restSpeed:u}))};return w(0),{calculatedDuration:null,next:A=>{let x=!1;return!E&&b===void 0&&(x=!0,P(A),w(A)),b!==void 0&&A>=b?E.next(A-b):(!x&&P(A),h)}}}function Wy(n,t,e){let i=[],s=e||Ye.mix||dr,r=n.length-1;for(let o=0;o<r;o++){let a=s(n[o],n[o+1]);if(t){let l=Array.isArray(t)?t[o]||Bn:t;a=Rs(l,a)}i.push(a)}return i}function eg(n,t,{clamp:e=!0,ease:i,mixer:s}={}){let r=n.length;if(en(r===t.length,"Both input and output ranges must be the same length","range-length"),r===1)return()=>t[0];if(r===2&&t[0]===t[1])return()=>t[1];let o=n[0]===n[1];n[0]>n[r-1]&&(n=[...n].reverse(),t=[...t].reverse());let a=Wy(t,i,s),l=a.length,c=u=>{if(o&&u<n[0])return t[0];let f=0;if(l>1)for(;f<n.length-2&&!(u<n[f+1]);f++);let h=ti(n[f],n[f+1],u);return a[f](h)};return e?u=>c(He(n[0],n[r-1],u)):c}function Io(n,t){let e=n[n.length-1];for(let i=1;i<=t;i++){let s=ti(0,t,i);n.push(ln(e,1,s))}}function Ls(n){let t=[0];return Io(t,n.length-1),t}function ng(n,t){return n.map(e=>e*t)}function $y(n,t){return n.map(()=>t||ar).splice(0,n.length-1)}function Vn({duration:n=300,keyframes:t,times:e,ease:i="easeInOut"}){let s=To(i)?i.map(fc):fc(i)||ar,r={done:!1,value:t[0]};if(t.length===2&&!Array.isArray(s)&&(!e||e.length!==2||e[0]===0&&e[1]===1)){let[l,c]=t,u=l===c?void 0:(Ye.mix||dr)(l,c);return{calculatedDuration:n,next:f=>(r.value=u?u(s(n>0?He(0,1,f/n):1)):c,r.done=f>=n,r)}}let o=ng(e&&e.length===t.length?e:Ls(t),n),a=eg(o,t,{ease:Array.isArray(s)?s:$y(t,s)});return{calculatedDuration:n,next:l=>(r.value=a(l),r.done=l>=n,r)}}var Xy=5;function qy(n,t,e){let i=Math.max(t-Xy,0);return yo(e-n(i),t-i)}function ig(n,t,e=0){return t<=0?e:n.velocity?n.velocity(t):qy(i=>n.next(i).value,t,n.next(t).value)}var Yy=n=>n!==null;function Si(n,{repeat:t,repeatType:e="loop"},i,s=1){let r=n.filter(Yy),a=s<0||t&&e!=="loop"&&t%2===1?0:r.length-1;return!a||i===void 0?r[a]:i}var Zy={decay:mr,inertia:mr,tween:Vn,keyframes:Vn,spring:vi};function vc(n){typeof n.type=="string"&&(n.type=Zy[n.type])}var Ky=40,Sc=(n,t)=>t-n>Ky&&!Ye.useManualTiming?t:n;function Jy(n,t){return{kind:n,animation:t,timestamp:ge.now(),frameTimestamp:mn.timestamp,frameIsProcessing:mn.isProcessing}}function bc(n,t,e){let i=globalThis.__MOTION_INSPECT__;if(i)try{i({...Jy("animation-start",n),options:e?{...t,...e}:t})}catch{}}var Xi=class{constructor(){this.isResolved=!1}get finished(){return this._finished||(this._finished=this.isResolved?Promise.resolve():new Promise(t=>{this._resolve=t})),this._finished}updateFinished(){this._finished=this._resolve=void 0,this.isResolved=!1}notifyFinished(){this.isResolved=!0,this._resolve?.()}then(t,e){return this.finished.then(t,e)}};var jy=n=>n/100,Mc=n=>Math.round(n*1e4)/1e4,zn=class extends Xi{constructor(t){super(),this.state="idle",this.startTime=null,this.isStopped=!1,this.currentTime=0,this.holdTime=null,this.playbackSpeed=1,this.delayState={done:!1,value:void 0},this.stop=()=>{let{motionValue:e}=this.options;e&&e.updatedAt!==ge.now()&&this.tick(ge.now()),this.isStopped=!0,this.state!=="idle"&&(this.teardown(),this.options.onStop?.())},this.options=t,this.initAnimation(),this.play(),t.autoplay===!1&&this.pause(),bc(this,this.options)}initAnimation(){let{options:t}=this;vc(t);let{type:e=Vn,repeat:i=0,repeatDelay:s=0,repeatType:r,velocity:o=0}=t,{keyframes:a}=t,l=e||Vn;l!==Vn&&typeof a[0]!="number"&&(this.mixKeyframes=Rs(jy,dr(a[0],a[1])),a=[0,100]);let c=l(a===t.keyframes?t:{...t,keyframes:a});r==="mirror"&&(this.mirroredGenerator=l({...t,keyframes:[...a].reverse(),velocity:-o})),c.calculatedDuration===null&&(c.calculatedDuration=pr(c));let{calculatedDuration:u}=c;this.calculatedDuration=u,this.resolvedDuration=u+s,this.totalDuration=this.resolvedDuration*(i+1)-s,this.generator=c}updateTime(t){let e=Math.round(t-this.startTime)*this.playbackSpeed;this.holdTime!==null?this.currentTime=this.holdTime:this.currentTime=e}tick(t,e=!1){let{generator:i,totalDuration:s,calculatedDuration:r}=this;if(this.startTime===null)return i.next(0);let{delay:o=0,keyframes:a,type:l,onUpdate:c,finalKeyframe:u}=this.options;this.startTime===this.pendingStartTime&&(this.startTime=Sc(this.startTime,t)),this.pendingStartTime=void 0,this.speed>0?this.startTime=Math.min(this.startTime,t):this.speed<0&&(this.startTime=Math.min(t-s/this.speed,this.startTime)),e?this.currentTime=t:this.updateTime(t);let f=this.currentTime-o*(this.playbackSpeed>=0?1:-1),h=this.playbackSpeed>=0?f<0:f>s;this.currentTime=Math.max(f,0),this.state==="finished"&&this.holdTime===null&&(this.currentTime=s);let m=this.generate(this.currentTime,h),{done:_}=m;!h&&r!==null&&(_=this.playbackSpeed>=0?this.currentTime>=s:this.currentTime<=0);let S=this.holdTime===null&&(this.state==="finished"||this.state==="running"&&_);return S&&l!==mr&&(m.value=Si(a,this.options,u,this.speed)),c&&c(m.value),S&&this.finish(),m}at(t){return this.holdTime??Mc((t-this.startTime)*this.playbackSpeed)}sampleAt(t,e){let{options:i,totalDuration:s}=this,r=this.at(t)-(i.delay||0);return r>=s&&i.type!==mr?Si(i.keyframes,i,e?void 0:i.finalKeyframe):this.generate(Math.max(r,0),r<0).value}generate(t,e){let{generator:i,totalDuration:s,mixKeyframes:r,mirroredGenerator:o,resolvedDuration:a}=this,{keyframes:l,repeat:c,repeatType:u,repeatDelay:f}=this.options,h=t,m=i;if(c){let S=Math.min(t,s)/a,p=Math.floor(S),d=S%1;!d&&S>=1&&(d=1),d===1&&p--,p=Math.min(p,c+1),p%2&&(u==="reverse"?(d=1-d,f&&(d-=f/a)):u==="mirror"&&(m=o)),h=He(0,1,d)*a}let _;return e?(this.delayState.value=l[0],_=this.delayState):_=m.next(h),r&&!e&&(_.value=r(_.value)),_}then(t,e){return this.finished.then(t,e)}get duration(){return Fe(this.calculatedDuration)}get iterationDuration(){let{delay:t=0}=this.options||{};return this.duration+Fe(t)}get time(){return Fe(this.currentTime)}set time(t){t=We(t),this.currentTime=t,this.startTime===null||this.holdTime!==null||this.playbackSpeed===0?this.holdTime=t:this.driver&&(this.startTime=this.driver.now()-t/this.playbackSpeed),this.driver?this.driver.start(!1):(this.startTime=0,this.state="paused",this.holdTime=t,this.tick(t))}getGeneratorVelocity(){return ig(this.generator,this.currentTime,this.options.velocity)}get speed(){return this.playbackSpeed}set speed(t){let e=this.playbackSpeed!==t;e&&this.driver&&this.updateTime(ge.now()),this.playbackSpeed=t,e&&this.driver&&(this.time=Fe(this.currentTime))}play(){if(this.isStopped)return;let{driver:t=xc,startTime:e}=this.options;this.driver||(this.driver=t(s=>this.tick(s))),this.options.onPlay?.();let i=this.driver.now();this.state==="finished"?(this.updateFinished(),this.startTime=i):this.holdTime!==null?this.startTime=i-this.holdTime/(this.playbackSpeed||1):this.startTime||(this.startTime=e??(this.pendingStartTime=i)),this.state==="finished"&&this.speed<0&&(this.startTime+=this.calculatedDuration),this.holdTime=null,this.state="running",this.driver.start()}pause(){this.state="paused",this.updateTime(ge.now()),this.holdTime=this.currentTime}complete(){this.state!=="running"&&this.play(),this.state="finished",this.holdTime=null}finish(){this.notifyFinished(),this.teardown(),this.state="finished",this.options.onComplete?.()}cancel(){this.holdTime=null,this.startTime=0,this.tick(0),this.teardown(),this.options.onCancel?.()}teardown(){this.state="idle",this.stopDriver(),this.startTime=this.holdTime=null}stopDriver(){this.driver&&(this.driver.stop(),this.driver=void 0)}sample(t){return this.startTime=0,this.tick(t,!0)}attachTimeline(t){return this.options.allowFlatten&&(this.options.type="keyframes",this.options.ease="linear",this.initAnimation()),this.driver?.stop(),t.observe(this)}};var Qy=new Set(["brightness","contrast","saturate","opacity"]);function tv(n){let[t,e]=n.slice(0,-1).split("(");if(t==="drop-shadow")return n;let[i]=e.match(lr)||[];if(!i)return n;let s=e.replace(i,""),r=Qy.has(t)?1:0;return i!==e&&(r*=100),t+"("+r+s+")"}var ev=/\b([a-z-]*)\(.*?\)/gu,Lo={...nn,getAnimatableNone:n=>{let t=n.match(ev);return t?t.map(tv).join(" "):n}};var No={...nn,getAnimatableNone:n=>{let t=nn.parse(n);return nn.createTransformer(n)(t.map(i=>typeof i=="number"?0:typeof i=="object"?{...i,alpha:1}:i))}};var Jh={...ni,transform:Math.round};var Uo={rotate:kn,pathRotation:kn,rotateX:kn,rotateY:kn,rotateZ:kn,scale:Eo,scaleX:Eo,scaleY:Eo,scaleZ:Eo,skew:kn,skewX:kn,skewY:kn,distance:bt,translateX:bt,translateY:bt,translateZ:bt,x:bt,y:bt,z:bt,perspective:bt,transformPerspective:bt,opacity:yi,originX:Gh,originY:Gh,originZ:bt};var Ze={borderWidth:bt,borderTopWidth:bt,borderRightWidth:bt,borderBottomWidth:bt,borderLeftWidth:bt,borderRadius:bt,borderTopLeftRadius:bt,borderTopRightRadius:bt,borderBottomRightRadius:bt,borderBottomLeftRadius:bt,width:bt,maxWidth:bt,height:bt,maxHeight:bt,top:bt,right:bt,bottom:bt,left:bt,inset:bt,insetBlock:bt,insetBlockStart:bt,insetBlockEnd:bt,insetInline:bt,insetInlineStart:bt,insetInlineEnd:bt,padding:bt,paddingTop:bt,paddingRight:bt,paddingBottom:bt,paddingLeft:bt,paddingBlock:bt,paddingBlockStart:bt,paddingBlockEnd:bt,paddingInline:bt,paddingInlineStart:bt,paddingInlineEnd:bt,margin:bt,marginTop:bt,marginRight:bt,marginBottom:bt,marginLeft:bt,marginBlock:bt,marginBlockStart:bt,marginBlockEnd:bt,marginInline:bt,marginInlineStart:bt,marginInlineEnd:bt,fontSize:bt,backgroundPositionX:bt,backgroundPositionY:bt,...Uo,zIndex:Jh,fillOpacity:yi,strokeOpacity:yi,numOctaves:Jh};var nv={...Ze,color:Ae,backgroundColor:Ae,outlineColor:Ae,fill:Ae,stroke:Ae,borderColor:Ae,borderTopColor:Ae,borderRightColor:Ae,borderBottomColor:Ae,borderLeftColor:Ae,filter:Lo,WebkitFilter:Lo,mask:No,WebkitMask:No},sg=n=>nv[n];var iv=new Set([Lo,No]);function Tc(n,t){let e=sg(n);return iv.has(e)||(e=nn),e.getAnimatableNone?e.getAnimatableNone(t):void 0}function rg(n){for(let t=1;t<n.length;t++)n[t]??(n[t]=n[t-1])}var Ns=n=>n*180/Math.PI,jh=n=>{let t=Ns(Math.atan2(n[1],n[0]));return Qh(t)},sv={x:4,y:5,translateX:4,translateY:5,scaleX:0,scaleY:3,scaleZ:()=>1,scale:n=>(Math.abs(n[0])+Math.abs(n[3]))/2,rotate:jh,rotateZ:jh,skewX:n=>Ns(Math.atan(n[1])),skewY:n=>Ns(Math.atan(n[2])),skew:n=>(Math.abs(n[1])+Math.abs(n[2]))/2},Qh=n=>(n=n%360,n<0&&(n+=360),n),og=jh,ag=n=>Math.hypot(n[0],n[1]),cg=n=>Math.hypot(n[4],n[5]),rv={x:12,y:13,z:14,translateX:12,translateY:13,translateZ:14,scaleX:ag,scaleY:cg,scaleZ:n=>Math.hypot(n[8],n[9],n[10]),scale:n=>(ag(n)+cg(n))/2,rotateX:n=>Qh(Ns(Math.atan2(n[6],n[5]))),rotateY:n=>Qh(Ns(Math.atan2(-n[2],n[0]))),rotateZ:og,rotate:og,skewX:n=>Ns(Math.atan(n[4])),skewY:n=>Ns(Math.atan(n[1])),skew:n=>(Math.abs(n[1])+Math.abs(n[4]))/2};function lg(n){return n.includes("scale")?1:0}function wc(n,t){if(!n||n==="none")return lg(t);let e=n.match(/^matrix3d\(([-\d.e\s,]+)\)$/u),i,s;if(e)i=rv,s=e;else{let a=n.match(/^matrix\(([-\d.e\s,]+)\)$/u);i=sv,s=a}if(!s)return lg(t);let r=i[t],o=s[1].split(",").map(ov);return typeof r=="function"?r(o):o[r]}var ug=(n,t)=>{let{transform:e="none"}=getComputedStyle(n);return wc(e,t)};function ov(n){return parseFloat(n.trim())}var sn=["transformPerspective","x","y","z","translateX","translateY","translateZ","scale","scaleX","scaleY","scaleZ","rotate","rotateX","rotateY","rotateZ","skew","skewX","skewY"],bi=new Set([...sn,"pathRotation"]);var tf=n=>n===ni||n===bt,av=new Set(["x","y","z"]),cv=sn.filter(n=>!av.has(n));function fg(n){let t=[];return cv.forEach(e=>{let i=n.getValue(e);if(i!==void 0){let s=i.get(),r=e.startsWith("scale")?1:0;if(s===r)return;t.push([e,s]),i.set(r)}}),t}var dg=new Set(["bottom","right"]);function hg(n,t,e,i,s,r){let o=parseFloat(n);if(!isNaN(o))return o;let{min:a,max:l}=t()[e],c=l-a;return r==="border-box"?c:c-parseFloat(i)-parseFloat(s)}var qi={width:({width:n,paddingLeft:t="0",paddingRight:e="0",boxSizing:i},s)=>hg(n,s,"x",t,e,i),height:({height:n,paddingTop:t="0",paddingBottom:e="0",boxSizing:i},s)=>hg(n,s,"y",t,e,i),top:({top:n})=>parseFloat(n),left:({left:n})=>parseFloat(n),bottom:({top:n},t)=>{let{y:e}=t();return parseFloat(n)+(e.max-e.min)},right:({left:n},t)=>{let{x:e}=t();return parseFloat(n)+(e.max-e.min)},x:({transform:n})=>wc(n,"x"),y:({transform:n})=>wc(n,"y")};qi.translateX=qi.x;qi.translateY=qi.y;var Us=new Set,ef=!1,nf=!1,sf=!1;function pg(){if(nf){let n=[],t=new Set,e=new Set;Us.forEach(s=>{s.needsMeasurement&&(n.push(s),t.add(s.element),dg.has(s.name)&&e.add(s.element))});let i=new Map;e.forEach(s=>{let r=fg(s);r.length&&(i.set(s,r),s.render())}),n.forEach(s=>s.measureInitialState()),t.forEach(s=>{s.render();let r=i.get(s);r&&r.forEach(([o,a])=>{s.getValue(o)?.set(a)})}),n.forEach(s=>s.measureEndState()),n.forEach(s=>{s.suspendedScrollY!==void 0&&window.scrollTo(0,s.suspendedScrollY)})}nf=!1,ef=!1,Us.forEach(n=>n.complete(sf)),Us.clear()}function mg(){Us.forEach(n=>{n.readKeyframes(),n.needsMeasurement&&(nf=!0)})}function gg(){sf=!0,mg(),pg(),sf=!1}function lv(n,t,e){if(typeof n=="string"){if(go(n)||_o(n))return parseFloat(n);if(!nn.test(n)&&nn.test(e))return Tc(t,e)}return n??void 0}var gr=class{constructor(t,e,i,s,r,o=!1){this.state="pending",this.isAsync=!1,this.needsMeasurement=!1,this.unresolvedKeyframes=[...t],this.onComplete=e,this.name=i,this.motionValue=s,this.element=r,this.isAsync=o}scheduleResolve(){this.state="scheduled",this.isAsync?(Us.add(this),ef||(ef=!0,Be.read(mg),Be.resolveKeyframes(pg))):(this.readKeyframes(),this.complete())}readKeyframes(){let{unresolvedKeyframes:t,name:e,element:i,motionValue:s}=this;if(t[0]===null){let r=s?.get(),o=t[t.length-1];if(r!==void 0)t[0]=r;else if(i&&e){let a=lv(i.readValue(e,o),e,o);a!==void 0&&(t[0]=a)}t[0]===void 0&&(t[0]=o),s&&r===void 0&&s.set(t[0])}rg(t)}setFinalKeyframe(){}measureInitialState(){}renderEndStyles(){}measureEndState(){}complete(t=!1){this.state="complete",this.onComplete(this.unresolvedKeyframes,this.finalKeyframe,t),Us.delete(this)}cancel(){this.state==="scheduled"&&(Us.delete(this),this.state="pending")}resume(){this.state==="pending"&&this.scheduleResolve()}};var Yi=n=>n.startsWith("--");function Ec(n,t,e){Yi(t)?n.style.setProperty(t,e):n.style[t]=e}var _g={};function Ac(n,t){let e=xo(n);return()=>_g[t]??e()}var xg=Ac(()=>window.ScrollTimeline!==void 0,"scrollTimeline");var _r=Ac(()=>{try{document.createElement("div").animate({opacity:0},{easing:"linear(0, 1)"})}catch{return!1}return!0},"linearEasing");var Mi=([n,t,e,i])=>`cubic-bezier(${n}, ${t}, ${e}, ${i})`;var Do={linear:"linear",ease:"ease",easeIn:"ease-in",easeOut:"ease-out",easeInOut:"ease-in-out",circIn:Mi([0,.65,.55,1]),circOut:Mi([.55,0,1,.45]),backIn:Mi([.31,.01,.66,-.59]),backOut:Mi([.33,1.53,.69,.99])};function rf(n,t){if(n)return typeof n=="function"?_r()?yc(n,t):"ease-out":Is(n)?Mi(n):Array.isArray(n)?n.map(e=>rf(e,t)||Do.easeOut):Do[n]}function yg(n,t,e,{delay:i=0,duration:s=300,repeat:r=0,repeatType:o="loop",ease:a="easeOut",times:l}={},c=void 0){let u={[t]:e};l&&(u.offset=l);let f=rf(a,s);Array.isArray(f)&&(u.easing=f);let h={delay:i,duration:s,easing:Array.isArray(f)?"linear":f,fill:"both",iterations:r+1,direction:o==="reverse"?"alternate":"normal"};return c&&(h.pseudoElement=c),n.animate(u,h)}function Ds(n){return typeof n=="function"&&"applyToOptions"in n}function vg({type:n,...t}){return Ds(n)&&_r()?n.applyToOptions(t):(t.duration??(t.duration=300),t.ease??(t.ease="easeOut"),t)}var Cc=class extends Xi{constructor(t){if(super(),this.finishedTime=null,this.isStopped=!1,this.manualStartTime=null,!t)return;let{element:e,name:i,keyframes:s,pseudoElement:r,allowFlatten:o=!1,finalKeyframe:a,onComplete:l}=t;this.isPseudoElement=!!r,this.allowFlatten=o,this.options=t,en(typeof t.type!="string",`Mini animate() doesn't support "type" as a string.`,"mini-spring");let c=vg(t);this.animation=yg(e,i,s,c,r),c.autoplay===!1&&this.animation.pause(),this.animation.onfinish=()=>{if(this.finishedTime=this.time,!r){let u=Si(s,this.options,a,this.speed);this.updateMotionValue&&this.updateMotionValue(u),Ec(e,i,u),this.animation.cancel()}l?.(),this.notifyFinished()},bc(this,t,c)}play(){this.isStopped||(this.manualStartTime=null,this.animation.play(),this.state==="finished"&&this.updateFinished())}pause(){this.animation.pause()}complete(){this.animation.finish?.()}cancel(){try{this.animation.cancel()}catch{}}stop(){if(this.isStopped)return;this.isStopped=!0;let{state:t}=this;t==="idle"||t==="finished"||(this.updateMotionValue?this.updateMotionValue():this.commitStyles(),this.isPseudoElement||this.cancel())}commitStyles(){let t=this.options?.element;!this.isPseudoElement&&t?.isConnected&&this.animation.commitStyles?.()}get duration(){let t=this.animation.effect?.getComputedTiming?.().duration||0;return Fe(Number(t))}get iterationDuration(){let{delay:t=0}=this.options||{};return this.duration+Fe(t)}get time(){return Fe(Number(this.animation.currentTime)||0)}set time(t){let e=this.finishedTime!==null;this.manualStartTime=null,this.finishedTime=null,this.animation.currentTime=We(t),e&&this.animation.pause()}get speed(){return this.animation.playbackRate}set speed(t){t<0&&(this.finishedTime=null),this.animation.playbackRate=t}get state(){return this.finishedTime!==null?"finished":this.animation.playState}get startTime(){return this.manualStartTime??Number(this.animation.startTime)}set startTime(t){this.manualStartTime=this.animation.startTime=t}attachTimeline({timeline:t,onAttach:e,observe:i}){return this.allowFlatten&&this.animation.effect?.updateTiming({easing:"linear"}),this.animation.onfinish=null,t&&xg()?(this.animation.timeline=t,e?.(this.animation),Bn):i(this)}};var Sg={anticipate:So,backInOut:vo,circInOut:Mo};function uv(n){return n in Sg}function bg(n){typeof n.ease=="string"&&uv(n.ease)&&(n.ease=Sg[n.ease])}var Oo=10,Rc=class extends Cc{constructor(t){bg(t),vc(t),super(t),t.startTime!==void 0&&t.autoplay!==!1&&(this.startTime=t.startTime),this.options=t}elapsed(){return this.state==="running"?(ge.now()-this.startTime)*this.speed:this.time*1e3}sample(t){if(!this.sampler){let{motionValue:e,onUpdate:i,onComplete:s,onPlay:r,onStop:o,element:a,...l}=this.options;this.sampler=new zn({...l,autoplay:!1}),this.sampler.stop()}return this.sampler.sample(Math.max(0,t)).value}liveValue(){let{state:t}=this;if(t==="running"||t==="paused")return this.sample(this.elapsed())}updateMotionValue(t){let{motionValue:e,element:i,name:s}=this.options;if(!e)return;if(t!==void 0){e.set(t);return}let{speed:r}=this,o=this.elapsed(),a=this.state==="running"&&r?He(0,Oo,o):0,l=this.sample(o);i&&s&&Ec(i,s,l),e.setWithVelocity(this.sample(o-a*Math.sign(r)),l,a/Math.abs(r||1))}};var of=(n,t)=>t==="zIndex"?!1:!!(typeof n=="number"||Array.isArray(n)||typeof n=="string"&&(nn.test(n)||n==="0")&&!n.startsWith("url("));function hv(n){let t=n[0];if(n.length===1)return!0;for(let e=0;e<n.length;e++)if(n[e]!==t)return!0}function Mg(n,t,e,i){let s=n[0];if(s===null)return!1;if(t==="display"||t==="visibility")return!0;let r=n[n.length-1],o=of(s,t),a=of(r,t);return!o||!a?(o!==a&&Fn(!1,`You are trying to animate ${t} from "${s}" to "${r}". "${o?r:s}" is not an animatable value.`,"value-not-animatable"),!1):hv(n)||(e==="spring"||Ds(e))&&i}function Fo(n){n.duration=0,n.type="keyframes"}var af=new Set(["opacity","clipPath","filter","transform","backgroundColor"]);var fv=/^(?:oklch|oklab|lab|lch|color|color-mix|light-dark)\(/;function Tg(n){for(let t=0;t<n.length;t++)if(typeof n[t]=="string"&&fv.test(n[t]))return!0;return!1}var wg=new Set(["color","backgroundColor","outlineColor","fill","stroke","borderColor","borderTopColor","borderRightColor","borderBottomColor","borderLeftColor"]),cf=xo(()=>Object.hasOwnProperty.call(Element.prototype,"animate"));function Eg(n){let{motionValue:t,name:e,repeatDelay:i,repeatType:s,damping:r,type:o,keyframes:a}=n;if(!e||!(af.has(e)||wg.has(e)))return!1;let l=t?.owner?.current;if(!(l instanceof HTMLElement)&&!(l instanceof SVGElement))return!1;let{onUpdate:c,transformTemplate:u}=t.owner.getProps();return cf()&&(af.has(e)||wg.has(e)&&Tg(a))&&(e!=="transform"||!u)&&!c&&!i&&s!=="mirror"&&r!==0&&o!=="inertia"}var un=(n,t)=>t&&typeof n=="number"?t.transform(n):n;var Bo={x:"translateX",y:"translateY",z:"translateZ",transformPerspective:"perspective"},dv=sn.length;function Ag(n,t,e){let i="",s=!0;for(let o=0;o<dv;o++){let a=sn[o],l=n[a];if(l===void 0)continue;let c=!0;if(typeof l=="number")c=l===(a.startsWith("scale")?1:0);else{let u=parseFloat(l);c=a.startsWith("scale")?u===1:u===0}if(!c||e){let u=un(l,Ze[a]);if(!c){s=!1;let f=Bo[a]||a;i+=`${f}(${u}) `}e&&(t[a]=u)}}let r=n.pathRotation;return r&&(s=!1,i+=`rotate(${un(r,Ze.pathRotation)}) `),i=i.trim(),e?i=e(t,s?"":i):s&&(i="none"),i}var xr=new WeakMap;var pv=200,Pc=.001,mv=.1,gv=.001,_v=100,xv=n=>/^(linear|ease(In|Out|InOut))$/.test(n),lf=(n,t)=>n-t,Cg=(n,t,e)=>{let i=[];for(let s=0;s<=e;s++)i.push(ln(n,t,s/e));return i},Ic=n=>n.motionValue.owner,Lc=n=>xr.get(n),yr=(n,t)=>n.latestValues?n.latestValues[t]:n.getValue(t)?.get(),Rg=({name:n,motionValue:t})=>n&&sn.includes(n)&&t?.owner?.current instanceof HTMLElement&&cf()&&_r();function yv(n){let t=Ic(n),{onUpdate:e,transformTemplate:i}=t.getProps();return!n.isHandoff&&!e&&!n.hasOnUpdate&&!i&&n.type!=="inertia"&&(yr(t,"transform")||"none")==="none"&&!yr(t,"pathRotation")&&!t.projection?.isProjecting()}var Nc=class extends zn{constructor(t){let e=Ic(t).current,{driver:i=xc}=t,s,r=yv(t);t.driver=a=>{let l=i(a);return{js:l,now:l.now,start:(c=!0)=>{let u=Lc(e);!u||u.isJS?l.start(c):u.schedule(!1,!c)},stop:()=>{l.stop();let c=Lc(e);c&&!c.isFinishing&&c.release(s)}}},super(t),s=this,this.canAccelerate=r;let{stop:o}=this;this.stop=()=>{this.isAccelerated()&&this.sync(),o()}}get group(){return Lc(Ic(this.options).current)}get js(){return this.driver?.js}get name(){return this.options.name}timing(){let{startTime:t,speed:e,totalDuration:i}=this,{delay:s=0,repeatType:r}=this.options;return this.holdTime!==null?[1/0,0]:i===1/0?[t+s/e,this.resolvedDuration*(r==="loop"?1:2)/e||1]:[t+(s+i)/e,0]}isAccelerated(){let{group:t,state:e}=this;return t?.tracks.has(this)&&!t.isJS&&this.canAccelerate&&(e==="running"||e==="paused")}liveValue(){return this.isAccelerated()?this.sampleAt(ge.now()):void 0}tween(){let{keyframes:t,type:e,ease:i,times:s,repeat:r,delay:o=0}=this.options,a=Is(i)?Mi(i):xv(i)&&Do[i];if(a&&!r&&!s&&t.length===2&&e===Vn&&this.holdTime===null){let l=this.startTime+o/this.speed;return[l,l+this.resolvedDuration/this.speed,a]}}boundaries(t,e){let{startTime:i,speed:s,resolvedDuration:r,options:o}=this,{delay:a=0,repeat:l=0,repeatDelay:c=0,repeatType:u,times:f,keyframes:h,type:m}=o,_=(m||Vn)===Vn?f||Ls(h):[0,1],S=i+a/s,p=[];if(this.holdTime!==null||!(r>0))return p;for(let d=Math.max(0,Math.floor((t-S)*s/r));d<=l;d++){let M=S+d*r/s;if(M>e)break;for(let P of _){let b=M+(d%2&&u&&u!=="loop"?1-P:P)*(r-c)/s;b>t&&b<e&&p.push(b)}}return p}numberAt(t){return parseFloat(this.sampleAt(t,!0))}sync(){let t=ge.now();this.options.motionValue.setWithVelocity(this.sampleAt(t-Oo,!0),this.sampleAt(t,!0),Oo)}play(){this.isStopped||((this.group||vv(Ic(this.options))).tracks.add(this),super.play())}pause(){super.pause(),this.isAccelerated()&&(this.sync(),this.group.schedule(!1))}complete(){super.complete();let{group:t}=this;t&&!t.isJS&&this.canAccelerate&&this.tick(ge.now())}get time(){return this.isAccelerated()?Fe(He(0,this.totalDuration,this.at(ge.now())-(this.options.delay||0))):super.time}set time(t){super.time=t,this.isAccelerated()&&this.sync()}attachTimeline(t){return this.canAccelerate=!1,this.group?.demote(!0),super.attachTimeline(t)}};function vv(n){let t=n.current,e=new Set,i=new Map,s={},r=[],o=new Map,a=[],l=!1,c=!1,u=!1,f=!1,h=-1/0,m=I=>{for(let R of e)if(R.name===I)return!0},_=(I,R)=>{let N={};for(let B of I===void 0?sn:r){let k=i.get(B),Y=I===void 0?yr(n,B):k?k.sampleAt(R>I&&!k.timing()[1]?R:I):s[B];Y!==void 0&&(N[B]=Y)}return N},S=(I,R)=>{let N="",B=_(I,R);for(let k in B)N+=(Bo[k]||k)+"("+un(B[k],Ze[k])+") ";return N||"none"},p=(I=_())=>{t.style.transform=Ag(I,{})},d=(I=!0)=>{I&&p(),a.forEach(({animation:R})=>R.cancel()),a=[]},M=(I,R,N=1/0)=>{let B={animation:I,offset:R,end:N};I.startTime=ge.now()+R,N<1/0&&(I.onfinish=()=>{B.isDone=!0,a.some(k=>k.end===1/0)&&(I.cancel(),a=a.filter(k=>k!==B)),V.schedule(!1)}),I.oncancel=()=>a.includes(B)&&V.demote(),a.push(B)},P=(I,R,N)=>{let B=(Y,$)=>Math.abs(I($)-I(Y)),k=B(R,N);for(;N-R>.01;){let Y=(R+N)/2;B(R,Y)>B(Y,N)?N=Y:R=Y}return B(R,N)>k/2?[R,N]:[]},b=(I,R,N,B)=>{let k=Math.min(pv,Math.max(2,Math.ceil((N-R)/Oo)));if(B.length*4>k)return;let Y=Cg(R,N,k).concat(B).sort(lf),$=Mt=>ti(R,N,Mt),J,q;for(let Mt of I){let Ct=Y.map(ct=>Mt.numberAt(ct)),[kt]=Ct,K=Ct.map(ct=>ct-kt),tt=K[K.length-1],xt=K.some(ct=>Math.abs(ct)*Pc>Math.abs(tt))?0:tt,Nt=K.map(ct=>xt?ct/xt:ct);if(xt){if(!J)J=Nt,q=ct=>(Mt.numberAt(ct)-kt)/xt;else if(Nt.some((ct,Ft)=>!(Math.abs(ct-J[Ft])<=Pc)))return}else if(Nt.some(ct=>!(Math.abs(ct)<=Pc)))return}if(!J||J.every((Mt,Ct)=>Math.abs(Mt-$(Y[Ct]))<=Pc))return"linear";let st=[],rt=(Mt,Ct=q(Mt))=>st.push(Mc(Ct)+" "+Mc($(Mt)*100)+"%");return J.forEach((Mt,Ct)=>{Ct&&Math.abs(Mt-J[Ct-1])>.2&&P(q,Y[Ct-1],Y[Ct]).forEach(kt=>rt(kt)),rt(Y[Ct],Mt)}),"linear("+st+")"},E=(I,R,N,B)=>{let k=[R],Y=(st,rt)=>I.every(Mt=>!(Math.abs(Mt.numberAt((st+rt)/2)-(Mt.numberAt(st)+Mt.numberAt(rt))/2)>(Mt.name.startsWith("scale")?gv:mv))),$=(st,rt,Mt)=>{if(rt-st<1||Y(st,rt))k.push(rt);else if(Mt<4)$(st,(st+rt)/2,Mt+1),$((st+rt)/2,rt,Mt+1);else{for(let Ct of I)k.push(...P(kt=>Ct.numberAt(kt),st,rt));k.push(rt)}},J=Cg(R,N,Math.ceil((N-R)/100));for(let st of B)J.push(st,Math.min(st+.01,N));let q=R;for(let st of J.sort(lf))st>q&&$(q,st,0),q=st;return k.sort(lf)},w=I=>{let R;for(let N of I){let B=N.tween();if(!B||R?.some((k,Y)=>Y<2?Math.abs(B[Y]-k)>1:B[Y]!==k))return;R=B}return R},A=(I,R,N,B={fill:"both"},k,Y)=>{let $=I.flatMap(Mt=>Mt.boundaries(R,N)),J=Y||b(I,R,N,$),q=J?[R,N]:E(I,R,N,$),st=q.map(Mt=>S(Mt,k)),rt={transform:st};return J||(rt.offset=q.map(Mt=>ti(R,N,Mt))),st.every(Mt=>Mt===st[0])&&(p(_(R,k)),rt=null),t.animate(rt,{...B,duration:N-R,easing:J||"linear"})},x=I=>{let R=I,N=0,B=0,k=[],Y=[],$=new Set;i.clear(),o=new Map;for(let q of e){i.set(q.name,q);let[st,rt]=q.timing(),Mt=st===1/0;if(o.set(q,[q.at(I),q.speed,Mt]),Mt){q.sync();continue}if(q.speed<0)return;if(rt){if(N){let Ct=(st-B)/rt;if(Math.abs(rt-N)>1||Math.abs(Ct-Math.round(Ct))*N>1)return}else N=rt,B=st;Y.push(q)}else $.add(st);k.push(q),R=Math.max(R,st)}s={},r=sn.filter(q=>{if(i.has(q))return!0;let st=s[q]=yr(n,q);return st!==void 0&&parseFloat(st)!==(q.startsWith("scale")?1:0)}),d(!1);let J=!N&&w(k);try{if(J&&J[1]>I){let[q,st,rt]=J;M(A(k,q,st,void 0,void 0,rt),q-I,st-q)}else R>I&&(M(A(k,I,R),0,R-I),$.forEach(q=>q<R-1&&M(t.animate(null,{duration:q-I}),0,q-I)));if(N){let q=B+Math.floor((R-B)/N)*N;M(A(Y,q,q+N,{iterations:1/0,iterationStart:(R-q)/N,fill:"forwards"},R),R-I)}}catch{return}return a.length||d(),!0},T=I=>{let R,N=0;for(let B of e){let k=o.get(B);if(!k)return!1;let[Y,$,J]=k,q=B.at(I),st=B.timing()[0]===1/0;if(J){if(st&&q===Y)continue;return!1}let rt=(q-Y)/$,Mt=st?0:B.speed/$;if(R===void 0)R=rt,N=Mt;else if(Math.abs(rt-R)>1||Mt!==N)return!1}if(R===void 0)return!0;if(!a.length)return!1;for(let{offset:B,end:k,isDone:Y}of a){let $=R-B;if(k<1/0&&(Y?$<k-1:$<0||$>=k))return!1}for(let{animation:B,offset:k,isDone:Y}of a){if(Y)continue;let $=R-k;N?(B.playbackRate=N,B.startTime=I-$/N):(B.pause(),B.currentTime=$)}return!0},L=()=>e.size?!1:(u=!0,Lc(t)===V&&xr.delete(t),V.isJS||d(),!0),F=()=>{let I=ge.now();if(V.isJS||(V.isFinishing=!0,e.forEach(B=>{let[k,Y]=B.timing();B.state==="running"&&B.speed>0&&!Y&&k<=I+1&&(B.complete(),s[B.name]=yr(n,B.name),o.has(B)||(l=!0))}),V.isFinishing=!1),c=!1,u||(e.forEach(({state:B},k)=>{(B==="idle"||B==="finished")&&e.delete(k)}),L()))return;for(let B of e)if(!B.canAccelerate)return V.demote(!0);V.isJS&&(V.isJS=!1,l=!0,e.forEach(B=>B.js?.stop()));let R=l,N=f;if(l=f=!1,R||!T(I)){if(N){if(I-h<_v)return V.demote();h=I}if(!x(I))return V.demote()}},V={tracks:e,isJS:!1,isFinishing:!1,schedule(I,R){u||(l||(l=I),f||(f=!!R),c||(c=!0,mn.isProcessing?Be.render(F,!1,!0):queueMicrotask(F)))},release(I){let{state:R}=I;(R==="idle"||R==="finished")&&e.delete(I),L()||V.schedule(!0)},check(){if(!V.isJS){for(let I in s)if(yr(n,I)!==s[I]&&!m(I))return V.schedule(!0,!0)}},demote(I){V.isJS||u||(e.forEach(R=>{R.isAccelerated()&&R.sync(),I||(R.canAccelerate=!1)}),V.isJS=!0,o=new Map,d(),e.forEach(R=>R.state==="running"&&R.js?.start()))}};return xr.set(t,V),V}var Uc=class extends Xi{constructor(t){super(),this.stop=()=>{this._animation&&(this._animation.stop(),this.stopTimeline?.()),this.keyframeResolver?.cancel()},this.createdAt=ge.now();let{keyframes:e,name:i,motionValue:s,element:r}=t,o=t;o.autoplay??(o.autoplay=!0),o.delay??(o.delay=0),o.type??(o.type="keyframes"),o.repeat??(o.repeat=0),o.repeatDelay??(o.repeatDelay=0),o.repeatType??(o.repeatType="loop");let a=r?.KeyframeResolver||gr;this.keyframeResolver=new a(e,(l,c,u)=>this.onKeyframesResolved(l,c,o,!u),i,s,r),this.keyframeResolver?.scheduleResolve()}onKeyframesResolved(t,e,i,s){this.keyframeResolver=void 0;let{name:r,type:o,velocity:a,delay:l,isHandoff:c,onUpdate:u}=i;this.resolvedAt=ge.now();let f=!0;Mg(t,r,o,a)||(f=!1,(Ye.instantAnimations||!l)&&u?.(Si(t,i,e)),t[0]=t[t.length-1],Fo(i),i.repeat=0);let{onComplete:h}=i;i.finalKeyframe=e,i.keyframes=t,i.onComplete=()=>{h?.(),this.notifyFinished()};let m=f&&!c&&Eg(i),_=!m&&Rg(i);s&&(m||_||this.resolvedAt!==this.createdAt)&&(i.startTime??(i.startTime=Sc(this.createdAt,this.resolvedAt)));let S;if(m){i.element=i.motionValue?.owner?.current;try{S=new Rc(i)}catch{S=new zn(i)}}else _?S=new Nc(i):S=new zn(i);this.pendingTimeline&&(this.stopTimeline=S.attachTimeline(this.pendingTimeline),this.pendingTimeline=void 0),this._animation=S}get finished(){return this._animation?this._animation.finished:super.finished}then(t,e){return this.finished.finally(t).then(()=>{})}liveValue(){return this._animation?.liveValue?.()}get animation(){return this._animation||(this.keyframeResolver?.resume(),gg()),this._animation}get duration(){return this.animation.duration}get iterationDuration(){return this.animation.iterationDuration}get time(){return this.animation.time}set time(t){this.animation.time=t}get speed(){return this.animation.speed}get state(){return this.animation.state}set speed(t){this.animation.speed=t}get startTime(){return this.animation.startTime}attachTimeline(t){return this._animation?this.stopTimeline=this.animation.attachTimeline(t):this.pendingTimeline=t,()=>this.stop()}play(){this.animation.play()}pause(){this.animation.pause()}complete(){this.animation.complete()}cancel(){this._animation&&this.animation.cancel(),this.keyframeResolver?.cancel()}};var Dc=class{constructor(t){this.stop=()=>this.runAll("stop"),this.animations=t.filter(Boolean)}get finished(){return Promise.all(this.animations.map(t=>t.finished))}getAll(t){return this.animations[0][t]}setAll(t,e){for(let i=0;i<this.animations.length;i++)this.animations[i][t]=e}attachTimeline(t){let e=this.animations.map(i=>i.attachTimeline(t));return()=>{e.forEach((i,s)=>{i&&i(),this.animations[s].stop()})}}get time(){return this.getAll("time")}set time(t){this.setAll("time",t)}get speed(){return this.getAll("speed")}set speed(t){this.setAll("speed",t)}get state(){return this.getAll("state")}get startTime(){return this.getAll("startTime")}get duration(){return Pg(this.animations,"duration")}get iterationDuration(){return Pg(this.animations,"iterationDuration")}runAll(t){this.animations.forEach(e=>e[t]())}play(){this.runAll("play")}pause(){this.runAll("pause")}cancel(){this.runAll("cancel")}complete(){this.runAll("complete")}};function Pg(n,t){let e=0;for(let i=0;i<n.length;i++){let s=n[i][t];s!==null&&s>e&&(e=s)}return e}var ko=class extends Dc{then(t,e){return this.finished.finally(t).then(()=>{})}};var Ig=30,Sv=n=>!isNaN(parseFloat(n)),uf={current:void 0},si=class{constructor(t,e={}){this.canTrackVelocity=null,this.events={},this.updateAndNotify=i=>{let s=ge.now();if(this.updatedAt!==s&&this.setPrevFrameValue(),this.prev=this.current,this.setCurrent(i),this.current!==this.prev&&(this.notifyChange(),this.dependents))for(let r of this.dependents)r.dirty()},this.hasAnimated=!1,this.setCurrent(t),this.owner=e.owner}setCurrent(t){this.current=t,this.updatedAt=ge.now(),this.canTrackVelocity===null&&t!==void 0&&(this.canTrackVelocity=Sv(this.current))}setPrevFrameValue(t=this.current){this.prevFrameValue=t,this.prevUpdatedAt=this.updatedAt}onChange(t){return this.on("change",t)}on(t,e){var i;return t==="change"?this.onChangeSubscribe(e):((i=this.events)[t]||(i[t]=new rr)).add(e)}onChangeSubscribe(t){let{events:e}=this;return!e.change&&!this.changeSubscriber?this.changeSubscriber=t:(e.change||(e.change=new rr,e.change.add(this.changeSubscriber),this.changeSubscriber=void 0),e.change.add(t)),()=>{this.changeSubscriber===t?this.changeSubscriber=void 0:e.change?.remove(t),this.stopIfUnobserved()}}stopIfUnobserved(){Be.read(()=>{!this.changeSubscriber&&!this.events.change?.getSize()&&this.stop()})}clearListeners(){this.changeSubscriber=void 0;for(let t in this.events)this.events[t].clear()}attach(t,e){this.passiveEffect=t,this.stopPassiveEffect=e}set(t){this.passiveEffect?this.passiveEffect(t,this.updateAndNotify):this.updateAndNotify(t)}setWithVelocity(t,e,i){this.set(e),this.prev=void 0,this.prevFrameValue=t,this.prevUpdatedAt=this.updatedAt-i}jump(t,e=!0){this.updateAndNotify(t),this.prev=t,this.prevUpdatedAt=this.prevFrameValue=void 0,e&&this.stop(),this.stopPassiveEffect&&this.stopPassiveEffect()}dirty(){this.notifyChange()}notifyChange(){let{current:t,changeSubscriber:e}=this;e?e(t):this.events.change?.notify(t)}addDependent(t){this.dependents||(this.dependents=new Set),this.dependents.add(t)}removeDependent(t){this.dependents&&this.dependents.delete(t)}get(){uf.current&&uf.current.push(this);let t=this.animation?.liveValue?.();return t===void 0?this.current:t}getCurrent(){return this.current}getPrevious(){return this.prev}getVelocity(){let t=ge.now();if(!this.canTrackVelocity||this.prevFrameValue===void 0||t-this.updatedAt>Ig)return 0;let e=Math.min(this.updatedAt-this.prevUpdatedAt,Ig);return yo(parseFloat(this.current)-parseFloat(this.prevFrameValue),e)}start(t){return this.stop(),new Promise(e=>{this.hasAnimated=!0;let i=!1,s;s=t(()=>{i=!0,this.events.animationComplete?.notify(),this.animation===s&&this.clearAnimation(),e()}),i||(this.animation=s),this.events.animationStart?.notify()})}stop(){this.animation&&(this.animation.stop(),this.events.animationCancel&&this.events.animationCancel.notify()),this.clearAnimation()}isAnimating(){return!!this.animation}clearAnimation(){this.animation=void 0}destroy(){this.dependents?.clear(),this.events.destroy?.notify(),this.clearListeners(),this.stop(),this.stopPassiveEffect&&this.stopPassiveEffect()}};function Os(n,t){return new si(n,t)}function Lg(n,t){if(n?.inherit&&t){let{inherit:e,...i}=n;return{...t,...i}}return n}function Ng(n,t){let e=n?.[t]??n?.default??n;return e!==n?Lg(e,n):e}var bv={type:"spring",stiffness:500,damping:25,restSpeed:10},Mv=n=>({type:"spring",stiffness:550,damping:n===0?2*Math.sqrt(550):30,restSpeed:10}),Tv={type:"keyframes",duration:.8},wv={type:"keyframes",ease:[.25,.1,.35,1],duration:.3},Ug=(n,{keyframes:t})=>t.length>2?Tv:bi.has(n)?n.startsWith("scale")?Mv(t[1]):bv:wv;var Ev=new Set(["when","delay","delayChildren","staggerChildren","staggerDirection","repeat","repeatType","repeatDelay","from","elapsed"]);function Dg(n){for(let t in n)if(!Ev.has(t))return!0;return!1}var Oc=(n,t,e,i={},s,r)=>o=>{let a=Ng(i,n)||{},l=a.delay||i.delay||0,{elapsed:c=0}=i;c=c-We(l);let u={keyframes:Array.isArray(e)?e:[null,e],ease:"easeOut",velocity:t.getVelocity(),...a,delay:-c,onUpdate:h=>{t.set(h),a.onUpdate&&a.onUpdate(h)},onComplete:()=>{o(),a.onComplete&&a.onComplete()},name:n,motionValue:t,element:r?void 0:s,hasOnUpdate:!!a.onUpdate};Dg(a)||Object.assign(u,Ug(n,u)),u.duration&&(u.duration=We(u.duration)),u.repeatDelay&&(u.repeatDelay=We(u.repeatDelay)),u.from!==void 0&&(u.keyframes[0]=u.from);let f=!1;if((u.type===!1||u.duration===0&&!u.repeatDelay)&&(Fo(u),u.delay===0&&(f=!0)),(Ye.instantAnimations||Ye.skipAnimations||s?.shouldSkipAnimations||a.skipAnimations)&&(f=!0,Fo(u),u.delay=0),u.allowFlatten=!a.type&&!a.ease,f&&!r&&t.get()!==void 0){let h=Si(u.keyframes,a);if(h!==void 0){Be.update(()=>{u.onUpdate(h),u.onComplete()});return}}return a.isSync?new zn(u):new Uc(u)};var Av=/^var\(--(?:([\w-]+)|([\w-]+), ?([a-zA-Z\d ()%#.,-]+))\)/u;function Cv(n){let t=Av.exec(n);if(!t)return[,];let[,e,i,s]=t;return[`--${e??i}`,s]}var Rv=4;function hf(n,t,e=1){en(e<=Rv,`Max CSS variable fallback depth detected in property "${n}". This may indicate a circular fallback dependency.`,"max-css-var-depth");let[i,s]=Cv(n);if(!i)return;let r=window.getComputedStyle(t).getPropertyValue(i);if(r){let o=r.trim();return go(o)?parseFloat(o):o}return cr(s)?hf(s,t,e+1):s}var Fc=new Set(["width","height","top","left","right","bottom",...sn]);var Fs=n=>!!(n&&n.getVelocity);function Vo(n){return n.replace(/([A-Z])/g,t=>`-${t.toLowerCase()}`)}var Og={test:n=>n==="auto",parse:n=>n};var Fg=n=>t=>t.test(n);var Pv=[ni,bt,Wi,kn,Dm,Um,Og],ff=n=>Pv.find(Fg(n));function Bg(n){return typeof n=="number"?n===0:n!==null?n==="none"||n==="0"||_o(n):!0}var Iv=new Set(["auto","none","0"]);function kg(n,t,e){let i=0,s;for(;i<n.length&&!s;){let r=n[i];typeof r=="string"&&!Iv.has(r)&&Gm(r)&&(s=n[i]),i++}if(s&&e)for(let r of t)n[r]!==s&&(n[r]=Tc(e,s))}var Bc=class extends gr{constructor(t,e,i,s,r){super(t,e,i,s,r,!0)}scheduleResolve(){if(this.canReadNow()&&(this.readKeyframes(),!this.needsMeasurement))return this.complete();super.scheduleResolve()}canReadNow(){let{unresolvedKeyframes:t,element:e,motionValue:i}=this,s=t[0]??i?.get();if(!e?.current||s===void 0)return!1;for(let r=0;r<t.length;r++)if(pc(r?t[r]:s))return!1;return!0}readKeyframes(){let{unresolvedKeyframes:t,element:e,name:i}=this;if(!e||!e.current)return;super.readKeyframes();for(let u=0;u<t.length;u++){let f=t[u];if(typeof f=="string"&&(f=f.trim(),cr(f))){let h=hf(f,e.current);h!==void 0&&(t[u]=h),u===t.length-1&&(this.finalKeyframe=f)}}if(this.resolveNoneKeyframes(),!Fc.has(i)||t.length!==2)return;let[s,r]=t;if(typeof s=="number"&&typeof r=="number")return;let o=ff(s),a=ff(r),l=pc(s),c=pc(r);if(l!==c&&qi[i]){this.needsMeasurement=!0;return}if(o!==a)if(tf(o)&&tf(a))for(let u=0;u<t.length;u++){let f=t[u];typeof f=="string"&&(t[u]=parseFloat(f))}else qi[i]&&(this.needsMeasurement=!0)}resolveNoneKeyframes(){let{unresolvedKeyframes:t,name:e}=this,i=[];for(let s=0;s<t.length;s++)(t[s]===null||Bg(t[s]))&&i.push(s);i.length&&kg(t,i,e)}measure(){let{element:t,name:e}=this;return qi[e](window.getComputedStyle(t.current),()=>t.measureViewportBox())}measureInitialState(){let{element:t,unresolvedKeyframes:e,name:i}=this;if(!t||!t.current)return;i==="height"&&(this.suspendedScrollY=window.pageYOffset),this.measuredOrigin=this.measure(),e[0]=this.measuredOrigin;let s=e[e.length-1];s!==void 0&&this.motionValue?.jump(s,!1)}measureEndState(){let{element:t,unresolvedKeyframes:e}=this;if(!t||!t.current)return;this.motionValue?.jump(this.measuredOrigin,!1);let i=e.length-1,s=e[i];e[i]=this.measure(),s!==null&&this.finalKeyframe===void 0&&(this.finalKeyframe=s),this.removedTransforms?.length&&this.removedTransforms.forEach(([r,o])=>{t.getValue(r).set(o)}),this.resolveNoneKeyframes()}};var df=[];function pf(n){en(typeof n.test=="function"&&typeof n.read=="function","Effects passed to animate.addEffect() need test() and read().","effect-missing-test"),kc(n),df.unshift(n)}function kc(n){xi(df,n)}function mf(n){return df.find(t=>t.test(n))}function Vc(n,t,e={},i){let s=[],{velocity:r,path:o}=e,a=e.reduceMotion??i?.shouldReduceMotion;o?.animateValues&&i&&(t={...t},o.animateValues(n,t,e,0,s));for(let c in t){if(c==="transition"||c==="transitionEnd")continue;let u=t[c];if(u===void 0)continue;let f=n(c),h=f.get();if(h!==void 0&&!f.isAnimating()&&!Array.isArray(u)&&u===h&&!r){Be.update(()=>f.set(u));continue}f.start(Oc(c,f,u,a&&Fc.has(c)?{type:!1}:e,i)),f.animation&&s.push(f.animation)}let{transitionEnd:l}=t;if(l){let c=()=>Be.update(()=>{for(let u in l)n(u).set(l[u])});s.length?Promise.all(s).then(c):c()}return s}function zo(n,t,e,i,s){return Vc(r=>{let o=n.get(t,r);if(!o){let a;if(!s){let l=e[r];a=Lv(l)??n.read(t,r,l),en(a!==void 0,`"${r}" can't be read from the animated subject. Provide [from, to] keyframes.`,"effect-unreadable-value")}o=Os(a,{owner:s}),n(t,{[r]:o})}return o},e,i,s)}function Lv(n){let t=Array.isArray(n)?n[0]:void 0;return t===null?void 0:t}function gf(n){return Cs(n)&&"offsetHeight"in n&&!("ownerSVGElement"in n)}function vr(n){return Cs(n)&&"ownerSVGElement"in n}function _f(n,t,e){if(n==null)return[];if(n instanceof EventTarget)return[n];if(typeof n=="string"){let i=document;t&&(i=t.current);let s=e?.[n]??i.querySelectorAll(n);return s?Array.from(s):[]}return Array.from(n).filter(i=>i!=null)}var zc=class{constructor(t=Be.render){this.step=t,this.values=new Map,this.pending=[],this.numPending=0,this.flush=()=>{let{pending:e,numPending:i}=this;this.numPending=0;for(let s=0;s<i;s++)e[s]()}}set(t,e,i,s){if(this.values.get(t)?.onRemove(),s)for(let l of this.values.values())l.value===s&&(i=l.render);let r=()=>i&&this.schedule(i);e.get()!==void 0&&r();let o=e.on("change",r),a=()=>{o(),i&&!s&&this.cancel(i),this.values.get(t)?.onRemove===a&&this.values.delete(t)};return this.values.set(t,{value:e,render:s?void 0:i,onRemove:a}),a}get(t){return this.values.get(t)?.value}release(){let t=new Map;return this.values.forEach((e,i)=>{t.set(i,e.value),e.onRemove()}),this.transformKeys=this.transformValues=void 0,t}schedule(t){let{pending:e,numPending:i}=this;for(let s=0;s<i;s++)if(e[s]===t)return;i||this.step(this.flush),e[this.numPending++]=t}cancel(t){let{pending:e}=this;for(let i=0;i<this.numPending;i++)if(e[i]===t){e[i]=e[--this.numPending];return}}};function Sr(n,{step:t,...e}={}){let i=new WeakMap;return Object.assign((r,o)=>{let a=i.get(r)??new zc(t);i.set(r,a);let l=[];for(let c in o){let u=o[c],f=n(r,a,c,u);l.push(f)}return()=>{for(let c of l)c()}},e,{get:(r,o)=>i.get(r)?.get(o),flush:r=>i.get(r)?.flush(),state:r=>i.get(r)})}var Vg={};function zg(n){let t="",{transformKeys:e=[],transformValues:i={}}=n;for(let r=0;r<e.length;r++){let o=e[r],a=i[o].getCurrent();if(a===void 0)continue;(typeof a=="number"?a:parseFloat(a))!==(o.startsWith("scale")?1:0)&&(t+=(t&&" ")+(Vg[o]||(Vg[o]=(Bo[o]||o)+"("))+un(a,Uo[o])+")")}let s=n.get("pathRotation")?.get();return s&&(t+=(t&&" ")+"rotate("+un(s,Uo.pathRotation)+")"),t||"none"}var yf=new Set(["originX","originY","originZ"]),xf=(n,t)=>un(n.get(t)?.get(),Ze[t]),Gc=(n,t,e,i)=>{let s,r;if(bi.has(e)){if(e!=="pathRotation"){let o=t.transformKeys??(t.transformKeys=[]);(t.transformValues??(t.transformValues={}))[e]=i,o.includes(e)||(o.push(e),o.sort((a,l)=>sn.indexOf(a)-sn.indexOf(l)))}t.get("transform")||(!gf(n)&&!t.get("transformBox")&&Gc(n,t,"transformBox",new si("fill-box")),t.set("transform",new si("none"),()=>{xr.get(n)?.check(),n.style.transform=zg(t)})),r=t.get("transform")}else yf.has(e)?(t.get("transformOrigin")||t.set("transformOrigin",new si(""),()=>{let o=xf(t,"originX")??"50%",a=xf(t,"originY")??"50%",l=xf(t,"originZ")??0;n.style.transformOrigin=`${o} ${a} ${l}`}),r=t.get("transformOrigin")):Yi(e)?s=()=>{n.style.setProperty(e,i.getCurrent())}:s=()=>{n.style[e]=un(i.getCurrent(),Ze[e])};return t.set(e,i,s,r)},Nv=n=>gf(n)||vr(n),vf=(n,t)=>{if(bi.has(t))return ug(n,t);let e=getComputedStyle(n),i=Yi(t)?e.getPropertyValue(t):e[t];return typeof i=="string"&&i.trim()||0},Gg=Sr(Gc,{test:Nv,read:vf});var Hg=["transform","opacity","clipPath","filter","offsetDistance","offsetPath","offsetRotate","offsetAnchor"];function Uv(n,t){if(!(t in n))return!1;let e=Object.getOwnPropertyDescriptor(Object.getPrototypeOf(n),t)||Object.getOwnPropertyDescriptor(n,t);return e&&typeof e.set=="function"}var Sf=(n,t,e,i,s=e)=>{let r=Uv(n,s);!r&&(s.startsWith("data")||s.startsWith("aria"))&&(s=Vo(s));let o=Ze[e]||Ze[s],a=r?()=>{n[s]=un(i.get(),Ze[e])}:()=>{let l=un(i.get(),o);l==null?n.removeAttribute(s):n.setAttribute(s,String(l))};return t.set(e,i,a)};function Dv(n,t,e,i){return Be.render(()=>n.setAttribute("pathLength","1")),e==="pathOffset"?t.set(e,i,()=>{let s=i.get();n.setAttribute("stroke-dashoffset",`${-s}`)}):(t.get("stroke-dasharray")||t.set("stroke-dasharray",new si("1 1"),()=>{let s=t.get("pathLength")?.get()??1,r=t.get("pathSpacing")?.get();n.setAttribute("stroke-dasharray",`${s} ${r??1-Number(s)}`)}),t.set(e,i,void 0,t.get("stroke-dasharray")))}var Ov=(n,t,e,i)=>e.startsWith("path")&&!bi.has(e)?Dv(n,t,e,i):e.startsWith("attr")?Sf(n,t,e,i,$g(e)):(bi.has(e)||yf.has(e)||Yi(e)||e in n.style?Gc:Sf)(n,t,e,i),Fv=(n,t)=>bi.has(t)?Ze[t]?.default||0:Yi(t)||Hg.includes(t)?vf(n,t)||n.getAttribute(Vo(t))||0:(t=$g(t),n.getAttribute(Vo(t))??n.getAttribute(t)??void 0),Wg=Sr(Ov,{test:vr,read:Fv});function $g(n){return n.replace(/^attr([A-Z])/,(t,e)=>e.toLowerCase())}function Xg({top:n,left:t,right:e,bottom:i}){return{x:{min:t,max:e},y:{min:n,max:i}}}function qg(n,t){if(!t)return n;let e=t({x:n.left,y:n.top}),i=t({x:n.right,y:n.bottom});return{top:e.y,left:e.x,bottom:i.y,right:i.x}}function Yg(n,t){return Xg(qg(n.getBoundingClientRect(),t))}var Bv={},kv=n=>vr(n)?Wg:Gg,bf=class{constructor(t,e){this.effect=t,this.current=e,this.KeyframeResolver=Bc}getValue(t){return this.effect.get(this.current,t)}readValue(t,e){return this.effect.read(this.current,t,e)}render(){this.effect.flush(this.current)}measureViewportBox(){return Yg(this.current)}getProps(){return Bv}};function Mf(n,t,e,i){if(i)return Vc(r=>i.getValue(r,null),t,e,i);let s=kv(n);return zo(s,n,t,e,new bf(s,n))}var Tf=Sr((n,t,e,i)=>t.set(e,i,()=>{n[e]=i.get()}),{test:n=>Cs(n),read:(n,t)=>{let e=n[t];return typeof e=="string"||typeof e=="number"?e:void 0}});function wf(n,t,e){let i=Fs(n)?n:Os(n);return i.start(Oc("",i,t,e)),i.animation}var Ef=new WeakMap;function Go(n){return typeof n=="object"&&!Array.isArray(n)}function Hc(n,t,e,i){return n==null?[]:typeof n=="string"&&Go(t)?_f(n,e,i):n instanceof NodeList?Array.from(n):Array.isArray(n)?n.filter(s=>s!=null):[n]}function Zg(n,t,e){return n*(t+1)+e*t}function Af(n,t,e,i){return typeof t=="number"?t:t.startsWith("-")||t.startsWith("+")?Math.max(0,n+parseFloat(t)):t==="<"?e:t.startsWith("<")?Math.max(0,e+parseFloat(t.slice(1))):i.get(t)??n}function Vv(n,t,e){for(let i=0;i<n.length;i++){let s=n[i];s.at>t&&s.at<e&&(xi(n,s),i--)}}function Kg(n,t,e,i,s,r){Vv(n,s,r);for(let o=0;o<t.length;o++)n.push({value:t[o],at:ln(s,r,i[o]),easing:wo(e,o)})}function Jg(n,t,e=0){let i=t+1+t*e;for(let s=0;s<n.length;s++)n[s]=n[s]/i}function jg(n,t){return n.at===t.at?n.value===null?1:t.value===null?-1:0:n.at-t.at}var zv="easeInOut",Cf=20;function e0(n,{defaultTransition:t={},...e}={},i,s){let r=t.duration||.3,o=new Map,a=new Map,l={},c=new Map,u=0,f=0,h=0;for(let m=0;m<n.length;m++){let _=n[m];if(typeof _=="string"){c.set(_,f);continue}else if(!Array.isArray(_)){c.set(_.name,Af(f,_.at,u,c));continue}let[S,p,d={}]=_;d.at!==void 0&&(f=Af(f,d.at,u,c));let M=0,P=(b,E,w,A=0,x=0)=>{let T=Gv(b),{delay:L=0,times:F=Ls(T),type:V=t.type||"keyframes",repeat:I,repeatType:R,repeatDelay:N=0,...B}=E,{ease:k=t.ease||"easeOut",duration:Y}=E,$=typeof L=="function"?L(A,x):L,J=T.length,q=Ds(V)?V:s?.[V||"keyframes"];if(J<=2&&q){let Ct=100;if(J===2&&$v(T)){let tt=T[1]-T[0];Ct=Math.abs(tt)}let kt={...t,...B};Y!==void 0&&(kt.duration=We(Y));let K=Po(kt,Ct,q);k=K.ease,Y=K.duration}Y??(Y=r);let st=f+$;F.length===1&&F[0]===0&&(F[1]=1);let rt=F.length-T.length;if(rt>0&&Io(F,rt),T.length===1&&T.unshift(null),I&&Fn(I<Cf,`Sequence segments can't repeat ${I} times \u2014 ignoring repeat option. Use a value below ${Cf} or apply repeat at the sequence level instead.`),I&&I<Cf){let Ct=Y>0?N/Y:0;Y=Zg(Y,I,N);let kt=[...T],K=[...F];k=Array.isArray(k)?[...k]:[k];let tt=[...k],xt=R==="reverse"||R==="mirror",Nt=kt,ct=tt;xt&&(Nt=[...kt].reverse(),R==="reverse"&&(ct=[...tt].reverse().map(Ft=>typeof Ft=="function"?Ps(Ft):Ft)));for(let Ft=0;Ft<I;Ft++){let Ee=xt&&Ft%2===0,Wt=Ee?Nt:kt,te=Ee?ct:tt,le=(Ft+1)*(1+Ct);Ct>0&&(T.push(T[T.length-1]),F.push(le),k.push("linear")),T.push(...Wt);for(let Gt=0;Gt<Wt.length;Gt++)F.push(K[Gt]+le),k.push(Gt===0?"linear":wo(te,Gt-1))}Jg(F,I,Ct)}let Mt=st+Y;Kg(w,T,k,F,st,Mt),M=Math.max($+Y,M),h=Math.max(Mt,h)};if(Fs(S)){let b=Qg(S,a);P(p,d,t0("default",b))}else{let b=Hc(S,p,i,l),E=b.length;for(let w=0;w<E;w++){p=p,d=d;let A=b[w],x=Qg(A,a);for(let T in p)P(p[T],Hv(d,T),t0(T,x),w,E)}}u=f,f+=M}return a.forEach((m,_)=>{for(let S in m){let p=m[S];p.sort(jg);let d=[],M=[],P=[];for(let A=0;A<p.length;A++){let{at:x,value:T,easing:L}=p[A];d.push(T),M.push(ti(0,h,x)),P.push(L||"easeOut")}M[0]!==0&&(M.unshift(0),d.unshift(d[0]),P.unshift(zv)),M[M.length-1]!==1&&(M.push(1),d.push(null)),o.has(_)||o.set(_,{keyframes:{},transition:{}});let b=o.get(_);b.keyframes[S]=d;let{type:E,...w}=t;b.transition[S]={...w,duration:h,ease:P,times:M,...e}}}),o}function Qg(n,t){return!t.has(n)&&t.set(n,{}),t.get(n)}function t0(n,t){return t[n]||(t[n]=[]),t[n]}function Gv(n){return Array.isArray(n)?n:[n]}function Hv(n,t){return n&&n[t]?{...n,...n[t]}:{...n}}var Wv=n=>typeof n=="number",$v=n=>n.every(Wv);function Xv(n,t){return Fs(n)||typeof n=="number"||typeof n=="string"&&!Go(t)}function Wc(n,t,e,i){let s=[];if(Xv(n,t))s.push(wf(n,Go(t)&&t.default||t,e&&(e.default||e)));else{if(n==null)return s;let r=Hc(n,t,i),o=r.length;en(!!o,"No valid elements provided.","no-valid-elements");for(let a=0;a<o;a++){let l=r[a],c={...e};"delay"in c&&typeof c.delay=="function"&&(c.delay=c.delay(a,o)),l instanceof Element?s.push(...Mf(l,t,c,Ef.get(l))):s.push(...zo(mf(l)??Tf,l,t,c))}}return s}function n0(n,t,e){let i=[],s=n.map(o=>{if(Array.isArray(o)&&typeof o[0]=="function"){let a=o[0],l=Os(0);return l.on("change",a),o.length===1?[l,[0,1]]:o.length===2?[l,[0,1],o[1]]:[l,o[1],o[2]]}return o});return e0(s,t,e,{spring:vi}).forEach(({keyframes:o,transition:a},l)=>{i.push(...Wc(l,o,a))}),i}function qv(n){return Array.isArray(n)&&n.some(Array.isArray)}function i0(n={}){let{scope:t,reduceMotion:e,skipAnimations:i}=n;function s(r,o,a){let l=[],c,u={};if(e!==void 0&&(u.reduceMotion=e),i!==void 0&&(u.skipAnimations=i),qv(r)){let{onComplete:h,...m}=o||{};typeof h=="function"&&(c=h),l=n0(r,{...u,...m},t)}else{let{onComplete:h,...m}=a||{};typeof h=="function"&&(c=h),l=Wc(r,o,{...u,...m},t)}let f=new ko(l);return c&&f.finished.then(c),t&&(t.animations.push(f),f.finished.then(()=>{xi(t.animations,f)})),f}return s}var Ho=Object.assign(i0(),{addEffect:pf,removeEffect:kc});var A0=0,sd=1,C0=2;var xa=1,R0=2,Gr=3,as=0,rn=1,ui=2,hi=0,Hr=1,rd=2,od=3,ad=4,P0=5;var Ws=100,I0=101,L0=102,N0=103,U0=104,D0=200,O0=201,F0=202,B0=203,cd=204,ld=205,k0=206,V0=207,z0=208,G0=209,H0=210,W0=211,$0=212,X0=213,q0=214,xl=0,yl=1,vl=2,Or=3,Sl=4,bl=5,Ml=6,Tl=7,ud=0,Y0=1,Z0=2,qn=0,hd=1,fd=2,dd=3,pd=4,md=5,gd=6,_d=7;var xd=300,cs=301,$s=302,jl=303,Ql=304,ya=306,wl=1e3,oi=1001,El=1002,Ge=1003,K0=1004;var va=1005;var $e=1006,tu=1007;var ls=1008;var Mn=1009,yd=1010,vd=1011,Wr=1012,eu=1013,Yn=1014,Zn=1015,Kn=1016,nu=1017,iu=1018,$r=1020,Sd=35902,bd=35899,Md=1021,Td=1022,Ln=1023,ai=1026,us=1027,wd=1028,su=1029,hs=1030,ru=1031;var ou=1033,Sa=33776,ba=33777,Ma=33778,Ta=33779,au=35840,cu=35841,lu=35842,uu=35843,hu=36196,fu=37492,du=37496,pu=37488,mu=37489,wa=37490,gu=37491,_u=37808,xu=37809,yu=37810,vu=37811,Su=37812,bu=37813,Mu=37814,Tu=37815,wu=37816,Eu=37817,Au=37818,Cu=37819,Ru=37820,Pu=37821,Iu=36492,Lu=36494,Nu=36495,Uu=36283,Du=36284,Ea=36285,Ou=36286;var Ko=2300,Al=2301,ml=2302,jf=2303,Qf=2400,td=2401,ed=2402;var J0=3200;var Ed=0,j0=1,Li="",xn="srgb",Jo="srgb-linear",jo="linear",ce="srgb";var gl=7680;var Q0=519,t_=512,e_=513,n_=514,Fu=515,i_=516,s_=517,Bu=518,r_=519,o_=35044;var Ad="300 es",Xn=2e3,Qo=2001;function Yv(n){for(let t=n.length-1;t>=0;--t)if(n[t]>=65535)return!0;return!1}function Zv(n){return ArrayBuffer.isView(n)&&!(n instanceof DataView)}function ta(n){return document.createElementNS("http://www.w3.org/1999/xhtml",n)}function a_(){let n=ta("canvas");return n.style.display="block",n}var s0={},Fr=null;function Cd(...n){let t="THREE."+n.shift();Fr?Fr("log",t,...n):console.log(t,...n)}function c_(n){let t=n[0];if(typeof t=="string"&&t.startsWith("TSL:")){let e=n[1];e&&e.isStackTrace?n[0]+=" "+e.getLocation():n[1]='Stack trace not available. Enable "THREE.Node.captureStackTrace" to capture stack traces.'}return n}function Dt(...n){n=c_(n);let t="THREE."+n.shift();if(Fr)Fr("warn",t,...n);else{let e=n[0];e&&e.isStackTrace?console.warn(e.getError(t)):console.warn(t,...n)}}function Bt(...n){n=c_(n);let t="THREE."+n.shift();if(Fr)Fr("error",t,...n);else{let e=n[0];e&&e.isStackTrace?console.error(e.getError(t)):console.error(t,...n)}}function Gs(...n){let t=n.join(" ");t in s0||(s0[t]=!0,Dt(...n))}function l_(n,t,e){return new Promise(function(i,s){function r(){switch(n.clientWaitSync(t,n.SYNC_FLUSH_COMMANDS_BIT,0)){case n.WAIT_FAILED:s();break;case n.TIMEOUT_EXPIRED:setTimeout(r,e);break;default:i()}}setTimeout(r,e)})}var u_={[xl]:yl,[vl]:Ml,[Sl]:Tl,[Or]:bl,[yl]:xl,[Ml]:vl,[Tl]:Sl,[bl]:Or},ci=class{addEventListener(t,e){this._listeners===void 0&&(this._listeners={});let i=this._listeners;i[t]===void 0&&(i[t]=[]),i[t].indexOf(e)===-1&&i[t].push(e)}hasEventListener(t,e){let i=this._listeners;return i===void 0?!1:i[t]!==void 0&&i[t].indexOf(e)!==-1}removeEventListener(t,e){let i=this._listeners;if(i===void 0)return;let s=i[t];if(s!==void 0){let r=s.indexOf(e);r!==-1&&s.splice(r,1)}}dispatchEvent(t){let e=this._listeners;if(e===void 0)return;let i=e[t.type];if(i!==void 0){t.target=this;let s=i.slice(0);for(let r=0,o=s.length;r<o;r++)s[r].call(this,t);t.target=null}}},Ke=["00","01","02","03","04","05","06","07","08","09","0a","0b","0c","0d","0e","0f","10","11","12","13","14","15","16","17","18","19","1a","1b","1c","1d","1e","1f","20","21","22","23","24","25","26","27","28","29","2a","2b","2c","2d","2e","2f","30","31","32","33","34","35","36","37","38","39","3a","3b","3c","3d","3e","3f","40","41","42","43","44","45","46","47","48","49","4a","4b","4c","4d","4e","4f","50","51","52","53","54","55","56","57","58","59","5a","5b","5c","5d","5e","5f","60","61","62","63","64","65","66","67","68","69","6a","6b","6c","6d","6e","6f","70","71","72","73","74","75","76","77","78","79","7a","7b","7c","7d","7e","7f","80","81","82","83","84","85","86","87","88","89","8a","8b","8c","8d","8e","8f","90","91","92","93","94","95","96","97","98","99","9a","9b","9c","9d","9e","9f","a0","a1","a2","a3","a4","a5","a6","a7","a8","a9","aa","ab","ac","ad","ae","af","b0","b1","b2","b3","b4","b5","b6","b7","b8","b9","ba","bb","bc","bd","be","bf","c0","c1","c2","c3","c4","c5","c6","c7","c8","c9","ca","cb","cc","cd","ce","cf","d0","d1","d2","d3","d4","d5","d6","d7","d8","d9","da","db","dc","dd","de","df","e0","e1","e2","e3","e4","e5","e6","e7","e8","e9","ea","eb","ec","ed","ee","ef","f0","f1","f2","f3","f4","f5","f6","f7","f8","f9","fa","fb","fc","fd","fe","ff"];var _l=Math.PI/180,Cl=180/Math.PI;function Aa(){let n=Math.random()*4294967295|0,t=Math.random()*4294967295|0,e=Math.random()*4294967295|0,i=Math.random()*4294967295|0;return(Ke[n&255]+Ke[n>>8&255]+Ke[n>>16&255]+Ke[n>>24&255]+"-"+Ke[t&255]+Ke[t>>8&255]+"-"+Ke[t>>16&15|64]+Ke[t>>24&255]+"-"+Ke[e&63|128]+Ke[e>>8&255]+"-"+Ke[e>>16&255]+Ke[e>>24&255]+Ke[i&255]+Ke[i>>8&255]+Ke[i>>16&255]+Ke[i>>24&255]).toLowerCase()}function Qt(n,t,e){return Math.max(t,Math.min(e,n))}function Kv(n,t){return(n%t+t)%t}function Rf(n,t,e){return(1-e)*n+e*t}function Wo(n,t){switch(t.constructor){case Float32Array:return n;case Uint32Array:return n/4294967295;case Uint16Array:return n/65535;case Uint8Array:case Uint8ClampedArray:return n/255;case Int32Array:return Math.max(n/2147483647,-1);case Int16Array:return Math.max(n/32767,-1);case Int8Array:return Math.max(n/127,-1);default:throw new Error("THREE.MathUtils: Invalid component type.")}}function hn(n,t){switch(t.constructor){case Float32Array:return n;case Uint32Array:return Math.round(n*4294967295);case Uint16Array:return Math.round(n*65535);case Uint8Array:case Uint8ClampedArray:return Math.round(n*255);case Int32Array:return Math.round(n*2147483647);case Int16Array:return Math.round(n*32767);case Int8Array:return Math.round(n*127);default:throw new Error("THREE.MathUtils: Invalid component type.")}}var re=class n{static{n.prototype.isVector2=!0}constructor(t=0,e=0){this.x=t,this.y=e}get width(){return this.x}set width(t){this.x=t}get height(){return this.y}set height(t){this.y=t}set(t,e){return this.x=t,this.y=e,this}setScalar(t){return this.x=t,this.y=t,this}setX(t){return this.x=t,this}setY(t){return this.y=t,this}setComponent(t,e){switch(t){case 0:this.x=e;break;case 1:this.y=e;break;default:throw new Error("THREE.Vector2: index is out of range: "+t)}return this}getComponent(t){switch(t){case 0:return this.x;case 1:return this.y;default:throw new Error("THREE.Vector2: index is out of range: "+t)}}clone(){return new this.constructor(this.x,this.y)}copy(t){return this.x=t.x,this.y=t.y,this}add(t){return this.x+=t.x,this.y+=t.y,this}addScalar(t){return this.x+=t,this.y+=t,this}addVectors(t,e){return this.x=t.x+e.x,this.y=t.y+e.y,this}addScaledVector(t,e){return this.x+=t.x*e,this.y+=t.y*e,this}sub(t){return this.x-=t.x,this.y-=t.y,this}subScalar(t){return this.x-=t,this.y-=t,this}subVectors(t,e){return this.x=t.x-e.x,this.y=t.y-e.y,this}multiply(t){return this.x*=t.x,this.y*=t.y,this}multiplyScalar(t){return this.x*=t,this.y*=t,this}divide(t){return this.x/=t.x,this.y/=t.y,this}divideScalar(t){return this.multiplyScalar(1/t)}applyMatrix3(t){let e=this.x,i=this.y,s=t.elements;return this.x=s[0]*e+s[3]*i+s[6],this.y=s[1]*e+s[4]*i+s[7],this}min(t){return this.x=Math.min(this.x,t.x),this.y=Math.min(this.y,t.y),this}max(t){return this.x=Math.max(this.x,t.x),this.y=Math.max(this.y,t.y),this}clamp(t,e){return this.x=Qt(this.x,t.x,e.x),this.y=Qt(this.y,t.y,e.y),this}clampScalar(t,e){return this.x=Qt(this.x,t,e),this.y=Qt(this.y,t,e),this}clampLength(t,e){let i=this.length();return this.divideScalar(i||1).multiplyScalar(Qt(i,t,e))}floor(){return this.x=Math.floor(this.x),this.y=Math.floor(this.y),this}ceil(){return this.x=Math.ceil(this.x),this.y=Math.ceil(this.y),this}round(){return this.x=Math.round(this.x),this.y=Math.round(this.y),this}roundToZero(){return this.x=Math.trunc(this.x),this.y=Math.trunc(this.y),this}negate(){return this.x=-this.x,this.y=-this.y,this}dot(t){return this.x*t.x+this.y*t.y}cross(t){return this.x*t.y-this.y*t.x}lengthSq(){return this.x*this.x+this.y*this.y}length(){return Math.sqrt(this.x*this.x+this.y*this.y)}manhattanLength(){return Math.abs(this.x)+Math.abs(this.y)}normalize(){return this.divideScalar(this.length()||1)}angle(){return Math.atan2(-this.y,-this.x)+Math.PI}angleTo(t){let e=Math.sqrt(this.lengthSq()*t.lengthSq());if(e===0)return Math.PI/2;let i=this.dot(t)/e;return Math.acos(Qt(i,-1,1))}distanceTo(t){return Math.sqrt(this.distanceToSquared(t))}distanceToSquared(t){let e=this.x-t.x,i=this.y-t.y;return e*e+i*i}manhattanDistanceTo(t){return Math.abs(this.x-t.x)+Math.abs(this.y-t.y)}setLength(t){return this.normalize().multiplyScalar(t)}lerp(t,e){return this.x+=(t.x-this.x)*e,this.y+=(t.y-this.y)*e,this}lerpVectors(t,e,i){return this.x=t.x+(e.x-t.x)*i,this.y=t.y+(e.y-t.y)*i,this}equals(t){return t.x===this.x&&t.y===this.y}fromArray(t,e=0){return this.x=t[e],this.y=t[e+1],this}toArray(t=[],e=0){return t[e]=this.x,t[e+1]=this.y,t}fromBufferAttribute(t,e){return this.x=t.getX(e),this.y=t.getY(e),this}rotateAround(t,e){let i=Math.cos(e),s=Math.sin(e),r=this.x-t.x,o=this.y-t.y;return this.x=r*i-o*s+t.x,this.y=r*s+o*i+t.y,this}random(){return this.x=Math.random(),this.y=Math.random(),this}*[Symbol.iterator](){yield this.x,yield this.y}},li=class{constructor(t=0,e=0,i=0,s=1){this.isQuaternion=!0,this._x=t,this._y=e,this._z=i,this._w=s}static slerpFlat(t,e,i,s,r,o,a){let l=i[s+0],c=i[s+1],u=i[s+2],f=i[s+3],h=r[o+0],m=r[o+1],_=r[o+2],S=r[o+3];if(f!==S||l!==h||c!==m||u!==_){let p=l*h+c*m+u*_+f*S;p<0&&(h=-h,m=-m,_=-_,S=-S,p=-p);let d=1-a;if(p<.9995){let M=Math.acos(p),P=Math.sin(M);d=Math.sin(d*M)/P,a=Math.sin(a*M)/P,l=l*d+h*a,c=c*d+m*a,u=u*d+_*a,f=f*d+S*a}else{l=l*d+h*a,c=c*d+m*a,u=u*d+_*a,f=f*d+S*a;let M=1/Math.sqrt(l*l+c*c+u*u+f*f);l*=M,c*=M,u*=M,f*=M}}t[e]=l,t[e+1]=c,t[e+2]=u,t[e+3]=f}static multiplyQuaternionsFlat(t,e,i,s,r,o){let a=i[s],l=i[s+1],c=i[s+2],u=i[s+3],f=r[o],h=r[o+1],m=r[o+2],_=r[o+3];return t[e]=a*_+u*f+l*m-c*h,t[e+1]=l*_+u*h+c*f-a*m,t[e+2]=c*_+u*m+a*h-l*f,t[e+3]=u*_-a*f-l*h-c*m,t}get x(){return this._x}set x(t){this._x=t,this._onChangeCallback()}get y(){return this._y}set y(t){this._y=t,this._onChangeCallback()}get z(){return this._z}set z(t){this._z=t,this._onChangeCallback()}get w(){return this._w}set w(t){this._w=t,this._onChangeCallback()}set(t,e,i,s){return this._x=t,this._y=e,this._z=i,this._w=s,this._onChangeCallback(),this}clone(){return new this.constructor(this._x,this._y,this._z,this._w)}copy(t){return this._x=t.x,this._y=t.y,this._z=t.z,this._w=t.w,this._onChangeCallback(),this}setFromEuler(t,e=!0){let i=t._x,s=t._y,r=t._z,o=t._order,a=Math.cos,l=Math.sin,c=a(i/2),u=a(s/2),f=a(r/2),h=l(i/2),m=l(s/2),_=l(r/2);switch(o){case"XYZ":this._x=h*u*f+c*m*_,this._y=c*m*f-h*u*_,this._z=c*u*_+h*m*f,this._w=c*u*f-h*m*_;break;case"YXZ":this._x=h*u*f+c*m*_,this._y=c*m*f-h*u*_,this._z=c*u*_-h*m*f,this._w=c*u*f+h*m*_;break;case"ZXY":this._x=h*u*f-c*m*_,this._y=c*m*f+h*u*_,this._z=c*u*_+h*m*f,this._w=c*u*f-h*m*_;break;case"ZYX":this._x=h*u*f-c*m*_,this._y=c*m*f+h*u*_,this._z=c*u*_-h*m*f,this._w=c*u*f+h*m*_;break;case"YZX":this._x=h*u*f+c*m*_,this._y=c*m*f+h*u*_,this._z=c*u*_-h*m*f,this._w=c*u*f-h*m*_;break;case"XZY":this._x=h*u*f-c*m*_,this._y=c*m*f-h*u*_,this._z=c*u*_+h*m*f,this._w=c*u*f+h*m*_;break;default:Dt("Quaternion: .setFromEuler() encountered an unknown order: "+o)}return e===!0&&this._onChangeCallback(),this}setFromAxisAngle(t,e){let i=e/2,s=Math.sin(i);return this._x=t.x*s,this._y=t.y*s,this._z=t.z*s,this._w=Math.cos(i),this._onChangeCallback(),this}setFromRotationMatrix(t){let e=t.elements,i=e[0],s=e[4],r=e[8],o=e[1],a=e[5],l=e[9],c=e[2],u=e[6],f=e[10],h=i+a+f;if(h>0){let m=.5/Math.sqrt(h+1);this._w=.25/m,this._x=(u-l)*m,this._y=(r-c)*m,this._z=(o-s)*m}else if(i>a&&i>f){let m=2*Math.sqrt(1+i-a-f);this._w=(u-l)/m,this._x=.25*m,this._y=(s+o)/m,this._z=(r+c)/m}else if(a>f){let m=2*Math.sqrt(1+a-i-f);this._w=(r-c)/m,this._x=(s+o)/m,this._y=.25*m,this._z=(l+u)/m}else{let m=2*Math.sqrt(1+f-i-a);this._w=(o-s)/m,this._x=(r+c)/m,this._y=(l+u)/m,this._z=.25*m}return this._onChangeCallback(),this}setFromUnitVectors(t,e){let i=t.dot(e)+1;return i<1e-8?(i=0,Math.abs(t.x)>Math.abs(t.z)?(this._x=-t.y,this._y=t.x,this._z=0,this._w=i):(this._x=0,this._y=-t.z,this._z=t.y,this._w=i)):(this._x=t.y*e.z-t.z*e.y,this._y=t.z*e.x-t.x*e.z,this._z=t.x*e.y-t.y*e.x,this._w=i),this.normalize()}angleTo(t){return 2*Math.acos(Math.abs(Qt(this.dot(t),-1,1)))}rotateTowards(t,e){let i=this.angleTo(t);if(i===0)return this;let s=Math.min(1,e/i);return this.slerp(t,s),this}identity(){return this.set(0,0,0,1)}invert(){return this.conjugate()}conjugate(){return this._x*=-1,this._y*=-1,this._z*=-1,this._onChangeCallback(),this}dot(t){return this._x*t._x+this._y*t._y+this._z*t._z+this._w*t._w}lengthSq(){return this._x*this._x+this._y*this._y+this._z*this._z+this._w*this._w}length(){return Math.sqrt(this._x*this._x+this._y*this._y+this._z*this._z+this._w*this._w)}normalize(){let t=this.length();return t===0?(this._x=0,this._y=0,this._z=0,this._w=1):(t=1/t,this._x=this._x*t,this._y=this._y*t,this._z=this._z*t,this._w=this._w*t),this._onChangeCallback(),this}multiply(t){return this.multiplyQuaternions(this,t)}premultiply(t){return this.multiplyQuaternions(t,this)}multiplyQuaternions(t,e){let i=t._x,s=t._y,r=t._z,o=t._w,a=e._x,l=e._y,c=e._z,u=e._w;return this._x=i*u+o*a+s*c-r*l,this._y=s*u+o*l+r*a-i*c,this._z=r*u+o*c+i*l-s*a,this._w=o*u-i*a-s*l-r*c,this._onChangeCallback(),this}slerp(t,e){let i=t._x,s=t._y,r=t._z,o=t._w,a=this.dot(t);a<0&&(i=-i,s=-s,r=-r,o=-o,a=-a);let l=1-e;if(a<.9995){let c=Math.acos(a),u=Math.sin(c);l=Math.sin(l*c)/u,e=Math.sin(e*c)/u,this._x=this._x*l+i*e,this._y=this._y*l+s*e,this._z=this._z*l+r*e,this._w=this._w*l+o*e,this._onChangeCallback()}else this._x=this._x*l+i*e,this._y=this._y*l+s*e,this._z=this._z*l+r*e,this._w=this._w*l+o*e,this.normalize();return this}slerpQuaternions(t,e,i){return this.copy(t).slerp(e,i)}random(){let t=2*Math.PI*Math.random(),e=2*Math.PI*Math.random(),i=Math.random(),s=Math.sqrt(1-i),r=Math.sqrt(i);return this.set(s*Math.sin(t),s*Math.cos(t),r*Math.sin(e),r*Math.cos(e))}equals(t){return t._x===this._x&&t._y===this._y&&t._z===this._z&&t._w===this._w}fromArray(t,e=0){return this._x=t[e],this._y=t[e+1],this._z=t[e+2],this._w=t[e+3],this._onChangeCallback(),this}toArray(t=[],e=0){return t[e]=this._x,t[e+1]=this._y,t[e+2]=this._z,t[e+3]=this._w,t}fromBufferAttribute(t,e){return this._x=t.getX(e),this._y=t.getY(e),this._z=t.getZ(e),this._w=t.getW(e),this._onChangeCallback(),this}toJSON(){return this.toArray()}_onChange(t){return this._onChangeCallback=t,this}_onChangeCallback(){}*[Symbol.iterator](){yield this._x,yield this._y,yield this._z,yield this._w}},W=class n{static{n.prototype.isVector3=!0}constructor(t=0,e=0,i=0){this.x=t,this.y=e,this.z=i}set(t,e,i){return i===void 0&&(i=this.z),this.x=t,this.y=e,this.z=i,this}setScalar(t){return this.x=t,this.y=t,this.z=t,this}setX(t){return this.x=t,this}setY(t){return this.y=t,this}setZ(t){return this.z=t,this}setComponent(t,e){switch(t){case 0:this.x=e;break;case 1:this.y=e;break;case 2:this.z=e;break;default:throw new Error("THREE.Vector3: index is out of range: "+t)}return this}getComponent(t){switch(t){case 0:return this.x;case 1:return this.y;case 2:return this.z;default:throw new Error("THREE.Vector3: index is out of range: "+t)}}clone(){return new this.constructor(this.x,this.y,this.z)}copy(t){return this.x=t.x,this.y=t.y,this.z=t.z,this}add(t){return this.x+=t.x,this.y+=t.y,this.z+=t.z,this}addScalar(t){return this.x+=t,this.y+=t,this.z+=t,this}addVectors(t,e){return this.x=t.x+e.x,this.y=t.y+e.y,this.z=t.z+e.z,this}addScaledVector(t,e){return this.x+=t.x*e,this.y+=t.y*e,this.z+=t.z*e,this}sub(t){return this.x-=t.x,this.y-=t.y,this.z-=t.z,this}subScalar(t){return this.x-=t,this.y-=t,this.z-=t,this}subVectors(t,e){return this.x=t.x-e.x,this.y=t.y-e.y,this.z=t.z-e.z,this}multiply(t){return this.x*=t.x,this.y*=t.y,this.z*=t.z,this}multiplyScalar(t){return this.x*=t,this.y*=t,this.z*=t,this}multiplyVectors(t,e){return this.x=t.x*e.x,this.y=t.y*e.y,this.z=t.z*e.z,this}applyEuler(t){return this.applyQuaternion(r0.setFromEuler(t))}applyAxisAngle(t,e){return this.applyQuaternion(r0.setFromAxisAngle(t,e))}applyMatrix3(t){let e=this.x,i=this.y,s=this.z,r=t.elements;return this.x=r[0]*e+r[3]*i+r[6]*s,this.y=r[1]*e+r[4]*i+r[7]*s,this.z=r[2]*e+r[5]*i+r[8]*s,this}applyNormalMatrix(t){return this.applyMatrix3(t).normalize()}applyMatrix4(t){let e=this.x,i=this.y,s=this.z,r=t.elements,o=1/(r[3]*e+r[7]*i+r[11]*s+r[15]);return this.x=(r[0]*e+r[4]*i+r[8]*s+r[12])*o,this.y=(r[1]*e+r[5]*i+r[9]*s+r[13])*o,this.z=(r[2]*e+r[6]*i+r[10]*s+r[14])*o,this}applyQuaternion(t){let e=this.x,i=this.y,s=this.z,r=t.x,o=t.y,a=t.z,l=t.w,c=2*(o*s-a*i),u=2*(a*e-r*s),f=2*(r*i-o*e);return this.x=e+l*c+o*f-a*u,this.y=i+l*u+a*c-r*f,this.z=s+l*f+r*u-o*c,this}project(t){return this.applyMatrix4(t.matrixWorldInverse).applyMatrix4(t.projectionMatrix)}unproject(t){return this.applyMatrix4(t.projectionMatrixInverse).applyMatrix4(t.matrixWorld)}transformDirection(t){let e=this.x,i=this.y,s=this.z,r=t.elements;return this.x=r[0]*e+r[4]*i+r[8]*s,this.y=r[1]*e+r[5]*i+r[9]*s,this.z=r[2]*e+r[6]*i+r[10]*s,this.normalize()}divide(t){return this.x/=t.x,this.y/=t.y,this.z/=t.z,this}divideScalar(t){return this.multiplyScalar(1/t)}min(t){return this.x=Math.min(this.x,t.x),this.y=Math.min(this.y,t.y),this.z=Math.min(this.z,t.z),this}max(t){return this.x=Math.max(this.x,t.x),this.y=Math.max(this.y,t.y),this.z=Math.max(this.z,t.z),this}clamp(t,e){return this.x=Qt(this.x,t.x,e.x),this.y=Qt(this.y,t.y,e.y),this.z=Qt(this.z,t.z,e.z),this}clampScalar(t,e){return this.x=Qt(this.x,t,e),this.y=Qt(this.y,t,e),this.z=Qt(this.z,t,e),this}clampLength(t,e){let i=this.length();return this.divideScalar(i||1).multiplyScalar(Qt(i,t,e))}floor(){return this.x=Math.floor(this.x),this.y=Math.floor(this.y),this.z=Math.floor(this.z),this}ceil(){return this.x=Math.ceil(this.x),this.y=Math.ceil(this.y),this.z=Math.ceil(this.z),this}round(){return this.x=Math.round(this.x),this.y=Math.round(this.y),this.z=Math.round(this.z),this}roundToZero(){return this.x=Math.trunc(this.x),this.y=Math.trunc(this.y),this.z=Math.trunc(this.z),this}negate(){return this.x=-this.x,this.y=-this.y,this.z=-this.z,this}dot(t){return this.x*t.x+this.y*t.y+this.z*t.z}lengthSq(){return this.x*this.x+this.y*this.y+this.z*this.z}length(){return Math.sqrt(this.x*this.x+this.y*this.y+this.z*this.z)}manhattanLength(){return Math.abs(this.x)+Math.abs(this.y)+Math.abs(this.z)}normalize(){return this.divideScalar(this.length()||1)}setLength(t){return this.normalize().multiplyScalar(t)}lerp(t,e){return this.x+=(t.x-this.x)*e,this.y+=(t.y-this.y)*e,this.z+=(t.z-this.z)*e,this}lerpVectors(t,e,i){return this.x=t.x+(e.x-t.x)*i,this.y=t.y+(e.y-t.y)*i,this.z=t.z+(e.z-t.z)*i,this}cross(t){return this.crossVectors(this,t)}crossVectors(t,e){let i=t.x,s=t.y,r=t.z,o=e.x,a=e.y,l=e.z;return this.x=s*l-r*a,this.y=r*o-i*l,this.z=i*a-s*o,this}projectOnVector(t){let e=t.lengthSq();if(e===0)return this.set(0,0,0);let i=t.dot(this)/e;return this.copy(t).multiplyScalar(i)}projectOnPlane(t){return Pf.copy(this).projectOnVector(t),this.sub(Pf)}reflect(t){return this.sub(Pf.copy(t).multiplyScalar(2*this.dot(t)))}angleTo(t){let e=Math.sqrt(this.lengthSq()*t.lengthSq());if(e===0)return Math.PI/2;let i=this.dot(t)/e;return Math.acos(Qt(i,-1,1))}distanceTo(t){return Math.sqrt(this.distanceToSquared(t))}distanceToSquared(t){let e=this.x-t.x,i=this.y-t.y,s=this.z-t.z;return e*e+i*i+s*s}manhattanDistanceTo(t){return Math.abs(this.x-t.x)+Math.abs(this.y-t.y)+Math.abs(this.z-t.z)}setFromSpherical(t){return this.setFromSphericalCoords(t.radius,t.phi,t.theta)}setFromSphericalCoords(t,e,i){let s=Math.sin(e)*t;return this.x=s*Math.sin(i),this.y=Math.cos(e)*t,this.z=s*Math.cos(i),this}setFromCylindrical(t){return this.setFromCylindricalCoords(t.radius,t.theta,t.y)}setFromCylindricalCoords(t,e,i){return this.x=t*Math.sin(e),this.y=i,this.z=t*Math.cos(e),this}setFromMatrixPosition(t){let e=t.elements;return this.x=e[12],this.y=e[13],this.z=e[14],this}setFromMatrixScale(t){let e=this.setFromMatrixColumn(t,0).length(),i=this.setFromMatrixColumn(t,1).length(),s=this.setFromMatrixColumn(t,2).length();return this.x=e,this.y=i,this.z=s,this}setFromMatrixColumn(t,e){return this.fromArray(t.elements,e*4)}setFromMatrix3Column(t,e){return this.fromArray(t.elements,e*3)}setFromEuler(t){return this.x=t._x,this.y=t._y,this.z=t._z,this}setFromColor(t){return this.x=t.r,this.y=t.g,this.z=t.b,this}equals(t){return t.x===this.x&&t.y===this.y&&t.z===this.z}fromArray(t,e=0){return this.x=t[e],this.y=t[e+1],this.z=t[e+2],this}toArray(t=[],e=0){return t[e]=this.x,t[e+1]=this.y,t[e+2]=this.z,t}fromBufferAttribute(t,e){return this.x=t.getX(e),this.y=t.getY(e),this.z=t.getZ(e),this}random(){return this.x=Math.random(),this.y=Math.random(),this.z=Math.random(),this}randomDirection(){let t=Math.random()*Math.PI*2,e=Math.random()*2-1,i=Math.sqrt(1-e*e);return this.x=i*Math.cos(t),this.y=e,this.z=i*Math.sin(t),this}*[Symbol.iterator](){yield this.x,yield this.y,yield this.z}},Pf=new W,r0=new li,Vt=class n{static{n.prototype.isMatrix3=!0}constructor(t,e,i,s,r,o,a,l,c){this.elements=[1,0,0,0,1,0,0,0,1],t!==void 0&&this.set(t,e,i,s,r,o,a,l,c)}set(t,e,i,s,r,o,a,l,c){let u=this.elements;return u[0]=t,u[1]=s,u[2]=a,u[3]=e,u[4]=r,u[5]=l,u[6]=i,u[7]=o,u[8]=c,this}identity(){return this.set(1,0,0,0,1,0,0,0,1),this}copy(t){let e=this.elements,i=t.elements;return e[0]=i[0],e[1]=i[1],e[2]=i[2],e[3]=i[3],e[4]=i[4],e[5]=i[5],e[6]=i[6],e[7]=i[7],e[8]=i[8],this}extractBasis(t,e,i){return t.setFromMatrix3Column(this,0),e.setFromMatrix3Column(this,1),i.setFromMatrix3Column(this,2),this}setFromMatrix4(t){let e=t.elements;return this.set(e[0],e[4],e[8],e[1],e[5],e[9],e[2],e[6],e[10]),this}multiply(t){return this.multiplyMatrices(this,t)}premultiply(t){return this.multiplyMatrices(t,this)}multiplyMatrices(t,e){let i=t.elements,s=e.elements,r=this.elements,o=i[0],a=i[3],l=i[6],c=i[1],u=i[4],f=i[7],h=i[2],m=i[5],_=i[8],S=s[0],p=s[3],d=s[6],M=s[1],P=s[4],b=s[7],E=s[2],w=s[5],A=s[8];return r[0]=o*S+a*M+l*E,r[3]=o*p+a*P+l*w,r[6]=o*d+a*b+l*A,r[1]=c*S+u*M+f*E,r[4]=c*p+u*P+f*w,r[7]=c*d+u*b+f*A,r[2]=h*S+m*M+_*E,r[5]=h*p+m*P+_*w,r[8]=h*d+m*b+_*A,this}multiplyScalar(t){let e=this.elements;return e[0]*=t,e[3]*=t,e[6]*=t,e[1]*=t,e[4]*=t,e[7]*=t,e[2]*=t,e[5]*=t,e[8]*=t,this}determinant(){let t=this.elements,e=t[0],i=t[1],s=t[2],r=t[3],o=t[4],a=t[5],l=t[6],c=t[7],u=t[8];return e*o*u-e*a*c-i*r*u+i*a*l+s*r*c-s*o*l}invert(){let t=this.elements,e=t[0],i=t[1],s=t[2],r=t[3],o=t[4],a=t[5],l=t[6],c=t[7],u=t[8],f=u*o-a*c,h=a*l-u*r,m=c*r-o*l,_=e*f+i*h+s*m;if(_===0)return this.set(0,0,0,0,0,0,0,0,0);let S=1/_;return t[0]=f*S,t[1]=(s*c-u*i)*S,t[2]=(a*i-s*o)*S,t[3]=h*S,t[4]=(u*e-s*l)*S,t[5]=(s*r-a*e)*S,t[6]=m*S,t[7]=(i*l-c*e)*S,t[8]=(o*e-i*r)*S,this}transpose(){let t,e=this.elements;return t=e[1],e[1]=e[3],e[3]=t,t=e[2],e[2]=e[6],e[6]=t,t=e[5],e[5]=e[7],e[7]=t,this}getNormalMatrix(t){return this.setFromMatrix4(t).invert().transpose()}transposeIntoArray(t){let e=this.elements;return t[0]=e[0],t[1]=e[3],t[2]=e[6],t[3]=e[1],t[4]=e[4],t[5]=e[7],t[6]=e[2],t[7]=e[5],t[8]=e[8],this}setUvTransform(t,e,i,s,r,o,a){let l=Math.cos(r),c=Math.sin(r);return this.set(i*l,i*c,-i*(l*o+c*a)+o+t,-s*c,s*l,-s*(-c*o+l*a)+a+e,0,0,1),this}scale(t,e){return Gs("Matrix3: .scale() is deprecated. Use .makeScale() instead."),this.premultiply(If.makeScale(t,e)),this}rotate(t){return Gs("Matrix3: .rotate() is deprecated. Use .makeRotation() instead."),this.premultiply(If.makeRotation(-t)),this}translate(t,e){return Gs("Matrix3: .translate() is deprecated. Use .makeTranslation() instead."),this.premultiply(If.makeTranslation(t,e)),this}makeTranslation(t,e){return t.isVector2?this.set(1,0,t.x,0,1,t.y,0,0,1):this.set(1,0,t,0,1,e,0,0,1),this}makeRotation(t){let e=Math.cos(t),i=Math.sin(t);return this.set(e,-i,0,i,e,0,0,0,1),this}makeScale(t,e){return this.set(t,0,0,0,e,0,0,0,1),this}equals(t){let e=this.elements,i=t.elements;for(let s=0;s<9;s++)if(e[s]!==i[s])return!1;return!0}fromArray(t,e=0){for(let i=0;i<9;i++)this.elements[i]=t[i+e];return this}toArray(t=[],e=0){let i=this.elements;return t[e]=i[0],t[e+1]=i[1],t[e+2]=i[2],t[e+3]=i[3],t[e+4]=i[4],t[e+5]=i[5],t[e+6]=i[6],t[e+7]=i[7],t[e+8]=i[8],t}clone(){return new this.constructor().fromArray(this.elements)}},If=new Vt,o0=new Vt().set(.4123908,.3575843,.1804808,.212639,.7151687,.0721923,.0193308,.1191948,.9505322),a0=new Vt().set(3.2409699,-1.5373832,-.4986108,-.9692436,1.8759675,.0415551,.0556301,-.203977,1.0569715);function Jv(){let n={enabled:!0,workingColorSpace:Jo,spaces:{},convert:function(s,r,o){return this.enabled===!1||r===o||!r||!o||(this.spaces[r].transfer===ce&&(s.r=Ii(s.r),s.g=Ii(s.g),s.b=Ii(s.b)),this.spaces[r].primaries!==this.spaces[o].primaries&&(s.applyMatrix3(this.spaces[r].toXYZ),s.applyMatrix3(this.spaces[o].fromXYZ)),this.spaces[o].transfer===ce&&(s.r=Dr(s.r),s.g=Dr(s.g),s.b=Dr(s.b))),s},workingToColorSpace:function(s,r){return this.convert(s,this.workingColorSpace,r)},colorSpaceToWorking:function(s,r){return this.convert(s,r,this.workingColorSpace)},getPrimaries:function(s){return this.spaces[s].primaries},getTransfer:function(s){return s===Li?jo:this.spaces[s].transfer},getToneMappingMode:function(s){return this.spaces[s].outputColorSpaceConfig.toneMappingMode||"standard"},getLuminanceCoefficients:function(s,r=this.workingColorSpace){return s.fromArray(this.spaces[r].luminanceCoefficients)},define:function(s){Object.assign(this.spaces,s)},_getMatrix:function(s,r,o){return s.copy(this.spaces[r].toXYZ).multiply(this.spaces[o].fromXYZ)},_getDrawingBufferColorSpace:function(s){return this.spaces[s].outputColorSpaceConfig.drawingBufferColorSpace},_getUnpackColorSpace:function(s=this.workingColorSpace){return this.spaces[s].workingColorSpaceConfig.unpackColorSpace},fromWorkingColorSpace:function(s,r){return Gs("ColorManagement: .fromWorkingColorSpace() has been renamed to .workingToColorSpace()."),n.workingToColorSpace(s,r)},toWorkingColorSpace:function(s,r){return Gs("ColorManagement: .toWorkingColorSpace() has been renamed to .colorSpaceToWorking()."),n.colorSpaceToWorking(s,r)}},t=[.64,.33,.3,.6,.15,.06],e=[.2126,.7152,.0722],i=[.3127,.329];return n.define({[Jo]:{primaries:t,whitePoint:i,transfer:jo,toXYZ:o0,fromXYZ:a0,luminanceCoefficients:e,workingColorSpaceConfig:{unpackColorSpace:xn},outputColorSpaceConfig:{drawingBufferColorSpace:xn}},[xn]:{primaries:t,whitePoint:i,transfer:ce,toXYZ:o0,fromXYZ:a0,luminanceCoefficients:e,outputColorSpaceConfig:{drawingBufferColorSpace:xn}}}),n}var Kt=Jv();function Ii(n){return n<.04045?n*.0773993808:Math.pow(n*.9478672986+.0521327014,2.4)}function Dr(n){return n<.0031308?n*12.92:1.055*Math.pow(n,.41666)-.055}var br,Rl=class{static getDataURL(t,e="image/png"){if(/^data:/i.test(t.src)||typeof HTMLCanvasElement>"u")return t.src;let i;if(t instanceof HTMLCanvasElement)i=t;else{br===void 0&&(br=ta("canvas")),br.width=t.width,br.height=t.height;let s=br.getContext("2d");t instanceof ImageData?s.putImageData(t,0,0):s.drawImage(t,0,0,t.width,t.height),i=br}return i.toDataURL(e)}static sRGBToLinear(t){if(typeof HTMLImageElement<"u"&&t instanceof HTMLImageElement||typeof HTMLCanvasElement<"u"&&t instanceof HTMLCanvasElement||typeof ImageBitmap<"u"&&t instanceof ImageBitmap){let e=ta("canvas");e.width=t.width,e.height=t.height;let i=e.getContext("2d");i.drawImage(t,0,0,t.width,t.height);let s=i.getImageData(0,0,t.width,t.height),r=s.data;for(let o=0;o<r.length;o++)r[o]=Ii(r[o]/255)*255;return i.putImageData(s,0,0),e}else if(t.data){let e=t.data.slice(0);for(let i=0;i<e.length;i++)e instanceof Uint8Array||e instanceof Uint8ClampedArray?e[i]=Math.floor(Ii(e[i]/255)*255):e[i]=Ii(e[i]);return{data:e,width:t.width,height:t.height}}else return Dt("ImageUtils.sRGBToLinear(): Unsupported image type. No color space conversion applied."),t}},jv=0,Br=class{constructor(t=null){this.isTextureSource=!0,Object.defineProperty(this,"id",{value:jv++}),this.uuid=Aa(),this.data=t,this.dataReady=!0,this.version=0}getSize(t){let e=this.data;return typeof HTMLVideoElement<"u"&&e instanceof HTMLVideoElement?t.set(e.videoWidth,e.videoHeight,0):typeof VideoFrame<"u"&&e instanceof VideoFrame?t.set(e.displayWidth,e.displayHeight,0):e!==null?t.set(e.width,e.height,e.depth||0):t.set(0,0,0),t}set needsUpdate(t){t===!0&&this.version++}toJSON(t){let e=t===void 0||typeof t=="string";if(!e&&t.images[this.uuid]!==void 0)return t.images[this.uuid];let i={uuid:this.uuid,url:""},s=this.data;if(s!==null){let r;if(Array.isArray(s)){r=[];for(let o=0,a=s.length;o<a;o++)s[o].isDataTexture?r.push(Lf(s[o].image)):r.push(Lf(s[o]))}else r=Lf(s);i.url=r}return e||(t.images[this.uuid]=i),i}};function Lf(n){return typeof HTMLImageElement<"u"&&n instanceof HTMLImageElement||typeof HTMLCanvasElement<"u"&&n instanceof HTMLCanvasElement||typeof ImageBitmap<"u"&&n instanceof ImageBitmap?Rl.getDataURL(n):n.data?{data:Array.from(n.data),width:n.width,height:n.height,type:n.data.constructor.name}:(Dt("Texture: Unable to serialize Texture."),{})}var Qv=0,Nf=new W,fn=class n extends ci{constructor(t=n.DEFAULT_IMAGE,e=n.DEFAULT_MAPPING,i=oi,s=oi,r=$e,o=ls,a=Ln,l=Mn,c=n.DEFAULT_ANISOTROPY,u=Li){super(),this.isTexture=!0,Object.defineProperty(this,"id",{value:Qv++}),this.uuid=Aa(),this.name="",this.source=new Br(t),this.mipmaps=[],this.mapping=e,this.channel=0,this.wrapS=i,this.wrapT=s,this.magFilter=r,this.minFilter=o,this.anisotropy=c,this.format=a,this.internalFormat=null,this.type=l,this.offset=new re(0,0),this.repeat=new re(1,1),this.center=new re(0,0),this.rotation=0,this.matrixAutoUpdate=!0,this.matrix=new Vt,this.generateMipmaps=!0,this.premultiplyAlpha=!1,this.flipY=!0,this.unpackAlignment=4,this.colorSpace=u,this.userData={},this.updateRanges=[],this.version=0,this.onUpdate=null,this.renderTarget=null,this.isRenderTargetTexture=!1,this.isArrayTexture=!!(t&&t.depth&&t.depth>1),this.pmremVersion=0,this.normalized=!1}get width(){return this.source.getSize(Nf).x}get height(){return this.source.getSize(Nf).y}get depth(){return this.source.getSize(Nf).z}get image(){return this.source.data}set image(t){this.source.data=t}updateMatrix(){this.matrix.setUvTransform(this.offset.x,this.offset.y,this.repeat.x,this.repeat.y,this.rotation,this.center.x,this.center.y)}addUpdateRange(t,e){this.updateRanges.push({start:t,count:e})}clearUpdateRanges(){this.updateRanges.length=0}clone(){return new this.constructor().copy(this)}copy(t){return this.name=t.name,this.source=t.source,this.mipmaps=t.mipmaps.slice(0),this.mapping=t.mapping,this.channel=t.channel,this.wrapS=t.wrapS,this.wrapT=t.wrapT,this.magFilter=t.magFilter,this.minFilter=t.minFilter,this.anisotropy=t.anisotropy,this.format=t.format,this.internalFormat=t.internalFormat,this.type=t.type,this.normalized=t.normalized,this.offset.copy(t.offset),this.repeat.copy(t.repeat),this.center.copy(t.center),this.rotation=t.rotation,this.matrixAutoUpdate=t.matrixAutoUpdate,this.matrix.copy(t.matrix),this.generateMipmaps=t.generateMipmaps,this.premultiplyAlpha=t.premultiplyAlpha,this.flipY=t.flipY,this.unpackAlignment=t.unpackAlignment,this.colorSpace=t.colorSpace,this.renderTarget=t.renderTarget,this.isRenderTargetTexture=t.isRenderTargetTexture,this.isArrayTexture=t.isArrayTexture,this.userData=JSON.parse(JSON.stringify(t.userData)),this.needsUpdate=!0,this}setValues(t){for(let e in t){let i=t[e];if(i===void 0){Dt(`Texture.setValues(): parameter '${e}' has value of undefined.`);continue}let s=this[e];if(s===void 0){Dt(`Texture.setValues(): property '${e}' does not exist.`);continue}s&&i&&s.isVector2&&i.isVector2||s&&i&&s.isVector3&&i.isVector3||s&&i&&s.isMatrix3&&i.isMatrix3?s.copy(i):this[e]=i}}toJSON(t){let e=t===void 0||typeof t=="string";if(!e&&t.textures[this.uuid]!==void 0)return t.textures[this.uuid];let i={metadata:{version:4.7,type:"Texture",generator:"Texture.toJSON"},uuid:this.uuid,name:this.name,image:this.source.toJSON(t).uuid,mapping:this.mapping,channel:this.channel,repeat:[this.repeat.x,this.repeat.y],offset:[this.offset.x,this.offset.y],center:[this.center.x,this.center.y],rotation:this.rotation,wrap:[this.wrapS,this.wrapT],format:this.format,internalFormat:this.internalFormat,type:this.type,normalized:this.normalized,colorSpace:this.colorSpace,minFilter:this.minFilter,magFilter:this.magFilter,anisotropy:this.anisotropy,flipY:this.flipY,generateMipmaps:this.generateMipmaps,premultiplyAlpha:this.premultiplyAlpha,unpackAlignment:this.unpackAlignment};return Object.keys(this.userData).length>0&&(i.userData=this.userData),e||(t.textures[this.uuid]=i),i}dispose(){this.dispatchEvent({type:"dispose"})}transformUv(t){if(this.mapping!==xd)return t;if(t.applyMatrix3(this.matrix),t.x<0||t.x>1)switch(this.wrapS){case wl:t.x=t.x-Math.floor(t.x);break;case oi:t.x=t.x<0?0:1;break;case El:Math.abs(Math.floor(t.x)%2)===1?t.x=Math.ceil(t.x)-t.x:t.x=t.x-Math.floor(t.x);break}if(t.y<0||t.y>1)switch(this.wrapT){case wl:t.y=t.y-Math.floor(t.y);break;case oi:t.y=t.y<0?0:1;break;case El:Math.abs(Math.floor(t.y)%2)===1?t.y=Math.ceil(t.y)-t.y:t.y=t.y-Math.floor(t.y);break}return this.flipY&&(t.y=1-t.y),t}set needsUpdate(t){t===!0&&(this.version++,this.source.needsUpdate=!0)}set needsPMREMUpdate(t){t===!0&&this.pmremVersion++}};fn.DEFAULT_IMAGE=null;fn.DEFAULT_MAPPING=xd;fn.DEFAULT_ANISOTROPY=1;var we=class n{static{n.prototype.isVector4=!0}constructor(t=0,e=0,i=0,s=1){this.x=t,this.y=e,this.z=i,this.w=s}get width(){return this.z}set width(t){this.z=t}get height(){return this.w}set height(t){this.w=t}set(t,e,i,s){return this.x=t,this.y=e,this.z=i,this.w=s,this}setScalar(t){return this.x=t,this.y=t,this.z=t,this.w=t,this}setX(t){return this.x=t,this}setY(t){return this.y=t,this}setZ(t){return this.z=t,this}setW(t){return this.w=t,this}setComponent(t,e){switch(t){case 0:this.x=e;break;case 1:this.y=e;break;case 2:this.z=e;break;case 3:this.w=e;break;default:throw new Error("THREE.Vector4: index is out of range: "+t)}return this}getComponent(t){switch(t){case 0:return this.x;case 1:return this.y;case 2:return this.z;case 3:return this.w;default:throw new Error("THREE.Vector4: index is out of range: "+t)}}clone(){return new this.constructor(this.x,this.y,this.z,this.w)}copy(t){return this.x=t.x,this.y=t.y,this.z=t.z,this.w=t.w!==void 0?t.w:1,this}add(t){return this.x+=t.x,this.y+=t.y,this.z+=t.z,this.w+=t.w,this}addScalar(t){return this.x+=t,this.y+=t,this.z+=t,this.w+=t,this}addVectors(t,e){return this.x=t.x+e.x,this.y=t.y+e.y,this.z=t.z+e.z,this.w=t.w+e.w,this}addScaledVector(t,e){return this.x+=t.x*e,this.y+=t.y*e,this.z+=t.z*e,this.w+=t.w*e,this}sub(t){return this.x-=t.x,this.y-=t.y,this.z-=t.z,this.w-=t.w,this}subScalar(t){return this.x-=t,this.y-=t,this.z-=t,this.w-=t,this}subVectors(t,e){return this.x=t.x-e.x,this.y=t.y-e.y,this.z=t.z-e.z,this.w=t.w-e.w,this}multiply(t){return this.x*=t.x,this.y*=t.y,this.z*=t.z,this.w*=t.w,this}multiplyScalar(t){return this.x*=t,this.y*=t,this.z*=t,this.w*=t,this}applyMatrix4(t){let e=this.x,i=this.y,s=this.z,r=this.w,o=t.elements;return this.x=o[0]*e+o[4]*i+o[8]*s+o[12]*r,this.y=o[1]*e+o[5]*i+o[9]*s+o[13]*r,this.z=o[2]*e+o[6]*i+o[10]*s+o[14]*r,this.w=o[3]*e+o[7]*i+o[11]*s+o[15]*r,this}divide(t){return this.x/=t.x,this.y/=t.y,this.z/=t.z,this.w/=t.w,this}divideScalar(t){return this.multiplyScalar(1/t)}setAxisAngleFromQuaternion(t){this.w=2*Math.acos(t.w);let e=Math.sqrt(1-t.w*t.w);return e<1e-4?(this.x=1,this.y=0,this.z=0):(this.x=t.x/e,this.y=t.y/e,this.z=t.z/e),this}setAxisAngleFromRotationMatrix(t){let e,i,s,r,l=t.elements,c=l[0],u=l[4],f=l[8],h=l[1],m=l[5],_=l[9],S=l[2],p=l[6],d=l[10];if(Math.abs(u-h)<.01&&Math.abs(f-S)<.01&&Math.abs(_-p)<.01){if(Math.abs(u+h)<.1&&Math.abs(f+S)<.1&&Math.abs(_+p)<.1&&Math.abs(c+m+d-3)<.1)return this.set(1,0,0,0),this;e=Math.PI;let P=(c+1)/2,b=(m+1)/2,E=(d+1)/2,w=(u+h)/4,A=(f+S)/4,x=(_+p)/4;return P>b&&P>E?P<.01?(i=0,s=.707106781,r=.707106781):(i=Math.sqrt(P),s=w/i,r=A/i):b>E?b<.01?(i=.707106781,s=0,r=.707106781):(s=Math.sqrt(b),i=w/s,r=x/s):E<.01?(i=.707106781,s=.707106781,r=0):(r=Math.sqrt(E),i=A/r,s=x/r),this.set(i,s,r,e),this}let M=Math.sqrt((p-_)*(p-_)+(f-S)*(f-S)+(h-u)*(h-u));return Math.abs(M)<.001&&(M=1),this.x=(p-_)/M,this.y=(f-S)/M,this.z=(h-u)/M,this.w=Math.acos((c+m+d-1)/2),this}setFromMatrixPosition(t){let e=t.elements;return this.x=e[12],this.y=e[13],this.z=e[14],this.w=e[15],this}min(t){return this.x=Math.min(this.x,t.x),this.y=Math.min(this.y,t.y),this.z=Math.min(this.z,t.z),this.w=Math.min(this.w,t.w),this}max(t){return this.x=Math.max(this.x,t.x),this.y=Math.max(this.y,t.y),this.z=Math.max(this.z,t.z),this.w=Math.max(this.w,t.w),this}clamp(t,e){return this.x=Qt(this.x,t.x,e.x),this.y=Qt(this.y,t.y,e.y),this.z=Qt(this.z,t.z,e.z),this.w=Qt(this.w,t.w,e.w),this}clampScalar(t,e){return this.x=Qt(this.x,t,e),this.y=Qt(this.y,t,e),this.z=Qt(this.z,t,e),this.w=Qt(this.w,t,e),this}clampLength(t,e){let i=this.length();return this.divideScalar(i||1).multiplyScalar(Qt(i,t,e))}floor(){return this.x=Math.floor(this.x),this.y=Math.floor(this.y),this.z=Math.floor(this.z),this.w=Math.floor(this.w),this}ceil(){return this.x=Math.ceil(this.x),this.y=Math.ceil(this.y),this.z=Math.ceil(this.z),this.w=Math.ceil(this.w),this}round(){return this.x=Math.round(this.x),this.y=Math.round(this.y),this.z=Math.round(this.z),this.w=Math.round(this.w),this}roundToZero(){return this.x=Math.trunc(this.x),this.y=Math.trunc(this.y),this.z=Math.trunc(this.z),this.w=Math.trunc(this.w),this}negate(){return this.x=-this.x,this.y=-this.y,this.z=-this.z,this.w=-this.w,this}dot(t){return this.x*t.x+this.y*t.y+this.z*t.z+this.w*t.w}lengthSq(){return this.x*this.x+this.y*this.y+this.z*this.z+this.w*this.w}length(){return Math.sqrt(this.x*this.x+this.y*this.y+this.z*this.z+this.w*this.w)}manhattanLength(){return Math.abs(this.x)+Math.abs(this.y)+Math.abs(this.z)+Math.abs(this.w)}normalize(){return this.divideScalar(this.length()||1)}setLength(t){return this.normalize().multiplyScalar(t)}lerp(t,e){return this.x+=(t.x-this.x)*e,this.y+=(t.y-this.y)*e,this.z+=(t.z-this.z)*e,this.w+=(t.w-this.w)*e,this}lerpVectors(t,e,i){return this.x=t.x+(e.x-t.x)*i,this.y=t.y+(e.y-t.y)*i,this.z=t.z+(e.z-t.z)*i,this.w=t.w+(e.w-t.w)*i,this}equals(t){return t.x===this.x&&t.y===this.y&&t.z===this.z&&t.w===this.w}fromArray(t,e=0){return this.x=t[e],this.y=t[e+1],this.z=t[e+2],this.w=t[e+3],this}toArray(t=[],e=0){return t[e]=this.x,t[e+1]=this.y,t[e+2]=this.z,t[e+3]=this.w,t}fromBufferAttribute(t,e){return this.x=t.getX(e),this.y=t.getY(e),this.z=t.getZ(e),this.w=t.getW(e),this}random(){return this.x=Math.random(),this.y=Math.random(),this.z=Math.random(),this.w=Math.random(),this}*[Symbol.iterator](){yield this.x,yield this.y,yield this.z,yield this.w}},Pl=class extends ci{constructor(t=1,e=1,i={}){super(),i=Object.assign({generateMipmaps:!1,internalFormat:null,minFilter:$e,depthBuffer:!0,stencilBuffer:!1,resolveColorBuffer:!0,resolveDepthBuffer:!0,resolveStencilBuffer:!0,storeMultisampledColorBuffer:!0,storeMultisampledDepthBuffer:!0,storeMultisampledStencilBuffer:!0,depthTexture:null,samples:0,count:1,depth:1,multiview:!1,useArrayDepthTexture:!1},i),this.isRenderTarget=!0,this.width=t,this.height=e,this.depth=i.depth,this.scissor=new we(0,0,t,e),this.scissorTest=!1,this.viewport=new we(0,0,t,e),this.textures=[];let s={width:t,height:e,depth:i.depth},r=new fn(s),o=i.count;for(let a=0;a<o;a++)this.textures[a]=r.clone(),this.textures[a].isRenderTargetTexture=!0,this.textures[a].renderTarget=this;this._setTextureOptions(i),this.depthBuffer=i.depthBuffer,this.stencilBuffer=i.stencilBuffer,this.resolveColorBuffer=i.resolveColorBuffer,this.resolveDepthBuffer=i.resolveDepthBuffer,this.resolveStencilBuffer=i.resolveStencilBuffer,this.storeMultisampledColorBuffer=i.storeMultisampledColorBuffer,this.storeMultisampledDepthBuffer=i.storeMultisampledDepthBuffer,this.storeMultisampledStencilBuffer=i.storeMultisampledStencilBuffer,this._depthTexture=null,this.depthTexture=i.depthTexture,this.samples=i.samples,this.multiview=i.multiview,this.useArrayDepthTexture=i.useArrayDepthTexture}_setTextureOptions(t={}){let e={minFilter:$e,generateMipmaps:!1,flipY:!1,internalFormat:null};t.mapping!==void 0&&(e.mapping=t.mapping),t.wrapS!==void 0&&(e.wrapS=t.wrapS),t.wrapT!==void 0&&(e.wrapT=t.wrapT),t.wrapR!==void 0&&(e.wrapR=t.wrapR),t.magFilter!==void 0&&(e.magFilter=t.magFilter),t.minFilter!==void 0&&(e.minFilter=t.minFilter),t.format!==void 0&&(e.format=t.format),t.type!==void 0&&(e.type=t.type),t.anisotropy!==void 0&&(e.anisotropy=t.anisotropy),t.colorSpace!==void 0&&(e.colorSpace=t.colorSpace),t.flipY!==void 0&&(e.flipY=t.flipY),t.generateMipmaps!==void 0&&(e.generateMipmaps=t.generateMipmaps),t.internalFormat!==void 0&&(e.internalFormat=t.internalFormat);for(let i=0;i<this.textures.length;i++)this.textures[i].setValues(e)}get texture(){return this.textures[0]}set texture(t){this.textures[0]=t}set depthTexture(t){this._depthTexture!==null&&this._depthTexture.renderTarget===this&&(this._depthTexture.renderTarget=null),t!==null&&t.renderTarget===null&&(t.renderTarget=this),this._depthTexture=t}get depthTexture(){return this._depthTexture}setSize(t,e,i=1){if(this.width!==t||this.height!==e||this.depth!==i){this.width=t,this.height=e,this.depth=i;for(let s=0,r=this.textures.length;s<r;s++)this.textures[s].image.width=t,this.textures[s].image.height=e,this.textures[s].image.depth=i,this.textures[s].isData3DTexture!==!0&&(this.textures[s].isArrayTexture=this.textures[s].image.depth>1);this.dispose()}this.viewport.set(0,0,t,e),this.scissor.set(0,0,t,e)}clone(){return new this.constructor().copy(this)}copy(t){this.width=t.width,this.height=t.height,this.depth=t.depth,this.scissor.copy(t.scissor),this.scissorTest=t.scissorTest,this.viewport.copy(t.viewport),this.textures.length=0;for(let e=0,i=t.textures.length;e<i;e++){this.textures[e]=t.textures[e].clone(),this.textures[e].isRenderTargetTexture=!0,this.textures[e].renderTarget=this;let s=Object.assign({},t.textures[e].image);this.textures[e].source=new Br(s)}if(this.depthBuffer=t.depthBuffer,this.stencilBuffer=t.stencilBuffer,this.resolveColorBuffer=t.resolveColorBuffer,this.resolveDepthBuffer=t.resolveDepthBuffer,this.resolveStencilBuffer=t.resolveStencilBuffer,this.storeMultisampledColorBuffer=t.storeMultisampledColorBuffer,this.storeMultisampledDepthBuffer=t.storeMultisampledDepthBuffer,this.storeMultisampledStencilBuffer=t.storeMultisampledStencilBuffer,t.depthTexture!==null)if(t.depthTexture.renderTarget===t){let e=t.depthTexture.clone();e.renderTarget=null,this.depthTexture=e}else this.depthTexture=t.depthTexture;return this.samples=t.samples,this.multiview=t.multiview,this.useArrayDepthTexture=t.useArrayDepthTexture,this}dispose(){this.dispatchEvent({type:"dispose"})}},dn=class extends Pl{constructor(t=1,e=1,i={}){super(t,e,i),this.isWebGLRenderTarget=!0}},ea=class extends fn{constructor(t=null,e=1,i=1,s=1){super(null),this.isDataArrayTexture=!0,this.image={data:t,width:e,height:i,depth:s},this.magFilter=Ge,this.minFilter=Ge,this.wrapR=oi,this.generateMipmaps=!1,this.flipY=!1,this.unpackAlignment=1,this.layerUpdates=new Set}copy(t){return super.copy(t),this.wrapR=t.wrapR,this}addLayerUpdate(t){this.layerUpdates.add(t)}clearLayerUpdates(){this.layerUpdates.clear()}};var Il=class extends fn{constructor(t=null,e=1,i=1,s=1){super(null),this.isData3DTexture=!0,this.image={data:t,width:e,height:i,depth:s},this.magFilter=Ge,this.minFilter=Ge,this.wrapR=oi,this.generateMipmaps=!1,this.flipY=!1,this.unpackAlignment=1}copy(t){return super.copy(t),this.wrapR=t.wrapR,this}};var Ce=class n{static{n.prototype.isMatrix4=!0}constructor(t,e,i,s,r,o,a,l,c,u,f,h,m,_,S,p){this.elements=[1,0,0,0,0,1,0,0,0,0,1,0,0,0,0,1],t!==void 0&&this.set(t,e,i,s,r,o,a,l,c,u,f,h,m,_,S,p)}set(t,e,i,s,r,o,a,l,c,u,f,h,m,_,S,p){let d=this.elements;return d[0]=t,d[4]=e,d[8]=i,d[12]=s,d[1]=r,d[5]=o,d[9]=a,d[13]=l,d[2]=c,d[6]=u,d[10]=f,d[14]=h,d[3]=m,d[7]=_,d[11]=S,d[15]=p,this}identity(){return this.set(1,0,0,0,0,1,0,0,0,0,1,0,0,0,0,1),this}clone(){return new n().fromArray(this.elements)}copy(t){let e=this.elements,i=t.elements;return e[0]=i[0],e[1]=i[1],e[2]=i[2],e[3]=i[3],e[4]=i[4],e[5]=i[5],e[6]=i[6],e[7]=i[7],e[8]=i[8],e[9]=i[9],e[10]=i[10],e[11]=i[11],e[12]=i[12],e[13]=i[13],e[14]=i[14],e[15]=i[15],this}copyPosition(t){let e=this.elements,i=t.elements;return e[12]=i[12],e[13]=i[13],e[14]=i[14],this}setFromMatrix3(t){let e=t.elements;return this.set(e[0],e[3],e[6],0,e[1],e[4],e[7],0,e[2],e[5],e[8],0,0,0,0,1),this}extractBasis(t,e,i){return this.determinantAffine()===0?(t.set(1,0,0),e.set(0,1,0),i.set(0,0,1),this):(t.setFromMatrixColumn(this,0),e.setFromMatrixColumn(this,1),i.setFromMatrixColumn(this,2),this)}makeBasis(t,e,i){return this.set(t.x,e.x,i.x,0,t.y,e.y,i.y,0,t.z,e.z,i.z,0,0,0,0,1),this}extractRotation(t){if(t.determinantAffine()===0)return this.identity();let e=this.elements,i=t.elements,s=1/Mr.setFromMatrixColumn(t,0).length(),r=1/Mr.setFromMatrixColumn(t,1).length(),o=1/Mr.setFromMatrixColumn(t,2).length();return e[0]=i[0]*s,e[1]=i[1]*s,e[2]=i[2]*s,e[3]=0,e[4]=i[4]*r,e[5]=i[5]*r,e[6]=i[6]*r,e[7]=0,e[8]=i[8]*o,e[9]=i[9]*o,e[10]=i[10]*o,e[11]=0,e[12]=0,e[13]=0,e[14]=0,e[15]=1,this}makeRotationFromEuler(t){let e=this.elements,i=t.x,s=t.y,r=t.z,o=Math.cos(i),a=Math.sin(i),l=Math.cos(s),c=Math.sin(s),u=Math.cos(r),f=Math.sin(r);if(t.order==="XYZ"){let h=o*u,m=o*f,_=a*u,S=a*f;e[0]=l*u,e[4]=-l*f,e[8]=c,e[1]=m+_*c,e[5]=h-S*c,e[9]=-a*l,e[2]=S-h*c,e[6]=_+m*c,e[10]=o*l}else if(t.order==="YXZ"){let h=l*u,m=l*f,_=c*u,S=c*f;e[0]=h+S*a,e[4]=_*a-m,e[8]=o*c,e[1]=o*f,e[5]=o*u,e[9]=-a,e[2]=m*a-_,e[6]=S+h*a,e[10]=o*l}else if(t.order==="ZXY"){let h=l*u,m=l*f,_=c*u,S=c*f;e[0]=h-S*a,e[4]=-o*f,e[8]=_+m*a,e[1]=m+_*a,e[5]=o*u,e[9]=S-h*a,e[2]=-o*c,e[6]=a,e[10]=o*l}else if(t.order==="ZYX"){let h=o*u,m=o*f,_=a*u,S=a*f;e[0]=l*u,e[4]=_*c-m,e[8]=h*c+S,e[1]=l*f,e[5]=S*c+h,e[9]=m*c-_,e[2]=-c,e[6]=a*l,e[10]=o*l}else if(t.order==="YZX"){let h=o*l,m=o*c,_=a*l,S=a*c;e[0]=l*u,e[4]=S-h*f,e[8]=_*f+m,e[1]=f,e[5]=o*u,e[9]=-a*u,e[2]=-c*u,e[6]=m*f+_,e[10]=h-S*f}else if(t.order==="XZY"){let h=o*l,m=o*c,_=a*l,S=a*c;e[0]=l*u,e[4]=-f,e[8]=c*u,e[1]=h*f+S,e[5]=o*u,e[9]=m*f-_,e[2]=_*f-m,e[6]=a*u,e[10]=S*f+h}return e[3]=0,e[7]=0,e[11]=0,e[12]=0,e[13]=0,e[14]=0,e[15]=1,this}makeRotationFromQuaternion(t){return this.compose(tS,t,eS)}lookAt(t,e,i){let s=this.elements;return gn.subVectors(t,e),gn.lengthSq()===0&&(gn.z=1),gn.normalize(),Zi.crossVectors(i,gn),Zi.lengthSq()===0&&(Math.abs(i.z)===1?gn.x+=1e-4:gn.z+=1e-4,gn.normalize(),Zi.crossVectors(i,gn)),Zi.normalize(),$c.crossVectors(gn,Zi),s[0]=Zi.x,s[4]=$c.x,s[8]=gn.x,s[1]=Zi.y,s[5]=$c.y,s[9]=gn.y,s[2]=Zi.z,s[6]=$c.z,s[10]=gn.z,this}multiply(t){return this.multiplyMatrices(this,t)}premultiply(t){return this.multiplyMatrices(t,this)}multiplyMatrices(t,e){let i=t.elements,s=e.elements,r=this.elements,o=i[0],a=i[4],l=i[8],c=i[12],u=i[1],f=i[5],h=i[9],m=i[13],_=i[2],S=i[6],p=i[10],d=i[14],M=i[3],P=i[7],b=i[11],E=i[15],w=s[0],A=s[4],x=s[8],T=s[12],L=s[1],F=s[5],V=s[9],I=s[13],R=s[2],N=s[6],B=s[10],k=s[14],Y=s[3],$=s[7],J=s[11],q=s[15];return r[0]=o*w+a*L+l*R+c*Y,r[4]=o*A+a*F+l*N+c*$,r[8]=o*x+a*V+l*B+c*J,r[12]=o*T+a*I+l*k+c*q,r[1]=u*w+f*L+h*R+m*Y,r[5]=u*A+f*F+h*N+m*$,r[9]=u*x+f*V+h*B+m*J,r[13]=u*T+f*I+h*k+m*q,r[2]=_*w+S*L+p*R+d*Y,r[6]=_*A+S*F+p*N+d*$,r[10]=_*x+S*V+p*B+d*J,r[14]=_*T+S*I+p*k+d*q,r[3]=M*w+P*L+b*R+E*Y,r[7]=M*A+P*F+b*N+E*$,r[11]=M*x+P*V+b*B+E*J,r[15]=M*T+P*I+b*k+E*q,this}multiplyScalar(t){let e=this.elements;return e[0]*=t,e[4]*=t,e[8]*=t,e[12]*=t,e[1]*=t,e[5]*=t,e[9]*=t,e[13]*=t,e[2]*=t,e[6]*=t,e[10]*=t,e[14]*=t,e[3]*=t,e[7]*=t,e[11]*=t,e[15]*=t,this}determinant(){let t=this.elements,e=t[0],i=t[4],s=t[8],r=t[12],o=t[1],a=t[5],l=t[9],c=t[13],u=t[2],f=t[6],h=t[10],m=t[14],_=t[3],S=t[7],p=t[11],d=t[15],M=l*m-c*h,P=a*m-c*f,b=a*h-l*f,E=o*m-c*u,w=o*h-l*u,A=o*f-a*u;return e*(S*M-p*P+d*b)-i*(_*M-p*E+d*w)+s*(_*P-S*E+d*A)-r*(_*b-S*w+p*A)}determinantAffine(){let t=this.elements,e=t[0],i=t[4],s=t[8],r=t[1],o=t[5],a=t[9],l=t[2],c=t[6],u=t[10];return e*(o*u-a*c)-i*(r*u-a*l)+s*(r*c-o*l)}transpose(){let t=this.elements,e;return e=t[1],t[1]=t[4],t[4]=e,e=t[2],t[2]=t[8],t[8]=e,e=t[6],t[6]=t[9],t[9]=e,e=t[3],t[3]=t[12],t[12]=e,e=t[7],t[7]=t[13],t[13]=e,e=t[11],t[11]=t[14],t[14]=e,this}setPosition(t,e,i){let s=this.elements;return t.isVector3?(s[12]=t.x,s[13]=t.y,s[14]=t.z):(s[12]=t,s[13]=e,s[14]=i),this}invert(){let t=this.elements,e=t[0],i=t[1],s=t[2],r=t[3],o=t[4],a=t[5],l=t[6],c=t[7],u=t[8],f=t[9],h=t[10],m=t[11],_=t[12],S=t[13],p=t[14],d=t[15],M=e*a-i*o,P=e*l-s*o,b=e*c-r*o,E=i*l-s*a,w=i*c-r*a,A=s*c-r*l,x=u*S-f*_,T=u*p-h*_,L=u*d-m*_,F=f*p-h*S,V=f*d-m*S,I=h*d-m*p,R=M*I-P*V+b*F+E*L-w*T+A*x;if(R===0)return this.set(0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0);let N=1/R;return t[0]=(a*I-l*V+c*F)*N,t[1]=(s*V-i*I-r*F)*N,t[2]=(S*A-p*w+d*E)*N,t[3]=(h*w-f*A-m*E)*N,t[4]=(l*L-o*I-c*T)*N,t[5]=(e*I-s*L+r*T)*N,t[6]=(p*b-_*A-d*P)*N,t[7]=(u*A-h*b+m*P)*N,t[8]=(o*V-a*L+c*x)*N,t[9]=(i*L-e*V-r*x)*N,t[10]=(_*w-S*b+d*M)*N,t[11]=(f*b-u*w-m*M)*N,t[12]=(a*T-o*F-l*x)*N,t[13]=(e*F-i*T+s*x)*N,t[14]=(S*P-_*E-p*M)*N,t[15]=(u*E-f*P+h*M)*N,this}scale(t){let e=this.elements,i=t.x,s=t.y,r=t.z;return e[0]*=i,e[4]*=s,e[8]*=r,e[1]*=i,e[5]*=s,e[9]*=r,e[2]*=i,e[6]*=s,e[10]*=r,e[3]*=i,e[7]*=s,e[11]*=r,this}getMaxScaleOnAxis(){let t=this.elements,e=t[0]*t[0]+t[1]*t[1]+t[2]*t[2],i=t[4]*t[4]+t[5]*t[5]+t[6]*t[6],s=t[8]*t[8]+t[9]*t[9]+t[10]*t[10];return Math.sqrt(Math.max(e,i,s))}makeTranslation(t,e,i){return t.isVector3?this.set(1,0,0,t.x,0,1,0,t.y,0,0,1,t.z,0,0,0,1):this.set(1,0,0,t,0,1,0,e,0,0,1,i,0,0,0,1),this}makeRotationX(t){let e=Math.cos(t),i=Math.sin(t);return this.set(1,0,0,0,0,e,-i,0,0,i,e,0,0,0,0,1),this}makeRotationY(t){let e=Math.cos(t),i=Math.sin(t);return this.set(e,0,i,0,0,1,0,0,-i,0,e,0,0,0,0,1),this}makeRotationZ(t){let e=Math.cos(t),i=Math.sin(t);return this.set(e,-i,0,0,i,e,0,0,0,0,1,0,0,0,0,1),this}makeRotationAxis(t,e){let i=Math.cos(e),s=Math.sin(e),r=1-i,o=t.x,a=t.y,l=t.z,c=r*o,u=r*a;return this.set(c*o+i,c*a-s*l,c*l+s*a,0,c*a+s*l,u*a+i,u*l-s*o,0,c*l-s*a,u*l+s*o,r*l*l+i,0,0,0,0,1),this}makeScale(t,e,i){return this.set(t,0,0,0,0,e,0,0,0,0,i,0,0,0,0,1),this}makeShear(t,e,i,s,r,o){return this.set(1,i,r,0,t,1,o,0,e,s,1,0,0,0,0,1),this}compose(t,e,i){let s=this.elements,r=e._x,o=e._y,a=e._z,l=e._w,c=r+r,u=o+o,f=a+a,h=r*c,m=r*u,_=r*f,S=o*u,p=o*f,d=a*f,M=l*c,P=l*u,b=l*f,E=i.x,w=i.y,A=i.z;return s[0]=(1-(S+d))*E,s[1]=(m+b)*E,s[2]=(_-P)*E,s[3]=0,s[4]=(m-b)*w,s[5]=(1-(h+d))*w,s[6]=(p+M)*w,s[7]=0,s[8]=(_+P)*A,s[9]=(p-M)*A,s[10]=(1-(h+S))*A,s[11]=0,s[12]=t.x,s[13]=t.y,s[14]=t.z,s[15]=1,this}decompose(t,e,i){let s=this.elements;t.x=s[12],t.y=s[13],t.z=s[14];let r=this.determinantAffine();if(r===0)return i.set(1,1,1),e.identity(),this;let o=Mr.set(s[0],s[1],s[2]).length(),a=Mr.set(s[4],s[5],s[6]).length(),l=Mr.set(s[8],s[9],s[10]).length();r<0&&(o=-o),Gn.copy(this);let c=1/o,u=1/a,f=1/l;return Gn.elements[0]*=c,Gn.elements[1]*=c,Gn.elements[2]*=c,Gn.elements[4]*=u,Gn.elements[5]*=u,Gn.elements[6]*=u,Gn.elements[8]*=f,Gn.elements[9]*=f,Gn.elements[10]*=f,e.setFromRotationMatrix(Gn),i.x=o,i.y=a,i.z=l,this}makePerspective(t,e,i,s,r,o,a=Xn,l=!1){let c=this.elements,u=2*r/(e-t),f=2*r/(i-s),h=(e+t)/(e-t),m=(i+s)/(i-s),_,S;if(l)_=r/(o-r),S=o*r/(o-r);else if(a===Xn)_=-(o+r)/(o-r),S=-2*o*r/(o-r);else if(a===Qo)_=-o/(o-r),S=-o*r/(o-r);else throw new Error("THREE.Matrix4.makePerspective(): Invalid coordinate system: "+a);return c[0]=u,c[4]=0,c[8]=h,c[12]=0,c[1]=0,c[5]=f,c[9]=m,c[13]=0,c[2]=0,c[6]=0,c[10]=_,c[14]=S,c[3]=0,c[7]=0,c[11]=-1,c[15]=0,this}makeOrthographic(t,e,i,s,r,o,a=Xn,l=!1){let c=this.elements,u=2/(e-t),f=2/(i-s),h=-(e+t)/(e-t),m=-(i+s)/(i-s),_,S;if(l)_=1/(o-r),S=o/(o-r);else if(a===Xn)_=-2/(o-r),S=-(o+r)/(o-r);else if(a===Qo)_=-1/(o-r),S=-r/(o-r);else throw new Error("THREE.Matrix4.makeOrthographic(): Invalid coordinate system: "+a);return c[0]=u,c[4]=0,c[8]=0,c[12]=h,c[1]=0,c[5]=f,c[9]=0,c[13]=m,c[2]=0,c[6]=0,c[10]=_,c[14]=S,c[3]=0,c[7]=0,c[11]=0,c[15]=1,this}equals(t){let e=this.elements,i=t.elements;for(let s=0;s<16;s++)if(e[s]!==i[s])return!1;return!0}fromArray(t,e=0){for(let i=0;i<16;i++)this.elements[i]=t[i+e];return this}toArray(t=[],e=0){let i=this.elements;return t[e]=i[0],t[e+1]=i[1],t[e+2]=i[2],t[e+3]=i[3],t[e+4]=i[4],t[e+5]=i[5],t[e+6]=i[6],t[e+7]=i[7],t[e+8]=i[8],t[e+9]=i[9],t[e+10]=i[10],t[e+11]=i[11],t[e+12]=i[12],t[e+13]=i[13],t[e+14]=i[14],t[e+15]=i[15],t}},Mr=new W,Gn=new Ce,tS=new W(0,0,0),eS=new W(1,1,1),Zi=new W,$c=new W,gn=new W,c0=new Ce,l0=new li,ts=class n{constructor(t=0,e=0,i=0,s=n.DEFAULT_ORDER){this.isEuler=!0,this._x=t,this._y=e,this._z=i,this._order=s}get x(){return this._x}set x(t){this._x=t,this._onChangeCallback()}get y(){return this._y}set y(t){this._y=t,this._onChangeCallback()}get z(){return this._z}set z(t){this._z=t,this._onChangeCallback()}get order(){return this._order}set order(t){this._order=t,this._onChangeCallback()}set(t,e,i,s=this._order){return this._x=t,this._y=e,this._z=i,this._order=s,this._onChangeCallback(),this}clone(){return new this.constructor(this._x,this._y,this._z,this._order)}copy(t){return this._x=t._x,this._y=t._y,this._z=t._z,this._order=t._order,this._onChangeCallback(),this}setFromRotationMatrix(t,e=this._order,i=!0){let s=t.elements,r=s[0],o=s[4],a=s[8],l=s[1],c=s[5],u=s[9],f=s[2],h=s[6],m=s[10];switch(e){case"XYZ":this._y=Math.asin(Qt(a,-1,1)),Math.abs(a)<.9999999?(this._x=Math.atan2(-u,m),this._z=Math.atan2(-o,r)):(this._x=Math.atan2(h,c),this._z=0);break;case"YXZ":this._x=Math.asin(-Qt(u,-1,1)),Math.abs(u)<.9999999?(this._y=Math.atan2(a,m),this._z=Math.atan2(l,c)):(this._y=Math.atan2(-f,r),this._z=0);break;case"ZXY":this._x=Math.asin(Qt(h,-1,1)),Math.abs(h)<.9999999?(this._y=Math.atan2(-f,m),this._z=Math.atan2(-o,c)):(this._y=0,this._z=Math.atan2(l,r));break;case"ZYX":this._y=Math.asin(-Qt(f,-1,1)),Math.abs(f)<.9999999?(this._x=Math.atan2(h,m),this._z=Math.atan2(l,r)):(this._x=0,this._z=Math.atan2(-o,c));break;case"YZX":this._z=Math.asin(Qt(l,-1,1)),Math.abs(l)<.9999999?(this._x=Math.atan2(-u,c),this._y=Math.atan2(-f,r)):(this._x=0,this._y=Math.atan2(a,m));break;case"XZY":this._z=Math.asin(-Qt(o,-1,1)),Math.abs(o)<.9999999?(this._x=Math.atan2(h,c),this._y=Math.atan2(a,r)):(this._x=Math.atan2(-u,m),this._y=0);break;default:Dt("Euler: .setFromRotationMatrix() encountered an unknown order: "+e)}return this._order=e,i===!0&&this._onChangeCallback(),this}setFromQuaternion(t,e,i){return c0.makeRotationFromQuaternion(t),this.setFromRotationMatrix(c0,e,i)}setFromVector3(t,e=this._order){return this.set(t.x,t.y,t.z,e)}reorder(t){return l0.setFromEuler(this),this.setFromQuaternion(l0,t)}equals(t){return t._x===this._x&&t._y===this._y&&t._z===this._z&&t._order===this._order}fromArray(t){return this._x=t[0],this._y=t[1],this._z=t[2],t[3]!==void 0&&(this._order=t[3]),this._onChangeCallback(),this}toArray(t=[],e=0){return t[e]=this._x,t[e+1]=this._y,t[e+2]=this._z,t[e+3]=this._order,t}_onChange(t){return this._onChangeCallback=t,this}_onChangeCallback(){}*[Symbol.iterator](){yield this._x,yield this._y,yield this._z,yield this._order}};ts.DEFAULT_ORDER="XYZ";var na=class{constructor(){this.mask=1}set(t){this.mask=(1<<t|0)>>>0}enable(t){this.mask|=1<<t|0}enableAll(){this.mask=-1}toggle(t){this.mask^=1<<t|0}disable(t){this.mask&=~(1<<t|0)}disableAll(){this.mask=0}test(t){return(this.mask&t.mask)!==0}isEnabled(t){return(this.mask&(1<<t|0))!==0}},nS=0,u0=new W,Tr=new li,Ti=new Ce,Xc=new W,$o=new W,iS=new W,sS=new li,h0=new W(1,0,0),f0=new W(0,1,0),d0=new W(0,0,1),p0={type:"added"},rS={type:"removed"},wr={type:"childadded",child:null},Uf={type:"childremoved",child:null},yn=class n extends ci{constructor(){super(),this.isObject3D=!0,Object.defineProperty(this,"id",{value:nS++}),this.uuid=Aa(),this.name="",this.type="Object3D",this.parent=null,this.children=[],this.up=n.DEFAULT_UP.clone();let t=new W,e=new ts,i=new li,s=new W(1,1,1);function r(){i.setFromEuler(e,!1)}function o(){e.setFromQuaternion(i,void 0,!1)}e._onChange(r),i._onChange(o),Object.defineProperties(this,{position:{configurable:!0,enumerable:!0,value:t},rotation:{configurable:!0,enumerable:!0,value:e},quaternion:{configurable:!0,enumerable:!0,value:i},scale:{configurable:!0,enumerable:!0,value:s},modelViewMatrix:{value:new Ce},normalMatrix:{value:new Vt}}),this.matrix=new Ce,this.matrixWorld=new Ce,this.matrixAutoUpdate=n.DEFAULT_MATRIX_AUTO_UPDATE,this.matrixWorldAutoUpdate=n.DEFAULT_MATRIX_WORLD_AUTO_UPDATE,this.matrixWorldNeedsUpdate=!1,this.layers=new na,this.visible=!0,this.castShadow=!1,this.receiveShadow=!1,this.frustumCulled=!0,this.renderOrder=0,this.animations=[],this.customDepthMaterial=void 0,this.customDistanceMaterial=void 0,this.static=!1,this.userData={},this.pivot=null}onBeforeShadow(){}onAfterShadow(){}onBeforeRender(){}onAfterRender(){}applyMatrix4(t){this.matrixAutoUpdate&&this.updateMatrix(),this.matrix.premultiply(t),this.matrix.decompose(this.position,this.quaternion,this.scale)}applyQuaternion(t){return this.quaternion.premultiply(t),this}setRotationFromAxisAngle(t,e){this.quaternion.setFromAxisAngle(t,e)}setRotationFromEuler(t){this.quaternion.setFromEuler(t,!0)}setRotationFromMatrix(t){this.quaternion.setFromRotationMatrix(t)}setRotationFromQuaternion(t){this.quaternion.copy(t)}rotateOnAxis(t,e){return Tr.setFromAxisAngle(t,e),this.quaternion.multiply(Tr),this}rotateOnWorldAxis(t,e){return Tr.setFromAxisAngle(t,e),this.quaternion.premultiply(Tr),this}rotateX(t){return this.rotateOnAxis(h0,t)}rotateY(t){return this.rotateOnAxis(f0,t)}rotateZ(t){return this.rotateOnAxis(d0,t)}translateOnAxis(t,e){return u0.copy(t).applyQuaternion(this.quaternion),this.position.add(u0.multiplyScalar(e)),this}translateX(t){return this.translateOnAxis(h0,t)}translateY(t){return this.translateOnAxis(f0,t)}translateZ(t){return this.translateOnAxis(d0,t)}localToWorld(t){return this.updateWorldMatrix(!0,!1),t.applyMatrix4(this.matrixWorld)}worldToLocal(t){return this.updateWorldMatrix(!0,!1),t.applyMatrix4(Ti.copy(this.matrixWorld).invert())}lookAt(t,e,i){t.isVector3?Xc.copy(t):Xc.set(t,e,i);let s=this.parent;this.updateWorldMatrix(!0,!1),$o.setFromMatrixPosition(this.matrixWorld),this.isCamera||this.isLight?Ti.lookAt($o,Xc,this.up):Ti.lookAt(Xc,$o,this.up),this.quaternion.setFromRotationMatrix(Ti),s&&(Ti.extractRotation(s.matrixWorld),Tr.setFromRotationMatrix(Ti),this.quaternion.premultiply(Tr.invert()))}add(t){if(arguments.length>1){for(let e=0;e<arguments.length;e++)this.add(arguments[e]);return this}return t===this?(Bt("Object3D.add: object can't be added as a child of itself.",t),this):(t&&t.isObject3D?(t.removeFromParent(),t.parent=this,this.children.push(t),t.dispatchEvent(p0),wr.child=t,this.dispatchEvent(wr),wr.child=null):Bt("Object3D.add: object not an instance of THREE.Object3D.",t),this)}remove(t){if(arguments.length>1){for(let i=0;i<arguments.length;i++)this.remove(arguments[i]);return this}let e=this.children.indexOf(t);return e!==-1&&(t.parent=null,this.children.splice(e,1),t.dispatchEvent(rS),Uf.child=t,this.dispatchEvent(Uf),Uf.child=null),this}removeFromParent(){let t=this.parent;return t!==null&&t.remove(this),this}clear(){return this.remove(...this.children)}attach(t){return this.updateWorldMatrix(!0,!1),Ti.copy(this.matrixWorld).invert(),t.parent!==null&&(t.parent.updateWorldMatrix(!0,!1),Ti.multiply(t.parent.matrixWorld)),t.applyMatrix4(Ti),t.removeFromParent(),t.parent=this,this.children.push(t),t.updateWorldMatrix(!1,!0),t.dispatchEvent(p0),wr.child=t,this.dispatchEvent(wr),wr.child=null,this}getObjectById(t){return this.getObjectByProperty("id",t)}getObjectByName(t){return this.getObjectByProperty("name",t)}getObjectByProperty(t,e){if(this[t]===e)return this;for(let i=0,s=this.children.length;i<s;i++){let o=this.children[i].getObjectByProperty(t,e);if(o!==void 0)return o}}getObjectsByProperty(t,e,i=[]){this[t]===e&&i.push(this);let s=this.children;for(let r=0,o=s.length;r<o;r++)s[r].getObjectsByProperty(t,e,i);return i}getWorldPosition(t){return this.updateWorldMatrix(!0,!1),t.setFromMatrixPosition(this.matrixWorld)}getWorldQuaternion(t){return this.updateWorldMatrix(!0,!1),this.matrixWorld.decompose($o,t,iS),t}getWorldScale(t){return this.updateWorldMatrix(!0,!1),this.matrixWorld.decompose($o,sS,t),t}getWorldDirection(t){this.updateWorldMatrix(!0,!1);let e=this.matrixWorld.elements;return t.set(e[8],e[9],e[10]).normalize()}raycast(){}intersectsFrustum(){}traverse(t){t(this);let e=this.children;for(let i=0,s=e.length;i<s;i++)e[i].traverse(t)}traverseVisible(t){if(this.visible===!1)return;t(this);let e=this.children;for(let i=0,s=e.length;i<s;i++)e[i].traverseVisible(t)}traverseAncestors(t){let e=this.parent;e!==null&&(t(e),e.traverseAncestors(t))}updateMatrix(){this.matrix.compose(this.position,this.quaternion,this.scale);let t=this.pivot;if(t!==null){let e=t.x,i=t.y,s=t.z,r=this.matrix.elements;r[12]+=e-r[0]*e-r[4]*i-r[8]*s,r[13]+=i-r[1]*e-r[5]*i-r[9]*s,r[14]+=s-r[2]*e-r[6]*i-r[10]*s}this.matrixWorldNeedsUpdate=!0}updateMatrixWorld(t){this.matrixAutoUpdate&&this.updateMatrix(),(this.matrixWorldNeedsUpdate||t)&&(this.matrixWorldAutoUpdate===!0&&(this.parent===null?this.matrixWorld.copy(this.matrix):this.matrixWorld.multiplyMatrices(this.parent.matrixWorld,this.matrix)),this.matrixWorldNeedsUpdate=!1,t=!0);let e=this.children;for(let i=0,s=e.length;i<s;i++)e[i].updateMatrixWorld(t)}updateWorldMatrix(t,e,i=!1){let s=this.parent;if(t===!0&&s!==null&&s.updateWorldMatrix(!0,!1),this.matrixAutoUpdate&&this.updateMatrix(),(this.matrixWorldNeedsUpdate||i)&&(this.matrixWorldAutoUpdate===!0&&(this.parent===null?this.matrixWorld.copy(this.matrix):this.matrixWorld.multiplyMatrices(this.parent.matrixWorld,this.matrix)),this.matrixWorldNeedsUpdate=!1,i=!0),e===!0){let r=this.children;for(let o=0,a=r.length;o<a;o++)r[o].updateWorldMatrix(!1,!0,i)}}toJSON(t){let e=t===void 0||typeof t=="string",i={};e&&(t={geometries:{},materials:{},textures:{},images:{},shapes:{},skeletons:{},animations:{},nodes:{}},i.metadata={version:4.7,type:"Object",generator:"Object3D.toJSON"});let s={};s.uuid=this.uuid,s.type=this.type,s.name=this.name,s.castShadow=this.castShadow,s.receiveShadow=this.receiveShadow,s.visible=this.visible,s.frustumCulled=this.frustumCulled,s.renderOrder=this.renderOrder,s.static=this.static,s.matrixAutoUpdate=this.matrixAutoUpdate,Object.keys(this.userData).length>0&&(s.userData=this.userData),s.layers=this.layers.mask,s.matrix=this.matrix.toArray(),s.up=this.up.toArray(),this.pivot!==null&&(s.pivot=this.pivot.toArray()),this.morphTargetDictionary!==void 0&&(s.morphTargetDictionary=Object.assign({},this.morphTargetDictionary)),this.morphTargetInfluences!==void 0&&(s.morphTargetInfluences=this.morphTargetInfluences.slice()),this.isInstancedMesh&&(s.type="InstancedMesh",s.count=this.count,s.instanceMatrix=this.instanceMatrix.toJSON(),this.instanceColor!==null&&(s.instanceColor=this.instanceColor.toJSON())),this.isBatchedMesh&&(s.type="BatchedMesh",s.perObjectFrustumCulled=this.perObjectFrustumCulled,s.sortObjects=this.sortObjects,s.drawRanges=this._drawRanges,s.reservedRanges=this._reservedRanges,s.geometryInfo=this._geometryInfo.map(a=>({...a,boundingBox:a.boundingBox?a.boundingBox.toJSON():void 0,boundingSphere:a.boundingSphere?a.boundingSphere.toJSON():void 0})),s.instanceInfo=this._instanceInfo.map(a=>({...a})),s.availableInstanceIds=this._availableInstanceIds.slice(),s.availableGeometryIds=this._availableGeometryIds.slice(),s.nextIndexStart=this._nextIndexStart,s.nextVertexStart=this._nextVertexStart,s.geometryCount=this._geometryCount,s.maxInstanceCount=this._maxInstanceCount,s.maxVertexCount=this._maxVertexCount,s.maxIndexCount=this._maxIndexCount,s.geometryInitialized=this._geometryInitialized,s.matricesTexture=this._matricesTexture.toJSON(t),s.indirectTexture=this._indirectTexture.toJSON(t),this._colorsTexture!==null&&(s.colorsTexture=this._colorsTexture.toJSON(t)),this.boundingSphere!==null&&(s.boundingSphere=this.boundingSphere.toJSON()),this.boundingBox!==null&&(s.boundingBox=this.boundingBox.toJSON()));function r(a,l){return a[l.uuid]===void 0&&(a[l.uuid]=l.toJSON(t)),l.uuid}if(this.isScene)this.background&&(this.background.isColor?s.background=this.background.toJSON():this.background.isTexture&&(s.background=this.background.toJSON(t).uuid)),this.environment&&this.environment.isTexture&&this.environment.isRenderTargetTexture!==!0&&(s.environment=this.environment.toJSON(t).uuid);else if(this.isMesh||this.isLine||this.isPoints){s.geometry=r(t.geometries,this.geometry);let a=this.geometry.parameters;if(a!==void 0&&a.shapes!==void 0){let l=a.shapes;if(Array.isArray(l))for(let c=0,u=l.length;c<u;c++){let f=l[c];r(t.shapes,f)}else r(t.shapes,l)}}if(this.isSkinnedMesh&&(s.bindMode=this.bindMode,s.bindMatrix=this.bindMatrix.toArray(),this.skeleton!==void 0&&(r(t.skeletons,this.skeleton),s.skeleton=this.skeleton.uuid)),this.material!==void 0)if(Array.isArray(this.material)){let a=[];for(let l=0,c=this.material.length;l<c;l++)a.push(r(t.materials,this.material[l]));s.material=a}else s.material=r(t.materials,this.material);if(this.children.length>0){s.children=[];for(let a=0;a<this.children.length;a++)s.children.push(this.children[a].toJSON(t).object)}if(this.animations.length>0){s.animations=[];for(let a=0;a<this.animations.length;a++){let l=this.animations[a];s.animations.push(r(t.animations,l))}}if(e){let a=o(t.geometries),l=o(t.materials),c=o(t.textures),u=o(t.images),f=o(t.shapes),h=o(t.skeletons),m=o(t.animations),_=o(t.nodes);a.length>0&&(i.geometries=a),l.length>0&&(i.materials=l),c.length>0&&(i.textures=c),u.length>0&&(i.images=u),f.length>0&&(i.shapes=f),h.length>0&&(i.skeletons=h),m.length>0&&(i.animations=m),_.length>0&&(i.nodes=_)}return i.object=s,i;function o(a){let l=[];for(let c in a){let u=a[c];delete u.metadata,l.push(u)}return l}}clone(t){return new this.constructor().copy(this,t)}copy(t,e=!0){if(this.name=t.name,this.up.copy(t.up),this.position.copy(t.position),this.rotation.order=t.rotation.order,this.quaternion.copy(t.quaternion),this.scale.copy(t.scale),this.pivot=t.pivot!==null?t.pivot.clone():null,this.matrix.copy(t.matrix),this.matrixWorld.copy(t.matrixWorld),this.matrixAutoUpdate=t.matrixAutoUpdate,this.matrixWorldAutoUpdate=t.matrixWorldAutoUpdate,this.matrixWorldNeedsUpdate=t.matrixWorldNeedsUpdate,this.layers.mask=t.layers.mask,this.visible=t.visible,this.castShadow=t.castShadow,this.receiveShadow=t.receiveShadow,this.frustumCulled=t.frustumCulled,this.renderOrder=t.renderOrder,this.static=t.static,this.animations=t.animations.slice(),this.userData=JSON.parse(JSON.stringify(t.userData)),e===!0)for(let i=0;i<t.children.length;i++){let s=t.children[i];this.add(s.clone())}return this}dispose(){this.dispatchEvent({type:"dispose"})}};yn.DEFAULT_UP=new W(0,1,0);yn.DEFAULT_MATRIX_AUTO_UPDATE=!0;yn.DEFAULT_MATRIX_WORLD_AUTO_UPDATE=!0;var Pi=class extends yn{constructor(){super(),this.isGroup=!0,this.type="Group"}},oS={type:"move"},kr=class{constructor(){this._targetRay=null,this._grip=null,this._hand=null}getHandSpace(){return this._hand===null&&(this._hand=new Pi,this._hand.matrixAutoUpdate=!1,this._hand.visible=!1,this._hand.joints={},this._hand.inputState={pinching:!1}),this._hand}getTargetRaySpace(){return this._targetRay===null&&(this._targetRay=new Pi,this._targetRay.matrixAutoUpdate=!1,this._targetRay.visible=!1,this._targetRay.hasLinearVelocity=!1,this._targetRay.linearVelocity=new W,this._targetRay.hasAngularVelocity=!1,this._targetRay.angularVelocity=new W),this._targetRay}getGripSpace(){return this._grip===null&&(this._grip=new Pi,this._grip.matrixAutoUpdate=!1,this._grip.visible=!1,this._grip.hasLinearVelocity=!1,this._grip.linearVelocity=new W,this._grip.hasAngularVelocity=!1,this._grip.angularVelocity=new W,this._grip.eventsEnabled=!1),this._grip}dispatchEvent(t){return this._targetRay!==null&&this._targetRay.dispatchEvent(t),this._grip!==null&&this._grip.dispatchEvent(t),this._hand!==null&&this._hand.dispatchEvent(t),this}connect(t){if(t&&t.hand){let e=this._hand;if(e)for(let i of t.hand.values())this._getHandJoint(e,i)}return this.dispatchEvent({type:"connected",data:t}),this}disconnect(t){return this.dispatchEvent({type:"disconnected",data:t}),this._targetRay!==null&&(this._targetRay.visible=!1),this._grip!==null&&(this._grip.visible=!1),this._hand!==null&&(this._hand.visible=!1),this}update(t,e,i){let s=null,r=null,o=null,a=this._targetRay,l=this._grip,c=this._hand;if(t&&e.session.visibilityState!=="visible-blurred"){if(c&&t.hand){o=!0;for(let S of t.hand.values()){let p=e.getJointPose(S,i),d=this._getHandJoint(c,S);p!==null&&(d.matrix.fromArray(p.transform.matrix),d.matrix.decompose(d.position,d.rotation,d.scale),d.matrixWorldNeedsUpdate=!0,d.jointRadius=p.radius),d.visible=p!==null}let u=c.joints["index-finger-tip"],f=c.joints["thumb-tip"],h=u.position.distanceTo(f.position),m=.02,_=.005;c.inputState.pinching&&h>m+_?(c.inputState.pinching=!1,this.dispatchEvent({type:"pinchend",handedness:t.handedness,target:this})):!c.inputState.pinching&&h<=m-_&&(c.inputState.pinching=!0,this.dispatchEvent({type:"pinchstart",handedness:t.handedness,target:this}))}else l!==null&&t.gripSpace&&(r=e.getPose(t.gripSpace,i),r!==null&&(l.matrix.fromArray(r.transform.matrix),l.matrix.decompose(l.position,l.rotation,l.scale),l.matrixWorldNeedsUpdate=!0,r.linearVelocity?(l.hasLinearVelocity=!0,l.linearVelocity.copy(r.linearVelocity)):l.hasLinearVelocity=!1,r.angularVelocity?(l.hasAngularVelocity=!0,l.angularVelocity.copy(r.angularVelocity)):l.hasAngularVelocity=!1,l.eventsEnabled&&l.dispatchEvent({type:"gripUpdated",data:t,target:this})));a!==null&&(s=e.getPose(t.targetRaySpace,i),s===null&&r!==null&&(s=r),s!==null&&(a.matrix.fromArray(s.transform.matrix),a.matrix.decompose(a.position,a.rotation,a.scale),a.matrixWorldNeedsUpdate=!0,s.linearVelocity?(a.hasLinearVelocity=!0,a.linearVelocity.copy(s.linearVelocity)):a.hasLinearVelocity=!1,s.angularVelocity?(a.hasAngularVelocity=!0,a.angularVelocity.copy(s.angularVelocity)):a.hasAngularVelocity=!1,this.dispatchEvent(oS)))}return a!==null&&(a.visible=s!==null),l!==null&&(l.visible=r!==null),c!==null&&(c.visible=o!==null),this}_getHandJoint(t,e){if(t.joints[e.jointName]===void 0){let i=new Pi;i.matrixAutoUpdate=!1,i.visible=!1,t.joints[e.jointName]=i,t.add(i)}return t.joints[e.jointName]}},h_={aliceblue:15792383,antiquewhite:16444375,aqua:65535,aquamarine:8388564,azure:15794175,beige:16119260,bisque:16770244,black:0,blanchedalmond:16772045,blue:255,blueviolet:9055202,brown:10824234,burlywood:14596231,cadetblue:6266528,chartreuse:8388352,chocolate:13789470,coral:16744272,cornflowerblue:6591981,cornsilk:16775388,crimson:14423100,cyan:65535,darkblue:139,darkcyan:35723,darkgoldenrod:12092939,darkgray:11119017,darkgreen:25600,darkgrey:11119017,darkkhaki:12433259,darkmagenta:9109643,darkolivegreen:5597999,darkorange:16747520,darkorchid:10040012,darkred:9109504,darksalmon:15308410,darkseagreen:9419919,darkslateblue:4734347,darkslategray:3100495,darkslategrey:3100495,darkturquoise:52945,darkviolet:9699539,deeppink:16716947,deepskyblue:49151,dimgray:6908265,dimgrey:6908265,dodgerblue:2003199,firebrick:11674146,floralwhite:16775920,forestgreen:2263842,fuchsia:16711935,gainsboro:14474460,ghostwhite:16316671,gold:16766720,goldenrod:14329120,gray:8421504,green:32768,greenyellow:11403055,grey:8421504,honeydew:15794160,hotpink:16738740,indianred:13458524,indigo:4915330,ivory:16777200,khaki:15787660,lavender:15132410,lavenderblush:16773365,lawngreen:8190976,lemonchiffon:16775885,lightblue:11393254,lightcoral:15761536,lightcyan:14745599,lightgoldenrodyellow:16448210,lightgray:13882323,lightgreen:9498256,lightgrey:13882323,lightpink:16758465,lightsalmon:16752762,lightseagreen:2142890,lightskyblue:8900346,lightslategray:7833753,lightslategrey:7833753,lightsteelblue:11584734,lightyellow:16777184,lime:65280,limegreen:3329330,linen:16445670,magenta:16711935,maroon:8388608,mediumaquamarine:6737322,mediumblue:205,mediumorchid:12211667,mediumpurple:9662683,mediumseagreen:3978097,mediumslateblue:8087790,mediumspringgreen:64154,mediumturquoise:4772300,mediumvioletred:13047173,midnightblue:1644912,mintcream:16121850,mistyrose:16770273,moccasin:16770229,navajowhite:16768685,navy:128,oldlace:16643558,olive:8421376,olivedrab:7048739,orange:16753920,orangered:16729344,orchid:14315734,palegoldenrod:15657130,palegreen:10025880,paleturquoise:11529966,palevioletred:14381203,papayawhip:16773077,peachpuff:16767673,peru:13468991,pink:16761035,plum:14524637,powderblue:11591910,purple:8388736,rebeccapurple:6697881,red:16711680,rosybrown:12357519,royalblue:4286945,saddlebrown:9127187,salmon:16416882,sandybrown:16032864,seagreen:3050327,seashell:16774638,sienna:10506797,silver:12632256,skyblue:8900331,slateblue:6970061,slategray:7372944,slategrey:7372944,snow:16775930,springgreen:65407,steelblue:4620980,tan:13808780,teal:32896,thistle:14204888,tomato:16737095,turquoise:4251856,violet:15631086,wheat:16113331,white:16777215,whitesmoke:16119285,yellow:16776960,yellowgreen:10145074},Ki={h:0,s:0,l:0},qc={h:0,s:0,l:0};function Df(n,t,e){return e<0&&(e+=1),e>1&&(e-=1),e<1/6?n+(t-n)*6*e:e<1/2?t:e<2/3?n+(t-n)*6*(2/3-e):n}var ne=class{constructor(t,e,i){return this.isColor=!0,this.r=1,this.g=1,this.b=1,this.set(t,e,i)}set(t,e,i){if(e===void 0&&i===void 0){let s=t;s&&s.isColor?this.copy(s):typeof s=="number"?this.setHex(s):typeof s=="string"&&this.setStyle(s)}else this.setRGB(t,e,i);return this}setScalar(t){return this.r=t,this.g=t,this.b=t,this}setHex(t,e=xn){return t=Math.floor(t),this.r=(t>>16&255)/255,this.g=(t>>8&255)/255,this.b=(t&255)/255,Kt.colorSpaceToWorking(this,e),this}setRGB(t,e,i,s=Kt.workingColorSpace){return this.r=t,this.g=e,this.b=i,Kt.colorSpaceToWorking(this,s),this}setHSL(t,e,i,s=Kt.workingColorSpace){if(t=Kv(t,1),e=Qt(e,0,1),i=Qt(i,0,1),e===0)this.r=this.g=this.b=i;else{let r=i<=.5?i*(1+e):i+e-i*e,o=2*i-r;this.r=Df(o,r,t+1/3),this.g=Df(o,r,t),this.b=Df(o,r,t-1/3)}return Kt.colorSpaceToWorking(this,s),this}setStyle(t,e=xn){function i(r){r!==void 0&&parseFloat(r)<1&&Dt("Color: Alpha component of "+t+" will be ignored.")}let s;if(s=/^(\w+)\(([^\)]*)\)/.exec(t)){let r,o=s[1],a=s[2];switch(o){case"rgb":case"rgba":if(r=/^\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)\s*(?:,\s*(\d*\.?\d+)\s*)?$/.exec(a))return i(r[4]),this.setRGB(Math.min(255,parseInt(r[1],10))/255,Math.min(255,parseInt(r[2],10))/255,Math.min(255,parseInt(r[3],10))/255,e);if(r=/^\s*(\d+)\%\s*,\s*(\d+)\%\s*,\s*(\d+)\%\s*(?:,\s*(\d*\.?\d+)\s*)?$/.exec(a))return i(r[4]),this.setRGB(Math.min(100,parseInt(r[1],10))/100,Math.min(100,parseInt(r[2],10))/100,Math.min(100,parseInt(r[3],10))/100,e);break;case"hsl":case"hsla":if(r=/^\s*(\d*\.?\d+)\s*,\s*(\d*\.?\d+)\%\s*,\s*(\d*\.?\d+)\%\s*(?:,\s*(\d*\.?\d+)\s*)?$/.exec(a))return i(r[4]),this.setHSL(parseFloat(r[1])/360,parseFloat(r[2])/100,parseFloat(r[3])/100,e);break;default:Dt("Color: Unknown color model "+t)}}else if(s=/^\#([A-Fa-f\d]+)$/.exec(t)){let r=s[1],o=r.length;if(o===3)return this.setRGB(parseInt(r.charAt(0),16)/15,parseInt(r.charAt(1),16)/15,parseInt(r.charAt(2),16)/15,e);if(o===6)return this.setHex(parseInt(r,16),e);Dt("Color: Invalid hex color "+t)}else if(t&&t.length>0)return this.setColorName(t,e);return this}setColorName(t,e=xn){let i=h_[t.toLowerCase()];return i!==void 0?this.setHex(i,e):Dt("Color: Unknown color "+t),this}clone(){return new this.constructor(this.r,this.g,this.b)}copy(t){return this.r=t.r,this.g=t.g,this.b=t.b,this}copySRGBToLinear(t){return this.r=Ii(t.r),this.g=Ii(t.g),this.b=Ii(t.b),this}copyLinearToSRGB(t){return this.r=Dr(t.r),this.g=Dr(t.g),this.b=Dr(t.b),this}convertSRGBToLinear(){return this.copySRGBToLinear(this),this}convertLinearToSRGB(){return this.copyLinearToSRGB(this),this}getHex(t=xn){return Kt.workingToColorSpace(Je.copy(this),t),Math.round(Qt(Je.r*255,0,255))*65536+Math.round(Qt(Je.g*255,0,255))*256+Math.round(Qt(Je.b*255,0,255))}getHexString(t=xn){return("000000"+this.getHex(t).toString(16)).slice(-6)}getHSL(t,e=Kt.workingColorSpace){Kt.workingToColorSpace(Je.copy(this),e);let i=Je.r,s=Je.g,r=Je.b,o=Math.max(i,s,r),a=Math.min(i,s,r),l,c,u=(a+o)/2;if(a===o)l=0,c=0;else{let f=o-a;switch(c=u<=.5?f/(o+a):f/(2-o-a),o){case i:l=(s-r)/f+(s<r?6:0);break;case s:l=(r-i)/f+2;break;case r:l=(i-s)/f+4;break}l/=6}return t.h=l,t.s=c,t.l=u,t}getRGB(t,e=Kt.workingColorSpace){return Kt.workingToColorSpace(Je.copy(this),e),t.r=Je.r,t.g=Je.g,t.b=Je.b,t}getStyle(t=xn){Kt.workingToColorSpace(Je.copy(this),t);let e=Je.r,i=Je.g,s=Je.b;return t!==xn?`color(${t} ${e.toFixed(3)} ${i.toFixed(3)} ${s.toFixed(3)})`:`rgb(${Math.round(e*255)},${Math.round(i*255)},${Math.round(s*255)})`}offsetHSL(t,e,i){return this.getHSL(Ki),this.setHSL(Ki.h+t,Ki.s+e,Ki.l+i)}add(t){return this.r+=t.r,this.g+=t.g,this.b+=t.b,this}addColors(t,e){return this.r=t.r+e.r,this.g=t.g+e.g,this.b=t.b+e.b,this}addScalar(t){return this.r+=t,this.g+=t,this.b+=t,this}sub(t){return this.r=Math.max(0,this.r-t.r),this.g=Math.max(0,this.g-t.g),this.b=Math.max(0,this.b-t.b),this}multiply(t){return this.r*=t.r,this.g*=t.g,this.b*=t.b,this}multiplyScalar(t){return this.r*=t,this.g*=t,this.b*=t,this}lerp(t,e){return this.r+=(t.r-this.r)*e,this.g+=(t.g-this.g)*e,this.b+=(t.b-this.b)*e,this}lerpColors(t,e,i){return this.r=t.r+(e.r-t.r)*i,this.g=t.g+(e.g-t.g)*i,this.b=t.b+(e.b-t.b)*i,this}lerpHSL(t,e){this.getHSL(Ki),t.getHSL(qc);let i=Rf(Ki.h,qc.h,e),s=Rf(Ki.s,qc.s,e),r=Rf(Ki.l,qc.l,e);return this.setHSL(i,s,r),this}setFromVector3(t){return this.r=t.x,this.g=t.y,this.b=t.z,this}applyMatrix3(t){let e=this.r,i=this.g,s=this.b,r=t.elements;return this.r=r[0]*e+r[3]*i+r[6]*s,this.g=r[1]*e+r[4]*i+r[7]*s,this.b=r[2]*e+r[5]*i+r[8]*s,this}equals(t){return t.r===this.r&&t.g===this.g&&t.b===this.b}fromArray(t,e=0){return this.r=t[e],this.g=t[e+1],this.b=t[e+2],this}toArray(t=[],e=0){return t[e]=this.r,t[e+1]=this.g,t[e+2]=this.b,t}fromBufferAttribute(t,e){return this.r=t.getX(e),this.g=t.getY(e),this.b=t.getZ(e),this}toJSON(){return this.getHex()}*[Symbol.iterator](){yield this.r,yield this.g,yield this.b}},Je=new ne;ne.NAMES=h_;var ia=class extends yn{constructor(){super(),this.isScene=!0,this.type="Scene",this.background=null,this.environment=null,this.fog=null,this.backgroundBlurriness=0,this.backgroundIntensity=1,this.backgroundRotation=new ts,this.environmentIntensity=1,this.environmentRotation=new ts,this.overrideMaterial=null,typeof __THREE_DEVTOOLS__<"u"&&__THREE_DEVTOOLS__.dispatchEvent(new CustomEvent("observe",{detail:this}))}copy(t,e){return super.copy(t,e),t.background!==null&&(this.background=t.background.clone()),t.environment!==null&&(this.environment=t.environment.clone()),t.fog!==null&&(this.fog=t.fog.clone()),this.backgroundBlurriness=t.backgroundBlurriness,this.backgroundIntensity=t.backgroundIntensity,this.backgroundRotation.copy(t.backgroundRotation),this.environmentIntensity=t.environmentIntensity,this.environmentRotation.copy(t.environmentRotation),t.overrideMaterial!==null&&(this.overrideMaterial=t.overrideMaterial.clone()),this.matrixAutoUpdate=t.matrixAutoUpdate,this}toJSON(t){let e=super.toJSON(t);return this.fog!==null&&(e.object.fog=this.fog.toJSON()),e.object.backgroundBlurriness=this.backgroundBlurriness,e.object.backgroundIntensity=this.backgroundIntensity,e.object.backgroundRotation=this.backgroundRotation.toArray(),e.object.environmentIntensity=this.environmentIntensity,e.object.environmentRotation=this.environmentRotation.toArray(),e}},Hn=new W,wi=new W,Of=new W,Ei=new W,Er=new W,Ar=new W,m0=new W,Ff=new W,Bf=new W,kf=new W,Vf=new we,zf=new we,Gf=new we,Ri=class n{constructor(t=new W,e=new W,i=new W){this.a=t,this.b=e,this.c=i}static getNormal(t,e,i,s){s.subVectors(i,e),Hn.subVectors(t,e),s.cross(Hn);let r=s.lengthSq();return r>0?s.multiplyScalar(1/Math.sqrt(r)):s.set(0,0,0)}static getBarycoord(t,e,i,s,r){Hn.subVectors(s,e),wi.subVectors(i,e),Of.subVectors(t,e);let o=Hn.dot(Hn),a=Hn.dot(wi),l=Hn.dot(Of),c=wi.dot(wi),u=wi.dot(Of),f=o*c-a*a;if(f===0)return r.set(0,0,0),null;let h=1/f,m=(c*l-a*u)*h,_=(o*u-a*l)*h;return r.set(1-m-_,_,m)}static containsPoint(t,e,i,s){return this.getBarycoord(t,e,i,s,Ei)===null?!1:Ei.x>=0&&Ei.y>=0&&Ei.x+Ei.y<=1}static getInterpolation(t,e,i,s,r,o,a,l){return this.getBarycoord(t,e,i,s,Ei)===null?(l.x=0,l.y=0,"z"in l&&(l.z=0),"w"in l&&(l.w=0),null):(l.setScalar(0),l.addScaledVector(r,Ei.x),l.addScaledVector(o,Ei.y),l.addScaledVector(a,Ei.z),l)}static getInterpolatedAttribute(t,e,i,s,r,o){return Vf.setScalar(0),zf.setScalar(0),Gf.setScalar(0),Vf.fromBufferAttribute(t,e),zf.fromBufferAttribute(t,i),Gf.fromBufferAttribute(t,s),o.setScalar(0),o.addScaledVector(Vf,r.x),o.addScaledVector(zf,r.y),o.addScaledVector(Gf,r.z),o}static isFrontFacing(t,e,i,s){return Hn.subVectors(i,e),wi.subVectors(t,e),Hn.cross(wi).dot(s)<0}set(t,e,i){return this.a.copy(t),this.b.copy(e),this.c.copy(i),this}setFromPointsAndIndices(t,e,i,s){return this.a.copy(t[e]),this.b.copy(t[i]),this.c.copy(t[s]),this}setFromAttributeAndIndices(t,e,i,s){return this.a.fromBufferAttribute(t,e),this.b.fromBufferAttribute(t,i),this.c.fromBufferAttribute(t,s),this}clone(){return new this.constructor().copy(this)}copy(t){return this.a.copy(t.a),this.b.copy(t.b),this.c.copy(t.c),this}getArea(){return Hn.subVectors(this.c,this.b),wi.subVectors(this.a,this.b),Hn.cross(wi).length()*.5}getMidpoint(t){return t.addVectors(this.a,this.b).add(this.c).multiplyScalar(1/3)}getNormal(t){return n.getNormal(this.a,this.b,this.c,t)}getPlane(t){return t.setFromCoplanarPoints(this.a,this.b,this.c)}getBarycoord(t,e){return n.getBarycoord(t,this.a,this.b,this.c,e)}getInterpolation(t,e,i,s,r){return n.getInterpolation(t,this.a,this.b,this.c,e,i,s,r)}containsPoint(t){return n.containsPoint(t,this.a,this.b,this.c)}isFrontFacing(t){return n.isFrontFacing(this.a,this.b,this.c,t)}intersectsBox(t){return t.intersectsTriangle(this)}closestPointToPoint(t,e){let i=this.a,s=this.b,r=this.c,o,a;Er.subVectors(s,i),Ar.subVectors(r,i),Ff.subVectors(t,i);let l=Er.dot(Ff),c=Ar.dot(Ff);if(l<=0&&c<=0)return e.copy(i);Bf.subVectors(t,s);let u=Er.dot(Bf),f=Ar.dot(Bf);if(u>=0&&f<=u)return e.copy(s);let h=l*f-u*c;if(h<=0&&l>=0&&u<=0)return o=l/(l-u),e.copy(i).addScaledVector(Er,o);kf.subVectors(t,r);let m=Er.dot(kf),_=Ar.dot(kf);if(_>=0&&m<=_)return e.copy(r);let S=m*c-l*_;if(S<=0&&c>=0&&_<=0)return a=c/(c-_),e.copy(i).addScaledVector(Ar,a);let p=u*_-m*f;if(p<=0&&f-u>=0&&m-_>=0)return m0.subVectors(r,s),a=(f-u)/(f-u+(m-_)),e.copy(s).addScaledVector(m0,a);let d=1/(p+S+h);return o=S*d,a=h*d,e.copy(i).addScaledVector(Er,o).addScaledVector(Ar,a)}equals(t){return t.a.equals(this.a)&&t.b.equals(this.b)&&t.c.equals(this.c)}},es=class{constructor(t=new W(1/0,1/0,1/0),e=new W(-1/0,-1/0,-1/0)){this.isBox3=!0,this.min=t,this.max=e}set(t,e){return this.min.copy(t),this.max.copy(e),this}setFromArray(t){this.makeEmpty();for(let e=0,i=t.length;e<i;e+=3)this.expandByPoint(Wn.fromArray(t,e));return this}setFromBufferAttribute(t){this.makeEmpty();for(let e=0,i=t.count;e<i;e++)this.expandByPoint(Wn.fromBufferAttribute(t,e));return this}setFromPoints(t){this.makeEmpty();for(let e=0,i=t.length;e<i;e++)this.expandByPoint(t[e]);return this}setFromCenterAndSize(t,e){let i=Wn.copy(e).multiplyScalar(.5);return this.min.copy(t).sub(i),this.max.copy(t).add(i),this}setFromObject(t,e=!1){return this.makeEmpty(),this.expandByObject(t,e)}clone(){return new this.constructor().copy(this)}copy(t){return this.min.copy(t.min),this.max.copy(t.max),this}makeEmpty(){return this.min.x=this.min.y=this.min.z=1/0,this.max.x=this.max.y=this.max.z=-1/0,this}isEmpty(){return this.max.x<this.min.x||this.max.y<this.min.y||this.max.z<this.min.z}getCenter(t){return this.isEmpty()?t.set(0,0,0):t.addVectors(this.min,this.max).multiplyScalar(.5)}getSize(t){return this.isEmpty()?t.set(0,0,0):t.subVectors(this.max,this.min)}expandByPoint(t){return this.min.min(t),this.max.max(t),this}expandByVector(t){return this.min.sub(t),this.max.add(t),this}expandByScalar(t){return this.min.addScalar(-t),this.max.addScalar(t),this}expandByObject(t,e=!1){t.updateWorldMatrix(!1,!1);let i=t.geometry;if(i!==void 0){let r=i.getAttribute("position");if(e===!0&&r!==void 0&&t.isInstancedMesh!==!0)for(let o=0,a=r.count;o<a;o++)t.isMesh===!0?t.getVertexPosition(o,Wn):Wn.fromBufferAttribute(r,o),Wn.applyMatrix4(t.matrixWorld),this.expandByPoint(Wn);else t.boundingBox!==void 0?(t.boundingBox===null&&t.computeBoundingBox(),Yc.copy(t.boundingBox)):(i.boundingBox===null&&i.computeBoundingBox(),Yc.copy(i.boundingBox)),Yc.applyMatrix4(t.matrixWorld),this.union(Yc)}let s=t.children;for(let r=0,o=s.length;r<o;r++)this.expandByObject(s[r],e);return this}containsPoint(t){return t.x>=this.min.x&&t.x<=this.max.x&&t.y>=this.min.y&&t.y<=this.max.y&&t.z>=this.min.z&&t.z<=this.max.z}containsBox(t){return this.min.x<=t.min.x&&t.max.x<=this.max.x&&this.min.y<=t.min.y&&t.max.y<=this.max.y&&this.min.z<=t.min.z&&t.max.z<=this.max.z}getParameter(t,e){return e.set((t.x-this.min.x)/(this.max.x-this.min.x),(t.y-this.min.y)/(this.max.y-this.min.y),(t.z-this.min.z)/(this.max.z-this.min.z))}intersectsBox(t){return t.max.x>=this.min.x&&t.min.x<=this.max.x&&t.max.y>=this.min.y&&t.min.y<=this.max.y&&t.max.z>=this.min.z&&t.min.z<=this.max.z}intersectsSphere(t){return this.clampPoint(t.center,Wn),Wn.distanceToSquared(t.center)<=t.radius*t.radius}intersectsPlane(t){let e,i;return t.normal.x>0?(e=t.normal.x*this.min.x,i=t.normal.x*this.max.x):(e=t.normal.x*this.max.x,i=t.normal.x*this.min.x),t.normal.y>0?(e+=t.normal.y*this.min.y,i+=t.normal.y*this.max.y):(e+=t.normal.y*this.max.y,i+=t.normal.y*this.min.y),t.normal.z>0?(e+=t.normal.z*this.min.z,i+=t.normal.z*this.max.z):(e+=t.normal.z*this.max.z,i+=t.normal.z*this.min.z),e<=-t.constant&&i>=-t.constant}intersectsTriangle(t){if(this.isEmpty())return!1;this.getCenter(Xo),Zc.subVectors(this.max,Xo),Cr.subVectors(t.a,Xo),Rr.subVectors(t.b,Xo),Pr.subVectors(t.c,Xo),Ji.subVectors(Rr,Cr),ji.subVectors(Pr,Rr),Bs.subVectors(Cr,Pr);let e=[0,-Ji.z,Ji.y,0,-ji.z,ji.y,0,-Bs.z,Bs.y,Ji.z,0,-Ji.x,ji.z,0,-ji.x,Bs.z,0,-Bs.x,-Ji.y,Ji.x,0,-ji.y,ji.x,0,-Bs.y,Bs.x,0];return!Hf(e,Cr,Rr,Pr,Zc)||(e=[1,0,0,0,1,0,0,0,1],!Hf(e,Cr,Rr,Pr,Zc))?!1:(Kc.crossVectors(Ji,ji),e=[Kc.x,Kc.y,Kc.z],Hf(e,Cr,Rr,Pr,Zc))}clampPoint(t,e){return e.copy(t).clamp(this.min,this.max)}distanceToPoint(t){return this.clampPoint(t,Wn).distanceTo(t)}getBoundingSphere(t){return this.isEmpty()?t.makeEmpty():(this.getCenter(t.center),t.radius=this.getSize(Wn).length()*.5),t}intersect(t){return this.min.max(t.min),this.max.min(t.max),this.isEmpty()&&this.makeEmpty(),this}union(t){return this.min.min(t.min),this.max.max(t.max),this}applyMatrix4(t){return this.isEmpty()?this:(Ai[0].set(this.min.x,this.min.y,this.min.z).applyMatrix4(t),Ai[1].set(this.min.x,this.min.y,this.max.z).applyMatrix4(t),Ai[2].set(this.min.x,this.max.y,this.min.z).applyMatrix4(t),Ai[3].set(this.min.x,this.max.y,this.max.z).applyMatrix4(t),Ai[4].set(this.max.x,this.min.y,this.min.z).applyMatrix4(t),Ai[5].set(this.max.x,this.min.y,this.max.z).applyMatrix4(t),Ai[6].set(this.max.x,this.max.y,this.min.z).applyMatrix4(t),Ai[7].set(this.max.x,this.max.y,this.max.z).applyMatrix4(t),this.setFromPoints(Ai),this)}translate(t){return this.min.add(t),this.max.add(t),this}equals(t){return t.min.equals(this.min)&&t.max.equals(this.max)}toJSON(){return{min:this.min.toArray(),max:this.max.toArray()}}fromJSON(t){return this.min.fromArray(t.min),this.max.fromArray(t.max),this}},Ai=[new W,new W,new W,new W,new W,new W,new W,new W],Wn=new W,Yc=new es,Cr=new W,Rr=new W,Pr=new W,Ji=new W,ji=new W,Bs=new W,Xo=new W,Zc=new W,Kc=new W,ks=new W;function Hf(n,t,e,i,s){for(let r=0,o=n.length-3;r<=o;r+=3){ks.fromArray(n,r);let a=s.x*Math.abs(ks.x)+s.y*Math.abs(ks.y)+s.z*Math.abs(ks.z),l=t.dot(ks),c=e.dot(ks),u=i.dot(ks);if(Math.max(-Math.max(l,c,u),Math.min(l,c,u))>a)return!1}return!0}var Ne=new W,Jc=new re,aS=0,Pn=class extends ci{constructor(t,e,i=!1){if(super(),Array.isArray(t))throw new TypeError("THREE.BufferAttribute: array should be a Typed Array.");this.isBufferAttribute=!0,Object.defineProperty(this,"id",{value:aS++}),this.name="",this.array=t,this.itemSize=e,this.count=t!==void 0?t.length/e:0,this.normalized=i,this.usage=o_,this.updateRanges=[],this.gpuType=Zn,this.version=0}onUploadCallback(){}set needsUpdate(t){t===!0&&this.version++}setUsage(t){return this.usage=t,this}addUpdateRange(t,e){this.updateRanges.push({start:t,count:e})}clearUpdateRanges(){this.updateRanges.length=0}copy(t){return this.name=t.name,this.array=new t.array.constructor(t.array),this.itemSize=t.itemSize,this.count=t.count,this.normalized=t.normalized,this.usage=t.usage,this.gpuType=t.gpuType,this}copyAt(t,e,i){t*=this.itemSize,i*=e.itemSize;for(let s=0,r=this.itemSize;s<r;s++)this.array[t+s]=e.array[i+s];return this}copyArray(t){return this.array.set(t),this}applyMatrix3(t){if(this.itemSize===2)for(let e=0,i=this.count;e<i;e++)Jc.fromBufferAttribute(this,e),Jc.applyMatrix3(t),this.setXY(e,Jc.x,Jc.y);else if(this.itemSize===3)for(let e=0,i=this.count;e<i;e++)Ne.fromBufferAttribute(this,e),Ne.applyMatrix3(t),this.setXYZ(e,Ne.x,Ne.y,Ne.z);return this}applyMatrix4(t){for(let e=0,i=this.count;e<i;e++)Ne.fromBufferAttribute(this,e),Ne.applyMatrix4(t),this.setXYZ(e,Ne.x,Ne.y,Ne.z);return this}applyNormalMatrix(t){for(let e=0,i=this.count;e<i;e++)Ne.fromBufferAttribute(this,e),Ne.applyNormalMatrix(t),this.setXYZ(e,Ne.x,Ne.y,Ne.z);return this}transformDirection(t){for(let e=0,i=this.count;e<i;e++)Ne.fromBufferAttribute(this,e),Ne.transformDirection(t),this.setXYZ(e,Ne.x,Ne.y,Ne.z);return this}set(t,e=0){return this.array.set(t,e),this}getComponent(t,e){let i=this.array[t*this.itemSize+e];return this.normalized&&(i=Wo(i,this.array)),i}setComponent(t,e,i){return this.normalized&&(i=hn(i,this.array)),this.array[t*this.itemSize+e]=i,this}getX(t){let e=this.array[t*this.itemSize];return this.normalized&&(e=Wo(e,this.array)),e}setX(t,e){return this.normalized&&(e=hn(e,this.array)),this.array[t*this.itemSize]=e,this}getY(t){let e=this.array[t*this.itemSize+1];return this.normalized&&(e=Wo(e,this.array)),e}setY(t,e){return this.normalized&&(e=hn(e,this.array)),this.array[t*this.itemSize+1]=e,this}getZ(t){let e=this.array[t*this.itemSize+2];return this.normalized&&(e=Wo(e,this.array)),e}setZ(t,e){return this.normalized&&(e=hn(e,this.array)),this.array[t*this.itemSize+2]=e,this}getW(t){let e=this.array[t*this.itemSize+3];return this.normalized&&(e=Wo(e,this.array)),e}setW(t,e){return this.normalized&&(e=hn(e,this.array)),this.array[t*this.itemSize+3]=e,this}setXY(t,e,i){return t*=this.itemSize,this.normalized&&(e=hn(e,this.array),i=hn(i,this.array)),this.array[t+0]=e,this.array[t+1]=i,this}setXYZ(t,e,i,s){return t*=this.itemSize,this.normalized&&(e=hn(e,this.array),i=hn(i,this.array),s=hn(s,this.array)),this.array[t+0]=e,this.array[t+1]=i,this.array[t+2]=s,this}setXYZW(t,e,i,s,r){return t*=this.itemSize,this.normalized&&(e=hn(e,this.array),i=hn(i,this.array),s=hn(s,this.array),r=hn(r,this.array)),this.array[t+0]=e,this.array[t+1]=i,this.array[t+2]=s,this.array[t+3]=r,this}onUpload(t){return this.onUploadCallback=t,this}clone(){return new this.constructor(this.array,this.itemSize).copy(this)}toJSON(){let t={itemSize:this.itemSize,type:this.array.constructor.name,array:Array.from(this.array),normalized:this.normalized};return t.name=this.name,t.usage=this.usage,t.gpuType=this.gpuType,t}dispose(){this.dispatchEvent({type:"dispose"})}};var sa=class extends Pn{constructor(t,e,i){super(new Uint16Array(t),e,i)}};var ra=class extends Pn{constructor(t,e,i){super(new Uint32Array(t),e,i)}};var ze=class extends Pn{constructor(t,e,i){super(new Float32Array(t),e,i)}},cS=new es,qo=new W,Wf=new W,Hs=class{constructor(t=new W,e=-1){this.isSphere=!0,this.center=t,this.radius=e}set(t,e){return this.center.copy(t),this.radius=e,this}setFromPoints(t,e){let i=this.center;e!==void 0?i.copy(e):cS.setFromPoints(t).getCenter(i);let s=0;for(let r=0,o=t.length;r<o;r++)s=Math.max(s,i.distanceToSquared(t[r]));return this.radius=Math.sqrt(s),this}copy(t){return this.center.copy(t.center),this.radius=t.radius,this}isEmpty(){return this.radius<0}makeEmpty(){return this.center.set(0,0,0),this.radius=-1,this}containsPoint(t){return t.distanceToSquared(this.center)<=this.radius*this.radius}distanceToPoint(t){return t.distanceTo(this.center)-this.radius}intersectsSphere(t){let e=this.radius+t.radius;return t.center.distanceToSquared(this.center)<=e*e}intersectsBox(t){return t.intersectsSphere(this)}intersectsPlane(t){return Math.abs(t.distanceToPoint(this.center))<=this.radius}clampPoint(t,e){let i=this.center.distanceToSquared(t);return e.copy(t),i>this.radius*this.radius&&(e.sub(this.center).normalize(),e.multiplyScalar(this.radius).add(this.center)),e}getBoundingBox(t){return this.isEmpty()?(t.makeEmpty(),t):(t.set(this.center,this.center),t.expandByScalar(this.radius),t)}applyMatrix4(t){return this.center.applyMatrix4(t),this.radius=this.radius*t.getMaxScaleOnAxis(),this}translate(t){return this.center.add(t),this}expandByPoint(t){if(this.isEmpty())return this.center.copy(t),this.radius=0,this;qo.subVectors(t,this.center);let e=qo.lengthSq();if(e>this.radius*this.radius){let i=Math.sqrt(e),s=(i-this.radius)*.5;this.center.addScaledVector(qo,s/i),this.radius+=s}return this}union(t){return t.isEmpty()?this:this.isEmpty()?(this.copy(t),this):(this.center.equals(t.center)===!0?this.radius=Math.max(this.radius,t.radius):(Wf.subVectors(t.center,this.center).setLength(t.radius),this.expandByPoint(qo.copy(t.center).add(Wf)),this.expandByPoint(qo.copy(t.center).sub(Wf))),this)}equals(t){return t.center.equals(this.center)&&t.radius===this.radius}clone(){return new this.constructor().copy(this)}toJSON(){return{radius:this.radius,center:this.center.toArray()}}fromJSON(t){return this.radius=t.radius,this.center.fromArray(t.center),this}},lS=0,Rn=new Ce,$f=new yn,Ir=new W,_n=new es,Yo=new es,Ve=new W,vn=class n extends ci{constructor(){super(),this.isBufferGeometry=!0,Object.defineProperty(this,"id",{value:lS++}),this.uuid=Aa(),this.name="",this.type="BufferGeometry",this.index=null,this.indirect=null,this.indirectOffset=0,this.attributes={},this.morphAttributes={},this.morphTargetsRelative=!1,this.groups=[],this.boundingBox=null,this.boundingSphere=null,this.drawRange={start:0,count:1/0},this.userData={},this._transformed=!1}getIndex(){return this.index}setIndex(t){return Array.isArray(t)?this.index=new(Yv(t)?ra:sa)(t,1):this.index=t,this}setIndirect(t,e=0){return this.indirect=t,this.indirectOffset=e,this}getIndirect(){return this.indirect}getAttribute(t){return this.attributes[t]}setAttribute(t,e){return this.attributes[t]=e,this}deleteAttribute(t){return delete this.attributes[t],this}hasAttribute(t){return this.attributes[t]!==void 0}addGroup(t,e,i=0){this.groups.push({start:t,count:e,materialIndex:i})}clearGroups(){this.groups=[]}setDrawRange(t,e){this.drawRange.start=t,this.drawRange.count=e}applyMatrix4(t){let e=this.attributes.position;e!==void 0&&(e.applyMatrix4(t),e.needsUpdate=!0);let i=this.attributes.normal;if(i!==void 0){let r=new Vt().getNormalMatrix(t);i.applyNormalMatrix(r),i.needsUpdate=!0}let s=this.attributes.tangent;return s!==void 0&&(s.transformDirection(t),s.needsUpdate=!0),this.boundingBox!==null&&this.computeBoundingBox(),this.boundingSphere!==null&&this.computeBoundingSphere(),this._transformed=!0,this}applyQuaternion(t){return Rn.makeRotationFromQuaternion(t),this.applyMatrix4(Rn),this}rotateX(t){return Rn.makeRotationX(t),this.applyMatrix4(Rn),this}rotateY(t){return Rn.makeRotationY(t),this.applyMatrix4(Rn),this}rotateZ(t){return Rn.makeRotationZ(t),this.applyMatrix4(Rn),this}translate(t,e,i){return Rn.makeTranslation(t,e,i),this.applyMatrix4(Rn),this}scale(t,e,i){return Rn.makeScale(t,e,i),this.applyMatrix4(Rn),this}lookAt(t){return $f.lookAt(t),$f.updateMatrix(),this.applyMatrix4($f.matrix),this}center(){return this.computeBoundingBox(),this.boundingBox.getCenter(Ir).negate(),this.translate(Ir.x,Ir.y,Ir.z),this}setFromPoints(t){let e=this.getAttribute("position");if(e===void 0){let i=[];for(let s=0,r=t.length;s<r;s++){let o=t[s];i.push(o.x,o.y,o.z||0)}this.setAttribute("position",new ze(i,3))}else{let i=Math.min(t.length,e.count);for(let s=0;s<i;s++){let r=t[s];e.setXYZ(s,r.x,r.y,r.z||0)}t.length>e.count&&Dt("BufferGeometry: Buffer size too small for points data. Use .dispose() and create a new geometry."),e.needsUpdate=!0}return this}computeBoundingBox(){this.boundingBox===null&&(this.boundingBox=new es);let t=this.attributes.position,e=this.morphAttributes.position;if(t&&t.isGLBufferAttribute){Bt("BufferGeometry.computeBoundingBox(): GLBufferAttribute requires a manual bounding box.",this),this.boundingBox.set(new W(-1/0,-1/0,-1/0),new W(1/0,1/0,1/0));return}if(t!==void 0){if(this.boundingBox.setFromBufferAttribute(t),e)for(let i=0,s=e.length;i<s;i++){let r=e[i];_n.setFromBufferAttribute(r),this.morphTargetsRelative?(Ve.addVectors(this.boundingBox.min,_n.min),this.boundingBox.expandByPoint(Ve),Ve.addVectors(this.boundingBox.max,_n.max),this.boundingBox.expandByPoint(Ve)):(this.boundingBox.expandByPoint(_n.min),this.boundingBox.expandByPoint(_n.max))}}else this.boundingBox.makeEmpty();(isNaN(this.boundingBox.min.x)||isNaN(this.boundingBox.min.y)||isNaN(this.boundingBox.min.z))&&Bt('BufferGeometry.computeBoundingBox(): Computed min/max have NaN values. The "position" attribute is likely to have NaN values.',this)}computeBoundingSphere(){this.boundingSphere===null&&(this.boundingSphere=new Hs);let t=this.attributes.position,e=this.morphAttributes.position;if(t&&t.isGLBufferAttribute){Bt("BufferGeometry.computeBoundingSphere(): GLBufferAttribute requires a manual bounding sphere.",this),this.boundingSphere.set(new W,1/0);return}if(t){let i=this.boundingSphere.center;if(_n.setFromBufferAttribute(t),e)for(let r=0,o=e.length;r<o;r++){let a=e[r];Yo.setFromBufferAttribute(a),this.morphTargetsRelative?(Ve.addVectors(_n.min,Yo.min),_n.expandByPoint(Ve),Ve.addVectors(_n.max,Yo.max),_n.expandByPoint(Ve)):(_n.expandByPoint(Yo.min),_n.expandByPoint(Yo.max))}_n.getCenter(i);let s=0;for(let r=0,o=t.count;r<o;r++)Ve.fromBufferAttribute(t,r),s=Math.max(s,i.distanceToSquared(Ve));if(e)for(let r=0,o=e.length;r<o;r++){let a=e[r],l=this.morphTargetsRelative;for(let c=0,u=a.count;c<u;c++)Ve.fromBufferAttribute(a,c),l&&(Ir.fromBufferAttribute(t,c),Ve.add(Ir)),s=Math.max(s,i.distanceToSquared(Ve))}this.boundingSphere.radius=Math.sqrt(s),isNaN(this.boundingSphere.radius)&&Bt('BufferGeometry.computeBoundingSphere(): Computed radius is NaN. The "position" attribute is likely to have NaN values.',this)}}computeTangents(){let t=this.index,e=this.attributes;if(t===null||e.position===void 0||e.normal===void 0||e.uv===void 0){Bt("BufferGeometry: .computeTangents() failed. Missing required attributes (index, position, normal or uv)");return}let i=e.position,s=e.normal,r=e.uv,o=this.getAttribute("tangent");(o===void 0||o.count!==i.count)&&(o=new Pn(new Float32Array(4*i.count),4),this.setAttribute("tangent",o));let a=[],l=[];for(let x=0;x<i.count;x++)a[x]=new W,l[x]=new W;let c=new W,u=new W,f=new W,h=new re,m=new re,_=new re,S=new W,p=new W;function d(x,T,L){c.fromBufferAttribute(i,x),u.fromBufferAttribute(i,T),f.fromBufferAttribute(i,L),h.fromBufferAttribute(r,x),m.fromBufferAttribute(r,T),_.fromBufferAttribute(r,L),u.sub(c),f.sub(c),m.sub(h),_.sub(h);let F=1/(m.x*_.y-_.x*m.y);isFinite(F)&&(S.copy(u).multiplyScalar(_.y).addScaledVector(f,-m.y).multiplyScalar(F),p.copy(f).multiplyScalar(m.x).addScaledVector(u,-_.x).multiplyScalar(F),a[x].add(S),a[T].add(S),a[L].add(S),l[x].add(p),l[T].add(p),l[L].add(p))}let M=this.groups;M.length===0&&(M=[{start:0,count:t.count}]);for(let x=0,T=M.length;x<T;++x){let L=M[x],F=L.start,V=L.count;for(let I=F,R=F+V;I<R;I+=3)d(t.getX(I+0),t.getX(I+1),t.getX(I+2))}let P=new W,b=new W,E=new W,w=new W;function A(x){E.fromBufferAttribute(s,x),w.copy(E);let T=a[x];P.copy(T),P.sub(E.multiplyScalar(E.dot(T))).normalize(),b.crossVectors(w,T);let F=b.dot(l[x])<0?-1:1;o.setXYZW(x,P.x,P.y,P.z,F)}for(let x=0,T=M.length;x<T;++x){let L=M[x],F=L.start,V=L.count;for(let I=F,R=F+V;I<R;I+=3)A(t.getX(I+0)),A(t.getX(I+1)),A(t.getX(I+2))}this._transformed=!0}computeVertexNormals(){let t=this.index,e=this.getAttribute("position");if(e!==void 0){let i=this.getAttribute("normal");if(i===void 0||i.count!==e.count)i=new Pn(new Float32Array(e.count*3),3),this.setAttribute("normal",i);else for(let h=0,m=i.count;h<m;h++)i.setXYZ(h,0,0,0);let s=new W,r=new W,o=new W,a=new W,l=new W,c=new W,u=new W,f=new W;if(t)for(let h=0,m=t.count;h<m;h+=3){let _=t.getX(h+0),S=t.getX(h+1),p=t.getX(h+2);s.fromBufferAttribute(e,_),r.fromBufferAttribute(e,S),o.fromBufferAttribute(e,p),u.subVectors(o,r),f.subVectors(s,r),u.cross(f),a.fromBufferAttribute(i,_),l.fromBufferAttribute(i,S),c.fromBufferAttribute(i,p),a.add(u),l.add(u),c.add(u),i.setXYZ(_,a.x,a.y,a.z),i.setXYZ(S,l.x,l.y,l.z),i.setXYZ(p,c.x,c.y,c.z)}else for(let h=0,m=e.count;h<m;h+=3)s.fromBufferAttribute(e,h+0),r.fromBufferAttribute(e,h+1),o.fromBufferAttribute(e,h+2),u.subVectors(o,r),f.subVectors(s,r),u.cross(f),i.setXYZ(h+0,u.x,u.y,u.z),i.setXYZ(h+1,u.x,u.y,u.z),i.setXYZ(h+2,u.x,u.y,u.z);this.normalizeNormals(),i.needsUpdate=!0}}normalizeNormals(){let t=this.attributes.normal;for(let e=0,i=t.count;e<i;e++)Ve.fromBufferAttribute(t,e),Ve.normalize(),t.setXYZ(e,Ve.x,Ve.y,Ve.z)}toNonIndexed(){function t(a,l){let c=a.array,u=a.itemSize,f=a.normalized,h=new c.constructor(l.length*u),m=0,_=0;for(let S=0,p=l.length;S<p;S++){a.isInterleavedBufferAttribute?m=l[S]*a.data.stride+a.offset:m=l[S]*u;for(let d=0;d<u;d++)h[_++]=c[m++]}return new Pn(h,u,f)}if(this.index===null)return Dt("BufferGeometry.toNonIndexed(): BufferGeometry is already non-indexed."),this;let e=new n,i=this.index.array,s=this.attributes;for(let a in s){let l=s[a],c=t(l,i);e.setAttribute(a,c)}let r=this.morphAttributes;for(let a in r){let l=[],c=r[a];for(let u=0,f=c.length;u<f;u++){let h=c[u],m=t(h,i);l.push(m)}e.morphAttributes[a]=l}e.morphTargetsRelative=this.morphTargetsRelative;let o=this.groups;for(let a=0,l=o.length;a<l;a++){let c=o[a];e.addGroup(c.start,c.count,c.materialIndex)}return e}toJSON(){let t={metadata:{version:4.7,type:"BufferGeometry",generator:"BufferGeometry.toJSON"}};if(t.uuid=this.uuid,t.type=this.parameters!==void 0&&this._transformed===!0?"BufferGeometry":this.type,t.name=this.name,Object.keys(this.userData).length>0&&(t.userData=this.userData),this.parameters!==void 0&&this._transformed!==!0){let l=this.parameters;for(let c in l)l[c]!==void 0&&(t[c]=l[c]);return t}t.data={attributes:{}};let e=this.index;e!==null&&(t.data.index={type:e.array.constructor.name,array:Array.prototype.slice.call(e.array)});let i=this.attributes;for(let l in i){let c=i[l];t.data.attributes[l]=c.toJSON(t.data)}let s={},r=!1;for(let l in this.morphAttributes){let c=this.morphAttributes[l],u=[];for(let f=0,h=c.length;f<h;f++){let m=c[f];u.push(m.toJSON(t.data))}u.length>0&&(s[l]=u,r=!0)}r&&(t.data.morphAttributes=s,t.data.morphTargetsRelative=this.morphTargetsRelative);let o=this.groups;o.length>0&&(t.data.groups=JSON.parse(JSON.stringify(o)));let a=this.boundingSphere;return a!==null&&(t.data.boundingSphere=a.toJSON()),t}clone(){return new this.constructor().copy(this)}copy(t){this.index=null,this.attributes={},this.morphAttributes={},this.groups=[],this.boundingBox=null,this.boundingSphere=null;let e={};this.name=t.name;let i=t.index;i!==null&&this.setIndex(i.clone());let s=t.attributes;for(let c in s){let u=s[c];this.setAttribute(c,u.clone(e))}let r=t.morphAttributes;for(let c in r){let u=[],f=r[c];for(let h=0,m=f.length;h<m;h++)u.push(f[h].clone(e));this.morphAttributes[c]=u}this.morphTargetsRelative=t.morphTargetsRelative;let o=t.groups;for(let c=0,u=o.length;c<u;c++){let f=o[c];this.addGroup(f.start,f.count,f.materialIndex)}let a=t.boundingBox;a!==null&&(this.boundingBox=a.clone());let l=t.boundingSphere;return l!==null&&(this.boundingSphere=l.clone()),this.drawRange.start=t.drawRange.start,this.drawRange.count=t.drawRange.count,this.userData=t.userData,this._transformed=t._transformed,this}dispose(){this.dispatchEvent({type:"dispose"})}};var Xf=new W,uS=new W,hS=new Vt,$n=class{constructor(t=new W(1,0,0),e=0){this.isPlane=!0,this.normal=t,this.constant=e}set(t,e){return this.normal.copy(t),this.constant=e,this}setComponents(t,e,i,s){return this.normal.set(t,e,i),this.constant=s,this}setFromNormalAndCoplanarPoint(t,e){return this.normal.copy(t),this.constant=-e.dot(this.normal),this}setFromCoplanarPoints(t,e,i){let s=Xf.subVectors(i,e).cross(uS.subVectors(t,e)).normalize();return this.setFromNormalAndCoplanarPoint(s,t),this}copy(t){return this.normal.copy(t.normal),this.constant=t.constant,this}normalize(){let t=1/this.normal.length();return this.normal.multiplyScalar(t),this.constant*=t,this}negate(){return this.constant*=-1,this.normal.negate(),this}distanceToPoint(t){return this.normal.dot(t)+this.constant}distanceToSphere(t){return this.distanceToPoint(t.center)-t.radius}projectPoint(t,e){return e.copy(t).addScaledVector(this.normal,-this.distanceToPoint(t))}intersectLine(t,e,i=!0){let s=t.delta(Xf),r=this.normal.dot(s);if(r===0)return this.distanceToPoint(t.start)===0?e.copy(t.start):null;let o=-(t.start.dot(this.normal)+this.constant)/r;return i===!0&&(o<0||o>1)?null:e.copy(t.start).addScaledVector(s,o)}intersectsLine(t){let e=this.distanceToPoint(t.start),i=this.distanceToPoint(t.end);return e<0&&i>0||i<0&&e>0}intersectsBox(t){return t.intersectsPlane(this)}intersectsSphere(t){return t.intersectsPlane(this)}coplanarPoint(t){return t.copy(this.normal).multiplyScalar(-this.constant)}applyMatrix4(t,e){let i=e||hS.getNormalMatrix(t),s=this.coplanarPoint(Xf).applyMatrix4(t),r=this.normal.applyMatrix3(i).normalize();return this.constant=-s.dot(r),this}translate(t){return this.constant-=t.dot(this.normal),this}equals(t){return t.normal.equals(this.normal)&&t.constant===this.constant}clone(){return new this.constructor().copy(this)}toJSON(){return{normal:this.normal.toArray(),constant:this.constant}}fromJSON(t){return this.normal.fromArray(t.normal),this.constant=t.constant,this}},fS=0,ns=class extends ci{constructor(){super(),this.isMaterial=!0,Object.defineProperty(this,"id",{value:fS++}),this.uuid=Aa(),this.name="",this.type="Material",this.blending=Hr,this.side=as,this.vertexColors=!1,this.opacity=1,this.transparent=!1,this.alphaHash=!1,this.blendSrc=cd,this.blendDst=ld,this.blendEquation=Ws,this.blendSrcAlpha=null,this.blendDstAlpha=null,this.blendEquationAlpha=null,this.blendColor=new ne(0,0,0),this.blendAlpha=0,this.depthFunc=Or,this.depthTest=!0,this.depthWrite=!0,this.stencilWriteMask=255,this.stencilFunc=Q0,this.stencilRef=0,this.stencilFuncMask=255,this.stencilFail=gl,this.stencilZFail=gl,this.stencilZPass=gl,this.stencilWrite=!1,this.clippingPlanes=null,this.clipIntersection=!1,this.clipShadows=!1,this.shadowSide=null,this.colorWrite=!0,this.precision=null,this.polygonOffset=!1,this.polygonOffsetFactor=0,this.polygonOffsetUnits=0,this.dithering=!1,this.alphaToCoverage=!1,this.premultipliedAlpha=!1,this.forceSinglePass=!1,this.allowOverride=!0,this.visible=!0,this.toneMapped=!0,this.userData={},this.version=0,this._alphaTest=0}get alphaTest(){return this._alphaTest}set alphaTest(t){this._alphaTest>0!=t>0&&this.version++,this._alphaTest=t}onBeforeRender(){}onBeforeCompile(){}customProgramCacheKey(){return this.onBeforeCompile.toString()}setValues(t){if(t!==void 0)for(let e in t){let i=t[e];if(i===void 0){Dt(`Material: parameter '${e}' has value of undefined.`);continue}let s=this[e];if(s===void 0){Dt(`Material: '${e}' is not a property of THREE.${this.type}.`);continue}s&&s.isColor?s.set(i):s&&s.isVector2&&i&&i.isVector2||s&&s.isEuler&&i&&i.isEuler||s&&s.isVector3&&i&&i.isVector3?s.copy(i):this[e]=i}}toJSON(t){let e=t===void 0||typeof t=="string";e&&(t={textures:{},images:{}});let i={metadata:{version:4.7,type:"Material",generator:"Material.toJSON"}};i.uuid=this.uuid,i.type=this.type,i.blending=this.blending,i.side=this.side,i.shadowSide=this.shadowSide,i.vertexColors=this.vertexColors,i.opacity=this.opacity,i.transparent=this.transparent,i.blendSrc=this.blendSrc,i.blendDst=this.blendDst,i.blendEquation=this.blendEquation,i.blendSrcAlpha=this.blendSrcAlpha,i.blendDstAlpha=this.blendDstAlpha,i.blendEquationAlpha=this.blendEquationAlpha,i.blendColor=this.blendColor.getHex(),i.blendAlpha=this.blendAlpha,i.depthFunc=this.depthFunc,i.depthTest=this.depthTest,i.depthWrite=this.depthWrite,i.colorWrite=this.colorWrite,i.clipIntersection=this.clipIntersection,i.clipShadows=this.clipShadows,i.stencilWriteMask=this.stencilWriteMask,i.stencilFunc=this.stencilFunc,i.stencilRef=this.stencilRef,i.stencilFuncMask=this.stencilFuncMask,i.stencilFail=this.stencilFail,i.stencilZFail=this.stencilZFail,i.stencilZPass=this.stencilZPass,i.stencilWrite=this.stencilWrite,i.polygonOffset=this.polygonOffset,i.polygonOffsetFactor=this.polygonOffsetFactor,i.polygonOffsetUnits=this.polygonOffsetUnits,i.dithering=this.dithering,i.alphaTest=this.alphaTest,i.alphaHash=this.alphaHash,i.alphaToCoverage=this.alphaToCoverage,i.premultipliedAlpha=this.premultipliedAlpha,i.forceSinglePass=this.forceSinglePass,i.allowOverride=this.allowOverride,i.visible=this.visible,i.toneMapped=this.toneMapped,i.name=this.name,this.color&&this.color.isColor&&(i.color=this.color.getHex()),this.roughness!==void 0&&(i.roughness=this.roughness),this.metalness!==void 0&&(i.metalness=this.metalness),this.sheen!==void 0&&(i.sheen=this.sheen),this.sheenColor&&this.sheenColor.isColor&&(i.sheenColor=this.sheenColor.getHex()),this.sheenRoughness!==void 0&&(i.sheenRoughness=this.sheenRoughness),this.emissive&&this.emissive.isColor&&(i.emissive=this.emissive.getHex()),this.emissiveIntensity!==void 0&&(i.emissiveIntensity=this.emissiveIntensity),this.specular&&this.specular.isColor&&(i.specular=this.specular.getHex()),this.specularIntensity!==void 0&&(i.specularIntensity=this.specularIntensity),this.specularColor&&this.specularColor.isColor&&(i.specularColor=this.specularColor.getHex()),this.shininess!==void 0&&(i.shininess=this.shininess),this.clearcoat!==void 0&&(i.clearcoat=this.clearcoat),this.clearcoatRoughness!==void 0&&(i.clearcoatRoughness=this.clearcoatRoughness),this.clearcoatMap&&this.clearcoatMap.isTexture&&(i.clearcoatMap=this.clearcoatMap.toJSON(t).uuid),this.clearcoatRoughnessMap&&this.clearcoatRoughnessMap.isTexture&&(i.clearcoatRoughnessMap=this.clearcoatRoughnessMap.toJSON(t).uuid),this.clearcoatNormalMap&&this.clearcoatNormalMap.isTexture&&(i.clearcoatNormalMap=this.clearcoatNormalMap.toJSON(t).uuid,i.clearcoatNormalScale=this.clearcoatNormalScale.toArray()),this.sheenColorMap&&this.sheenColorMap.isTexture&&(i.sheenColorMap=this.sheenColorMap.toJSON(t).uuid),this.sheenRoughnessMap&&this.sheenRoughnessMap.isTexture&&(i.sheenRoughnessMap=this.sheenRoughnessMap.toJSON(t).uuid),this.dispersion!==void 0&&(i.dispersion=this.dispersion),this.retroreflectivity!==void 0&&(i.retroreflectivity=this.retroreflectivity),this.iridescence!==void 0&&(i.iridescence=this.iridescence),this.iridescenceIOR!==void 0&&(i.iridescenceIOR=this.iridescenceIOR),this.iridescenceThicknessRange!==void 0&&(i.iridescenceThicknessRange=this.iridescenceThicknessRange),this.iridescenceMap&&this.iridescenceMap.isTexture&&(i.iridescenceMap=this.iridescenceMap.toJSON(t).uuid),this.iridescenceThicknessMap&&this.iridescenceThicknessMap.isTexture&&(i.iridescenceThicknessMap=this.iridescenceThicknessMap.toJSON(t).uuid),this.anisotropy!==void 0&&(i.anisotropy=this.anisotropy),this.anisotropyRotation!==void 0&&(i.anisotropyRotation=this.anisotropyRotation),this.anisotropyMap&&this.anisotropyMap.isTexture&&(i.anisotropyMap=this.anisotropyMap.toJSON(t).uuid),this.map&&this.map.isTexture&&(i.map=this.map.toJSON(t).uuid),this.matcap&&this.matcap.isTexture&&(i.matcap=this.matcap.toJSON(t).uuid),this.alphaMap&&this.alphaMap.isTexture&&(i.alphaMap=this.alphaMap.toJSON(t).uuid),this.lightMap&&this.lightMap.isTexture&&(i.lightMap=this.lightMap.toJSON(t).uuid,i.lightMapIntensity=this.lightMapIntensity),this.aoMap&&this.aoMap.isTexture&&(i.aoMap=this.aoMap.toJSON(t).uuid,i.aoMapIntensity=this.aoMapIntensity),this.bumpMap&&this.bumpMap.isTexture&&(i.bumpMap=this.bumpMap.toJSON(t).uuid,i.bumpScale=this.bumpScale),this.normalMap&&this.normalMap.isTexture&&(i.normalMap=this.normalMap.toJSON(t).uuid,i.normalMapType=this.normalMapType,i.normalScale=this.normalScale.toArray()),this.displacementMap&&this.displacementMap.isTexture&&(i.displacementMap=this.displacementMap.toJSON(t).uuid,i.displacementScale=this.displacementScale,i.displacementBias=this.displacementBias),this.roughnessMap&&this.roughnessMap.isTexture&&(i.roughnessMap=this.roughnessMap.toJSON(t).uuid),this.metalnessMap&&this.metalnessMap.isTexture&&(i.metalnessMap=this.metalnessMap.toJSON(t).uuid),this.emissiveMap&&this.emissiveMap.isTexture&&(i.emissiveMap=this.emissiveMap.toJSON(t).uuid),this.specularMap&&this.specularMap.isTexture&&(i.specularMap=this.specularMap.toJSON(t).uuid),this.specularIntensityMap&&this.specularIntensityMap.isTexture&&(i.specularIntensityMap=this.specularIntensityMap.toJSON(t).uuid),this.specularColorMap&&this.specularColorMap.isTexture&&(i.specularColorMap=this.specularColorMap.toJSON(t).uuid),this.envMap&&this.envMap.isTexture&&(i.envMap=this.envMap.toJSON(t).uuid,this.combine!==void 0&&(i.combine=this.combine)),this.envMapRotation!==void 0&&(i.envMapRotation=this.envMapRotation.toArray()),this.envMapIntensity!==void 0&&(i.envMapIntensity=this.envMapIntensity),this.reflectivity!==void 0&&(i.reflectivity=this.reflectivity),this.refractionRatio!==void 0&&(i.refractionRatio=this.refractionRatio),this.gradientMap&&this.gradientMap.isTexture&&(i.gradientMap=this.gradientMap.toJSON(t).uuid),this.transmission!==void 0&&(i.transmission=this.transmission),this.transmissionMap&&this.transmissionMap.isTexture&&(i.transmissionMap=this.transmissionMap.toJSON(t).uuid),this.thickness!==void 0&&(i.thickness=this.thickness),this.thicknessMap&&this.thicknessMap.isTexture&&(i.thicknessMap=this.thicknessMap.toJSON(t).uuid),this.attenuationDistance!==void 0&&(i.attenuationDistance=this.attenuationDistance),this.attenuationColor!==void 0&&(i.attenuationColor=this.attenuationColor.getHex()),this.size!==void 0&&(i.size=this.size),this.sizeAttenuation!==void 0&&(i.sizeAttenuation=this.sizeAttenuation),Array.isArray(this.clippingPlanes)&&this.clippingPlanes.length>0&&(i.clippingPlanes=this.clippingPlanes.map(r=>r.toJSON())),this.rotation!==void 0&&(i.rotation=this.rotation),this.depthPacking!==void 0&&(i.depthPacking=this.depthPacking),this.linewidth!==void 0&&(i.linewidth=this.linewidth),this.linecap!==void 0&&(i.linecap=this.linecap),this.linejoin!==void 0&&(i.linejoin=this.linejoin),this.dashSize!==void 0&&(i.dashSize=this.dashSize),this.gapSize!==void 0&&(i.gapSize=this.gapSize),this.scale!==void 0&&(i.scale=this.scale),this.wireframe!==void 0&&(i.wireframe=this.wireframe),this.wireframeLinewidth!==void 0&&(i.wireframeLinewidth=this.wireframeLinewidth),this.wireframeLinecap!==void 0&&(i.wireframeLinecap=this.wireframeLinecap),this.wireframeLinejoin!==void 0&&(i.wireframeLinejoin=this.wireframeLinejoin),this.flatShading!==void 0&&(i.flatShading=this.flatShading),this.fog!==void 0&&(i.fog=this.fog),Object.keys(this.userData).length>0&&(i.userData=this.userData);function s(r){let o=[];for(let a in r){let l=r[a];delete l.metadata,o.push(l)}return o}if(e){let r=s(t.textures),o=s(t.images);r.length>0&&(i.textures=r),o.length>0&&(i.images=o)}return i}fromJSON(t,e){if(t.uuid!==void 0&&(this.uuid=t.uuid),t.name!==void 0&&(this.name=t.name),t.color!==void 0&&this.color!==void 0&&this.color.setHex(t.color),t.roughness!==void 0&&(this.roughness=t.roughness),t.metalness!==void 0&&(this.metalness=t.metalness),t.sheen!==void 0&&(this.sheen=t.sheen),t.sheenColor!==void 0&&(this.sheenColor=new ne().setHex(t.sheenColor)),t.sheenRoughness!==void 0&&(this.sheenRoughness=t.sheenRoughness),t.emissive!==void 0&&this.emissive!==void 0&&this.emissive.setHex(t.emissive),t.specular!==void 0&&this.specular!==void 0&&this.specular.setHex(t.specular),t.specularIntensity!==void 0&&(this.specularIntensity=t.specularIntensity),t.specularColor!==void 0&&this.specularColor!==void 0&&this.specularColor.setHex(t.specularColor),t.shininess!==void 0&&(this.shininess=t.shininess),t.clearcoat!==void 0&&(this.clearcoat=t.clearcoat),t.clearcoatRoughness!==void 0&&(this.clearcoatRoughness=t.clearcoatRoughness),t.dispersion!==void 0&&(this.dispersion=t.dispersion),t.retroreflectivity!==void 0&&(this.retroreflectivity=t.retroreflectivity),t.iridescence!==void 0&&(this.iridescence=t.iridescence),t.iridescenceIOR!==void 0&&(this.iridescenceIOR=t.iridescenceIOR),t.iridescenceThicknessRange!==void 0&&(this.iridescenceThicknessRange=t.iridescenceThicknessRange),t.transmission!==void 0&&(this.transmission=t.transmission),t.thickness!==void 0&&(this.thickness=t.thickness),t.attenuationDistance!==void 0&&(this.attenuationDistance=t.attenuationDistance),t.attenuationColor!==void 0&&this.attenuationColor!==void 0&&this.attenuationColor.setHex(t.attenuationColor),t.anisotropy!==void 0&&(this.anisotropy=t.anisotropy),t.anisotropyRotation!==void 0&&(this.anisotropyRotation=t.anisotropyRotation),t.fog!==void 0&&(this.fog=t.fog),t.flatShading!==void 0&&(this.flatShading=t.flatShading),t.blending!==void 0&&(this.blending=t.blending),t.combine!==void 0&&(this.combine=t.combine),t.side!==void 0&&(this.side=t.side),t.shadowSide!==void 0&&(this.shadowSide=t.shadowSide),t.opacity!==void 0&&(this.opacity=t.opacity),t.transparent!==void 0&&(this.transparent=t.transparent),t.alphaTest!==void 0&&(this.alphaTest=t.alphaTest),t.alphaHash!==void 0&&(this.alphaHash=t.alphaHash),t.depthFunc!==void 0&&(this.depthFunc=t.depthFunc),t.depthTest!==void 0&&(this.depthTest=t.depthTest),t.depthWrite!==void 0&&(this.depthWrite=t.depthWrite),t.colorWrite!==void 0&&(this.colorWrite=t.colorWrite),t.clippingPlanes!==void 0&&(this.clippingPlanes=t.clippingPlanes.map(i=>new $n().fromJSON(i))),t.clipIntersection!==void 0&&(this.clipIntersection=t.clipIntersection),t.clipShadows!==void 0&&(this.clipShadows=t.clipShadows),t.depthPacking!==void 0&&(this.depthPacking=t.depthPacking),t.blendSrc!==void 0&&(this.blendSrc=t.blendSrc),t.blendDst!==void 0&&(this.blendDst=t.blendDst),t.blendEquation!==void 0&&(this.blendEquation=t.blendEquation),t.blendSrcAlpha!==void 0&&(this.blendSrcAlpha=t.blendSrcAlpha),t.blendDstAlpha!==void 0&&(this.blendDstAlpha=t.blendDstAlpha),t.blendEquationAlpha!==void 0&&(this.blendEquationAlpha=t.blendEquationAlpha),t.blendColor!==void 0&&this.blendColor!==void 0&&this.blendColor.setHex(t.blendColor),t.blendAlpha!==void 0&&(this.blendAlpha=t.blendAlpha),t.stencilWriteMask!==void 0&&(this.stencilWriteMask=t.stencilWriteMask),t.stencilFunc!==void 0&&(this.stencilFunc=t.stencilFunc),t.stencilRef!==void 0&&(this.stencilRef=t.stencilRef),t.stencilFuncMask!==void 0&&(this.stencilFuncMask=t.stencilFuncMask),t.stencilFail!==void 0&&(this.stencilFail=t.stencilFail),t.stencilZFail!==void 0&&(this.stencilZFail=t.stencilZFail),t.stencilZPass!==void 0&&(this.stencilZPass=t.stencilZPass),t.stencilWrite!==void 0&&(this.stencilWrite=t.stencilWrite),t.wireframe!==void 0&&(this.wireframe=t.wireframe),t.wireframeLinewidth!==void 0&&(this.wireframeLinewidth=t.wireframeLinewidth),t.wireframeLinecap!==void 0&&(this.wireframeLinecap=t.wireframeLinecap),t.wireframeLinejoin!==void 0&&(this.wireframeLinejoin=t.wireframeLinejoin),t.rotation!==void 0&&(this.rotation=t.rotation),t.linewidth!==void 0&&(this.linewidth=t.linewidth),t.linecap!==void 0&&(this.linecap=t.linecap),t.linejoin!==void 0&&(this.linejoin=t.linejoin),t.dashSize!==void 0&&(this.dashSize=t.dashSize),t.gapSize!==void 0&&(this.gapSize=t.gapSize),t.scale!==void 0&&(this.scale=t.scale),t.polygonOffset!==void 0&&(this.polygonOffset=t.polygonOffset),t.polygonOffsetFactor!==void 0&&(this.polygonOffsetFactor=t.polygonOffsetFactor),t.polygonOffsetUnits!==void 0&&(this.polygonOffsetUnits=t.polygonOffsetUnits),t.dithering!==void 0&&(this.dithering=t.dithering),t.alphaToCoverage!==void 0&&(this.alphaToCoverage=t.alphaToCoverage),t.premultipliedAlpha!==void 0&&(this.premultipliedAlpha=t.premultipliedAlpha),t.forceSinglePass!==void 0&&(this.forceSinglePass=t.forceSinglePass),t.allowOverride!==void 0&&(this.allowOverride=t.allowOverride),t.visible!==void 0&&(this.visible=t.visible),t.toneMapped!==void 0&&(this.toneMapped=t.toneMapped),t.userData!==void 0&&(this.userData=t.userData),t.vertexColors!==void 0&&(typeof t.vertexColors=="number"?this.vertexColors=t.vertexColors>0:this.vertexColors=t.vertexColors),t.size!==void 0&&(this.size=t.size),t.sizeAttenuation!==void 0&&(this.sizeAttenuation=t.sizeAttenuation),t.map!==void 0&&(this.map=e[t.map]||null),t.matcap!==void 0&&(this.matcap=e[t.matcap]||null),t.alphaMap!==void 0&&(this.alphaMap=e[t.alphaMap]||null),t.bumpMap!==void 0&&(this.bumpMap=e[t.bumpMap]||null),t.bumpScale!==void 0&&(this.bumpScale=t.bumpScale),t.normalMap!==void 0&&(this.normalMap=e[t.normalMap]||null),t.normalMapType!==void 0&&(this.normalMapType=t.normalMapType),t.normalScale!==void 0){let i=t.normalScale;Array.isArray(i)===!1&&(i=[i,i]),this.normalScale=new re().fromArray(i)}return t.displacementMap!==void 0&&(this.displacementMap=e[t.displacementMap]||null),t.displacementScale!==void 0&&(this.displacementScale=t.displacementScale),t.displacementBias!==void 0&&(this.displacementBias=t.displacementBias),t.roughnessMap!==void 0&&(this.roughnessMap=e[t.roughnessMap]||null),t.metalnessMap!==void 0&&(this.metalnessMap=e[t.metalnessMap]||null),t.emissiveMap!==void 0&&(this.emissiveMap=e[t.emissiveMap]||null),t.emissiveIntensity!==void 0&&(this.emissiveIntensity=t.emissiveIntensity),t.specularMap!==void 0&&(this.specularMap=e[t.specularMap]||null),t.specularIntensityMap!==void 0&&(this.specularIntensityMap=e[t.specularIntensityMap]||null),t.specularColorMap!==void 0&&(this.specularColorMap=e[t.specularColorMap]||null),t.envMap!==void 0&&(this.envMap=e[t.envMap]||null),t.envMapRotation!==void 0&&this.envMapRotation.fromArray(t.envMapRotation),t.envMapIntensity!==void 0&&(this.envMapIntensity=t.envMapIntensity),t.reflectivity!==void 0&&(this.reflectivity=t.reflectivity),t.refractionRatio!==void 0&&(this.refractionRatio=t.refractionRatio),t.lightMap!==void 0&&(this.lightMap=e[t.lightMap]||null),t.lightMapIntensity!==void 0&&(this.lightMapIntensity=t.lightMapIntensity),t.aoMap!==void 0&&(this.aoMap=e[t.aoMap]||null),t.aoMapIntensity!==void 0&&(this.aoMapIntensity=t.aoMapIntensity),t.gradientMap!==void 0&&(this.gradientMap=e[t.gradientMap]||null),t.clearcoatMap!==void 0&&(this.clearcoatMap=e[t.clearcoatMap]||null),t.clearcoatRoughnessMap!==void 0&&(this.clearcoatRoughnessMap=e[t.clearcoatRoughnessMap]||null),t.clearcoatNormalMap!==void 0&&(this.clearcoatNormalMap=e[t.clearcoatNormalMap]||null),t.clearcoatNormalScale!==void 0&&(this.clearcoatNormalScale=new re().fromArray(t.clearcoatNormalScale)),t.iridescenceMap!==void 0&&(this.iridescenceMap=e[t.iridescenceMap]||null),t.iridescenceThicknessMap!==void 0&&(this.iridescenceThicknessMap=e[t.iridescenceThicknessMap]||null),t.transmissionMap!==void 0&&(this.transmissionMap=e[t.transmissionMap]||null),t.thicknessMap!==void 0&&(this.thicknessMap=e[t.thicknessMap]||null),t.anisotropyMap!==void 0&&(this.anisotropyMap=e[t.anisotropyMap]||null),t.sheenColorMap!==void 0&&(this.sheenColorMap=e[t.sheenColorMap]||null),t.sheenRoughnessMap!==void 0&&(this.sheenRoughnessMap=e[t.sheenRoughnessMap]||null),this}clone(){return new this.constructor().copy(this)}copy(t){this.name=t.name,this.blending=t.blending,this.side=t.side,this.vertexColors=t.vertexColors,this.opacity=t.opacity,this.transparent=t.transparent,this.blendSrc=t.blendSrc,this.blendDst=t.blendDst,this.blendEquation=t.blendEquation,this.blendSrcAlpha=t.blendSrcAlpha,this.blendDstAlpha=t.blendDstAlpha,this.blendEquationAlpha=t.blendEquationAlpha,this.blendColor.copy(t.blendColor),this.blendAlpha=t.blendAlpha,this.depthFunc=t.depthFunc,this.depthTest=t.depthTest,this.depthWrite=t.depthWrite,this.stencilWriteMask=t.stencilWriteMask,this.stencilFunc=t.stencilFunc,this.stencilRef=t.stencilRef,this.stencilFuncMask=t.stencilFuncMask,this.stencilFail=t.stencilFail,this.stencilZFail=t.stencilZFail,this.stencilZPass=t.stencilZPass,this.stencilWrite=t.stencilWrite;let e=t.clippingPlanes,i=null;if(e!==null){let s=e.length;i=new Array(s);for(let r=0;r!==s;++r)i[r]=e[r].clone()}return this.clippingPlanes=i,this.clipIntersection=t.clipIntersection,this.clipShadows=t.clipShadows,this.shadowSide=t.shadowSide,this.colorWrite=t.colorWrite,this.precision=t.precision,this.polygonOffset=t.polygonOffset,this.polygonOffsetFactor=t.polygonOffsetFactor,this.polygonOffsetUnits=t.polygonOffsetUnits,this.dithering=t.dithering,this.alphaTest=t.alphaTest,this.alphaHash=t.alphaHash,this.alphaToCoverage=t.alphaToCoverage,this.premultipliedAlpha=t.premultipliedAlpha,this.forceSinglePass=t.forceSinglePass,this.allowOverride=t.allowOverride,this.visible=t.visible,this.toneMapped=t.toneMapped,this.userData=JSON.parse(JSON.stringify(t.userData)),this}dispose(){this.dispatchEvent({type:"dispose"})}set needsUpdate(t){t===!0&&this.version++}};var Ci=new W,qf=new W,jc=new W,Qc=new W,oa=class{constructor(t=new W,e=new W(0,0,-1)){this.origin=t,this.direction=e}set(t,e){return this.origin.copy(t),this.direction.copy(e),this}copy(t){return this.origin.copy(t.origin),this.direction.copy(t.direction),this}at(t,e){return e.copy(this.origin).addScaledVector(this.direction,t)}lookAt(t){return this.direction.copy(t).sub(this.origin).normalize(),this}recast(t){return this.origin.copy(this.at(t,Ci)),this}closestPointToPoint(t,e){e.subVectors(t,this.origin);let i=e.dot(this.direction);return i<0?e.copy(this.origin):e.copy(this.origin).addScaledVector(this.direction,i)}distanceToPoint(t){return Math.sqrt(this.distanceSqToPoint(t))}distanceSqToPoint(t){let e=Ci.subVectors(t,this.origin).dot(this.direction);return e<0?this.origin.distanceToSquared(t):(Ci.copy(this.origin).addScaledVector(this.direction,e),Ci.distanceToSquared(t))}distanceSqToSegment(t,e,i,s){qf.copy(t).add(e).multiplyScalar(.5),jc.copy(e).sub(t).normalize(),Qc.copy(this.origin).sub(qf);let r=t.distanceTo(e)*.5,o=-this.direction.dot(jc),a=Qc.dot(this.direction),l=-Qc.dot(jc),c=Qc.lengthSq(),u=Math.abs(1-o*o),f,h,m,_;if(u>0)if(f=o*l-a,h=o*a-l,_=r*u,f>=0)if(h>=-_)if(h<=_){let S=1/u;f*=S,h*=S,m=f*(f+o*h+2*a)+h*(o*f+h+2*l)+c}else h=r,f=Math.max(0,-(o*h+a)),m=-f*f+h*(h+2*l)+c;else h=-r,f=Math.max(0,-(o*h+a)),m=-f*f+h*(h+2*l)+c;else h<=-_?(f=Math.max(0,-(-o*r+a)),h=f>0?-r:Math.min(Math.max(-r,-l),r),m=-f*f+h*(h+2*l)+c):h<=_?(f=0,h=Math.min(Math.max(-r,-l),r),m=h*(h+2*l)+c):(f=Math.max(0,-(o*r+a)),h=f>0?r:Math.min(Math.max(-r,-l),r),m=-f*f+h*(h+2*l)+c);else h=o>0?-r:r,f=Math.max(0,-(o*h+a)),m=-f*f+h*(h+2*l)+c;return i&&i.copy(this.origin).addScaledVector(this.direction,f),s&&s.copy(qf).addScaledVector(jc,h),m}intersectSphere(t,e){if(t.radius<0)return null;Ci.subVectors(t.center,this.origin);let i=Ci.dot(this.direction),s=Ci.dot(Ci)-i*i,r=t.radius*t.radius;if(s>r)return null;let o=Math.sqrt(r-s),a=i-o,l=i+o;return l<0?null:a<0?this.at(l,e):this.at(a,e)}intersectsSphere(t){return t.radius<0?!1:this.distanceSqToPoint(t.center)<=t.radius*t.radius}distanceToPlane(t){let e=t.normal.dot(this.direction);if(e===0)return t.distanceToPoint(this.origin)===0?0:null;let i=-(this.origin.dot(t.normal)+t.constant)/e;return i>=0?i:null}intersectPlane(t,e){let i=this.distanceToPlane(t);return i===null?null:this.at(i,e)}intersectsPlane(t){let e=t.distanceToPoint(this.origin);return e===0||t.normal.dot(this.direction)*e<0}intersectBox(t,e){let i,s,r,o,a,l,c=1/this.direction.x,u=1/this.direction.y,f=1/this.direction.z,h=this.origin;return c>=0?(i=(t.min.x-h.x)*c,s=(t.max.x-h.x)*c):(i=(t.max.x-h.x)*c,s=(t.min.x-h.x)*c),u>=0?(r=(t.min.y-h.y)*u,o=(t.max.y-h.y)*u):(r=(t.max.y-h.y)*u,o=(t.min.y-h.y)*u),i>o||r>s||((r>i||isNaN(i))&&(i=r),(o<s||isNaN(s))&&(s=o),f>=0?(a=(t.min.z-h.z)*f,l=(t.max.z-h.z)*f):(a=(t.max.z-h.z)*f,l=(t.min.z-h.z)*f),i>l||a>s)||((a>i||i!==i)&&(i=a),(l<s||s!==s)&&(s=l),s<0)?null:this.at(i>=0?i:s,e)}intersectsBox(t){return this.intersectBox(t,Ci)!==null}intersectTriangle(t,e,i,s,r){let o=this.origin,a=this.direction,l=a.x,c=a.y,u=a.z,f=t.x-o.x,h=t.y-o.y,m=t.z-o.z,_=e.x-o.x,S=e.y-o.y,p=e.z-o.z,d=i.x-o.x,M=i.y-o.y,P=i.z-o.z,b=Math.abs(l),E=Math.abs(c),w=Math.abs(u),A,x,T,L,F,V,I,R,N,B,k,Y;if(b>=E&&b>=w?(T=l,V=f,N=_,Y=d,l>=0?(A=c,x=u,L=h,F=m,I=S,R=p,B=M,k=P):(A=u,x=c,L=m,F=h,I=p,R=S,B=P,k=M)):E>=w?(T=c,V=h,N=S,Y=M,c>=0?(A=u,x=l,L=m,F=f,I=p,R=_,B=P,k=d):(A=l,x=u,L=f,F=m,I=_,R=p,B=d,k=P)):(T=u,V=m,N=p,Y=P,u>=0?(A=l,x=c,L=f,F=h,I=_,R=S,B=d,k=M):(A=c,x=l,L=h,F=f,I=S,R=_,B=M,k=d)),T===0)return null;let $=A/T,J=x/T,q=1/T,st=L-$*V,rt=F-J*V,Mt=I-$*N,Ct=R-J*N,kt=B-$*Y,K=k-J*Y,tt=kt*Ct-K*Mt,xt=st*K-rt*kt,Nt=Mt*rt-Ct*st;if(s){if(tt<0||xt<0||Nt<0)return null}else if((tt<0||xt<0||Nt<0)&&(tt>0||xt>0||Nt>0))return null;let ct=tt+xt+Nt;if(ct===0)return null;let Ft=q*(tt*V+xt*N+Nt*Y);return(ct>0?Ft<0:Ft>0)?null:this.at(Ft/ct,r)}applyMatrix4(t){return this.origin.applyMatrix4(t),this.direction.transformDirection(t),this}equals(t){return t.origin.equals(this.origin)&&t.direction.equals(this.direction)}clone(){return new this.constructor().copy(this)}},aa=class extends ns{constructor(t){super(),this.isMeshBasicMaterial=!0,this.type="MeshBasicMaterial",this.color=new ne(16777215),this.map=null,this.lightMap=null,this.lightMapIntensity=1,this.aoMap=null,this.aoMapIntensity=1,this.specularMap=null,this.alphaMap=null,this.envMap=null,this.envMapRotation=new ts,this.combine=ud,this.reflectivity=1,this.refractionRatio=.98,this.wireframe=!1,this.wireframeLinewidth=1,this.wireframeLinecap="round",this.wireframeLinejoin="round",this.fog=!0,this.setValues(t)}copy(t){return super.copy(t),this.color.copy(t.color),this.map=t.map,this.lightMap=t.lightMap,this.lightMapIntensity=t.lightMapIntensity,this.aoMap=t.aoMap,this.aoMapIntensity=t.aoMapIntensity,this.specularMap=t.specularMap,this.alphaMap=t.alphaMap,this.envMap=t.envMap,this.envMapRotation.copy(t.envMapRotation),this.combine=t.combine,this.reflectivity=t.reflectivity,this.refractionRatio=t.refractionRatio,this.wireframe=t.wireframe,this.wireframeLinewidth=t.wireframeLinewidth,this.wireframeLinecap=t.wireframeLinecap,this.wireframeLinejoin=t.wireframeLinejoin,this.fog=t.fog,this}},g0=new Ce,Vs=new oa,tl=new Hs,_0=new W,el=new W,nl=new W,il=new W,Yf=new W,sl=new W,x0=new W,rl=new W,In=class extends yn{constructor(t=new vn,e=new aa){super(),this.isMesh=!0,this.type="Mesh",this.geometry=t,this.material=e,this.morphTargetDictionary=void 0,this.morphTargetInfluences=void 0,this.count=1,this.updateMorphTargets()}copy(t,e){return super.copy(t,e),t.morphTargetInfluences!==void 0&&(this.morphTargetInfluences=t.morphTargetInfluences.slice()),t.morphTargetDictionary!==void 0&&(this.morphTargetDictionary=Object.assign({},t.morphTargetDictionary)),this.material=Array.isArray(t.material)?t.material.slice():t.material,this.geometry=t.geometry,this}updateMorphTargets(){let e=this.geometry.morphAttributes,i=Object.keys(e);if(i.length>0){let s=e[i[0]];if(s!==void 0){this.morphTargetInfluences=[],this.morphTargetDictionary={};for(let r=0,o=s.length;r<o;r++){let a=s[r].name||String(r);this.morphTargetInfluences.push(0),this.morphTargetDictionary[a]=r}}}}getVertexPosition(t,e){let i=this.geometry,s=i.attributes.position,r=i.morphAttributes.position,o=i.morphTargetsRelative;e.fromBufferAttribute(s,t);let a=this.morphTargetInfluences;if(r&&a){sl.set(0,0,0);for(let l=0,c=r.length;l<c;l++){let u=a[l],f=r[l];u!==0&&(Yf.fromBufferAttribute(f,t),o?sl.addScaledVector(Yf,u):sl.addScaledVector(Yf.sub(e),u))}e.add(sl)}return e}intersectsFrustum(t){return t.intersectsObject(this)}raycast(t,e){let i=this.geometry,s=this.material,r=this.matrixWorld;s!==void 0&&(i.boundingSphere===null&&i.computeBoundingSphere(),tl.copy(i.boundingSphere),tl.applyMatrix4(r),Vs.copy(t.ray).recast(t.near),!(tl.containsPoint(Vs.origin)===!1&&(Vs.intersectSphere(tl,_0)===null||Vs.origin.distanceToSquared(_0)>(t.far-t.near)**2))&&(g0.copy(r).invert(),Vs.copy(t.ray).applyMatrix4(g0),!(i.boundingBox!==null&&Vs.intersectsBox(i.boundingBox)===!1)&&this._computeIntersections(t,e,Vs)))}_computeIntersections(t,e,i){let s,r=this.geometry,o=this.material,a=r.index,l=r.attributes.position,c=r.attributes.uv,u=r.attributes.uv1,f=r.attributes.normal,h=r.groups,m=r.drawRange;if(a!==null)if(Array.isArray(o))for(let _=0,S=h.length;_<S;_++){let p=h[_],d=o[p.materialIndex],M=Math.max(p.start,m.start),P=Math.min(a.count,Math.min(p.start+p.count,m.start+m.count));for(let b=M,E=P;b<E;b+=3){let w=a.getX(b),A=a.getX(b+1),x=a.getX(b+2);s=ol(this,d,t,i,c,u,f,w,A,x),s&&(s.faceIndex=Math.floor(b/3),s.face.materialIndex=p.materialIndex,e.push(s))}}else{let _=Math.max(0,m.start),S=Math.min(a.count,m.start+m.count);for(let p=_,d=S;p<d;p+=3){let M=a.getX(p),P=a.getX(p+1),b=a.getX(p+2);s=ol(this,o,t,i,c,u,f,M,P,b),s&&(s.faceIndex=Math.floor(p/3),e.push(s))}}else if(l!==void 0)if(Array.isArray(o))for(let _=0,S=h.length;_<S;_++){let p=h[_],d=o[p.materialIndex],M=Math.max(p.start,m.start),P=Math.min(l.count,Math.min(p.start+p.count,m.start+m.count));for(let b=M,E=P;b<E;b+=3){let w=b,A=b+1,x=b+2;s=ol(this,d,t,i,c,u,f,w,A,x),s&&(s.faceIndex=Math.floor(b/3),s.face.materialIndex=p.materialIndex,e.push(s))}}else{let _=Math.max(0,m.start),S=Math.min(l.count,m.start+m.count);for(let p=_,d=S;p<d;p+=3){let M=p,P=p+1,b=p+2;s=ol(this,o,t,i,c,u,f,M,P,b),s&&(s.faceIndex=Math.floor(p/3),e.push(s))}}}};function dS(n,t,e,i,s,r,o,a){let l;if(t.side===rn?l=i.intersectTriangle(o,r,s,!0,a):l=i.intersectTriangle(s,r,o,t.side===as,a),l===null)return null;rl.copy(a),rl.applyMatrix4(n.matrixWorld);let c=e.ray.origin.distanceTo(rl);return c<e.near||c>e.far?null:{distance:c,point:rl.clone(),object:n}}function ol(n,t,e,i,s,r,o,a,l,c){n.getVertexPosition(a,el),n.getVertexPosition(l,nl),n.getVertexPosition(c,il);let u=dS(n,t,e,i,el,nl,il,x0);if(u){let f=new W;Ri.getBarycoord(x0,el,nl,il,f),s&&(u.uv=Ri.getInterpolatedAttribute(s,a,l,c,f,new re)),r&&(u.uv1=Ri.getInterpolatedAttribute(r,a,l,c,f,new re)),o&&(u.normal=Ri.getInterpolatedAttribute(o,a,l,c,f,new W),u.normal.dot(i.direction)>0&&u.normal.multiplyScalar(-1));let h={a,b:l,c,normal:new W,materialIndex:0};Ri.getNormal(el,nl,il,h.normal),u.face=h,u.barycoord=f}return u}var Ll=class extends fn{constructor(t=null,e=1,i=1,s,r,o,a,l,c=Ge,u=Ge,f,h){super(null,o,a,l,c,u,s,r,f,h),this.isDataTexture=!0,this.image={data:t,width:e,height:i},this.generateMipmaps=!1,this.flipY=!1,this.unpackAlignment=1}};var zs=new Hs,pS=new re(.5,.5),al=new W,ca=class{constructor(t=new $n,e=new $n,i=new $n,s=new $n,r=new $n,o=new $n){this.planes=[t,e,i,s,r,o]}set(t,e,i,s,r,o){let a=this.planes;return a[0].copy(t),a[1].copy(e),a[2].copy(i),a[3].copy(s),a[4].copy(r),a[5].copy(o),this}copy(t){let e=this.planes;for(let i=0;i<6;i++)e[i].copy(t.planes[i]);return this}setFromProjectionMatrix(t,e=Xn,i=!1){let s=this.planes,r=t.elements,o=r[0],a=r[1],l=r[2],c=r[3],u=r[4],f=r[5],h=r[6],m=r[7],_=r[8],S=r[9],p=r[10],d=r[11],M=r[12],P=r[13],b=r[14],E=r[15];if(s[0].setComponents(c-o,m-u,d-_,E-M).normalize(),s[1].setComponents(c+o,m+u,d+_,E+M).normalize(),s[2].setComponents(c+a,m+f,d+S,E+P).normalize(),s[3].setComponents(c-a,m-f,d-S,E-P).normalize(),i)s[4].setComponents(l,h,p,b).normalize(),s[5].setComponents(c-l,m-h,d-p,E-b).normalize();else if(s[4].setComponents(c-l,m-h,d-p,E-b).normalize(),e===Xn)s[5].setComponents(c+l,m+h,d+p,E+b).normalize();else if(e===Qo)s[5].setComponents(l,h,p,b).normalize();else throw new Error("THREE.Frustum.setFromProjectionMatrix(): Invalid coordinate system: "+e);return this}intersectsObject(t){if(t.boundingSphere!==void 0)t.boundingSphere===null&&t.computeBoundingSphere(),zs.copy(t.boundingSphere).applyMatrix4(t.matrixWorld);else{let e=t.geometry;e.boundingSphere===null&&e.computeBoundingSphere(),zs.copy(e.boundingSphere).applyMatrix4(t.matrixWorld)}return this.intersectsSphere(zs)}intersectsSprite(t){zs.center.set(0,0,0);let e=pS.distanceTo(t.center);return zs.radius=.7071067811865476+e,zs.applyMatrix4(t.matrixWorld),this.intersectsSphere(zs)}intersectsSphere(t){let e=this.planes,i=t.center,s=-t.radius;for(let r=0;r<6;r++)if(e[r].distanceToPoint(i)<s)return!1;return!0}intersectsBox(t){let e=this.planes;for(let i=0;i<6;i++){let s=e[i];if(al.x=s.normal.x>0?t.max.x:t.min.x,al.y=s.normal.y>0?t.max.y:t.min.y,al.z=s.normal.z>0?t.max.z:t.min.z,s.distanceToPoint(al)<0)return!1}return!0}containsPoint(t){let e=this.planes;for(let i=0;i<6;i++)if(e[i].distanceToPoint(t)<0)return!1;return!0}clone(){return new this.constructor().copy(this)}};var Vr=class extends ns{constructor(t){super(),this.isLineBasicMaterial=!0,this.type="LineBasicMaterial",this.color=new ne(16777215),this.map=null,this.linewidth=1,this.linecap="round",this.linejoin="round",this.fog=!0,this.setValues(t)}copy(t){return super.copy(t),this.color.copy(t.color),this.map=t.map,this.linewidth=t.linewidth,this.linecap=t.linecap,this.linejoin=t.linejoin,this.fog=t.fog,this}},Nl=new W,Ul=new W,y0=new Ce,Zo=new oa,cl=new Hs,Zf=new W,v0=new W,Dl=class extends yn{constructor(t=new vn,e=new Vr){super(),this.isLine=!0,this.type="Line",this.geometry=t,this.material=e,this.morphTargetDictionary=void 0,this.morphTargetInfluences=void 0,this.updateMorphTargets()}copy(t,e){return super.copy(t,e),this.material=Array.isArray(t.material)?t.material.slice():t.material,this.geometry=t.geometry,this}computeLineDistances(){let t=this.geometry;if(t.index===null){let e=t.attributes.position,i=[0];for(let s=1,r=e.count;s<r;s++)Nl.fromBufferAttribute(e,s-1),Ul.fromBufferAttribute(e,s),i[s]=i[s-1],i[s]+=Nl.distanceTo(Ul);t.setAttribute("lineDistance",new ze(i,1))}else Dt("Line.computeLineDistances(): Computation only possible with non-indexed BufferGeometry.");return this}intersectsFrustum(t){return t.intersectsObject(this)}raycast(t,e){let i=this.geometry,s=this.matrixWorld,r=t.params.Line.threshold,o=i.drawRange;if(i.boundingSphere===null&&i.computeBoundingSphere(),cl.copy(i.boundingSphere),cl.applyMatrix4(s),cl.radius+=r,t.ray.intersectsSphere(cl)===!1)return;y0.copy(s).invert(),Zo.copy(t.ray).applyMatrix4(y0);let a=r/((this.scale.x+this.scale.y+this.scale.z)/3),l=a*a,c=this.isLineSegments?2:1,u=i.index,h=i.attributes.position;if(u!==null){let m=Math.max(0,o.start),_=Math.min(u.count,o.start+o.count);for(let S=m,p=_-1;S<p;S+=c){let d=u.getX(S),M=u.getX(S+1),P=ll(this,t,Zo,l,d,M,S);P&&e.push(P)}if(this.isLineLoop){let S=u.getX(_-1),p=u.getX(m),d=ll(this,t,Zo,l,S,p,_-1);d&&e.push(d)}}else{let m=Math.max(0,o.start),_=Math.min(h.count,o.start+o.count);for(let S=m,p=_-1;S<p;S+=c){let d=ll(this,t,Zo,l,S,S+1,S);d&&e.push(d)}if(this.isLineLoop){let S=ll(this,t,Zo,l,_-1,m,_-1);S&&e.push(S)}}}updateMorphTargets(){let e=this.geometry.morphAttributes,i=Object.keys(e);if(i.length>0){let s=e[i[0]];if(s!==void 0){this.morphTargetInfluences=[],this.morphTargetDictionary={};for(let r=0,o=s.length;r<o;r++){let a=s[r].name||String(r);this.morphTargetInfluences.push(0),this.morphTargetDictionary[a]=r}}}}};function ll(n,t,e,i,s,r,o){let a=n.geometry.attributes.position;if(Nl.fromBufferAttribute(a,s),Ul.fromBufferAttribute(a,r),e.distanceSqToSegment(Nl,Ul,Zf,v0)>i)return;Zf.applyMatrix4(n.matrixWorld);let c=t.ray.origin.distanceTo(Zf);if(!(c<t.near||c>t.far))return{distance:c,point:v0.clone().applyMatrix4(n.matrixWorld),index:o,face:null,faceIndex:null,barycoord:null,object:n}}var S0=new W,b0=new W,la=class extends Dl{constructor(t,e){super(t,e),this.isLineSegments=!0,this.type="LineSegments"}computeLineDistances(){let t=this.geometry;if(t.index===null){let e=t.attributes.position,i=[];for(let s=0,r=e.count;s<r;s+=2)S0.fromBufferAttribute(e,s),b0.fromBufferAttribute(e,s+1),i[s]=s===0?0:i[s-1],i[s+1]=i[s]+S0.distanceTo(b0);t.setAttribute("lineDistance",new ze(i,1))}else Dt("LineSegments.computeLineDistances(): Computation only possible with non-indexed BufferGeometry.");return this}};var ua=class extends fn{constructor(t=[],e=cs,i,s,r,o,a,l,c,u){super(t,e,i,s,r,o,a,l,c,u),this.isCubeTexture=!0,this.flipY=!1}get images(){return this.image}set images(t){this.image=t}};var is=class extends fn{constructor(t,e,i=Yn,s,r,o,a=Ge,l=Ge,c,u=ai,f=1){if(u!==ai&&u!==us)throw new Error("THREE.DepthTexture: format must be either THREE.DepthFormat or THREE.DepthStencilFormat");let h={width:t,height:e,depth:f};super(h,s,r,o,a,l,u,i,c),this.isDepthTexture=!0,this.flipY=!1,this.generateMipmaps=!1,this.compareFunction=null}copy(t){return super.copy(t),this.source=new Br(Object.assign({},t.image)),this.compareFunction=t.compareFunction,this}toJSON(t){let e=super.toJSON(t);return e.compareFunction=this.compareFunction,e}},Ol=class extends is{constructor(t,e=Yn,i=cs,s,r,o=Ge,a=Ge,l,c=ai){let u={width:t,height:t,depth:1},f=[u,u,u,u,u,u];super(t,t,e,i,s,r,o,a,l,c),this.image=f,this.isCubeDepthTexture=!0,this.isCubeTexture=!0}get images(){return this.image}set images(t){this.image=t}},ha=class extends fn{constructor(t=null){super(),this.sourceTexture=t,this.isExternalTexture=!0}copy(t){return super.copy(t),this.sourceTexture=t.sourceTexture,this}},zr=class n extends vn{constructor(t=1,e=1,i=1,s=1,r=1,o=1){super(),this.type="BoxGeometry",this.parameters={width:t,height:e,depth:i,widthSegments:s,heightSegments:r,depthSegments:o};let a=this;s=Math.floor(s),r=Math.floor(r),o=Math.floor(o);let l=[],c=[],u=[],f=[],h=0,m=0;_("z","y","x",-1,-1,i,e,t,o,r,0),_("z","y","x",1,-1,i,e,-t,o,r,1),_("x","z","y",1,1,t,i,e,s,o,2),_("x","z","y",1,-1,t,i,-e,s,o,3),_("x","y","z",1,-1,t,e,i,s,r,4),_("x","y","z",-1,-1,t,e,-i,s,r,5),this.setIndex(l),this.setAttribute("position",new ze(c,3)),this.setAttribute("normal",new ze(u,3)),this.setAttribute("uv",new ze(f,2));function _(S,p,d,M,P,b,E,w,A,x,T){let L=b/A,F=E/x,V=b/2,I=E/2,R=w/2,N=A+1,B=x+1,k=0,Y=0,$=new W;for(let J=0;J<B;J++){let q=J*F-I;for(let st=0;st<N;st++){let rt=st*L-V;$[S]=rt*M,$[p]=q*P,$[d]=R,c.push($.x,$.y,$.z),$[S]=0,$[p]=0,$[d]=w>0?1:-1,u.push($.x,$.y,$.z),f.push(st/A),f.push(1-J/x),k+=1}}for(let J=0;J<x;J++)for(let q=0;q<A;q++){let st=h+q+N*J,rt=h+q+N*(J+1),Mt=h+(q+1)+N*(J+1),Ct=h+(q+1)+N*J;l.push(st,rt,Ct),l.push(rt,Mt,Ct),Y+=6}a.addGroup(m,Y,T),m+=Y,h+=k}}copy(t){return super.copy(t),this.parameters=Object.assign({},t.parameters),this}static fromJSON(t){return new n(t.width,t.height,t.depth,t.widthSegments,t.heightSegments,t.depthSegments)}};var ul=new W,hl=new W,Kf=new W,fl=new Ri,fa=class extends vn{constructor(t=null,e=1){if(super(),this.type="EdgesGeometry",this.parameters={geometry:t,thresholdAngle:e},t!==null){let s=Math.pow(10,4),r=Math.cos(_l*e),o=t.getIndex(),a=t.getAttribute("position"),l=o?o.count:a.count,c=[0,0,0],u=["a","b","c"],f=new Array(3),h={},m=[];for(let _=0;_<l;_+=3){o?(c[0]=o.getX(_),c[1]=o.getX(_+1),c[2]=o.getX(_+2)):(c[0]=_,c[1]=_+1,c[2]=_+2);let{a:S,b:p,c:d}=fl;if(S.fromBufferAttribute(a,c[0]),p.fromBufferAttribute(a,c[1]),d.fromBufferAttribute(a,c[2]),fl.getNormal(Kf),f[0]=`${Math.round(S.x*s)},${Math.round(S.y*s)},${Math.round(S.z*s)}`,f[1]=`${Math.round(p.x*s)},${Math.round(p.y*s)},${Math.round(p.z*s)}`,f[2]=`${Math.round(d.x*s)},${Math.round(d.y*s)},${Math.round(d.z*s)}`,!(f[0]===f[1]||f[1]===f[2]||f[2]===f[0]))for(let M=0;M<3;M++){let P=(M+1)%3,b=f[M],E=f[P],w=fl[u[M]],A=fl[u[P]],x=`${b}_${E}`,T=`${E}_${b}`;T in h&&h[T]?(Kf.dot(h[T].normal)<=r&&(m.push(w.x,w.y,w.z),m.push(A.x,A.y,A.z)),h[T]=null):x in h||(h[x]={index0:c[M],index1:c[P],normal:Kf.clone()})}}for(let _ in h)if(h[_]){let{index0:S,index1:p}=h[_];ul.fromBufferAttribute(a,S),hl.fromBufferAttribute(a,p),m.push(ul.x,ul.y,ul.z),m.push(hl.x,hl.y,hl.z)}this.setAttribute("position",new ze(m,3))}}copy(t){return super.copy(t),this.parameters=Object.assign({},t.parameters),this}};var da=class n extends vn{constructor(t=1,e=1,i=1,s=1){super(),this.type="PlaneGeometry",this.parameters={width:t,height:e,widthSegments:i,heightSegments:s};let r=t/2,o=e/2,a=Math.floor(i),l=Math.floor(s),c=a+1,u=l+1,f=t/a,h=e/l,m=[],_=[],S=[],p=[];for(let d=0;d<u;d++){let M=d*h-o;for(let P=0;P<c;P++){let b=P*f-r;_.push(b,-M,0),S.push(0,0,1),p.push(P/a),p.push(1-d/l)}}for(let d=0;d<l;d++)for(let M=0;M<a;M++){let P=M+c*d,b=M+c*(d+1),E=M+1+c*(d+1),w=M+1+c*d;m.push(P,b,w),m.push(b,E,w)}this.setIndex(m),this.setAttribute("position",new ze(_,3)),this.setAttribute("normal",new ze(S,3)),this.setAttribute("uv",new ze(p,2))}copy(t){return super.copy(t),this.parameters=Object.assign({},t.parameters),this}static fromJSON(t){return new n(t.width,t.height,t.widthSegments,t.heightSegments)}};var pa=class n extends vn{constructor(t=1,e=.4,i=12,s=48,r=Math.PI*2,o=0,a=Math.PI*2){super(),this.type="TorusGeometry",this.parameters={radius:t,tube:e,radialSegments:i,tubularSegments:s,arc:r,thetaStart:o,thetaLength:a},i=Math.floor(i),s=Math.floor(s);let l=[],c=[],u=[],f=[],h=new W,m=new W,_=new W;for(let S=0;S<=i;S++){let p=o+S/i*a;for(let d=0;d<=s;d++){let M=d/s*r;m.x=(t+e*Math.cos(p))*Math.cos(M),m.y=(t+e*Math.cos(p))*Math.sin(M),m.z=e*Math.sin(p),c.push(m.x,m.y,m.z),h.x=t*Math.cos(M),h.y=t*Math.sin(M),_.subVectors(m,h).normalize(),u.push(_.x,_.y,_.z),f.push(d/s),f.push(S/i)}}for(let S=1;S<=i;S++)for(let p=1;p<=s;p++){let d=(s+1)*S+p-1,M=(s+1)*(S-1)+p-1,P=(s+1)*(S-1)+p,b=(s+1)*S+p;l.push(d,M,b),l.push(M,P,b)}this.setIndex(l),this.setAttribute("position",new ze(c,3)),this.setAttribute("normal",new ze(u,3)),this.setAttribute("uv",new ze(f,2))}copy(t){return super.copy(t),this.parameters=Object.assign({},t.parameters),this}static fromJSON(t){return new n(t.radius,t.tube,t.radialSegments,t.tubularSegments,t.arc,t.thetaStart,t.thetaLength)}};function Xs(n){let t={};for(let e in n){t[e]={};for(let i in n[e]){let s=n[e][i];if(M0(s))s.isRenderTargetTexture?(Dt("UniformsUtils: Textures of render targets cannot be cloned via cloneUniforms() or mergeUniforms()."),t[e][i]=null):t[e][i]=s.clone();else if(Array.isArray(s))if(M0(s[0])){let r=[];for(let o=0,a=s.length;o<a;o++)r[o]=s[o].clone();t[e][i]=r}else t[e][i]=s.slice();else t[e][i]=s}}return t}function Qe(n){let t={};for(let e=0;e<n.length;e++){let i=Xs(n[e]);for(let s in i)t[s]=i[s]}return t}function M0(n){return n&&(n.isColor||n.isMatrix3||n.isMatrix4||n.isVector2||n.isVector3||n.isVector4||n.isTexture||n.isQuaternion)}function mS(n){let t=[];for(let e=0;e<n.length;e++)t.push(n[e].clone());return t}function Rd(n){let t=n.getRenderTarget();return t===null?n.outputColorSpace:t.isXRRenderTarget===!0?t.texture.colorSpace:Kt.workingColorSpace}var f_={clone:Xs,merge:Qe},gS=`void main() {
	gl_Position = projectionMatrix * modelViewMatrix * vec4( position, 1.0 );
}`,_S=`void main() {
	gl_FragColor = vec4( 1.0, 0.0, 0.0, 1.0 );
}`,Sn=class extends ns{constructor(t){super(),this.isShaderMaterial=!0,this.type="ShaderMaterial",this.defines={},this.uniforms={},this.uniformsGroups=[],this.vertexShader=gS,this.fragmentShader=_S,this.linewidth=1,this.wireframe=!1,this.wireframeLinewidth=1,this.fog=!1,this.lights=!1,this.clipping=!1,this.forceSinglePass=!0,this.extensions={clipCullDistance:!1,multiDraw:!1},this.defaultAttributeValues={color:[1,1,1],uv:[0,0],uv1:[0,0]},this.index0AttributeName=void 0,this.uniformsNeedUpdate=!1,this.glslVersion=null,t!==void 0&&this.setValues(t)}copy(t){return super.copy(t),this.fragmentShader=t.fragmentShader,this.vertexShader=t.vertexShader,this.uniforms=Xs(t.uniforms),this.uniformsGroups=mS(t.uniformsGroups),this.defines=Object.assign({},t.defines),this.wireframe=t.wireframe,this.wireframeLinewidth=t.wireframeLinewidth,this.fog=t.fog,this.lights=t.lights,this.clipping=t.clipping,this.extensions=Object.assign({},t.extensions),this.glslVersion=t.glslVersion,this.defaultAttributeValues=Object.assign({},t.defaultAttributeValues),this.index0AttributeName=t.index0AttributeName,this.uniformsNeedUpdate=t.uniformsNeedUpdate,this}toJSON(t){let e=super.toJSON(t);e.glslVersion=this.glslVersion,e.uniforms={};for(let s in this.uniforms){let o=this.uniforms[s].value;o&&o.isTexture?e.uniforms[s]={type:"t",value:o.toJSON(t).uuid}:o&&o.isColor?e.uniforms[s]={type:"c",value:o.getHex()}:o&&o.isVector2?e.uniforms[s]={type:"v2",value:o.toArray()}:o&&o.isVector3?e.uniforms[s]={type:"v3",value:o.toArray()}:o&&o.isVector4?e.uniforms[s]={type:"v4",value:o.toArray()}:o&&o.isMatrix3?e.uniforms[s]={type:"m3",value:o.toArray()}:o&&o.isMatrix4?e.uniforms[s]={type:"m4",value:o.toArray()}:e.uniforms[s]={value:o}}Object.keys(this.defines).length>0&&(e.defines=this.defines),e.vertexShader=this.vertexShader,e.fragmentShader=this.fragmentShader,e.lights=this.lights,e.clipping=this.clipping;let i={};for(let s in this.extensions)this.extensions[s]===!0&&(i[s]=!0);return Object.keys(i).length>0&&(e.extensions=i),e}fromJSON(t,e){if(super.fromJSON(t,e),t.uniforms!==void 0)for(let i in t.uniforms){let s=t.uniforms[i];switch(this.uniforms[i]={},s.type){case"t":this.uniforms[i].value=e[s.value]||null;break;case"c":this.uniforms[i].value=new ne().setHex(s.value);break;case"v2":this.uniforms[i].value=new re().fromArray(s.value);break;case"v3":this.uniforms[i].value=new W().fromArray(s.value);break;case"v4":this.uniforms[i].value=new we().fromArray(s.value);break;case"m3":this.uniforms[i].value=new Vt().fromArray(s.value);break;case"m4":this.uniforms[i].value=new Ce().fromArray(s.value);break;default:this.uniforms[i].value=s.value}}if(t.defines!==void 0&&(this.defines=t.defines),t.vertexShader!==void 0&&(this.vertexShader=t.vertexShader),t.fragmentShader!==void 0&&(this.fragmentShader=t.fragmentShader),t.glslVersion!==void 0&&(this.glslVersion=t.glslVersion),t.extensions!==void 0)for(let i in t.extensions)this.extensions[i]=t.extensions[i];return t.lights!==void 0&&(this.lights=t.lights),t.clipping!==void 0&&(this.clipping=t.clipping),this}},Fl=class extends Sn{constructor(t){super(t),this.isRawShaderMaterial=!0,this.type="RawShaderMaterial"}};var Bl=class extends ns{constructor(t){super(),this.isMeshDepthMaterial=!0,this.type="MeshDepthMaterial",this.depthPacking=J0,this.map=null,this.alphaMap=null,this.displacementMap=null,this.displacementScale=1,this.displacementBias=0,this.wireframe=!1,this.wireframeLinewidth=1,this.setValues(t)}copy(t){return super.copy(t),this.depthPacking=t.depthPacking,this.map=t.map,this.alphaMap=t.alphaMap,this.displacementMap=t.displacementMap,this.displacementScale=t.displacementScale,this.displacementBias=t.displacementBias,this.wireframe=t.wireframe,this.wireframeLinewidth=t.wireframeLinewidth,this}},kl=class extends ns{constructor(t){super(),this.isMeshDistanceMaterial=!0,this.type="MeshDistanceMaterial",this.map=null,this.alphaMap=null,this.displacementMap=null,this.displacementScale=1,this.displacementBias=0,this.setValues(t)}copy(t){return super.copy(t),this.map=t.map,this.alphaMap=t.alphaMap,this.displacementMap=t.displacementMap,this.displacementScale=t.displacementScale,this.displacementBias=t.displacementBias,this}};function Lr(n,t){return!n||n.constructor===t?n:typeof t.BYTES_PER_ELEMENT=="number"?new t(n):Array.prototype.slice.call(n)}function Jf(n){return n!==void 0&&n.inTangents!==void 0&&n.outTangents!==void 0}var ss=class{constructor(t,e,i,s){this.parameterPositions=t,this._cachedIndex=0,this.resultBuffer=s!==void 0?s:new e.constructor(i),this.sampleValues=e,this.valueSize=i,this.settings=null,this.DefaultSettings_={}}evaluate(t){let e=this.parameterPositions,i=this._cachedIndex,s=e[i],r=e[i-1];n:{t:{let o;e:{i:if(!(t<s)){for(let a=i+2;;){if(s===void 0){if(t<r)break i;return i=e.length,this._cachedIndex=i,this.copySampleValue_(i-1)}if(i===a)break;if(r=s,s=e[++i],t<s)break t}o=e.length;break e}if(!(t>=r)){let a=e[1];t<a&&(i=2,r=a);for(let l=i-2;;){if(r===void 0)return this._cachedIndex=0,this.copySampleValue_(0);if(i===l)break;if(s=r,r=e[--i-1],t>=r)break t}o=i,i=0;break e}break n}for(;i<o;){let a=i+o>>>1;t<e[a]?o=a:i=a+1}if(s=e[i],r=e[i-1],r===void 0)return this._cachedIndex=0,this.copySampleValue_(0);if(s===void 0)return i=e.length,this._cachedIndex=i,this.copySampleValue_(i-1)}this._cachedIndex=i,this.intervalChanged_(i,r,s)}return this.interpolate_(i,r,t,s)}getSettings_(){return this.settings||this.DefaultSettings_}copySampleValue_(t){let e=this.resultBuffer,i=this.sampleValues,s=this.valueSize,r=t*s;for(let o=0;o!==s;++o)e[o]=i[r+o];return e}interpolate_(){throw new Error("THREE.Interpolant: Call to abstract method.")}intervalChanged_(){}},Vl=class extends ss{constructor(t,e,i,s){super(t,e,i,s),this._weightPrev=-0,this._offsetPrev=-0,this._weightNext=-0,this._offsetNext=-0,this.DefaultSettings_={endingStart:Qf,endingEnd:Qf}}intervalChanged_(t,e,i){let s=this.parameterPositions,r=t-2,o=t+1,a=s[r],l=s[o];if(a===void 0)switch(this.getSettings_().endingStart){case td:r=t,a=2*e-i;break;case ed:r=s.length-2,a=e+s[r]-s[r+1];break;default:r=t,a=i}if(l===void 0)switch(this.getSettings_().endingEnd){case td:o=t,l=2*i-e;break;case ed:o=1,l=i+s[1]-s[0];break;default:o=t-1,l=e}let c=(i-e)*.5,u=this.valueSize;this._weightPrev=c/(e-a),this._weightNext=c/(l-i),this._offsetPrev=r*u,this._offsetNext=o*u}interpolate_(t,e,i,s){let r=this.resultBuffer,o=this.sampleValues,a=this.valueSize,l=t*a,c=l-a,u=this._offsetPrev,f=this._offsetNext,h=this._weightPrev,m=this._weightNext,_=(i-e)/(s-e),S=_*_,p=S*_,d=-h*p+2*h*S-h*_,M=(1+h)*p+(-1.5-2*h)*S+(-.5+h)*_+1,P=(-1-m)*p+(1.5+m)*S+.5*_,b=m*p-m*S;for(let E=0;E!==a;++E)r[E]=d*o[u+E]+M*o[c+E]+P*o[l+E]+b*o[f+E];return r}},zl=class extends ss{constructor(t,e,i,s){super(t,e,i,s)}interpolate_(t,e,i,s){let r=this.resultBuffer,o=this.sampleValues,a=this.valueSize,l=t*a,c=l-a,u=(i-e)/(s-e),f=1-u;for(let h=0;h!==a;++h)r[h]=o[c+h]*f+o[l+h]*u;return r}},Gl=class extends ss{constructor(t,e,i,s){super(t,e,i,s)}interpolate_(t){return this.copySampleValue_(t-1)}},Hl=class extends ss{interpolate_(t,e,i,s){let r=this.resultBuffer,o=this.sampleValues,a=this.valueSize,l=t*a,c=l-a,u=this.inTangents,f=this.outTangents;if(!u||!f){let _=(i-e)/(s-e),S=1-_;for(let p=0;p!==a;++p)r[p]=o[c+p]*S+o[l+p]*_;return r}let h=a*2,m=t-1;for(let _=0;_!==a;++_){let S=o[c+_],p=o[l+_],d=m*h+_*2,M=f[d],P=f[d+1],b=t*h+_*2,E=u[b],w=u[b+1],A=yS(i,e,M,E,s);r[_]=d_(A,S,P,w,p)}return r}};function d_(n,t,e,i,s){let r=1-n;return r*r*r*t+3*r*r*n*e+3*r*n*n*i+n*n*n*s}function xS(n,t,e,i,s){let r=1-n;return 3*r*r*(e-t)+6*r*n*(i-e)+3*n*n*(s-i)}function yS(n,t,e,i,s){let r=(n-t)/(s-t);for(let o=0;o<8;o++){let a=d_(r,t,e,i,s)-n;if(Math.abs(a)<1e-10)break;let l=xS(r,t,e,i,s);if(Math.abs(l)<1e-10)break;r=Math.max(0,Math.min(1,r-a/l))}return r}var bn=class{constructor(t,e,i,s){if(t===void 0)throw new Error("THREE.KeyframeTrack: track name is undefined");if(e===void 0||e.length===0)throw new Error("THREE.KeyframeTrack: no keyframes in track named "+t);this.name=t,this.times=Lr(e,this.TimeBufferType),this.values=Lr(i,this.ValueBufferType),this.setInterpolation(s||this.DefaultInterpolation)}static toJSON(t){let e=t.constructor,i;if(e.toJSON!==this.toJSON)i=e.toJSON(t);else{i={name:t.name,times:Lr(t.times,Array),values:Lr(t.values,Array)};let s=t.getInterpolation();s!==t.DefaultInterpolation&&(i.interpolation=s),Jf(t.settings)&&(i.settings={inTangents:Lr(t.settings.inTangents,Array),outTangents:Lr(t.settings.outTangents,Array)})}return i.type=t.ValueTypeName,i}InterpolantFactoryMethodDiscrete(t){return new Gl(this.times,this.values,this.getValueSize(),t)}InterpolantFactoryMethodLinear(t){return new zl(this.times,this.values,this.getValueSize(),t)}InterpolantFactoryMethodSmooth(t){return new Vl(this.times,this.values,this.getValueSize(),t)}InterpolantFactoryMethodBezier(t){let e=new Hl(this.times,this.values,this.getValueSize(),t);return this.settings&&(e.inTangents=this.settings.inTangents,e.outTangents=this.settings.outTangents),e}setInterpolation(t){let e;switch(t){case Ko:e=this.InterpolantFactoryMethodDiscrete;break;case Al:e=this.InterpolantFactoryMethodLinear;break;case ml:e=this.InterpolantFactoryMethodSmooth;break;case jf:e=this.InterpolantFactoryMethodBezier;break}if(e===void 0){let i="unsupported interpolation for "+this.ValueTypeName+" keyframe track named "+this.name;if(this.createInterpolant===void 0)if(t!==this.DefaultInterpolation)this.setInterpolation(this.DefaultInterpolation);else throw new Error(i);return Dt("KeyframeTrack:",i),this}return this.createInterpolant=e,this}getInterpolation(){switch(this.createInterpolant){case this.InterpolantFactoryMethodDiscrete:return Ko;case this.InterpolantFactoryMethodLinear:return Al;case this.InterpolantFactoryMethodSmooth:return ml;case this.InterpolantFactoryMethodBezier:return jf}}getValueSize(){return this.values.length/this.times.length}shift(t){if(t!==0){let e=this.times;for(let i=0,s=e.length;i!==s;++i)e[i]+=t}return this}scale(t){if(t!==1){let e=this.times;for(let i=0,s=e.length;i!==s;++i)e[i]*=t;Jf(this.settings)&&(T0(this.settings.inTangents,t),T0(this.settings.outTangents,t))}return this}trim(t,e){let i=this.times,s=i.length,r=0,o=s-1;for(;r!==s&&i[r]<t;)++r;for(;o!==-1&&i[o]>e;)--o;if(++o,r!==0||o!==s){r>=o&&(o=Math.max(o,1),r=o-1);let a=this.getValueSize();this.times=i.slice(r,o),this.values=this.values.slice(r*a,o*a)}return this}validate(){let t=!0,e=this.getValueSize();e-Math.floor(e)!==0&&(Bt("KeyframeTrack: Invalid value size in track.",this),t=!1);let i=this.times,s=this.values,r=i.length;r===0&&(Bt("KeyframeTrack: Track is empty.",this),t=!1);let o=null;for(let a=0;a!==r;a++){let l=i[a];if(typeof l=="number"&&isNaN(l)){Bt("KeyframeTrack: Time is not a valid number.",this,a,l),t=!1;break}if(o!==null&&o>l){Bt("KeyframeTrack: Out of order keys.",this,a,l,o),t=!1;break}o=l}if(s!==void 0&&Zv(s))for(let a=0,l=s.length;a!==l;++a){let c=s[a];if(isNaN(c)){Bt("KeyframeTrack: Value is not a valid number.",this,a,c),t=!1;break}}return t}optimize(){let t=this.times.slice(),e=this.values.slice(),i=this.getValueSize(),s=this.getInterpolation()===ml,r=t.length-1,o=1;for(let a=1;a<r;++a){let l=!1,c=t[a],u=t[a+1];if(c!==u&&(a!==1||c!==t[0]))if(s)l=!0;else{let f=a*i,h=f-i,m=f+i;for(let _=0;_!==i;++_){let S=e[f+_];if(S!==e[h+_]||S!==e[m+_]){l=!0;break}}}if(l){if(a!==o){t[o]=t[a];let f=a*i,h=o*i;for(let m=0;m!==i;++m)e[h+m]=e[f+m]}++o}}if(r>0){t[o]=t[r];for(let a=r*i,l=o*i,c=0;c!==i;++c)e[l+c]=e[a+c];++o}return o!==t.length?(this.times=t.slice(0,o),this.values=e.slice(0,o*i)):(this.times=t,this.values=e),this}clone(){let t=this.times.slice(),e=this.values.slice(),i=this.constructor,s=new i(this.name,t,e);return s.createInterpolant=this.createInterpolant,Jf(this.settings)&&(s.settings={inTangents:this.settings.inTangents.slice(),outTangents:this.settings.outTangents.slice()}),s}};function T0(n,t){for(let e=0,i=n.length;e!==i;e+=2)n[e]*=t}bn.prototype.ValueTypeName="";bn.prototype.TimeBufferType=Float32Array;bn.prototype.ValueBufferType=Float32Array;bn.prototype.DefaultInterpolation=Al;var rs=class extends bn{constructor(t,e,i){super(t,e,i)}};rs.prototype.ValueTypeName="bool";rs.prototype.ValueBufferType=Array;rs.prototype.DefaultInterpolation=Ko;rs.prototype.InterpolantFactoryMethodLinear=void 0;rs.prototype.InterpolantFactoryMethodSmooth=void 0;var Wl=class extends bn{constructor(t,e,i,s){super(t,e,i,s)}};Wl.prototype.ValueTypeName="color";var $l=class extends bn{constructor(t,e,i,s){super(t,e,i,s)}};$l.prototype.ValueTypeName="number";var Xl=class extends ss{constructor(t,e,i,s){super(t,e,i,s)}interpolate_(t,e,i,s){let r=this.resultBuffer,o=this.sampleValues,a=this.valueSize,l=(i-e)/(s-e),c=t*a;for(let u=c+a;c!==u;c+=4)li.slerpFlat(r,0,o,c-a,o,c,l);return r}},ma=class extends bn{constructor(t,e,i,s){super(t,e,i,s)}InterpolantFactoryMethodLinear(t){return new Xl(this.times,this.values,this.getValueSize(),t)}};ma.prototype.ValueTypeName="quaternion";ma.prototype.InterpolantFactoryMethodSmooth=void 0;var os=class extends bn{constructor(t,e,i){super(t,e,i)}};os.prototype.ValueTypeName="string";os.prototype.ValueBufferType=Array;os.prototype.DefaultInterpolation=Ko;os.prototype.InterpolantFactoryMethodLinear=void 0;os.prototype.InterpolantFactoryMethodSmooth=void 0;var ql=class extends bn{constructor(t,e,i,s){super(t,e,i,s)}};ql.prototype.ValueTypeName="vector";var Yl=class{constructor(t,e,i){let s=this,r=!1,o=0,a=0,l,c=[];this.onStart=void 0,this.onLoad=t,this.onProgress=e,this.onError=i,this._abortController=null,this.itemStart=function(u){a++,r===!1&&s.onStart!==void 0&&s.onStart(u,o,a),r=!0},this.itemEnd=function(u){o++,s.onProgress!==void 0&&s.onProgress(u,o,a),o===a&&(r=!1,s.onLoad!==void 0&&s.onLoad())},this.itemError=function(u){s.onError!==void 0&&s.onError(u)},this.resolveURL=function(u){return u=u.normalize("NFC"),l?l(u):u},this.setURLModifier=function(u){return l=u,this},this.addHandler=function(u,f){return c.push(u,f),this},this.removeHandler=function(u){let f=c.indexOf(u);return f!==-1&&c.splice(f,2),this},this.getHandler=function(u){for(let f=0,h=c.length;f<h;f+=2){let m=c[f],_=c[f+1];if(m.global&&(m.lastIndex=0),m.test(u))return _}return null},this.abort=function(){return this.abortController.abort(),this._abortController=null,this}}get abortController(){return this._abortController||(this._abortController=new AbortController),this._abortController}},p_=new Yl,Zl=class{constructor(t){this.manager=t!==void 0?t:p_,this.crossOrigin="anonymous",this.withCredentials=!1,this.path="",this.resourcePath="",this.requestHeader={},typeof __THREE_DEVTOOLS__<"u"&&__THREE_DEVTOOLS__.dispatchEvent(new CustomEvent("observe",{detail:this}))}load(){}loadAsync(t,e){let i=this;return new Promise(function(s,r){i.load(t,s,e,r)})}parse(){}setCrossOrigin(t){return this.crossOrigin=t,this}setWithCredentials(t){return this.withCredentials=t,this}setPath(t){return this.path=t,this}setResourcePath(t){return this.resourcePath=t,this}setRequestHeader(t){return this.requestHeader=t,this}abort(){return this}};Zl.DEFAULT_MATERIAL_NAME="__DEFAULT";var dl=new W,pl=new li,ri=new W,ga=class extends yn{constructor(){super(),this.isCamera=!0,this.type="Camera",this.matrixWorldInverse=new Ce,this.projectionMatrix=new Ce,this.projectionMatrixInverse=new Ce,this.coordinateSystem=Xn,this._reversedDepth=!1}get reversedDepth(){return this._reversedDepth}copy(t,e){return super.copy(t,e),this.matrixWorldInverse.copy(t.matrixWorldInverse),this.projectionMatrix.copy(t.projectionMatrix),this.projectionMatrixInverse.copy(t.projectionMatrixInverse),this.coordinateSystem=t.coordinateSystem,this}getWorldDirection(t){return super.getWorldDirection(t).negate()}updateMatrixWorld(t){super.updateMatrixWorld(t),this.matrixWorld.decompose(dl,pl,ri),ri.x===1&&ri.y===1&&ri.z===1?this.matrixWorldInverse.copy(this.matrixWorld).invert():this.matrixWorldInverse.compose(dl,pl,ri.set(1,1,1)).invert()}updateWorldMatrix(t,e,i=!1){super.updateWorldMatrix(t,e,i),this.matrixWorld.decompose(dl,pl,ri),ri.x===1&&ri.y===1&&ri.z===1?this.matrixWorldInverse.copy(this.matrixWorld).invert():this.matrixWorldInverse.compose(dl,pl,ri.set(1,1,1)).invert()}clone(){return new this.constructor().copy(this)}},Qi=new W,w0=new re,E0=new re,je=class extends ga{constructor(t=50,e=1,i=.1,s=2e3){super(),this.isPerspectiveCamera=!0,this.type="PerspectiveCamera",this.fov=t,this.zoom=1,this.near=i,this.far=s,this.focus=10,this.aspect=e,this.view=null,this.filmGauge=35,this.filmOffset=0,this.updateProjectionMatrix()}copy(t,e){return super.copy(t,e),this.fov=t.fov,this.zoom=t.zoom,this.near=t.near,this.far=t.far,this.focus=t.focus,this.aspect=t.aspect,this.view=t.view===null?null:Object.assign({},t.view),this.filmGauge=t.filmGauge,this.filmOffset=t.filmOffset,this}setFocalLength(t){let e=.5*this.getFilmHeight()/t;this.fov=Cl*2*Math.atan(e),this.updateProjectionMatrix()}getFocalLength(){let t=Math.tan(_l*.5*this.fov);return .5*this.getFilmHeight()/t}getEffectiveFOV(){return Cl*2*Math.atan(Math.tan(_l*.5*this.fov)/this.zoom)}getFilmWidth(){return this.filmGauge*Math.min(this.aspect,1)}getFilmHeight(){return this.filmGauge/Math.max(this.aspect,1)}getViewBounds(t,e,i){Qi.set(-1,-1,.5).applyMatrix4(this.projectionMatrixInverse),e.set(Qi.x,Qi.y).multiplyScalar(-t/Qi.z),Qi.set(1,1,.5).applyMatrix4(this.projectionMatrixInverse),i.set(Qi.x,Qi.y).multiplyScalar(-t/Qi.z)}getViewSize(t,e){return this.getViewBounds(t,w0,E0),e.subVectors(E0,w0)}setViewOffset(t,e,i,s,r,o){this.aspect=t/e,this.view===null&&(this.view={enabled:!0,fullWidth:1,fullHeight:1,offsetX:0,offsetY:0,width:1,height:1}),this.view.enabled=!0,this.view.fullWidth=t,this.view.fullHeight=e,this.view.offsetX=i,this.view.offsetY=s,this.view.width=r,this.view.height=o,this.updateProjectionMatrix()}clearViewOffset(){this.view!==null&&(this.view.enabled=!1),this.updateProjectionMatrix()}updateProjectionMatrix(){let t=this.near,e=t*Math.tan(_l*.5*this.fov)/this.zoom,i=2*e,s=this.aspect*i,r=-.5*s,o=this.view;if(this.view!==null&&this.view.enabled){let l=o.fullWidth,c=o.fullHeight;r+=o.offsetX*s/l,e-=o.offsetY*i/c,s*=o.width/l,i*=o.height/c}let a=this.filmOffset;a!==0&&(r+=t*a/this.getFilmWidth()),this.projectionMatrix.makePerspective(r,r+s,e,e-i,t,this.far,this.coordinateSystem,this.reversedDepth),this.projectionMatrixInverse.copy(this.projectionMatrix).invert()}toJSON(t){let e=super.toJSON(t);return e.object.fov=this.fov,e.object.zoom=this.zoom,e.object.near=this.near,e.object.far=this.far,e.object.focus=this.focus,e.object.aspect=this.aspect,this.view!==null&&(e.object.view=Object.assign({},this.view)),e.object.filmGauge=this.filmGauge,e.object.filmOffset=this.filmOffset,e}};var _a=class extends ga{constructor(t=-1,e=1,i=1,s=-1,r=.1,o=2e3){super(),this.isOrthographicCamera=!0,this.type="OrthographicCamera",this.zoom=1,this.view=null,this.left=t,this.right=e,this.top=i,this.bottom=s,this.near=r,this.far=o,this.updateProjectionMatrix()}copy(t,e){return super.copy(t,e),this.left=t.left,this.right=t.right,this.top=t.top,this.bottom=t.bottom,this.near=t.near,this.far=t.far,this.zoom=t.zoom,this.view=t.view===null?null:Object.assign({},t.view),this}setViewOffset(t,e,i,s,r,o){this.view===null&&(this.view={enabled:!0,fullWidth:1,fullHeight:1,offsetX:0,offsetY:0,width:1,height:1}),this.view.enabled=!0,this.view.fullWidth=t,this.view.fullHeight=e,this.view.offsetX=i,this.view.offsetY=s,this.view.width=r,this.view.height=o,this.updateProjectionMatrix()}clearViewOffset(){this.view!==null&&(this.view.enabled=!1),this.updateProjectionMatrix()}updateProjectionMatrix(){let t=(this.right-this.left)/(2*this.zoom),e=(this.top-this.bottom)/(2*this.zoom),i=(this.right+this.left)/2,s=(this.top+this.bottom)/2,r=i-t,o=i+t,a=s+e,l=s-e;if(this.view!==null&&this.view.enabled){let c=(this.right-this.left)/this.view.fullWidth/this.zoom,u=(this.top-this.bottom)/this.view.fullHeight/this.zoom;r+=c*this.view.offsetX,o=r+c*this.view.width,a-=u*this.view.offsetY,l=a-u*this.view.height}this.projectionMatrix.makeOrthographic(r,o,a,l,this.near,this.far,this.coordinateSystem,this.reversedDepth),this.projectionMatrixInverse.copy(this.projectionMatrix).invert()}toJSON(t){let e=super.toJSON(t);return e.object.zoom=this.zoom,e.object.left=this.left,e.object.right=this.right,e.object.top=this.top,e.object.bottom=this.bottom,e.object.near=this.near,e.object.far=this.far,this.view!==null&&(e.object.view=Object.assign({},this.view)),e}};var Nr=-90,Ur=1,Kl=class extends yn{constructor(t,e,i){super(),this.type="CubeCamera",this.renderTarget=i,this.coordinateSystem=null,this.activeMipmapLevel=0;let s=new je(Nr,Ur,t,e);s.layers=this.layers,this.add(s);let r=new je(Nr,Ur,t,e);r.layers=this.layers,this.add(r);let o=new je(Nr,Ur,t,e);o.layers=this.layers,this.add(o);let a=new je(Nr,Ur,t,e);a.layers=this.layers,this.add(a);let l=new je(Nr,Ur,t,e);l.layers=this.layers,this.add(l);let c=new je(Nr,Ur,t,e);c.layers=this.layers,this.add(c)}updateCoordinateSystem(){let t=this.coordinateSystem,e=this.children.concat(),[i,s,r,o,a,l]=e;for(let c of e)this.remove(c);if(t===Xn)i.up.set(0,1,0),i.lookAt(1,0,0),s.up.set(0,1,0),s.lookAt(-1,0,0),r.up.set(0,0,-1),r.lookAt(0,1,0),o.up.set(0,0,1),o.lookAt(0,-1,0),a.up.set(0,1,0),a.lookAt(0,0,1),l.up.set(0,1,0),l.lookAt(0,0,-1);else if(t===Qo)i.up.set(0,-1,0),i.lookAt(-1,0,0),s.up.set(0,-1,0),s.lookAt(1,0,0),r.up.set(0,0,1),r.lookAt(0,1,0),o.up.set(0,0,-1),o.lookAt(0,-1,0),a.up.set(0,-1,0),a.lookAt(0,0,1),l.up.set(0,-1,0),l.lookAt(0,0,-1);else throw new Error("THREE.CubeCamera.updateCoordinateSystem(): Invalid coordinate system: "+t);for(let c of e)this.add(c),c.updateMatrixWorld()}update(t,e){this.parent===null&&this.updateMatrixWorld();let{renderTarget:i,activeMipmapLevel:s}=this;this.coordinateSystem!==t.coordinateSystem&&(this.coordinateSystem=t.coordinateSystem,this.updateCoordinateSystem());let[r,o,a,l,c,u]=this.children,f=t.getRenderTarget(),h=t.getActiveCubeFace(),m=t.getActiveMipmapLevel(),_=t.xr.enabled;t.xr.enabled=!1;let S=i.texture.generateMipmaps;i.texture.generateMipmaps=!1;let p=!1;t.isWebGLRenderer===!0?p=t.state.buffers.depth.getReversed():p=t.reversedDepthBuffer,t.setRenderTarget(i,0,s),p&&t.autoClear===!1&&t.clearDepth(),t.render(e,r),t.setRenderTarget(i,1,s),p&&t.autoClear===!1&&t.clearDepth(),t.render(e,o),t.setRenderTarget(i,2,s),p&&t.autoClear===!1&&t.clearDepth(),t.render(e,a),t.setRenderTarget(i,3,s),p&&t.autoClear===!1&&t.clearDepth(),t.render(e,l),t.setRenderTarget(i,4,s),p&&t.autoClear===!1&&t.clearDepth(),t.render(e,c),i.texture.generateMipmaps=S,t.setRenderTarget(i,5,s),p&&t.autoClear===!1&&t.clearDepth(),t.render(e,u),t.setRenderTarget(f,h,m),t.xr.enabled=_,i.texture.needsPMREMUpdate=!0}},Jl=class extends je{constructor(t=[]){super(),this.isArrayCamera=!0,this.isMultiViewCamera=!1,this.cameras=t}};var Pd="\\[\\]\\.:\\/",vS=new RegExp("["+Pd+"]","g"),Id="[^"+Pd+"]",SS="[^"+Pd.replace("\\.","")+"]",bS=/((?:WC+[\/:])*)/.source.replace("WC",Id),MS=/(WCOD+)?/.source.replace("WCOD",SS),TS=/(?:\.(WC+)(?:\[(.+)\])?)?/.source.replace("WC",Id),wS=/\.(WC+)(?:\[(.+)\])?/.source.replace("WC",Id),ES=new RegExp("^"+bS+MS+TS+wS+"$"),AS=["material","materials","bones","map"],nd=class{constructor(t,e,i){let s=i||xe.parseTrackName(e);this._targetGroup=t,this._bindings=t.subscribe_(e,s)}getValue(t,e){this.bind();let i=this._targetGroup.nCachedObjects_,s=this._bindings[i];s!==void 0&&s.getValue(t,e)}setValue(t,e){let i=this._bindings;for(let s=this._targetGroup.nCachedObjects_,r=i.length;s!==r;++s)i[s].setValue(t,e)}bind(){let t=this._bindings;for(let e=this._targetGroup.nCachedObjects_,i=t.length;e!==i;++e)t[e].bind()}unbind(){let t=this._bindings;for(let e=this._targetGroup.nCachedObjects_,i=t.length;e!==i;++e)t[e].unbind()}},xe=class n{constructor(t,e,i){this.path=e,this.parsedPath=i||n.parseTrackName(e),this.node=n.findNode(t,this.parsedPath.nodeName),this.rootNode=t,this.getValue=this._getValue_unbound,this.setValue=this._setValue_unbound}static create(t,e,i){return t&&t.isAnimationObjectGroup?new n.Composite(t,e,i):new n(t,e,i)}static sanitizeNodeName(t){return t.replace(/\s/g,"_").replace(vS,"")}static parseTrackName(t){let e=ES.exec(t);if(e===null)throw new Error("THREE.PropertyBinding: Cannot parse trackName: "+t);let i={nodeName:e[2],objectName:e[3],objectIndex:e[4],propertyName:e[5],propertyIndex:e[6]},s=i.nodeName&&i.nodeName.lastIndexOf(".");if(s!==void 0&&s!==-1){let r=i.nodeName.substring(s+1);AS.indexOf(r)!==-1&&(i.nodeName=i.nodeName.substring(0,s),i.objectName=r)}if(i.propertyName===null||i.propertyName.length===0)throw new Error("THREE.PropertyBinding: can not parse propertyName from trackName: "+t);return i}static findNode(t,e){if(e===void 0||e===""||e==="."||e===-1||e===t.name||e===t.uuid)return t;if(t.skeleton){let i=t.skeleton.getBoneByName(e);if(i!==void 0)return i}if(t.children){let i=function(r){for(let o=0;o<r.length;o++){let a=r[o];if(a.name===e||a.uuid===e)return a;let l=i(a.children);if(l)return l}return null},s=i(t.children);if(s)return s}return null}_getValue_unavailable(){}_setValue_unavailable(){}_getValue_direct(t,e){t[e]=this.targetObject[this.propertyName]}_getValue_array(t,e){let i=this.resolvedProperty;for(let s=0,r=i.length;s!==r;++s)t[e++]=i[s]}_getValue_arrayElement(t,e){t[e]=this.resolvedProperty[this.propertyIndex]}_getValue_toArray(t,e){this.resolvedProperty.toArray(t,e)}_setValue_direct(t,e){this.targetObject[this.propertyName]=t[e]}_setValue_direct_setNeedsUpdate(t,e){this.targetObject[this.propertyName]=t[e],this.targetObject.needsUpdate=!0}_setValue_direct_setMatrixWorldNeedsUpdate(t,e){this.targetObject[this.propertyName]=t[e],this.targetObject.matrixWorldNeedsUpdate=!0}_setValue_array(t,e){let i=this.resolvedProperty;for(let s=0,r=i.length;s!==r;++s)i[s]=t[e++]}_setValue_array_setNeedsUpdate(t,e){let i=this.resolvedProperty;for(let s=0,r=i.length;s!==r;++s)i[s]=t[e++];this.targetObject.needsUpdate=!0}_setValue_array_setMatrixWorldNeedsUpdate(t,e){let i=this.resolvedProperty;for(let s=0,r=i.length;s!==r;++s)i[s]=t[e++];this.targetObject.matrixWorldNeedsUpdate=!0}_setValue_arrayElement(t,e){this.resolvedProperty[this.propertyIndex]=t[e]}_setValue_arrayElement_setNeedsUpdate(t,e){this.resolvedProperty[this.propertyIndex]=t[e],this.targetObject.needsUpdate=!0}_setValue_arrayElement_setMatrixWorldNeedsUpdate(t,e){this.resolvedProperty[this.propertyIndex]=t[e],this.targetObject.matrixWorldNeedsUpdate=!0}_setValue_fromArray(t,e){this.resolvedProperty.fromArray(t,e)}_setValue_fromArray_setNeedsUpdate(t,e){this.resolvedProperty.fromArray(t,e),this.targetObject.needsUpdate=!0}_setValue_fromArray_setMatrixWorldNeedsUpdate(t,e){this.resolvedProperty.fromArray(t,e),this.targetObject.matrixWorldNeedsUpdate=!0}_getValue_unbound(t,e){this.bind(),this.getValue(t,e)}_setValue_unbound(t,e){this.bind(),this.setValue(t,e)}bind(){let t=this.node,e=this.parsedPath,i=e.objectName,s=e.propertyName,r=e.propertyIndex;if(t||(t=n.findNode(this.rootNode,e.nodeName),this.node=t),this.getValue=this._getValue_unavailable,this.setValue=this._setValue_unavailable,!t){Dt("PropertyBinding: No target node found for track: "+this.path+".");return}if(i){let c=e.objectIndex;switch(i){case"materials":if(!t.material){Bt("PropertyBinding: Can not bind to material as node does not have a material.",this);return}if(!t.material.materials){Bt("PropertyBinding: Can not bind to material.materials as node.material does not have a materials array.",this);return}t=t.material.materials;break;case"bones":if(!t.skeleton){Bt("PropertyBinding: Can not bind to bones as node does not have a skeleton.",this);return}t=t.skeleton.bones;for(let u=0;u<t.length;u++)if(t[u].name===c){c=u;break}break;case"map":if("map"in t){t=t.map;break}if(!t.material){Bt("PropertyBinding: Can not bind to material as node does not have a material.",this);return}if(!t.material.map){Bt("PropertyBinding: Can not bind to material.map as node.material does not have a map.",this);return}t=t.material.map;break;default:if(t[i]===void 0){Bt("PropertyBinding: Can not bind to objectName of node undefined.",this);return}t=t[i]}if(c!==void 0){if(t[c]===void 0){Bt("PropertyBinding: Trying to bind to objectIndex of objectName, but is undefined.",this,t);return}t=t[c]}}let o=t[s];if(o===void 0){let c=e.nodeName;Bt("PropertyBinding: Trying to update property for track: "+c+"."+s+" but it wasn't found.",t);return}let a=this.Versioning.None;this.targetObject=t,t.isMaterial===!0?a=this.Versioning.NeedsUpdate:t.isObject3D===!0&&(a=this.Versioning.MatrixWorldNeedsUpdate);let l=this.BindingType.Direct;if(r!==void 0){if(s==="morphTargetInfluences"){if(!t.geometry){Bt("PropertyBinding: Can not bind to morphTargetInfluences because node does not have a geometry.",this);return}if(!t.geometry.morphAttributes){Bt("PropertyBinding: Can not bind to morphTargetInfluences because node does not have a geometry.morphAttributes.",this);return}t.morphTargetDictionary[r]!==void 0&&(r=t.morphTargetDictionary[r])}l=this.BindingType.ArrayElement,this.resolvedProperty=o,this.propertyIndex=r}else o.fromArray!==void 0&&o.toArray!==void 0?(l=this.BindingType.HasFromToArray,this.resolvedProperty=o):Array.isArray(o)?(l=this.BindingType.EntireArray,this.resolvedProperty=o):this.propertyName=s;this.getValue=this.GetterByBindingType[l],this.setValue=this.SetterByBindingTypeAndVersioning[l][a]}unbind(){this.node=null,this.getValue=this._getValue_unbound,this.setValue=this._setValue_unbound}};xe.Composite=nd;xe.prototype.BindingType={Direct:0,EntireArray:1,ArrayElement:2,HasFromToArray:3};xe.prototype.Versioning={None:0,NeedsUpdate:1,MatrixWorldNeedsUpdate:2};xe.prototype.GetterByBindingType=[xe.prototype._getValue_direct,xe.prototype._getValue_array,xe.prototype._getValue_arrayElement,xe.prototype._getValue_toArray];xe.prototype.SetterByBindingTypeAndVersioning=[[xe.prototype._setValue_direct,xe.prototype._setValue_direct_setNeedsUpdate,xe.prototype._setValue_direct_setMatrixWorldNeedsUpdate],[xe.prototype._setValue_array,xe.prototype._setValue_array_setNeedsUpdate,xe.prototype._setValue_array_setMatrixWorldNeedsUpdate],[xe.prototype._setValue_arrayElement,xe.prototype._setValue_arrayElement_setNeedsUpdate,xe.prototype._setValue_arrayElement_setMatrixWorldNeedsUpdate],[xe.prototype._setValue_fromArray,xe.prototype._setValue_fromArray_setNeedsUpdate,xe.prototype._setValue_fromArray_setMatrixWorldNeedsUpdate]];var qU=new Float32Array(1);var id=class n{static{n.prototype.isMatrix2=!0}constructor(t,e,i,s){this.elements=[1,0,0,1],t!==void 0&&this.set(t,e,i,s)}identity(){return this.set(1,0,0,1),this}fromArray(t,e=0){for(let i=0;i<4;i++)this.elements[i]=t[i+e];return this}set(t,e,i,s){let r=this.elements;return r[0]=t,r[2]=e,r[1]=i,r[3]=s,this}};function Ld(n,t,e,i){let s=CS(i);switch(e){case Md:return n*t;case wd:return n*t/s.components*s.byteLength;case su:return n*t/s.components*s.byteLength;case hs:return n*t*2/s.components*s.byteLength;case ru:return n*t*2/s.components*s.byteLength;case Td:return n*t*3/s.components*s.byteLength;case Ln:return n*t*4/s.components*s.byteLength;case ou:return n*t*4/s.components*s.byteLength;case Sa:case ba:return Math.floor((n+3)/4)*Math.floor((t+3)/4)*8;case Ma:case Ta:return Math.floor((n+3)/4)*Math.floor((t+3)/4)*16;case cu:case uu:return Math.max(n,16)*Math.max(t,8)/4;case au:case lu:return Math.max(n,8)*Math.max(t,8)/2;case hu:case fu:case pu:case mu:return Math.floor((n+3)/4)*Math.floor((t+3)/4)*8;case du:case wa:case gu:return Math.floor((n+3)/4)*Math.floor((t+3)/4)*16;case _u:return Math.floor((n+3)/4)*Math.floor((t+3)/4)*16;case xu:return Math.floor((n+4)/5)*Math.floor((t+3)/4)*16;case yu:return Math.floor((n+4)/5)*Math.floor((t+4)/5)*16;case vu:return Math.floor((n+5)/6)*Math.floor((t+4)/5)*16;case Su:return Math.floor((n+5)/6)*Math.floor((t+5)/6)*16;case bu:return Math.floor((n+7)/8)*Math.floor((t+4)/5)*16;case Mu:return Math.floor((n+7)/8)*Math.floor((t+5)/6)*16;case Tu:return Math.floor((n+7)/8)*Math.floor((t+7)/8)*16;case wu:return Math.floor((n+9)/10)*Math.floor((t+4)/5)*16;case Eu:return Math.floor((n+9)/10)*Math.floor((t+5)/6)*16;case Au:return Math.floor((n+9)/10)*Math.floor((t+7)/8)*16;case Cu:return Math.floor((n+9)/10)*Math.floor((t+9)/10)*16;case Ru:return Math.floor((n+11)/12)*Math.floor((t+9)/10)*16;case Pu:return Math.floor((n+11)/12)*Math.floor((t+11)/12)*16;case Iu:case Lu:case Nu:return Math.ceil(n/4)*Math.ceil(t/4)*16;case Uu:case Du:return Math.ceil(n/4)*Math.ceil(t/4)*8;case Ea:case Ou:return Math.ceil(n/4)*Math.ceil(t/4)*16}throw new Error(`Unable to determine texture byte length for ${e} format.`)}function CS(n){switch(n){case Mn:case yd:return{byteLength:1,components:1};case Wr:case vd:case Kn:return{byteLength:2,components:1};case nu:case iu:return{byteLength:2,components:4};case Yn:case eu:case Zn:return{byteLength:4,components:1};case Sd:case bd:return{byteLength:4,components:3}}throw new Error(`THREE.TextureUtils: Unknown texture type ${n}.`)}typeof __THREE_DEVTOOLS__<"u"&&__THREE_DEVTOOLS__.dispatchEvent(new CustomEvent("register",{detail:{revision:"186"}}));typeof window<"u"&&(window.__THREE__?Dt("WARNING: Multiple instances of Three.js being imported."):window.__THREE__="186");function O_(){let n=null,t=!1,e=null,i=null;function s(r,o){i=n.requestAnimationFrame(s),e(r,o)}return{start:function(){t!==!0&&e!==null&&n!==null&&(i=n.requestAnimationFrame(s),t=!0)},stop:function(){n!==null&&n.cancelAnimationFrame(i),t=!1},setAnimationLoop:function(r){e=r},setContext:function(r){n=r}}}function PS(n){let t=new WeakMap;function e(a,l){let c=a.array,u=a.usage,f=c.byteLength,h=n.createBuffer();n.bindBuffer(l,h),n.bufferData(l,c,u),a.onUploadCallback();let m;if(c instanceof Float32Array)m=n.FLOAT;else if(typeof Float16Array<"u"&&c instanceof Float16Array)m=n.HALF_FLOAT;else if(c instanceof Uint16Array)a.isFloat16BufferAttribute?m=n.HALF_FLOAT:m=n.UNSIGNED_SHORT;else if(c instanceof Int16Array)m=n.SHORT;else if(c instanceof Uint32Array)m=n.UNSIGNED_INT;else if(c instanceof Int32Array)m=n.INT;else if(c instanceof Int8Array)m=n.BYTE;else if(c instanceof Uint8Array)m=n.UNSIGNED_BYTE;else if(c instanceof Uint8ClampedArray)m=n.UNSIGNED_BYTE;else throw new Error("THREE.WebGLAttributes: Unsupported buffer data format: "+c);return{buffer:h,type:m,bytesPerElement:c.BYTES_PER_ELEMENT,version:a.version,size:f}}function i(a,l,c){let u=l.array,f=l.updateRanges;if(n.bindBuffer(c,a),f.length===0)n.bufferSubData(c,0,u);else{f.sort((m,_)=>m.start-_.start);let h=0;for(let m=1;m<f.length;m++){let _=f[h],S=f[m];S.start<=_.start+_.count+1?_.count=Math.max(_.count,S.start+S.count-_.start):(++h,f[h]=S)}f.length=h+1;for(let m=0,_=f.length;m<_;m++){let S=f[m];n.bufferSubData(c,S.start*u.BYTES_PER_ELEMENT,u,S.start,S.count)}l.clearUpdateRanges()}l.onUploadCallback()}function s(a){return a.isInterleavedBufferAttribute&&(a=a.data),t.get(a)}function r(a){a.isInterleavedBufferAttribute&&(a=a.data);let l=t.get(a);l&&(n.deleteBuffer(l.buffer),t.delete(a))}function o(a,l){if(a.isInterleavedBufferAttribute&&(a=a.data),a.isGLBufferAttribute){let u=t.get(a);(!u||u.version<a.version)&&t.set(a,{buffer:a.buffer,type:a.type,bytesPerElement:a.elementSize,version:a.version});return}let c=t.get(a);if(c===void 0)t.set(a,e(a,l));else if(c.version<a.version){if(c.size!==a.array.byteLength)throw new Error("THREE.WebGLAttributes: The size of the buffer attribute's array buffer does not match the original size. Resizing buffer attributes is not supported.");i(c.buffer,a,l),c.version=a.version}}return{get:s,remove:r,update:o}}var IS=`#ifdef USE_ALPHAHASH
	if ( diffuseColor.a < getAlphaHashThreshold( vPosition ) ) discard;
#endif`,LS=`#ifdef USE_ALPHAHASH
	const float ALPHA_HASH_SCALE = 0.05;
	float hash2D( vec2 value ) {
		return fract( 1.0e4 * sin( 17.0 * value.x + 0.1 * value.y ) * ( 0.1 + abs( sin( 13.0 * value.y + value.x ) ) ) );
	}
	float hash3D( vec3 value ) {
		return hash2D( vec2( hash2D( value.xy ), value.z ) );
	}
	float getAlphaHashThreshold( vec3 position ) {
		float maxDeriv = max(
			length( dFdx( position.xyz ) ),
			length( dFdy( position.xyz ) )
		);
		float pixScale = 1.0 / ( ALPHA_HASH_SCALE * maxDeriv );
		vec2 pixScales = vec2(
			exp2( floor( log2( pixScale ) ) ),
			exp2( ceil( log2( pixScale ) ) )
		);
		vec2 alpha = vec2(
			hash3D( floor( pixScales.x * position.xyz ) ),
			hash3D( floor( pixScales.y * position.xyz ) )
		);
		float lerpFactor = fract( log2( pixScale ) );
		float x = ( 1.0 - lerpFactor ) * alpha.x + lerpFactor * alpha.y;
		float a = min( lerpFactor, 1.0 - lerpFactor );
		vec3 cases = vec3(
			x * x / ( 2.0 * a * ( 1.0 - a ) ),
			( x - 0.5 * a ) / ( 1.0 - a ),
			1.0 - ( ( 1.0 - x ) * ( 1.0 - x ) / ( 2.0 * a * ( 1.0 - a ) ) )
		);
		float threshold = ( x < ( 1.0 - a ) )
			? ( ( x < a ) ? cases.x : cases.y )
			: cases.z;
		return clamp( threshold , 1.0e-6, 1.0 );
	}
#endif`,NS=`#ifdef USE_ALPHAMAP
	diffuseColor.a *= texture2D( alphaMap, vAlphaMapUv ).g;
#endif`,US=`#ifdef USE_ALPHAMAP
	uniform sampler2D alphaMap;
#endif`,DS=`#ifdef USE_ALPHATEST
	#ifdef ALPHA_TO_COVERAGE
	diffuseColor.a = smoothstep( alphaTest, alphaTest + fwidth( diffuseColor.a ), diffuseColor.a );
	if ( diffuseColor.a == 0.0 ) discard;
	#else
	if ( diffuseColor.a < alphaTest ) discard;
	#endif
#endif`,OS=`#ifdef USE_ALPHATEST
	uniform float alphaTest;
#endif`,FS=`#ifdef USE_AOMAP
	float ambientOcclusion = ( texture2D( aoMap, vAoMapUv ).r - 1.0 ) * aoMapIntensity + 1.0;
	reflectedLight.indirectDiffuse *= ambientOcclusion;
	#if defined( USE_CLEARCOAT ) 
		clearcoatSpecularIndirect *= ambientOcclusion;
	#endif
	#if defined( USE_SHEEN ) 
		sheenSpecularIndirect *= ambientOcclusion;
	#endif
	#if defined( USE_ENVMAP ) && defined( STANDARD )
		float dotNV = saturate( dot( geometryNormal, geometryViewDir ) );
		reflectedLight.indirectSpecular *= computeSpecularOcclusion( dotNV, ambientOcclusion, material.roughness );
	#endif
#endif`,BS=`#ifdef USE_AOMAP
	uniform sampler2D aoMap;
	uniform float aoMapIntensity;
#endif`,kS=`#ifdef USE_BATCHING
	#if ! defined( GL_ANGLE_multi_draw )
	#define gl_DrawID _gl_DrawID
	uniform int _gl_DrawID;
	#endif
	uniform highp sampler2D batchingTexture;
	uniform highp usampler2D batchingIdTexture;
	mat4 getBatchingMatrix( const in float i ) {
		int size = textureSize( batchingTexture, 0 ).x;
		int j = int( i ) * 4;
		int x = j % size;
		int y = j / size;
		vec4 v1 = texelFetch( batchingTexture, ivec2( x, y ), 0 );
		vec4 v2 = texelFetch( batchingTexture, ivec2( x + 1, y ), 0 );
		vec4 v3 = texelFetch( batchingTexture, ivec2( x + 2, y ), 0 );
		vec4 v4 = texelFetch( batchingTexture, ivec2( x + 3, y ), 0 );
		return mat4( v1, v2, v3, v4 );
	}
	float getIndirectIndex( const in int i ) {
		int size = textureSize( batchingIdTexture, 0 ).x;
		int x = i % size;
		int y = i / size;
		return float( texelFetch( batchingIdTexture, ivec2( x, y ), 0 ).r );
	}
#endif
#ifdef USE_BATCHING_COLOR
	uniform sampler2D batchingColorTexture;
	vec4 getBatchingColor( const in float i ) {
		int size = textureSize( batchingColorTexture, 0 ).x;
		int j = int( i );
		int x = j % size;
		int y = j / size;
		return texelFetch( batchingColorTexture, ivec2( x, y ), 0 );
	}
#endif`,VS=`#ifdef USE_BATCHING
	mat4 batchingMatrix = getBatchingMatrix( getIndirectIndex( gl_DrawID ) );
#endif`,zS=`vec3 transformed = vec3( position );
#ifdef USE_ALPHAHASH
	vPosition = vec3( position );
#endif`,GS=`vec3 objectNormal = vec3( normal );
#ifdef USE_TANGENT
	vec3 objectTangent = vec3( tangent.xyz );
#endif`,HS=`float G_BlinnPhong_Implicit( ) {
	return 0.25;
}
float D_BlinnPhong( const in float shininess, const in float dotNH ) {
	return RECIPROCAL_PI * ( shininess * 0.5 + 1.0 ) * pow( dotNH, shininess );
}
vec3 BRDF_BlinnPhong( const in vec3 lightDir, const in vec3 viewDir, const in vec3 normal, const in vec3 specularColor, const in float shininess ) {
	vec3 halfDir = normalize( lightDir + viewDir );
	float dotNH = saturate( dot( normal, halfDir ) );
	float dotVH = saturate( dot( viewDir, halfDir ) );
	vec3 F = F_Schlick( specularColor, 1.0, dotVH );
	float G = G_BlinnPhong_Implicit( );
	float D = D_BlinnPhong( shininess, dotNH );
	return F * ( G * D );
} // validated`,WS=`#ifdef USE_IRIDESCENCE
	const mat3 XYZ_TO_REC709 = mat3(
		 3.2404542, -0.9692660,  0.0556434,
		-1.5371385,  1.8760108, -0.2040259,
		-0.4985314,  0.0415560,  1.0572252
	);
	vec3 Fresnel0ToIor( vec3 fresnel0 ) {
		vec3 sqrtF0 = sqrt( fresnel0 );
		return ( vec3( 1.0 ) + sqrtF0 ) / ( vec3( 1.0 ) - sqrtF0 );
	}
	vec3 IorToFresnel0( vec3 transmittedIor, float incidentIor ) {
		return pow2( ( transmittedIor - vec3( incidentIor ) ) / ( transmittedIor + vec3( incidentIor ) ) );
	}
	float IorToFresnel0( float transmittedIor, float incidentIor ) {
		return pow2( ( transmittedIor - incidentIor ) / ( transmittedIor + incidentIor ));
	}
	vec3 evalSensitivity( float OPD, vec3 shift ) {
		float phase = 2.0 * PI * OPD * 1.0e-9;
		vec3 val = vec3( 5.4856e-13, 4.4201e-13, 5.2481e-13 );
		vec3 pos = vec3( 1.6810e+06, 1.7953e+06, 2.2084e+06 );
		vec3 var = vec3( 4.3278e+09, 9.3046e+09, 6.6121e+09 );
		vec3 xyz = val * sqrt( 2.0 * PI * var ) * cos( pos * phase + shift ) * exp( - pow2( phase ) * var );
		xyz.x += 9.7470e-14 * sqrt( 2.0 * PI * 4.5282e+09 ) * cos( 2.2399e+06 * phase + shift[ 0 ] ) * exp( - 4.5282e+09 * pow2( phase ) );
		xyz /= 1.0685e-7;
		vec3 rgb = XYZ_TO_REC709 * xyz;
		return rgb;
	}
	vec3 evalIridescence( float outsideIOR, float eta2, float cosTheta1, float thinFilmThickness, vec3 baseF0 ) {
		vec3 I;
		float iridescenceIOR = mix( outsideIOR, eta2, smoothstep( 0.0, 0.03, thinFilmThickness ) );
		float sinTheta2Sq = pow2( outsideIOR / iridescenceIOR ) * ( 1.0 - pow2( cosTheta1 ) );
		float cosTheta2Sq = 1.0 - sinTheta2Sq;
		if ( cosTheta2Sq < 0.0 ) {
			return vec3( 1.0 );
		}
		float cosTheta2 = sqrt( cosTheta2Sq );
		float R0 = IorToFresnel0( iridescenceIOR, outsideIOR );
		float R12 = F_Schlick( R0, 1.0, cosTheta1 );
		float T121 = 1.0 - R12;
		float phi12 = 0.0;
		if ( iridescenceIOR < outsideIOR ) phi12 = PI;
		float phi21 = PI - phi12;
		vec3 baseIOR = Fresnel0ToIor( clamp( baseF0, 0.0, 0.9999 ) );		vec3 R1 = IorToFresnel0( baseIOR, iridescenceIOR );
		vec3 R23 = F_Schlick( R1, 1.0, cosTheta2 );
		vec3 phi23 = vec3( 0.0 );
		if ( baseIOR[ 0 ] < iridescenceIOR ) phi23[ 0 ] = PI;
		if ( baseIOR[ 1 ] < iridescenceIOR ) phi23[ 1 ] = PI;
		if ( baseIOR[ 2 ] < iridescenceIOR ) phi23[ 2 ] = PI;
		float OPD = 2.0 * iridescenceIOR * thinFilmThickness * cosTheta2;
		vec3 phi = vec3( phi21 ) + phi23;
		vec3 R123 = clamp( R12 * R23, 1e-5, 0.9999 );
		vec3 r123 = sqrt( R123 );
		vec3 Rs = pow2( T121 ) * R23 / ( vec3( 1.0 ) - R123 );
		vec3 C0 = R12 + Rs;
		I = C0;
		vec3 Cm = Rs - T121;
		for ( int m = 1; m <= 2; ++ m ) {
			Cm *= r123;
			vec3 Sm = 2.0 * evalSensitivity( float( m ) * OPD, float( m ) * phi );
			I += Cm * Sm;
		}
		return max( I, vec3( 0.0 ) );
	}
#endif`,$S=`#ifdef USE_BUMPMAP
	uniform sampler2D bumpMap;
	uniform float bumpScale;
	vec2 dHdxy_fwd() {
		vec2 dSTdx = dFdx( vBumpMapUv );
		vec2 dSTdy = dFdy( vBumpMapUv );
		float Hll = bumpScale * texture2D( bumpMap, vBumpMapUv ).x;
		float dBx = bumpScale * texture2D( bumpMap, vBumpMapUv + dSTdx ).x - Hll;
		float dBy = bumpScale * texture2D( bumpMap, vBumpMapUv + dSTdy ).x - Hll;
		return vec2( dBx, dBy );
	}
	vec3 perturbNormalArb( vec3 surf_pos, vec3 surf_norm, vec2 dHdxy, float faceDirection ) {
		vec3 vSigmaX = normalize( dFdx( surf_pos.xyz ) );
		vec3 vSigmaY = normalize( dFdy( surf_pos.xyz ) );
		vec3 vN = surf_norm;
		vec3 R1 = cross( vSigmaY, vN );
		vec3 R2 = cross( vN, vSigmaX );
		float fDet = dot( vSigmaX, R1 ) * faceDirection;
		vec3 vGrad = sign( fDet ) * ( dHdxy.x * R1 + dHdxy.y * R2 );
		return normalize( abs( fDet ) * surf_norm - vGrad );
	}
#endif`,XS=`#if NUM_CLIPPING_PLANES > 0
	vec4 plane;
	#ifdef ALPHA_TO_COVERAGE
		float distanceToPlane, distanceGradient;
		float clipOpacity = 1.0;
		#pragma unroll_loop_start
		for ( int i = 0; i < UNION_CLIPPING_PLANES; i ++ ) {
			plane = clippingPlanes[ i ];
			distanceToPlane = - dot( vClipPosition, plane.xyz ) + plane.w;
			distanceGradient = fwidth( distanceToPlane ) / 2.0;
			clipOpacity *= smoothstep( - distanceGradient, distanceGradient, distanceToPlane );
			if ( clipOpacity == 0.0 ) discard;
		}
		#pragma unroll_loop_end
		#if UNION_CLIPPING_PLANES < NUM_CLIPPING_PLANES
			float unionClipOpacity = 1.0;
			#pragma unroll_loop_start
			for ( int i = UNION_CLIPPING_PLANES; i < NUM_CLIPPING_PLANES; i ++ ) {
				plane = clippingPlanes[ i ];
				distanceToPlane = - dot( vClipPosition, plane.xyz ) + plane.w;
				distanceGradient = fwidth( distanceToPlane ) / 2.0;
				unionClipOpacity *= 1.0 - smoothstep( - distanceGradient, distanceGradient, distanceToPlane );
			}
			#pragma unroll_loop_end
			clipOpacity *= 1.0 - unionClipOpacity;
		#endif
		diffuseColor.a *= clipOpacity;
		if ( diffuseColor.a == 0.0 ) discard;
	#else
		#pragma unroll_loop_start
		for ( int i = 0; i < UNION_CLIPPING_PLANES; i ++ ) {
			plane = clippingPlanes[ i ];
			if ( dot( vClipPosition, plane.xyz ) > plane.w ) discard;
		}
		#pragma unroll_loop_end
		#if UNION_CLIPPING_PLANES < NUM_CLIPPING_PLANES
			bool clipped = true;
			#pragma unroll_loop_start
			for ( int i = UNION_CLIPPING_PLANES; i < NUM_CLIPPING_PLANES; i ++ ) {
				plane = clippingPlanes[ i ];
				clipped = ( dot( vClipPosition, plane.xyz ) > plane.w ) && clipped;
			}
			#pragma unroll_loop_end
			if ( clipped ) discard;
		#endif
	#endif
#endif`,qS=`#if NUM_CLIPPING_PLANES > 0
	varying vec3 vClipPosition;
	uniform vec4 clippingPlanes[ NUM_CLIPPING_PLANES ];
#endif`,YS=`#if NUM_CLIPPING_PLANES > 0
	varying vec3 vClipPosition;
#endif`,ZS=`#if NUM_CLIPPING_PLANES > 0
	vClipPosition = - mvPosition.xyz;
#endif`,KS=`#if defined( USE_COLOR ) || defined( USE_COLOR_ALPHA )
	diffuseColor *= vColor;
#endif`,JS=`#if defined( USE_COLOR ) || defined( USE_COLOR_ALPHA )
	varying vec4 vColor;
#endif`,jS=`#if defined( USE_COLOR ) || defined( USE_COLOR_ALPHA ) || defined( USE_INSTANCING_COLOR ) || defined( USE_BATCHING_COLOR )
	varying vec4 vColor;
#endif`,QS=`#if defined( USE_COLOR ) || defined( USE_COLOR_ALPHA ) || defined( USE_INSTANCING_COLOR ) || defined( USE_BATCHING_COLOR )
	vColor = vec4( 1.0 );
#endif
#ifdef USE_COLOR_ALPHA
	vColor *= color;
#elif defined( USE_COLOR )
	vColor.rgb *= color;
#endif
#ifdef USE_INSTANCING_COLOR
	vColor.rgb *= instanceColor.rgb;
#endif
#ifdef USE_BATCHING_COLOR
	vColor *= getBatchingColor( getIndirectIndex( gl_DrawID ) );
#endif`,tb=`#define PI 3.141592653589793
#define PI2 6.283185307179586
#define PI_HALF 1.5707963267948966
#define RECIPROCAL_PI 0.3183098861837907
#define RECIPROCAL_PI2 0.15915494309189535
#define EPSILON 1e-6
#ifndef saturate
#define saturate( a ) clamp( a, 0.0, 1.0 )
#endif
#define whiteComplement( a ) ( 1.0 - saturate( a ) )
float pow2( const in float x ) { return x*x; }
vec3 pow2( const in vec3 x ) { return x*x; }
float pow3( const in float x ) { return x*x*x; }
float pow4( const in float x ) { float x2 = x*x; return x2*x2; }
float max3( const in vec3 v ) { return max( max( v.x, v.y ), v.z ); }
float average( const in vec3 v ) { return dot( v, vec3( 0.3333333 ) ); }
highp float rand( const in vec2 uv ) {
	const highp float a = 12.9898, b = 78.233, c = 43758.5453;
	highp float dt = dot( uv.xy, vec2( a,b ) ), sn = mod( dt, PI );
	return fract( sin( sn ) * c );
}
#ifdef HIGH_PRECISION
	float precisionSafeLength( vec3 v ) { return length( v ); }
#else
	float precisionSafeLength( vec3 v ) {
		float maxComponent = max3( abs( v ) );
		return length( v / maxComponent ) * maxComponent;
	}
#endif
struct IncidentLight {
	vec3 color;
	vec3 direction;
	bool visible;
};
struct ReflectedLight {
	vec3 directDiffuse;
	vec3 directSpecular;
	vec3 indirectDiffuse;
	vec3 indirectSpecular;
};
#ifdef USE_ALPHAHASH
	varying vec3 vPosition;
#endif
vec3 transformDirection( in vec3 dir, in mat4 matrix ) {
	return normalize( ( matrix * vec4( dir, 0.0 ) ).xyz );
}
#define inverseTransformDirection transformDirectionByInverseViewMatrix
vec3 transformNormalByInverseViewMatrix( in vec3 normal, in mat4 viewMatrix ) {
	return normalize( ( vec4( normal, 0.0 ) * viewMatrix ).xyz );
}
vec3 transformDirectionByInverseViewMatrix( in vec3 dir, in mat4 viewMatrix ) {
	return normalize( ( vec4( dir, 0.0 ) * viewMatrix ).xyz );
}
bool isPerspectiveMatrix( mat4 m ) {
	return m[ 2 ][ 3 ] == - 1.0;
}
vec2 equirectUv( in vec3 dir ) {
	float u = atan( dir.z, dir.x ) * RECIPROCAL_PI2 + 0.5;
	float v = asin( clamp( dir.y, - 1.0, 1.0 ) ) * RECIPROCAL_PI + 0.5;
	return vec2( u, v );
}
vec3 BRDF_Lambert( const in vec3 diffuseColor ) {
	return RECIPROCAL_PI * diffuseColor;
}
vec3 F_Schlick( const in vec3 f0, const in float f90, const in float dotVH ) {
	float fresnel = exp2( ( - 5.55473 * dotVH - 6.98316 ) * dotVH );
	return f0 * ( 1.0 - fresnel ) + ( f90 * fresnel );
}
float F_Schlick( const in float f0, const in float f90, const in float dotVH ) {
	float fresnel = exp2( ( - 5.55473 * dotVH - 6.98316 ) * dotVH );
	return f0 * ( 1.0 - fresnel ) + ( f90 * fresnel );
} // validated`,eb=`#ifdef ENVMAP_TYPE_CUBE_UV
	#define cubeUV_minMipLevel 4.0
	#define cubeUV_minTileSize 16.0
	float getFace( vec3 direction ) {
		vec3 absDirection = abs( direction );
		float face = - 1.0;
		if ( absDirection.x > absDirection.z ) {
			if ( absDirection.x > absDirection.y )
				face = direction.x > 0.0 ? 0.0 : 3.0;
			else
				face = direction.y > 0.0 ? 1.0 : 4.0;
		} else {
			if ( absDirection.z > absDirection.y )
				face = direction.z > 0.0 ? 2.0 : 5.0;
			else
				face = direction.y > 0.0 ? 1.0 : 4.0;
		}
		return face;
	}
	vec2 getUV( vec3 direction, float face ) {
		vec2 uv;
		if ( face == 0.0 ) {
			uv = vec2( direction.z, direction.y ) / abs( direction.x );
		} else if ( face == 1.0 ) {
			uv = vec2( - direction.x, - direction.z ) / abs( direction.y );
		} else if ( face == 2.0 ) {
			uv = vec2( - direction.x, direction.y ) / abs( direction.z );
		} else if ( face == 3.0 ) {
			uv = vec2( - direction.z, direction.y ) / abs( direction.x );
		} else if ( face == 4.0 ) {
			uv = vec2( - direction.x, direction.z ) / abs( direction.y );
		} else {
			uv = vec2( direction.x, direction.y ) / abs( direction.z );
		}
		return 0.5 * ( uv + 1.0 );
	}
	vec3 bilinearCubeUV( sampler2D envMap, vec3 direction, float mipInt ) {
		float face = getFace( direction );
		float filterInt = max( cubeUV_minMipLevel - mipInt, 0.0 );
		mipInt = max( mipInt, cubeUV_minMipLevel );
		float faceSize = exp2( mipInt );
		highp vec2 uv = getUV( direction, face ) * ( faceSize - 2.0 ) + 1.0;
		if ( face > 2.0 ) {
			uv.y += faceSize;
			face -= 3.0;
		}
		uv.x += face * faceSize;
		uv.x += filterInt * 3.0 * cubeUV_minTileSize;
		uv.y += 4.0 * ( exp2( CUBEUV_MAX_MIP ) - faceSize );
		uv.x *= CUBEUV_TEXEL_WIDTH;
		uv.y *= CUBEUV_TEXEL_HEIGHT;
		#ifdef texture2DGradEXT
			return texture2DGradEXT( envMap, uv, vec2( 0.0 ), vec2( 0.0 ) ).rgb;
		#else
			return texture2D( envMap, uv ).rgb;
		#endif
	}
	#define cubeUV_r0 1.0
	#define cubeUV_m0 - 2.0
	#define cubeUV_r1 0.8
	#define cubeUV_m1 - 1.0
	#define cubeUV_r4 0.4
	#define cubeUV_m4 2.0
	#define cubeUV_r5 0.305
	#define cubeUV_m5 3.0
	#define cubeUV_r6 0.21
	#define cubeUV_m6 4.0
	float roughnessToMip( float roughness ) {
		float mip = 0.0;
		if ( roughness >= cubeUV_r1 ) {
			mip = ( cubeUV_r0 - roughness ) * ( cubeUV_m1 - cubeUV_m0 ) / ( cubeUV_r0 - cubeUV_r1 ) + cubeUV_m0;
		} else if ( roughness >= cubeUV_r4 ) {
			mip = ( cubeUV_r1 - roughness ) * ( cubeUV_m4 - cubeUV_m1 ) / ( cubeUV_r1 - cubeUV_r4 ) + cubeUV_m1;
		} else if ( roughness >= cubeUV_r5 ) {
			mip = ( cubeUV_r4 - roughness ) * ( cubeUV_m5 - cubeUV_m4 ) / ( cubeUV_r4 - cubeUV_r5 ) + cubeUV_m4;
		} else if ( roughness >= cubeUV_r6 ) {
			mip = ( cubeUV_r5 - roughness ) * ( cubeUV_m6 - cubeUV_m5 ) / ( cubeUV_r5 - cubeUV_r6 ) + cubeUV_m5;
		} else {
			mip = - 2.0 * log2( 1.16 * roughness );		}
		return mip;
	}
	vec4 textureCubeUV( sampler2D envMap, vec3 sampleDir, float roughness ) {
		float mip = clamp( roughnessToMip( roughness ), cubeUV_m0, CUBEUV_MAX_MIP );
		float mipF = fract( mip );
		float mipInt = floor( mip );
		vec3 color0 = bilinearCubeUV( envMap, sampleDir, mipInt );
		if ( mipF == 0.0 ) {
			return vec4( color0, 1.0 );
		} else {
			vec3 color1 = bilinearCubeUV( envMap, sampleDir, mipInt + 1.0 );
			return vec4( mix( color0, color1, mipF ), 1.0 );
		}
	}
#endif`,nb=`vec3 transformedNormal = objectNormal;
#ifdef USE_TANGENT
	vec3 transformedTangent = objectTangent;
#endif
#ifdef USE_BATCHING
	mat3 bm = mat3( batchingMatrix );
	transformedNormal /= vec3( dot( bm[ 0 ], bm[ 0 ] ), dot( bm[ 1 ], bm[ 1 ] ), dot( bm[ 2 ], bm[ 2 ] ) );
	transformedNormal = bm * transformedNormal;
	#ifdef USE_TANGENT
		transformedTangent = bm * transformedTangent;
	#endif
#endif
#ifdef USE_INSTANCING
	mat3 im = mat3( instanceMatrix );
	transformedNormal /= vec3( dot( im[ 0 ], im[ 0 ] ), dot( im[ 1 ], im[ 1 ] ), dot( im[ 2 ], im[ 2 ] ) );
	transformedNormal = im * transformedNormal;
	#ifdef USE_TANGENT
		transformedTangent = im * transformedTangent;
	#endif
#endif
transformedNormal = normalMatrix * transformedNormal;
#ifdef FLIP_SIDED
	transformedNormal = - transformedNormal;
#endif
#ifdef USE_TANGENT
	transformedTangent = ( modelViewMatrix * vec4( transformedTangent, 0.0 ) ).xyz;
#endif`,ib=`#ifdef USE_DISPLACEMENTMAP
	uniform sampler2D displacementMap;
	uniform float displacementScale;
	uniform float displacementBias;
#endif`,sb=`#ifdef USE_DISPLACEMENTMAP
	transformed += normalize( objectNormal ) * ( texture2D( displacementMap, vDisplacementMapUv ).x * displacementScale + displacementBias );
#endif`,rb=`#ifdef USE_EMISSIVEMAP
	vec4 emissiveColor = texture2D( emissiveMap, vEmissiveMapUv );
	#ifdef DECODE_VIDEO_TEXTURE_EMISSIVE
		emissiveColor = sRGBTransferEOTF( emissiveColor );
	#endif
	totalEmissiveRadiance *= emissiveColor.rgb;
#endif`,ob=`#ifdef USE_EMISSIVEMAP
	uniform sampler2D emissiveMap;
#endif`,ab="gl_FragColor = linearToOutputTexel( gl_FragColor );",cb=`vec4 LinearTransferOETF( in vec4 value ) {
	return value;
}
vec4 sRGBTransferEOTF( in vec4 value ) {
	return vec4( mix( pow( value.rgb * 0.9478672986 + vec3( 0.0521327014 ), vec3( 2.4 ) ), value.rgb * 0.0773993808, vec3( lessThanEqual( value.rgb, vec3( 0.04045 ) ) ) ), value.a );
}
vec4 sRGBTransferOETF( in vec4 value ) {
	return vec4( mix( pow( value.rgb, vec3( 0.41666 ) ) * 1.055 - vec3( 0.055 ), value.rgb * 12.92, vec3( lessThanEqual( value.rgb, vec3( 0.0031308 ) ) ) ), value.a );
}`,lb=`#ifdef USE_ENVMAP
	#ifdef ENV_WORLDPOS
		vec3 cameraToFrag;
		if ( isOrthographic ) {
			cameraToFrag = normalize( vec3( - viewMatrix[ 0 ][ 2 ], - viewMatrix[ 1 ][ 2 ], - viewMatrix[ 2 ][ 2 ] ) );
		} else {
			cameraToFrag = normalize( vWorldPosition - cameraPosition );
		}
		vec3 worldNormal = transformNormalByInverseViewMatrix( normal, viewMatrix );
		#ifdef ENVMAP_MODE_REFLECTION
			vec3 reflectVec = reflect( cameraToFrag, worldNormal );
		#else
			vec3 reflectVec = refract( cameraToFrag, worldNormal, refractionRatio );
		#endif
	#else
		vec3 reflectVec = vReflect;
	#endif
	#ifdef ENVMAP_TYPE_CUBE
		vec4 envColor = textureCube( envMap, envMapRotation * reflectVec );
		#ifdef ENVMAP_BLENDING_MULTIPLY
			outgoingLight = mix( outgoingLight, outgoingLight * envColor.xyz, specularStrength * reflectivity );
		#elif defined( ENVMAP_BLENDING_MIX )
			outgoingLight = mix( outgoingLight, envColor.xyz, specularStrength * reflectivity );
		#elif defined( ENVMAP_BLENDING_ADD )
			outgoingLight += envColor.xyz * specularStrength * reflectivity;
		#endif
	#endif
#endif`,ub=`#ifdef USE_ENVMAP
	uniform float envMapIntensity;
	uniform mat3 envMapRotation;
	#ifdef ENVMAP_TYPE_CUBE
		uniform samplerCube envMap;
	#else
		uniform sampler2D envMap;
	#endif
#endif`,hb=`#ifdef USE_ENVMAP
	uniform float reflectivity;
	#if defined( USE_BUMPMAP ) || defined( USE_NORMALMAP ) || defined( PHONG ) || defined( LAMBERT )
		#define ENV_WORLDPOS
	#endif
	#ifdef ENV_WORLDPOS
		varying vec3 vWorldPosition;
		uniform float refractionRatio;
	#else
		varying vec3 vReflect;
	#endif
#endif`,fb=`#ifdef USE_ENVMAP
	#if defined( USE_BUMPMAP ) || defined( USE_NORMALMAP ) || defined( PHONG ) || defined( LAMBERT )
		#define ENV_WORLDPOS
	#endif
	#ifdef ENV_WORLDPOS
		
		varying vec3 vWorldPosition;
	#else
		varying vec3 vReflect;
		uniform float refractionRatio;
	#endif
#endif`,db=`#ifdef USE_ENVMAP
	#ifdef ENV_WORLDPOS
		vWorldPosition = worldPosition.xyz;
	#else
		vec3 cameraToVertex;
		if ( isOrthographic ) {
			cameraToVertex = normalize( vec3( - viewMatrix[ 0 ][ 2 ], - viewMatrix[ 1 ][ 2 ], - viewMatrix[ 2 ][ 2 ] ) );
		} else {
			cameraToVertex = normalize( worldPosition.xyz - cameraPosition );
		}
		vec3 worldNormal = transformNormalByInverseViewMatrix( transformedNormal, viewMatrix );
		#ifdef ENVMAP_MODE_REFLECTION
			vReflect = reflect( cameraToVertex, worldNormal );
		#else
			vReflect = refract( cameraToVertex, worldNormal, refractionRatio );
		#endif
	#endif
#endif`,pb=`#ifdef USE_FOG
	vFogDepth = - mvPosition.z;
#endif`,mb=`#ifdef USE_FOG
	varying float vFogDepth;
#endif`,gb=`#ifdef USE_FOG
	#ifdef FOG_EXP2
		float fogFactor = 1.0 - exp( - fogDensity * fogDensity * vFogDepth * vFogDepth );
	#else
		float fogFactor = smoothstep( fogNear, fogFar, vFogDepth );
	#endif
	gl_FragColor.rgb = mix( gl_FragColor.rgb, fogColor, fogFactor );
#endif`,_b=`#ifdef USE_FOG
	uniform vec3 fogColor;
	varying float vFogDepth;
	#ifdef FOG_EXP2
		uniform float fogDensity;
	#else
		uniform float fogNear;
		uniform float fogFar;
	#endif
#endif`,xb=`#ifdef USE_GRADIENTMAP
	uniform sampler2D gradientMap;
#endif
vec3 getGradientIrradiance( vec3 normal, vec3 lightDirection ) {
	float dotNL = dot( normal, lightDirection );
	vec2 coord = vec2( dotNL * 0.5 + 0.5, 0.0 );
	#ifdef USE_GRADIENTMAP
		return vec3( texture2D( gradientMap, coord ).r );
	#else
		vec2 fw = fwidth( coord ) * 0.5;
		return mix( vec3( 0.7 ), vec3( 1.0 ), smoothstep( 0.7 - fw.x, 0.7 + fw.x, coord.x ) );
	#endif
}`,yb=`#ifdef USE_LIGHTMAP
	uniform sampler2D lightMap;
	uniform float lightMapIntensity;
#endif`,vb=`LambertMaterial material;
material.diffuseColor = diffuseColor.rgb;
material.specularStrength = specularStrength;`,Sb=`varying vec3 vViewPosition;
struct LambertMaterial {
	vec3 diffuseColor;
	float specularStrength;
};
void RE_Direct_Lambert( const in IncidentLight directLight, const in vec3 geometryPosition, const in vec3 geometryNormal, const in vec3 geometryViewDir, const in vec3 geometryClearcoatNormal, const in LambertMaterial material, inout ReflectedLight reflectedLight ) {
	float dotNL = saturate( dot( geometryNormal, directLight.direction ) );
	vec3 irradiance = dotNL * directLight.color;
	reflectedLight.directDiffuse += irradiance * BRDF_Lambert( material.diffuseColor );
}
void RE_IndirectDiffuse_Lambert( const in vec3 irradiance, const in vec3 geometryPosition, const in vec3 geometryNormal, const in vec3 geometryViewDir, const in vec3 geometryClearcoatNormal, const in LambertMaterial material, inout ReflectedLight reflectedLight ) {
	reflectedLight.indirectDiffuse += irradiance * BRDF_Lambert( material.diffuseColor );
}
#define RE_Direct				RE_Direct_Lambert
#define RE_IndirectDiffuse		RE_IndirectDiffuse_Lambert`,bb=`uniform bool receiveShadow;
uniform vec3 ambientLightColor;
#if defined( USE_LIGHT_PROBES )
	uniform vec3 lightProbe[ 9 ];
#endif
vec3 shGetIrradianceAt( in vec3 normal, in vec3 shCoefficients[ 9 ] ) {
	float x = normal.x, y = normal.y, z = normal.z;
	vec3 result = shCoefficients[ 0 ] * 0.886227;
	result += shCoefficients[ 1 ] * 2.0 * 0.511664 * y;
	result += shCoefficients[ 2 ] * 2.0 * 0.511664 * z;
	result += shCoefficients[ 3 ] * 2.0 * 0.511664 * x;
	result += shCoefficients[ 4 ] * 2.0 * 0.429043 * x * y;
	result += shCoefficients[ 5 ] * 2.0 * 0.429043 * y * z;
	result += shCoefficients[ 6 ] * ( 0.743125 * z * z - 0.247708 );
	result += shCoefficients[ 7 ] * 2.0 * 0.429043 * x * z;
	result += shCoefficients[ 8 ] * 0.429043 * ( x * x - y * y );
	return result;
}
vec3 getLightProbeIrradiance( const in vec3 lightProbe[ 9 ], const in vec3 normal ) {
	vec3 worldNormal = transformNormalByInverseViewMatrix( normal, viewMatrix );
	vec3 irradiance = shGetIrradianceAt( worldNormal, lightProbe );
	return irradiance;
}
vec3 getAmbientLightIrradiance( const in vec3 ambientLightColor ) {
	vec3 irradiance = ambientLightColor;
	return irradiance;
}
float getDistanceAttenuation( const in float lightDistance, const in float cutoffDistance, const in float decayExponent ) {
	float distanceFalloff = 1.0 / max( pow( lightDistance, decayExponent ), 0.01 );
	if ( cutoffDistance > 0.0 ) {
		distanceFalloff *= pow2( saturate( 1.0 - pow4( lightDistance / cutoffDistance ) ) );
	}
	return distanceFalloff;
}
float getSpotAttenuation( const in float coneCosine, const in float penumbraCosine, const in float angleCosine ) {
	return smoothstep( coneCosine, penumbraCosine, angleCosine );
}
#if NUM_SUN_LIGHTS > 0
	struct SunLight {
		vec3 direction;
		vec3 color;
	};
	uniform SunLight sunLights[ NUM_SUN_LIGHTS ];
	void getSunLightInfo( const in SunLight sunLight, out IncidentLight light ) {
		light.color = sunLight.color;
		light.direction = sunLight.direction;
		light.visible = true;
	}
#endif
#if NUM_DIR_LIGHTS > 0
	struct DirectionalLight {
		vec3 direction;
		vec3 color;
	};
	uniform DirectionalLight directionalLights[ NUM_DIR_LIGHTS ];
	void getDirectionalLightInfo( const in DirectionalLight directionalLight, out IncidentLight light ) {
		light.color = directionalLight.color;
		light.direction = directionalLight.direction;
		light.visible = true;
	}
#endif
#if NUM_POINT_LIGHTS > 0
	struct PointLight {
		vec3 position;
		vec3 color;
		float distance;
		float decay;
	};
	uniform PointLight pointLights[ NUM_POINT_LIGHTS ];
	void getPointLightInfo( const in PointLight pointLight, const in vec3 geometryPosition, out IncidentLight light ) {
		vec3 lVector = pointLight.position - geometryPosition;
		light.direction = normalize( lVector );
		float lightDistance = length( lVector );
		light.color = pointLight.color;
		light.color *= getDistanceAttenuation( lightDistance, pointLight.distance, pointLight.decay );
		light.visible = ( light.color != vec3( 0.0 ) );
	}
#endif
#if NUM_SPOT_LIGHTS > 0
	struct SpotLight {
		vec3 position;
		vec3 direction;
		vec3 color;
		float distance;
		float decay;
		float coneCos;
		float penumbraCos;
	};
	uniform SpotLight spotLights[ NUM_SPOT_LIGHTS ];
	void getSpotLightInfo( const in SpotLight spotLight, const in vec3 geometryPosition, out IncidentLight light ) {
		vec3 lVector = spotLight.position - geometryPosition;
		light.direction = normalize( lVector );
		float angleCos = dot( light.direction, spotLight.direction );
		float spotAttenuation = getSpotAttenuation( spotLight.coneCos, spotLight.penumbraCos, angleCos );
		if ( spotAttenuation > 0.0 ) {
			float lightDistance = length( lVector );
			light.color = spotLight.color * spotAttenuation;
			light.color *= getDistanceAttenuation( lightDistance, spotLight.distance, spotLight.decay );
			light.visible = ( light.color != vec3( 0.0 ) );
		} else {
			light.color = vec3( 0.0 );
			light.visible = false;
		}
	}
#endif
#if NUM_RECT_AREA_LIGHTS > 0
	struct RectAreaLight {
		vec3 color;
		vec3 position;
		vec3 halfWidth;
		vec3 halfHeight;
	};
	uniform sampler2D ltc_1;	uniform sampler2D ltc_2;
	uniform RectAreaLight rectAreaLights[ NUM_RECT_AREA_LIGHTS ];
#endif
#if NUM_HEMI_LIGHTS > 0
	struct HemisphereLight {
		vec3 direction;
		vec3 skyColor;
		vec3 groundColor;
	};
	uniform HemisphereLight hemisphereLights[ NUM_HEMI_LIGHTS ];
	vec3 getHemisphereLightIrradiance( const in HemisphereLight hemiLight, const in vec3 normal ) {
		float dotNL = dot( normal, hemiLight.direction );
		float hemiDiffuseWeight = 0.5 * dotNL + 0.5;
		vec3 irradiance = mix( hemiLight.groundColor, hemiLight.skyColor, hemiDiffuseWeight );
		return irradiance;
	}
#endif
#include <lightprobes_pars_fragment>`,Mb=`#ifdef USE_ENVMAP
	vec3 getIBLIrradiance( const in vec3 normal ) {
		#ifdef ENVMAP_TYPE_CUBE_UV
			vec3 worldNormal = transformNormalByInverseViewMatrix( normal, viewMatrix );
			vec4 envMapColor = textureCubeUV( envMap, envMapRotation * worldNormal, 1.0 );
			return PI * envMapColor.rgb * envMapIntensity;
		#else
			return vec3( 0.0 );
		#endif
	}
	vec3 getIBLRadiance( const in vec3 viewDir, const in vec3 normal, const in float roughness ) {
		#ifdef ENVMAP_TYPE_CUBE_UV
			vec3 reflectVec = reflect( - viewDir, normal );
			reflectVec = normalize( mix( reflectVec, normal, pow4( roughness ) ) );
			reflectVec = transformDirectionByInverseViewMatrix( reflectVec, viewMatrix );
			vec4 envMapColor = textureCubeUV( envMap, envMapRotation * reflectVec, roughness );
			return envMapColor.rgb * envMapIntensity;
		#else
			return vec3( 0.0 );
		#endif
	}
	#ifdef USE_RETROREFLECTION
		vec3 getIBLRetroRadiance( const in vec3 viewDir, const in vec3 normal, const in float roughness ) {
			#ifdef ENVMAP_TYPE_CUBE_UV
				vec3 retroVec = normalize( mix( viewDir, normal, pow4( roughness ) ) );
				retroVec = transformDirectionByInverseViewMatrix( retroVec, viewMatrix );
				vec4 envMapColor = textureCubeUV( envMap, envMapRotation * retroVec, roughness );
				return envMapColor.rgb * envMapIntensity;
			#else
				return vec3( 0.0 );
			#endif
		}
	#endif
	#ifdef USE_ANISOTROPY
		vec3 getIBLAnisotropyRadiance( const in vec3 viewDir, const in vec3 normal, const in float roughness, const in vec3 bitangent, const in float anisotropy ) {
			#ifdef ENVMAP_TYPE_CUBE_UV
				vec3 bentNormal = cross( bitangent, viewDir );
				bentNormal = normalize( cross( bentNormal, bitangent ) );
				bentNormal = normalize( mix( bentNormal, normal, pow2( pow2( 1.0 - anisotropy * ( 1.0 - roughness ) ) ) ) );
				return getIBLRadiance( viewDir, bentNormal, roughness );
			#else
				return vec3( 0.0 );
			#endif
		}
		#ifdef USE_RETROREFLECTION
			vec3 getIBLAnisotropyRetroRadiance( const in vec3 viewDir, const in vec3 normal, const in float roughness, const in vec3 bitangent, const in float anisotropy ) {
				#ifdef ENVMAP_TYPE_CUBE_UV
					vec3 bentNormal = cross( bitangent, viewDir );
					bentNormal = normalize( cross( bentNormal, bitangent ) );
					bentNormal = normalize( mix( bentNormal, normal, pow2( pow2( 1.0 - anisotropy * ( 1.0 - roughness ) ) ) ) );
					return getIBLRetroRadiance( viewDir, bentNormal, roughness );
				#else
					return vec3( 0.0 );
				#endif
			}
		#endif
	#endif
#endif`,Tb=`ToonMaterial material;
material.diffuseColor = diffuseColor.rgb;`,wb=`varying vec3 vViewPosition;
struct ToonMaterial {
	vec3 diffuseColor;
};
void RE_Direct_Toon( const in IncidentLight directLight, const in vec3 geometryPosition, const in vec3 geometryNormal, const in vec3 geometryViewDir, const in vec3 geometryClearcoatNormal, const in ToonMaterial material, inout ReflectedLight reflectedLight ) {
	vec3 irradiance = getGradientIrradiance( geometryNormal, directLight.direction ) * directLight.color;
	reflectedLight.directDiffuse += irradiance * BRDF_Lambert( material.diffuseColor );
}
void RE_IndirectDiffuse_Toon( const in vec3 irradiance, const in vec3 geometryPosition, const in vec3 geometryNormal, const in vec3 geometryViewDir, const in vec3 geometryClearcoatNormal, const in ToonMaterial material, inout ReflectedLight reflectedLight ) {
	reflectedLight.indirectDiffuse += irradiance * BRDF_Lambert( material.diffuseColor );
}
#define RE_Direct				RE_Direct_Toon
#define RE_IndirectDiffuse		RE_IndirectDiffuse_Toon`,Eb=`BlinnPhongMaterial material;
material.diffuseColor = diffuseColor.rgb;
material.specularColor = specular;
material.specularShininess = shininess;
material.specularStrength = specularStrength;`,Ab=`varying vec3 vViewPosition;
struct BlinnPhongMaterial {
	vec3 diffuseColor;
	vec3 specularColor;
	float specularShininess;
	float specularStrength;
};
void RE_Direct_BlinnPhong( const in IncidentLight directLight, const in vec3 geometryPosition, const in vec3 geometryNormal, const in vec3 geometryViewDir, const in vec3 geometryClearcoatNormal, const in BlinnPhongMaterial material, inout ReflectedLight reflectedLight ) {
	float dotNL = saturate( dot( geometryNormal, directLight.direction ) );
	vec3 irradiance = dotNL * directLight.color;
	reflectedLight.directDiffuse += irradiance * BRDF_Lambert( material.diffuseColor );
	reflectedLight.directSpecular += irradiance * BRDF_BlinnPhong( directLight.direction, geometryViewDir, geometryNormal, material.specularColor, material.specularShininess ) * material.specularStrength;
}
void RE_IndirectDiffuse_BlinnPhong( const in vec3 irradiance, const in vec3 geometryPosition, const in vec3 geometryNormal, const in vec3 geometryViewDir, const in vec3 geometryClearcoatNormal, const in BlinnPhongMaterial material, inout ReflectedLight reflectedLight ) {
	reflectedLight.indirectDiffuse += irradiance * BRDF_Lambert( material.diffuseColor );
}
#define RE_Direct				RE_Direct_BlinnPhong
#define RE_IndirectDiffuse		RE_IndirectDiffuse_BlinnPhong`,Cb=`PhysicalMaterial material;
material.diffuseColor = diffuseColor.rgb;
material.diffuseContribution = diffuseColor.rgb * ( 1.0 - metalnessFactor );
material.metalness = metalnessFactor;
vec3 dxy = max( abs( dFdx( nonPerturbedNormal ) ), abs( dFdy( nonPerturbedNormal ) ) );
float geometryRoughness = max( max( dxy.x, dxy.y ), dxy.z );
material.roughness = max( roughnessFactor, 0.0525 );material.roughness += geometryRoughness;
material.roughness = min( material.roughness, 1.0 );
#ifdef IOR
	material.ior = ior;
	#ifdef USE_SPECULAR
		float specularIntensityFactor = specularIntensity;
		vec3 specularColorFactor = specularColor;
		#ifdef USE_SPECULAR_COLORMAP
			specularColorFactor *= texture2D( specularColorMap, vSpecularColorMapUv ).rgb;
		#endif
		#ifdef USE_SPECULAR_INTENSITYMAP
			specularIntensityFactor *= texture2D( specularIntensityMap, vSpecularIntensityMapUv ).a;
		#endif
		material.specularF90 = mix( specularIntensityFactor, 1.0, metalnessFactor );
	#else
		float specularIntensityFactor = 1.0;
		vec3 specularColorFactor = vec3( 1.0 );
		material.specularF90 = 1.0;
	#endif
	material.specularColor = min( pow2( ( material.ior - 1.0 ) / ( material.ior + 1.0 ) ) * specularColorFactor, vec3( 1.0 ) ) * specularIntensityFactor;
	material.specularColorBlended = mix( material.specularColor, diffuseColor.rgb, metalnessFactor );
#else
	material.specularColor = vec3( 0.04 );
	material.specularColorBlended = mix( material.specularColor, diffuseColor.rgb, metalnessFactor );
	material.specularF90 = 1.0;
#endif
#ifdef USE_CLEARCOAT
	material.clearcoat = clearcoat;
	material.clearcoatRoughness = clearcoatRoughness;
	material.clearcoatF0 = vec3( 0.04 );
	material.clearcoatF90 = 1.0;
	#ifdef USE_CLEARCOATMAP
		material.clearcoat *= texture2D( clearcoatMap, vClearcoatMapUv ).x;
	#endif
	#ifdef USE_CLEARCOAT_ROUGHNESSMAP
		material.clearcoatRoughness *= texture2D( clearcoatRoughnessMap, vClearcoatRoughnessMapUv ).y;
	#endif
	material.clearcoat = saturate( material.clearcoat );	material.clearcoatRoughness = max( material.clearcoatRoughness, 0.0525 );
	material.clearcoatRoughness += geometryRoughness;
	material.clearcoatRoughness = min( material.clearcoatRoughness, 1.0 );
#endif
#ifdef USE_DISPERSION
	material.dispersion = dispersion;
#endif
#ifdef USE_RETROREFLECTION
	material.retroreflectivity = retroreflectivity;
#endif
#ifdef USE_IRIDESCENCE
	material.iridescence = iridescence;
	material.iridescenceIOR = iridescenceIOR;
	#ifdef USE_IRIDESCENCEMAP
		material.iridescence *= texture2D( iridescenceMap, vIridescenceMapUv ).r;
	#endif
	#ifdef USE_IRIDESCENCE_THICKNESSMAP
		material.iridescenceThickness = (iridescenceThicknessMaximum - iridescenceThicknessMinimum) * texture2D( iridescenceThicknessMap, vIridescenceThicknessMapUv ).g + iridescenceThicknessMinimum;
	#else
		material.iridescenceThickness = iridescenceThicknessMaximum;
	#endif
#endif
#ifdef USE_SHEEN
	material.sheenColor = sheenColor;
	#ifdef USE_SHEEN_COLORMAP
		material.sheenColor *= texture2D( sheenColorMap, vSheenColorMapUv ).rgb;
	#endif
	material.sheenRoughness = clamp( sheenRoughness, 0.0001, 1.0 );
	#ifdef USE_SHEEN_ROUGHNESSMAP
		material.sheenRoughness *= texture2D( sheenRoughnessMap, vSheenRoughnessMapUv ).a;
	#endif
#endif
#ifdef USE_ANISOTROPY
	#ifdef USE_ANISOTROPYMAP
		mat2 anisotropyMat = mat2( anisotropyVector.x, anisotropyVector.y, - anisotropyVector.y, anisotropyVector.x );
		vec3 anisotropyPolar = texture2D( anisotropyMap, vAnisotropyMapUv ).rgb;
		vec2 anisotropyV = anisotropyMat * normalize( 2.0 * anisotropyPolar.rg - vec2( 1.0 ) ) * anisotropyPolar.b;
	#else
		vec2 anisotropyV = anisotropyVector;
	#endif
	material.anisotropy = length( anisotropyV );
	if( material.anisotropy == 0.0 ) {
		anisotropyV = vec2( 1.0, 0.0 );
	} else {
		anisotropyV /= material.anisotropy;
		material.anisotropy = saturate( material.anisotropy );
	}
	material.alphaT = mix( pow2( material.roughness ), 1.0, pow2( material.anisotropy ) );
	material.anisotropyT = tbn[ 0 ] * anisotropyV.x + tbn[ 1 ] * anisotropyV.y;
	material.anisotropyB = tbn[ 1 ] * anisotropyV.x - tbn[ 0 ] * anisotropyV.y;
#endif`,Rb=`uniform sampler2D dfgLUT;
struct PhysicalMaterial {
	vec3 diffuseColor;
	vec3 diffuseContribution;
	vec3 specularColor;
	vec3 specularColorBlended;
	float roughness;
	float metalness;
	float specularF90;
	float dispersion;
	vec2 dfg;
	vec3 multiScatteringCompensation;
	#ifdef USE_RETROREFLECTION
		float retroreflectivity;
	#endif
	#ifdef USE_CLEARCOAT
		float clearcoat;
		float clearcoatRoughness;
		vec3 clearcoatF0;
		float clearcoatF90;
	#endif
	#ifdef USE_IRIDESCENCE
		float iridescence;
		float iridescenceIOR;
		float iridescenceThickness;
		vec3 iridescenceFresnel;
		vec3 iridescenceF0Dielectric;
		vec3 iridescenceF0Metallic;
	#endif
	#ifdef USE_SHEEN
		vec3 sheenColor;
		float sheenRoughness;
	#endif
	#ifdef IOR
		float ior;
	#endif
	#ifdef USE_TRANSMISSION
		float transmission;
		float transmissionAlpha;
		float thickness;
		float attenuationDistance;
		vec3 attenuationColor;
	#endif
	#ifdef USE_ANISOTROPY
		float anisotropy;
		float alphaT;
		vec3 anisotropyT;
		vec3 anisotropyB;
	#endif
};
vec3 clearcoatSpecularDirect = vec3( 0.0 );
vec3 clearcoatSpecularIndirect = vec3( 0.0 );
vec3 sheenSpecularDirect = vec3( 0.0 );
vec3 sheenSpecularIndirect = vec3(0.0 );
vec3 Schlick_to_F0( const in vec3 f, const in float f90, const in float dotVH ) {
    float x = clamp( 1.0 - dotVH, 0.0, 1.0 );
    float x2 = x * x;
    float x5 = clamp( x * x2 * x2, 0.0, 0.9999 );
    return ( f - vec3( f90 ) * x5 ) / ( 1.0 - x5 );
}
float V_GGX_SmithCorrelated( const in float alpha, const in float dotNL, const in float dotNV ) {
	float a2 = pow2( alpha );
	float gv = dotNL * sqrt( a2 + ( 1.0 - a2 ) * pow2( dotNV ) );
	float gl = dotNV * sqrt( a2 + ( 1.0 - a2 ) * pow2( dotNL ) );
	return 0.5 / max( gv + gl, EPSILON );
}
float D_GGX( const in float alpha, const in float dotNH ) {
	float a2 = pow2( alpha );
	float denom = pow2( dotNH ) * ( a2 - 1.0 ) + 1.0;
	return RECIPROCAL_PI * a2 / pow2( denom );
}
#ifdef USE_ANISOTROPY
	float V_GGX_SmithCorrelated_Anisotropic( const in float alphaT, const in float alphaB, const in float dotTV, const in float dotBV, const in float dotTL, const in float dotBL, const in float dotNV, const in float dotNL ) {
		float gv = dotNL * length( vec3( alphaT * dotTV, alphaB * dotBV, dotNV ) );
		float gl = dotNV * length( vec3( alphaT * dotTL, alphaB * dotBL, dotNL ) );
		return 0.5 / max( gv + gl, EPSILON );
	}
	float D_GGX_Anisotropic( const in float alphaT, const in float alphaB, const in float dotNH, const in float dotTH, const in float dotBH ) {
		float a2 = alphaT * alphaB;
		highp vec3 v = vec3( alphaB * dotTH, alphaT * dotBH, a2 * dotNH );
		highp float v2 = dot( v, v );
		float w2 = a2 / v2;
		return RECIPROCAL_PI * a2 * pow2 ( w2 );
	}
#endif
#ifdef USE_CLEARCOAT
	vec3 BRDF_GGX_Clearcoat( const in vec3 lightDir, const in vec3 viewDir, const in vec3 normal, const in PhysicalMaterial material) {
		vec3 f0 = material.clearcoatF0;
		float f90 = material.clearcoatF90;
		float roughness = material.clearcoatRoughness;
		float alpha = pow2( roughness );
		vec3 halfDir = normalize( lightDir + viewDir );
		float dotNL = saturate( dot( normal, lightDir ) );
		float dotNV = saturate( dot( normal, viewDir ) );
		float dotNH = saturate( dot( normal, halfDir ) );
		float dotVH = saturate( dot( viewDir, halfDir ) );
		vec3 F = F_Schlick( f0, f90, dotVH );
		float V = V_GGX_SmithCorrelated( alpha, dotNL, dotNV );
		float D = D_GGX( alpha, dotNH );
		return F * ( V * D );
	}
#endif
vec3 BRDF_GGX( const in vec3 lightDir, const in vec3 viewDir, const in vec3 normal, const in PhysicalMaterial material ) {
	vec3 f0 = material.specularColorBlended;
	float f90 = material.specularF90;
	float roughness = material.roughness;
	float alpha = pow2( roughness );
	vec3 halfDir = normalize( lightDir + viewDir );
	float dotNL = saturate( dot( normal, lightDir ) );
	float dotNV = saturate( dot( normal, viewDir ) );
	float dotNH = saturate( dot( normal, halfDir ) );
	float dotVH = saturate( dot( viewDir, halfDir ) );
	vec3 F = F_Schlick( f0, f90, dotVH );
	#ifdef USE_IRIDESCENCE
		F = mix( F, material.iridescenceFresnel, material.iridescence );
	#endif
	#ifdef USE_ANISOTROPY
		float dotTL = dot( material.anisotropyT, lightDir );
		float dotTV = dot( material.anisotropyT, viewDir );
		float dotTH = dot( material.anisotropyT, halfDir );
		float dotBL = dot( material.anisotropyB, lightDir );
		float dotBV = dot( material.anisotropyB, viewDir );
		float dotBH = dot( material.anisotropyB, halfDir );
		float V = V_GGX_SmithCorrelated_Anisotropic( material.alphaT, alpha, dotTV, dotBV, dotTL, dotBL, dotNV, dotNL );
		float D = D_GGX_Anisotropic( material.alphaT, alpha, dotNH, dotTH, dotBH );
	#else
		float V = V_GGX_SmithCorrelated( alpha, dotNL, dotNV );
		float D = D_GGX( alpha, dotNH );
	#endif
	return F * ( V * D );
}
vec2 LTC_Uv( const in vec3 N, const in vec3 V, const in float roughness ) {
	const float LUT_SIZE = 64.0;
	const float LUT_SCALE = ( LUT_SIZE - 1.0 ) / LUT_SIZE;
	const float LUT_BIAS = 0.5 / LUT_SIZE;
	float dotNV = saturate( dot( N, V ) );
	vec2 uv = vec2( roughness, sqrt( 1.0 - dotNV ) );
	uv = uv * LUT_SCALE + LUT_BIAS;
	return uv;
}
float LTC_ClippedSphereFormFactor( const in vec3 f ) {
	float l = length( f );
	return max( ( l * l + f.z ) / ( l + 1.0 ), 0.0 );
}
vec3 LTC_EdgeVectorFormFactor( const in vec3 v1, const in vec3 v2 ) {
	float x = dot( v1, v2 );
	float y = abs( x );
	float a = 0.8543985 + ( 0.4965155 + 0.0145206 * y ) * y;
	float b = 3.4175940 + ( 4.1616724 + y ) * y;
	float v = a / b;
	float theta_sintheta = ( x > 0.0 ) ? v : 0.5 * inversesqrt( max( 1.0 - x * x, 1e-7 ) ) - v;
	return cross( v1, v2 ) * theta_sintheta;
}
vec3 LTC_Evaluate( const in vec3 N, const in vec3 V, const in vec3 P, const in mat3 mInv, const in vec3 rectCoords[ 4 ] ) {
	vec3 v1 = rectCoords[ 1 ] - rectCoords[ 0 ];
	vec3 v2 = rectCoords[ 3 ] - rectCoords[ 0 ];
	vec3 lightNormal = cross( v1, v2 );
	if( dot( lightNormal, P - rectCoords[ 0 ] ) < 0.0 ) return vec3( 0.0 );
	vec3 T1, T2;
	T1 = normalize( V - N * dot( V, N ) );
	T2 = - cross( N, T1 );
	mat3 mat = mInv * transpose( mat3( T1, T2, N ) );
	vec3 coords[ 4 ];
	coords[ 0 ] = mat * ( rectCoords[ 0 ] - P );
	coords[ 1 ] = mat * ( rectCoords[ 1 ] - P );
	coords[ 2 ] = mat * ( rectCoords[ 2 ] - P );
	coords[ 3 ] = mat * ( rectCoords[ 3 ] - P );
	coords[ 0 ] = normalize( coords[ 0 ] );
	coords[ 1 ] = normalize( coords[ 1 ] );
	coords[ 2 ] = normalize( coords[ 2 ] );
	coords[ 3 ] = normalize( coords[ 3 ] );
	vec3 vectorFormFactor = vec3( 0.0 );
	vectorFormFactor += LTC_EdgeVectorFormFactor( coords[ 0 ], coords[ 1 ] );
	vectorFormFactor += LTC_EdgeVectorFormFactor( coords[ 1 ], coords[ 2 ] );
	vectorFormFactor += LTC_EdgeVectorFormFactor( coords[ 2 ], coords[ 3 ] );
	vectorFormFactor += LTC_EdgeVectorFormFactor( coords[ 3 ], coords[ 0 ] );
	float result = LTC_ClippedSphereFormFactor( vectorFormFactor );
	return vec3( result );
}
#if defined( USE_SHEEN )
float D_Charlie( float roughness, float dotNH ) {
	float alpha = pow2( roughness );
	float invAlpha = 1.0 / alpha;
	float cos2h = dotNH * dotNH;
	float sin2h = max( 1.0 - cos2h, 0.0078125 );
	return ( 2.0 + invAlpha ) * pow( sin2h, invAlpha * 0.5 ) / ( 2.0 * PI );
}
float V_Neubelt( float dotNV, float dotNL ) {
	return saturate( 1.0 / ( 4.0 * ( dotNL + dotNV - dotNL * dotNV ) ) );
}
vec3 BRDF_Sheen( const in vec3 lightDir, const in vec3 viewDir, const in vec3 normal, vec3 sheenColor, const in float sheenRoughness ) {
	vec3 halfDir = normalize( lightDir + viewDir );
	float dotNL = saturate( dot( normal, lightDir ) );
	float dotNV = saturate( dot( normal, viewDir ) );
	float dotNH = saturate( dot( normal, halfDir ) );
	float D = D_Charlie( sheenRoughness, dotNH );
	float V = V_Neubelt( dotNV, dotNL );
	return sheenColor * ( D * V );
}
#endif
float IBLSheenBRDF( const in vec3 normal, const in vec3 viewDir, const in float roughness ) {
	float dotNV = saturate( dot( normal, viewDir ) );
	float r2 = roughness * roughness;
	float rInv = 1.0 / ( roughness + 0.1 );
	float a = -1.9362 + 1.0678 * roughness + 0.4573 * r2 - 0.8469 * rInv;
	float b = -0.6014 + 0.5538 * roughness - 0.4670 * r2 - 0.1255 * rInv;
	float DG = exp( a * dotNV + b );
	return saturate( DG );
}
vec3 EnvironmentBRDF( const in vec3 normal, const in vec3 viewDir, const in vec3 specularColor, const in float specularF90, const in float roughness ) {
	float dotNV = saturate( dot( normal, viewDir ) );
	vec2 fab = texture2D( dfgLUT, vec2( roughness, dotNV ) ).rg;
	return specularColor * fab.x + specularF90 * fab.y;
}
#ifdef USE_IRIDESCENCE
void computeMultiscatteringIridescence( const in vec2 fab, const in vec3 specularColor, const in float specularF90, const in float iridescence, const in vec3 iridescenceF0, inout vec3 singleScatter, inout vec3 multiScatter ) {
#else
void computeMultiscattering( const in vec2 fab, const in vec3 specularColor, const in float specularF90, inout vec3 singleScatter, inout vec3 multiScatter ) {
#endif
	#ifdef USE_IRIDESCENCE
		vec3 Fr = mix( specularColor, iridescenceF0, iridescence );
	#else
		vec3 Fr = specularColor;
	#endif
	vec3 FssEss = Fr * fab.x + specularF90 * fab.y;
	float Ess = fab.x + fab.y;
	float Ems = 1.0 - Ess;
	vec3 Favg = Fr + ( 1.0 - Fr ) * 0.047619;	vec3 Fms = FssEss * Favg / ( 1.0 - Ems * Favg );
	singleScatter += FssEss;
	multiScatter += Fms * Ems;
}
#if NUM_RECT_AREA_LIGHTS > 0
	void RE_Direct_RectArea_Physical( const in RectAreaLight rectAreaLight, const in vec3 geometryPosition, const in vec3 geometryNormal, const in vec3 geometryViewDir, const in vec3 geometryClearcoatNormal, const in PhysicalMaterial material, inout ReflectedLight reflectedLight ) {
		vec3 normal = geometryNormal;
		vec3 viewDir = geometryViewDir;
		vec3 position = geometryPosition;
		vec3 lightPos = rectAreaLight.position;
		vec3 halfWidth = rectAreaLight.halfWidth;
		vec3 halfHeight = rectAreaLight.halfHeight;
		vec3 lightColor = rectAreaLight.color;
		float roughness = material.roughness;
		vec3 rectCoords[ 4 ];
		rectCoords[ 0 ] = lightPos + halfWidth - halfHeight;		rectCoords[ 1 ] = lightPos - halfWidth - halfHeight;
		rectCoords[ 2 ] = lightPos - halfWidth + halfHeight;
		rectCoords[ 3 ] = lightPos + halfWidth + halfHeight;
		vec2 uv = LTC_Uv( normal, viewDir, roughness );
		vec4 t1 = texture2D( ltc_1, uv );
		vec4 t2 = texture2D( ltc_2, uv );
		mat3 mInv = mat3(
			vec3( t1.x, 0, t1.y ),
			vec3(    0, 1,    0 ),
			vec3( t1.z, 0, t1.w )
		);
		vec3 fresnel = ( material.specularColorBlended * t2.x + ( material.specularF90 - material.specularColorBlended ) * t2.y );
		reflectedLight.directSpecular += lightColor * fresnel * LTC_Evaluate( normal, viewDir, position, mInv, rectCoords );
		reflectedLight.directDiffuse += lightColor * material.diffuseContribution * LTC_Evaluate( normal, viewDir, position, mat3( 1.0 ), rectCoords );
		#ifdef USE_CLEARCOAT
			vec3 Ncc = geometryClearcoatNormal;
			vec2 uvClearcoat = LTC_Uv( Ncc, viewDir, material.clearcoatRoughness );
			vec4 t1Clearcoat = texture2D( ltc_1, uvClearcoat );
			vec4 t2Clearcoat = texture2D( ltc_2, uvClearcoat );
			mat3 mInvClearcoat = mat3(
				vec3( t1Clearcoat.x, 0, t1Clearcoat.y ),
				vec3(             0, 1,             0 ),
				vec3( t1Clearcoat.z, 0, t1Clearcoat.w )
			);
			vec3 fresnelClearcoat = material.clearcoatF0 * t2Clearcoat.x + ( material.clearcoatF90 - material.clearcoatF0 ) * t2Clearcoat.y;
			clearcoatSpecularDirect += lightColor * fresnelClearcoat * LTC_Evaluate( Ncc, viewDir, position, mInvClearcoat, rectCoords );
		#endif
	}
#endif
void RE_Direct_Physical( const in IncidentLight directLight, const in vec3 geometryPosition, const in vec3 geometryNormal, const in vec3 geometryViewDir, const in vec3 geometryClearcoatNormal, const in PhysicalMaterial material, inout ReflectedLight reflectedLight ) {
	float dotNL = saturate( dot( geometryNormal, directLight.direction ) );
	vec3 irradiance = dotNL * directLight.color;
	#ifdef USE_CLEARCOAT
		float dotNLcc = saturate( dot( geometryClearcoatNormal, directLight.direction ) );
		vec3 ccIrradiance = dotNLcc * directLight.color;
		clearcoatSpecularDirect += ccIrradiance * BRDF_GGX_Clearcoat( directLight.direction, geometryViewDir, geometryClearcoatNormal, material );
	#endif
	#ifdef USE_SHEEN
 
 		sheenSpecularDirect += irradiance * BRDF_Sheen( directLight.direction, geometryViewDir, geometryNormal, material.sheenColor, material.sheenRoughness );
 
 		float sheenAlbedoV = IBLSheenBRDF( geometryNormal, geometryViewDir, material.sheenRoughness );
 		float sheenAlbedoL = IBLSheenBRDF( geometryNormal, directLight.direction, material.sheenRoughness );
 
 		float sheenEnergyComp = 1.0 - max3( material.sheenColor ) * max( sheenAlbedoV, sheenAlbedoL );
 
 		irradiance *= sheenEnergyComp;
 
 	#endif
	vec3 specularBRDF = BRDF_GGX( directLight.direction, geometryViewDir, geometryNormal, material );
	#ifdef USE_RETROREFLECTION
		vec3 retroViewDir = reflect( - geometryViewDir, geometryNormal );
		vec3 retroSpecularBRDF = BRDF_GGX( directLight.direction, retroViewDir, geometryNormal, material );
		specularBRDF = mix( specularBRDF, retroSpecularBRDF, saturate( material.retroreflectivity ) );
	#endif
	reflectedLight.directSpecular += irradiance * specularBRDF * material.multiScatteringCompensation;
	vec3 halfDir = normalize( directLight.direction + geometryViewDir );
	float dotVH = saturate( dot( geometryViewDir, halfDir ) );
	vec3 F = F_Schlick( material.specularColor, material.specularF90, dotVH );
	#ifdef USE_RETROREFLECTION
		vec3 retroHalfDir = normalize( directLight.direction + retroViewDir );
		float dotRetroVH = saturate( dot( retroViewDir, retroHalfDir ) );
		vec3 retroF = F_Schlick( material.specularColor, material.specularF90, dotRetroVH );
		F = mix( F, retroF, saturate( material.retroreflectivity ) );
	#endif
	reflectedLight.directDiffuse += irradiance * BRDF_Lambert( material.diffuseContribution ) * ( 1.0 - F );
}
void RE_IndirectDiffuse_Physical( const in vec3 irradiance, const in vec3 geometryPosition, const in vec3 geometryNormal, const in vec3 geometryViewDir, const in vec3 geometryClearcoatNormal, const in PhysicalMaterial material, inout ReflectedLight reflectedLight ) {
	vec3 singleScattering = vec3( 0.0 );
	vec3 multiScattering = vec3( 0.0 );
	#ifdef USE_IRIDESCENCE
		computeMultiscatteringIridescence( material.dfg, material.specularColor, material.specularF90, material.iridescence, material.iridescenceF0Dielectric, singleScattering, multiScattering );
	#else
		computeMultiscattering( material.dfg, material.specularColor, material.specularF90, singleScattering, multiScattering );
	#endif
	vec3 diffuse = irradiance * BRDF_Lambert( material.diffuseContribution ) * ( 1.0 - singleScattering - multiScattering );
	#ifdef USE_SHEEN
		float sheenAlbedo = IBLSheenBRDF( geometryNormal, geometryViewDir, material.sheenRoughness );
		sheenSpecularIndirect += irradiance * material.sheenColor * sheenAlbedo * RECIPROCAL_PI;
		float sheenEnergyComp = 1.0 - max3( material.sheenColor ) * sheenAlbedo;
		diffuse *= sheenEnergyComp;
	#endif
	reflectedLight.indirectDiffuse += diffuse;
}
void RE_IndirectSpecular_Physical( const in vec3 radiance, const in vec3 irradiance, const in vec3 clearcoatRadiance, const in vec3 geometryPosition, const in vec3 geometryNormal, const in vec3 geometryViewDir, const in vec3 geometryClearcoatNormal, const in PhysicalMaterial material, inout ReflectedLight reflectedLight) {
	#ifdef USE_CLEARCOAT
		clearcoatSpecularIndirect += clearcoatRadiance * EnvironmentBRDF( geometryClearcoatNormal, geometryViewDir, material.clearcoatF0, material.clearcoatF90, material.clearcoatRoughness );
	#endif
	#ifdef USE_SHEEN
		sheenSpecularIndirect += irradiance * material.sheenColor * IBLSheenBRDF( geometryNormal, geometryViewDir, material.sheenRoughness ) * RECIPROCAL_PI;
 	#endif
	vec3 singleScatteringDielectric = vec3( 0.0 );
	vec3 multiScatteringDielectric = vec3( 0.0 );
	vec3 singleScatteringMetallic = vec3( 0.0 );
	vec3 multiScatteringMetallic = vec3( 0.0 );
	#ifdef USE_IRIDESCENCE
		computeMultiscatteringIridescence( material.dfg, material.specularColor, material.specularF90, material.iridescence, material.iridescenceF0Dielectric, singleScatteringDielectric, multiScatteringDielectric );
		computeMultiscatteringIridescence( material.dfg, material.diffuseColor, material.specularF90, material.iridescence, material.iridescenceF0Metallic, singleScatteringMetallic, multiScatteringMetallic );
	#else
		computeMultiscattering( material.dfg, material.specularColor, material.specularF90, singleScatteringDielectric, multiScatteringDielectric );
		computeMultiscattering( material.dfg, material.diffuseColor, material.specularF90, singleScatteringMetallic, multiScatteringMetallic );
	#endif
	vec3 singleScattering = mix( singleScatteringDielectric, singleScatteringMetallic, material.metalness );
	vec3 multiScattering = mix( multiScatteringDielectric, multiScatteringMetallic, material.metalness );
	vec3 totalScatteringDielectric = singleScatteringDielectric + multiScatteringDielectric;
	vec3 diffuse = material.diffuseContribution * ( 1.0 - totalScatteringDielectric );
	vec3 cosineWeightedIrradiance = irradiance * RECIPROCAL_PI;
	vec3 indirectSpecular = radiance * singleScattering;
	indirectSpecular += multiScattering * cosineWeightedIrradiance;
	vec3 indirectDiffuse = diffuse * cosineWeightedIrradiance;
	#ifdef USE_SHEEN
		float sheenAlbedo = IBLSheenBRDF( geometryNormal, geometryViewDir, material.sheenRoughness );
		float sheenEnergyComp = 1.0 - max3( material.sheenColor ) * sheenAlbedo;
		indirectSpecular *= sheenEnergyComp;
		indirectDiffuse *= sheenEnergyComp;
	#endif
	reflectedLight.indirectSpecular += indirectSpecular;
	reflectedLight.indirectDiffuse += indirectDiffuse;
}
#define RE_Direct				RE_Direct_Physical
#define RE_Direct_RectArea		RE_Direct_RectArea_Physical
#define RE_IndirectDiffuse		RE_IndirectDiffuse_Physical
#define RE_IndirectSpecular		RE_IndirectSpecular_Physical
float computeSpecularOcclusion( const in float dotNV, const in float ambientOcclusion, const in float roughness ) {
	return saturate( pow( dotNV + ambientOcclusion, exp2( - 16.0 * roughness - 1.0 ) ) - 1.0 + ambientOcclusion );
}`,Pb=`
vec3 geometryPosition = - vViewPosition;
vec3 geometryNormal = normal;
vec3 geometryViewDir = ( isOrthographic ) ? vec3( 0, 0, 1 ) : normalize( vViewPosition );
vec3 geometryClearcoatNormal = vec3( 0.0 );
#ifdef USE_CLEARCOAT
	geometryClearcoatNormal = clearcoatNormal;
#endif
#ifdef USE_IRIDESCENCE
	float dotNVi = saturate( dot( normal, geometryViewDir ) );
	if ( material.iridescenceThickness == 0.0 ) {
		material.iridescence = 0.0;
	} else {
		material.iridescence = saturate( material.iridescence );
	}
	if ( material.iridescence > 0.0 ) {
		vec3 iridescenceFresnelDielectric = evalIridescence( 1.0, material.iridescenceIOR, dotNVi, material.iridescenceThickness, material.specularColor );
		vec3 iridescenceFresnelMetallic = evalIridescence( 1.0, material.iridescenceIOR, dotNVi, material.iridescenceThickness, material.diffuseColor );
		material.iridescenceFresnel = mix( iridescenceFresnelDielectric, iridescenceFresnelMetallic, material.metalness );
		material.iridescenceF0Dielectric = Schlick_to_F0( iridescenceFresnelDielectric, 1.0, dotNVi );
		material.iridescenceF0Metallic = Schlick_to_F0( iridescenceFresnelMetallic, 1.0, dotNVi );
	}
#endif
#ifdef STANDARD
	float dotNVms = saturate( dot( geometryNormal, geometryViewDir ) );
	material.dfg = texture2D( dfgLUT, vec2( material.roughness, dotNVms ) ).rg;
	#if ( NUM_SUN_LIGHTS > 0 || NUM_DIR_LIGHTS > 0 || NUM_POINT_LIGHTS > 0 || NUM_SPOT_LIGHTS > 0 )
		float EssMs = material.dfg.x + material.dfg.y;
		material.multiScatteringCompensation = 1.0 + material.specularColorBlended * ( 1.0 / EssMs - 1.0 );
	#endif
#endif
IncidentLight directLight;
#if ( NUM_POINT_LIGHTS > 0 ) && defined( RE_Direct )
	PointLight pointLight;
	#if defined( USE_SHADOWMAP ) && NUM_POINT_LIGHT_SHADOWS > 0
	PointLightShadow pointLightShadow;
	#endif
	#pragma unroll_loop_start
	for ( int i = 0; i < NUM_POINT_LIGHTS; i ++ ) {
		pointLight = pointLights[ i ];
		getPointLightInfo( pointLight, geometryPosition, directLight );
		#if defined( USE_SHADOWMAP ) && ( UNROLLED_LOOP_INDEX < NUM_POINT_LIGHT_SHADOWS ) && ( defined( SHADOWMAP_TYPE_PCF ) || defined( SHADOWMAP_TYPE_BASIC ) )
		pointLightShadow = pointLightShadows[ i ];
		directLight.color *= ( directLight.visible && receiveShadow ) ? getPointShadow( pointShadowMap[ i ], pointLightShadow.shadowMapSize, pointLightShadow.shadowIntensity, pointLightShadow.shadowBias, pointLightShadow.shadowRadius, vPointShadowCoord[ i ], pointLightShadow.shadowCameraNear, pointLightShadow.shadowCameraFar ) : 1.0;
		#endif
		RE_Direct( directLight, geometryPosition, geometryNormal, geometryViewDir, geometryClearcoatNormal, material, reflectedLight );
	}
	#pragma unroll_loop_end
#endif
#if ( NUM_SPOT_LIGHTS > 0 ) && defined( RE_Direct )
	SpotLight spotLight;
	vec4 spotColor;
	vec3 spotLightCoord;
	bool inSpotLightMap;
	#if defined( USE_SHADOWMAP ) && NUM_SPOT_LIGHT_SHADOWS > 0
	SpotLightShadow spotLightShadow;
	#endif
	#pragma unroll_loop_start
	for ( int i = 0; i < NUM_SPOT_LIGHTS; i ++ ) {
		spotLight = spotLights[ i ];
		getSpotLightInfo( spotLight, geometryPosition, directLight );
		#if ( UNROLLED_LOOP_INDEX < NUM_SPOT_LIGHT_SHADOWS_WITH_MAPS )
		#define SPOT_LIGHT_MAP_INDEX UNROLLED_LOOP_INDEX
		#elif ( UNROLLED_LOOP_INDEX < NUM_SPOT_LIGHT_SHADOWS )
		#define SPOT_LIGHT_MAP_INDEX NUM_SPOT_LIGHT_MAPS
		#else
		#define SPOT_LIGHT_MAP_INDEX ( UNROLLED_LOOP_INDEX - NUM_SPOT_LIGHT_SHADOWS + NUM_SPOT_LIGHT_SHADOWS_WITH_MAPS )
		#endif
		#if ( SPOT_LIGHT_MAP_INDEX < NUM_SPOT_LIGHT_MAPS )
			spotLightCoord = vSpotLightCoord[ i ].xyz / vSpotLightCoord[ i ].w;
			inSpotLightMap = all( lessThan( abs( spotLightCoord * 2. - 1. ), vec3( 1.0 ) ) );
			spotColor = texture2D( spotLightMap[ SPOT_LIGHT_MAP_INDEX ], spotLightCoord.xy );
			directLight.color = inSpotLightMap ? directLight.color * spotColor.rgb : directLight.color;
		#endif
		#undef SPOT_LIGHT_MAP_INDEX
		#if defined( USE_SHADOWMAP ) && ( UNROLLED_LOOP_INDEX < NUM_SPOT_LIGHT_SHADOWS )
		spotLightShadow = spotLightShadows[ i ];
		directLight.color *= ( directLight.visible && receiveShadow ) ? getShadow( spotShadowMap[ i ], spotLightShadow.shadowMapSize, spotLightShadow.shadowIntensity, spotLightShadow.shadowBias, spotLightShadow.shadowRadius, vSpotLightCoord[ i ] ) : 1.0;
		#endif
		RE_Direct( directLight, geometryPosition, geometryNormal, geometryViewDir, geometryClearcoatNormal, material, reflectedLight );
	}
	#pragma unroll_loop_end
#endif
#if ( NUM_SUN_LIGHTS > 0 ) && defined( RE_Direct )
	SunLight sunLight;
	#if defined( USE_SHADOWMAP ) && NUM_SUN_LIGHT_SHADOWS > 0
	SunLightShadow sunLightShadow;
	#endif
	#pragma unroll_loop_start
	for ( int i = 0; i < NUM_SUN_LIGHTS; i ++ ) {
		sunLight = sunLights[ i ];
		getSunLightInfo( sunLight, directLight );
		#if defined( USE_SHADOWMAP ) && ( UNROLLED_LOOP_INDEX < NUM_SUN_LIGHT_SHADOWS )
		sunLightShadow = sunLightShadows[ i ];
		directLight.color *= ( directLight.visible && receiveShadow ) ? getSunShadow( sunShadowMap[ i ], sunLightShadow, UNROLLED_LOOP_INDEX ) : 1.0;
		#endif
		RE_Direct( directLight, geometryPosition, geometryNormal, geometryViewDir, geometryClearcoatNormal, material, reflectedLight );
	}
	#pragma unroll_loop_end
#endif
#if ( NUM_DIR_LIGHTS > 0 ) && defined( RE_Direct )
	DirectionalLight directionalLight;
	#if defined( USE_SHADOWMAP ) && NUM_DIR_LIGHT_SHADOWS > 0
	DirectionalLightShadow directionalLightShadow;
	#endif
	#pragma unroll_loop_start
	for ( int i = 0; i < NUM_DIR_LIGHTS; i ++ ) {
		directionalLight = directionalLights[ i ];
		getDirectionalLightInfo( directionalLight, directLight );
		#if defined( USE_SHADOWMAP ) && ( UNROLLED_LOOP_INDEX < NUM_DIR_LIGHT_SHADOWS )
		directionalLightShadow = directionalLightShadows[ i ];
		directLight.color *= ( directLight.visible && receiveShadow ) ? getShadow( directionalShadowMap[ i ], directionalLightShadow.shadowMapSize, directionalLightShadow.shadowIntensity, directionalLightShadow.shadowBias, directionalLightShadow.shadowRadius, vDirectionalShadowCoord[ i ] ) : 1.0;
		#endif
		RE_Direct( directLight, geometryPosition, geometryNormal, geometryViewDir, geometryClearcoatNormal, material, reflectedLight );
	}
	#pragma unroll_loop_end
#endif
#if ( NUM_RECT_AREA_LIGHTS > 0 ) && defined( RE_Direct_RectArea )
	RectAreaLight rectAreaLight;
	#pragma unroll_loop_start
	for ( int i = 0; i < NUM_RECT_AREA_LIGHTS; i ++ ) {
		rectAreaLight = rectAreaLights[ i ];
		RE_Direct_RectArea( rectAreaLight, geometryPosition, geometryNormal, geometryViewDir, geometryClearcoatNormal, material, reflectedLight );
	}
	#pragma unroll_loop_end
#endif
#if defined( RE_IndirectDiffuse )
	vec3 iblIrradiance = vec3( 0.0 );
	vec3 irradiance = getAmbientLightIrradiance( ambientLightColor );
	#if defined( USE_LIGHT_PROBES )
		irradiance += getLightProbeIrradiance( lightProbe, geometryNormal );
	#endif
	#if ( NUM_HEMI_LIGHTS > 0 )
		#pragma unroll_loop_start
		for ( int i = 0; i < NUM_HEMI_LIGHTS; i ++ ) {
			irradiance += getHemisphereLightIrradiance( hemisphereLights[ i ], geometryNormal );
		}
		#pragma unroll_loop_end
	#endif
	#ifdef USE_LIGHT_PROBES_GRID
		vec3 probeWorldPos = ( ( vec4( geometryPosition, 1.0 ) - viewMatrix[ 3 ] ) * viewMatrix ).xyz;
		vec3 probeWorldNormal = transformNormalByInverseViewMatrix( geometryNormal, viewMatrix );
		irradiance += getLightProbeGridIrradiance( probeWorldPos, probeWorldNormal );
	#endif
#endif
#if defined( RE_IndirectSpecular )
	vec3 radiance = vec3( 0.0 );
	vec3 clearcoatRadiance = vec3( 0.0 );
#endif`,Ib=`#if defined( RE_IndirectDiffuse )
	#ifdef USE_LIGHTMAP
		vec4 lightMapTexel = texture2D( lightMap, vLightMapUv );
		vec3 lightMapIrradiance = lightMapTexel.rgb * lightMapIntensity;
		irradiance += lightMapIrradiance;
	#endif
	#if defined( USE_ENVMAP ) && defined( ENVMAP_TYPE_CUBE_UV )
		#if defined( STANDARD ) || defined( LAMBERT ) || defined( PHONG )
			iblIrradiance += getIBLIrradiance( geometryNormal );
		#endif
	#endif
#endif
#if defined( USE_ENVMAP ) && defined( RE_IndirectSpecular )
	#ifdef USE_ANISOTROPY
		vec3 iblRadiance = getIBLAnisotropyRadiance( geometryViewDir, geometryNormal, material.roughness, material.anisotropyB, material.anisotropy );
	#else
		vec3 iblRadiance = getIBLRadiance( geometryViewDir, geometryNormal, material.roughness );
	#endif
	#ifdef USE_RETROREFLECTION
		#ifdef USE_ANISOTROPY
			vec3 retroIBLRadiance = getIBLAnisotropyRetroRadiance( geometryViewDir, geometryNormal, material.roughness, material.anisotropyB, material.anisotropy );
		#else
			vec3 retroIBLRadiance = getIBLRetroRadiance( geometryViewDir, geometryNormal, material.roughness );
		#endif
		iblRadiance = mix( iblRadiance, retroIBLRadiance, saturate( material.retroreflectivity ) );
	#endif
	radiance += iblRadiance;
	#ifdef USE_CLEARCOAT
		clearcoatRadiance += getIBLRadiance( geometryViewDir, geometryClearcoatNormal, material.clearcoatRoughness );
	#endif
#endif`,Lb=`#if defined( RE_IndirectDiffuse )
	#if defined( LAMBERT ) || defined( PHONG )
		irradiance += iblIrradiance;
	#endif
	RE_IndirectDiffuse( irradiance, geometryPosition, geometryNormal, geometryViewDir, geometryClearcoatNormal, material, reflectedLight );
#endif
#if defined( RE_IndirectSpecular )
	RE_IndirectSpecular( radiance, iblIrradiance, clearcoatRadiance, geometryPosition, geometryNormal, geometryViewDir, geometryClearcoatNormal, material, reflectedLight );
#endif`,Nb=`#ifdef USE_LIGHT_PROBES_GRID
uniform highp sampler3D probesSH;
uniform vec3 probesMin;
uniform vec3 probesMax;
uniform vec3 probesResolution;
vec3 getLightProbeGridIrradiance( vec3 worldPos, vec3 worldNormal ) {
	vec3 res = probesResolution;
	vec3 gridRange = probesMax - probesMin;
	vec3 resMinusOne = res - 1.0;
	vec3 probeSpacing = gridRange / resMinusOne;
	vec3 samplePos = worldPos + worldNormal * probeSpacing * 0.5;
	vec3 uvw = clamp( ( samplePos - probesMin ) / gridRange, 0.0, 1.0 );
	uvw = uvw * resMinusOne / res + 0.5 / res;
	float nz          = res.z;
	float paddedSlices = nz + 2.0;
	float atlasDepth  = 7.0 * paddedSlices;
	float uvZBase     = uvw.z * nz + 1.0;
	vec4 s0 = texture( probesSH, vec3( uvw.xy, ( uvZBase                       ) / atlasDepth ) );
	vec4 s1 = texture( probesSH, vec3( uvw.xy, ( uvZBase +       paddedSlices   ) / atlasDepth ) );
	vec4 s2 = texture( probesSH, vec3( uvw.xy, ( uvZBase + 2.0 * paddedSlices   ) / atlasDepth ) );
	vec4 s3 = texture( probesSH, vec3( uvw.xy, ( uvZBase + 3.0 * paddedSlices   ) / atlasDepth ) );
	vec4 s4 = texture( probesSH, vec3( uvw.xy, ( uvZBase + 4.0 * paddedSlices   ) / atlasDepth ) );
	vec4 s5 = texture( probesSH, vec3( uvw.xy, ( uvZBase + 5.0 * paddedSlices   ) / atlasDepth ) );
	vec4 s6 = texture( probesSH, vec3( uvw.xy, ( uvZBase + 6.0 * paddedSlices   ) / atlasDepth ) );
	vec3 c0 = s0.xyz;
	vec3 c1 = vec3( s0.w, s1.xy );
	vec3 c2 = vec3( s1.zw, s2.x );
	vec3 c3 = s2.yzw;
	vec3 c4 = s3.xyz;
	vec3 c5 = vec3( s3.w, s4.xy );
	vec3 c6 = vec3( s4.zw, s5.x );
	vec3 c7 = s5.yzw;
	vec3 c8 = s6.xyz;
	float x = worldNormal.x, y = worldNormal.y, z = worldNormal.z;
	vec3 result = c0 * 0.886227;
	result += c1 * 2.0 * 0.511664 * y;
	result += c2 * 2.0 * 0.511664 * z;
	result += c3 * 2.0 * 0.511664 * x;
	result += c4 * 2.0 * 0.429043 * x * y;
	result += c5 * 2.0 * 0.429043 * y * z;
	result += c6 * ( 0.743125 * z * z - 0.247708 );
	result += c7 * 2.0 * 0.429043 * x * z;
	result += c8 * 0.429043 * ( x * x - y * y );
	return max( result, vec3( 0.0 ) );
}
#endif`,Ub=`#if defined( USE_LOGARITHMIC_DEPTH_BUFFER )
	gl_FragDepth = vIsPerspective == 0.0 ? gl_FragCoord.z : log2( vFragDepth ) * logDepthBufFC * 0.5;
#endif`,Db=`#if defined( USE_LOGARITHMIC_DEPTH_BUFFER )
	uniform float logDepthBufFC;
	varying float vFragDepth;
	varying float vIsPerspective;
#endif`,Ob=`#ifdef USE_LOGARITHMIC_DEPTH_BUFFER
	varying float vFragDepth;
	varying float vIsPerspective;
#endif`,Fb=`#ifdef USE_LOGARITHMIC_DEPTH_BUFFER
	vFragDepth = 1.0 + gl_Position.w;
	vIsPerspective = float( isPerspectiveMatrix( projectionMatrix ) );
#endif`,Bb=`#ifdef USE_MAP
	vec4 sampledDiffuseColor = texture2D( map, vMapUv );
	#ifdef DECODE_VIDEO_TEXTURE
		sampledDiffuseColor = sRGBTransferEOTF( sampledDiffuseColor );
	#endif
	diffuseColor *= sampledDiffuseColor;
#endif`,kb=`#ifdef USE_MAP
	uniform sampler2D map;
#endif`,Vb=`#if defined( USE_MAP ) || defined( USE_ALPHAMAP )
	#if defined( USE_POINTS_UV )
		vec2 uv = vUv;
	#else
		vec2 uv = ( uvTransform * vec3( gl_PointCoord.x, 1.0 - gl_PointCoord.y, 1 ) ).xy;
	#endif
#endif
#ifdef USE_MAP
	diffuseColor *= texture2D( map, uv );
#endif
#ifdef USE_ALPHAMAP
	diffuseColor.a *= texture2D( alphaMap, uv ).g;
#endif`,zb=`#if defined( USE_POINTS_UV )
	varying vec2 vUv;
#else
	#if defined( USE_MAP ) || defined( USE_ALPHAMAP )
		uniform mat3 uvTransform;
	#endif
#endif
#ifdef USE_MAP
	uniform sampler2D map;
#endif
#ifdef USE_ALPHAMAP
	uniform sampler2D alphaMap;
#endif`,Gb=`float metalnessFactor = metalness;
#ifdef USE_METALNESSMAP
	vec4 texelMetalness = texture2D( metalnessMap, vMetalnessMapUv );
	metalnessFactor *= texelMetalness.b;
#endif`,Hb=`#ifdef USE_METALNESSMAP
	uniform sampler2D metalnessMap;
#endif`,Wb=`#ifdef USE_INSTANCING_MORPH
	float morphTargetInfluences[ MORPHTARGETS_COUNT ];
	float morphTargetBaseInfluence = texelFetch( morphTexture, ivec2( 0, gl_InstanceID ), 0 ).r;
	for ( int i = 0; i < MORPHTARGETS_COUNT; i ++ ) {
		morphTargetInfluences[i] =  texelFetch( morphTexture, ivec2( i + 1, gl_InstanceID ), 0 ).r;
	}
#endif`,$b=`#if defined( USE_MORPHCOLORS )
	vColor *= morphTargetBaseInfluence;
	for ( int i = 0; i < MORPHTARGETS_COUNT; i ++ ) {
		#if defined( USE_COLOR_ALPHA )
			if ( morphTargetInfluences[ i ] != 0.0 ) vColor += getMorph( gl_VertexID, i, 2 ) * morphTargetInfluences[ i ];
		#elif defined( USE_COLOR )
			if ( morphTargetInfluences[ i ] != 0.0 ) vColor += getMorph( gl_VertexID, i, 2 ).rgb * morphTargetInfluences[ i ];
		#endif
	}
#endif`,Xb=`#ifdef USE_MORPHNORMALS
	objectNormal *= morphTargetBaseInfluence;
	for ( int i = 0; i < MORPHTARGETS_COUNT; i ++ ) {
		if ( morphTargetInfluences[ i ] != 0.0 ) objectNormal += getMorph( gl_VertexID, i, 1 ).xyz * morphTargetInfluences[ i ];
	}
#endif`,qb=`#ifdef USE_MORPHTARGETS
	#ifndef USE_INSTANCING_MORPH
		uniform float morphTargetBaseInfluence;
		uniform float morphTargetInfluences[ MORPHTARGETS_COUNT ];
	#endif
	uniform sampler2DArray morphTargetsTexture;
	uniform ivec2 morphTargetsTextureSize;
	vec4 getMorph( const in int vertexIndex, const in int morphTargetIndex, const in int offset ) {
		int texelIndex = vertexIndex * MORPHTARGETS_TEXTURE_STRIDE + offset;
		int y = texelIndex / morphTargetsTextureSize.x;
		int x = texelIndex - y * morphTargetsTextureSize.x;
		ivec3 morphUV = ivec3( x, y, morphTargetIndex );
		return texelFetch( morphTargetsTexture, morphUV, 0 );
	}
#endif`,Yb=`#ifdef USE_MORPHTARGETS
	transformed *= morphTargetBaseInfluence;
	for ( int i = 0; i < MORPHTARGETS_COUNT; i ++ ) {
		if ( morphTargetInfluences[ i ] != 0.0 ) transformed += getMorph( gl_VertexID, i, 0 ).xyz * morphTargetInfluences[ i ];
	}
#endif`,Zb=`float faceDirection = gl_FrontFacing ? 1.0 : - 1.0;
#ifdef FLAT_SHADED
	vec3 fdx = dFdx( vViewPosition );
	vec3 fdy = dFdy( vViewPosition );
	vec3 normal = normalize( cross( fdx, fdy ) );
#else
	vec3 normal = normalize( vNormal );
	#ifdef DOUBLE_SIDED
		normal *= faceDirection;
	#endif
#endif
#if defined( USE_NORMALMAP_TANGENTSPACE ) || defined( USE_CLEARCOAT_NORMALMAP ) || defined( USE_ANISOTROPY )
	#ifdef USE_TANGENT
		mat3 tbn = mat3( normalize( vTangent ), normalize( vBitangent ), normal );
	#else
		mat3 tbn = getTangentFrame( - vViewPosition, normal,
		#if defined( USE_NORMALMAP )
			vNormalMapUv
		#elif defined( USE_CLEARCOAT_NORMALMAP )
			vClearcoatNormalMapUv
		#else
			vUv
		#endif
		);
	#endif
	#ifdef DOUBLE_SIDED
		tbn[0] *= faceDirection;
		tbn[1] *= faceDirection;
	#endif
#endif
#ifdef USE_CLEARCOAT_NORMALMAP
	#ifdef USE_TANGENT
		mat3 tbn2 = mat3( normalize( vTangent ), normalize( vBitangent ), normal );
	#else
		mat3 tbn2 = getTangentFrame( - vViewPosition, normal, vClearcoatNormalMapUv );
	#endif
	#ifdef DOUBLE_SIDED
		tbn2[0] *= faceDirection;
		tbn2[1] *= faceDirection;
	#endif
#endif
vec3 nonPerturbedNormal = normal;`,Kb=`#ifdef USE_NORMALMAP_OBJECTSPACE
	normal = texture2D( normalMap, vNormalMapUv ).xyz * 2.0 - 1.0;
	#ifdef FLIP_SIDED
		normal = - normal;
	#endif
	#ifdef DOUBLE_SIDED
		normal = normal * faceDirection;
	#endif
	normal = normalize( normalMatrix * normal );
#elif defined( USE_NORMALMAP_TANGENTSPACE )
	vec3 mapN = texture2D( normalMap, vNormalMapUv ).xyz * 2.0 - 1.0;
	#if defined( USE_PACKED_NORMALMAP )
		mapN = vec3( mapN.xy, sqrt( saturate( 1.0 - dot( mapN.xy, mapN.xy ) ) ) );
	#endif
	mapN.xy *= normalScale;
	normal = normalize( tbn * mapN );
#elif defined( USE_BUMPMAP )
	normal = perturbNormalArb( - vViewPosition, normal, dHdxy_fwd(), faceDirection );
#endif`,Jb=`#ifndef FLAT_SHADED
	varying vec3 vNormal;
	#ifdef USE_TANGENT
		varying vec3 vTangent;
		varying vec3 vBitangent;
	#endif
#endif`,jb=`#ifndef FLAT_SHADED
	varying vec3 vNormal;
	#ifdef USE_TANGENT
		varying vec3 vTangent;
		varying vec3 vBitangent;
	#endif
#endif`,Qb=`#ifndef FLAT_SHADED
	vNormal = normalize( transformedNormal );
	#ifdef USE_TANGENT
		vTangent = normalize( transformedTangent );
		vBitangent = normalize( cross( vNormal, vTangent ) * tangent.w );
		#ifdef FLIP_SIDED
			vBitangent = - vBitangent;
		#endif
	#endif
#endif`,tM=`#ifdef USE_NORMALMAP
	uniform sampler2D normalMap;
	uniform vec2 normalScale;
#endif
#ifdef USE_NORMALMAP_OBJECTSPACE
	uniform mat3 normalMatrix;
#endif
#if ! defined ( USE_TANGENT ) && ( defined ( USE_NORMALMAP_TANGENTSPACE ) || defined ( USE_CLEARCOAT_NORMALMAP ) || defined( USE_ANISOTROPY ) )
	mat3 getTangentFrame( vec3 eye_pos, vec3 surf_norm, vec2 uv ) {
		vec3 q0 = dFdx( eye_pos.xyz );
		vec3 q1 = dFdy( eye_pos.xyz );
		vec2 st0 = dFdx( uv.st );
		vec2 st1 = dFdy( uv.st );
		vec3 N = surf_norm;
		vec3 q1perp = cross( q1, N );
		vec3 q0perp = cross( N, q0 );
		vec3 T = q1perp * st0.x + q0perp * st1.x;
		vec3 B = q1perp * st0.y + q0perp * st1.y;
		float det = max( dot( T, T ), dot( B, B ) );
		float scale = ( det == 0.0 ) ? 0.0 : inversesqrt( det );
		return mat3( T * scale, B * scale, N );
	}
#endif`,eM=`#ifdef USE_CLEARCOAT
	vec3 clearcoatNormal = nonPerturbedNormal;
#endif`,nM=`#ifdef USE_CLEARCOAT_NORMALMAP
	vec3 clearcoatMapN = texture2D( clearcoatNormalMap, vClearcoatNormalMapUv ).xyz * 2.0 - 1.0;
	clearcoatMapN.xy *= clearcoatNormalScale;
	clearcoatNormal = normalize( tbn2 * clearcoatMapN );
#endif`,iM=`#ifdef USE_CLEARCOATMAP
	uniform sampler2D clearcoatMap;
#endif
#ifdef USE_CLEARCOAT_NORMALMAP
	uniform sampler2D clearcoatNormalMap;
	uniform vec2 clearcoatNormalScale;
#endif
#ifdef USE_CLEARCOAT_ROUGHNESSMAP
	uniform sampler2D clearcoatRoughnessMap;
#endif`,sM=`#ifdef USE_IRIDESCENCEMAP
	uniform sampler2D iridescenceMap;
#endif
#ifdef USE_IRIDESCENCE_THICKNESSMAP
	uniform sampler2D iridescenceThicknessMap;
#endif`,rM=`#ifdef OPAQUE
diffuseColor.a = 1.0;
#endif
#ifdef USE_TRANSMISSION
diffuseColor.a *= material.transmissionAlpha;
#endif
gl_FragColor = vec4( outgoingLight, diffuseColor.a );`,oM=`vec3 packNormalToRGB( const in vec3 normal ) {
	return normalize( normal ) * 0.5 + 0.5;
}
vec3 unpackRGBToNormal( const in vec3 rgb ) {
	return 2.0 * rgb.xyz - 1.0;
}
const float PackUpscale = 256. / 255.;const float UnpackDownscale = 255. / 256.;const float ShiftRight8 = 1. / 256.;
const float Inv255 = 1. / 255.;
const vec4 PackFactors = vec4( 1.0, 256.0, 256.0 * 256.0, 256.0 * 256.0 * 256.0 );
const vec2 UnpackFactors2 = vec2( UnpackDownscale, 1.0 / PackFactors.g );
const vec3 UnpackFactors3 = vec3( UnpackDownscale / PackFactors.rg, 1.0 / PackFactors.b );
const vec4 UnpackFactors4 = vec4( UnpackDownscale / PackFactors.rgb, 1.0 / PackFactors.a );
vec4 packDepthToRGBA( const in float v ) {
	if( v <= 0.0 )
		return vec4( 0., 0., 0., 0. );
	if( v >= 1.0 )
		return vec4( 1., 1., 1., 1. );
	float vuf;
	float af = modf( v * PackFactors.a, vuf );
	float bf = modf( vuf * ShiftRight8, vuf );
	float gf = modf( vuf * ShiftRight8, vuf );
	return vec4( vuf * Inv255, gf * PackUpscale, bf * PackUpscale, af );
}
vec3 packDepthToRGB( const in float v ) {
	if( v <= 0.0 )
		return vec3( 0., 0., 0. );
	if( v >= 1.0 )
		return vec3( 1., 1., 1. );
	float vuf;
	float bf = modf( v * PackFactors.b, vuf );
	float gf = modf( vuf * ShiftRight8, vuf );
	return vec3( vuf * Inv255, gf * PackUpscale, bf );
}
vec2 packDepthToRG( const in float v ) {
	if( v <= 0.0 )
		return vec2( 0., 0. );
	if( v >= 1.0 )
		return vec2( 1., 1. );
	float vuf;
	float gf = modf( v * 256., vuf );
	return vec2( vuf * Inv255, gf );
}
float unpackRGBAToDepth( const in vec4 v ) {
	return dot( v, UnpackFactors4 );
}
float unpackRGBToDepth( const in vec3 v ) {
	return dot( v, UnpackFactors3 );
}
float unpackRGToDepth( const in vec2 v ) {
	return v.r * UnpackFactors2.r + v.g * UnpackFactors2.g;
}
vec4 pack2HalfToRGBA( const in vec2 v ) {
	vec4 r = vec4( v.x, fract( v.x * 255.0 ), v.y, fract( v.y * 255.0 ) );
	return vec4( r.x - r.y / 255.0, r.y, r.z - r.w / 255.0, r.w );
}
vec2 unpackRGBATo2Half( const in vec4 v ) {
	return vec2( v.x + ( v.y / 255.0 ), v.z + ( v.w / 255.0 ) );
}
float viewZToOrthographicDepth( const in float viewZ, const in float near, const in float far ) {
	return ( viewZ + near ) / ( near - far );
}
float orthographicDepthToViewZ( const in float depth, const in float near, const in float far ) {
	#ifdef USE_REVERSED_DEPTH_BUFFER
	
		return depth * ( far - near ) - far;
	#else
		return depth * ( near - far ) - near;
	#endif
}
float viewZToPerspectiveDepth( const in float viewZ, const in float near, const in float far ) {
	return ( ( near + viewZ ) * far ) / ( ( far - near ) * viewZ );
}
float perspectiveDepthToViewZ( const in float depth, const in float near, const in float far ) {
	
	#ifdef USE_REVERSED_DEPTH_BUFFER
		return ( near * far ) / ( ( near - far ) * depth - near );
	#else
		return ( near * far ) / ( ( far - near ) * depth - far );
	#endif
}`,aM=`#ifdef PREMULTIPLIED_ALPHA
	gl_FragColor.rgb *= gl_FragColor.a;
#endif`,cM=`vec4 mvPosition = vec4( transformed, 1.0 );
#ifdef USE_BATCHING
	mvPosition = batchingMatrix * mvPosition;
#endif
#ifdef USE_INSTANCING
	mvPosition = instanceMatrix * mvPosition;
#endif
mvPosition = modelViewMatrix * mvPosition;
gl_Position = projectionMatrix * mvPosition;`,lM=`#ifdef DITHERING
	gl_FragColor.rgb = dithering( gl_FragColor.rgb );
#endif`,uM=`#ifdef DITHERING
	vec3 dithering( vec3 color ) {
		float grid_position = rand( gl_FragCoord.xy );
		vec3 dither_shift_RGB = vec3( 0.25 / 255.0, -0.25 / 255.0, 0.25 / 255.0 );
		dither_shift_RGB = mix( 2.0 * dither_shift_RGB, -2.0 * dither_shift_RGB, grid_position );
		return color + dither_shift_RGB;
	}
#endif`,hM=`float roughnessFactor = roughness;
#ifdef USE_ROUGHNESSMAP
	vec4 texelRoughness = texture2D( roughnessMap, vRoughnessMapUv );
	roughnessFactor *= texelRoughness.g;
#endif`,fM=`#ifdef USE_ROUGHNESSMAP
	uniform sampler2D roughnessMap;
#endif`,dM=`#if NUM_SPOT_LIGHT_COORDS > 0
	varying vec4 vSpotLightCoord[ NUM_SPOT_LIGHT_COORDS ];
#endif
#if NUM_SPOT_LIGHT_MAPS > 0
	uniform sampler2D spotLightMap[ NUM_SPOT_LIGHT_MAPS ];
#endif
#ifdef USE_SHADOWMAP
	#if NUM_SUN_LIGHT_SHADOWS > 0
		#define SUN_LIGHT_CASCADES 2
		#if defined( SHADOWMAP_TYPE_PCF )
			uniform sampler2DShadow sunShadowMap[ NUM_SUN_LIGHT_SHADOWS ];
		#else
			uniform sampler2D sunShadowMap[ NUM_SUN_LIGHT_SHADOWS ];
		#endif
		uniform mat4 sunShadowMatrix[ NUM_SUN_LIGHT_SHADOWS * SUN_LIGHT_CASCADES ];
		uniform vec4 sunShadowCascade[ NUM_SUN_LIGHT_SHADOWS * SUN_LIGHT_CASCADES ];
		varying vec4 vSunShadowWorldPosition;
		varying vec3 vSunShadowWorldNormal;
		struct SunLightShadow {
			float shadowIntensity;
			float shadowBias;
			float shadowNormalBias;
			float shadowRadius;
			vec2 shadowMapSize;
		};
		uniform SunLightShadow sunLightShadows[ NUM_SUN_LIGHT_SHADOWS ];
	#endif
	#if NUM_DIR_LIGHT_SHADOWS > 0
		#if defined( SHADOWMAP_TYPE_PCF )
			uniform sampler2DShadow directionalShadowMap[ NUM_DIR_LIGHT_SHADOWS ];
		#else
			uniform sampler2D directionalShadowMap[ NUM_DIR_LIGHT_SHADOWS ];
		#endif
		varying vec4 vDirectionalShadowCoord[ NUM_DIR_LIGHT_SHADOWS ];
		struct DirectionalLightShadow {
			float shadowIntensity;
			float shadowBias;
			float shadowNormalBias;
			float shadowRadius;
			vec2 shadowMapSize;
		};
		uniform DirectionalLightShadow directionalLightShadows[ NUM_DIR_LIGHT_SHADOWS ];
	#endif
	#if NUM_SPOT_LIGHT_SHADOWS > 0
		#if defined( SHADOWMAP_TYPE_PCF )
			uniform sampler2DShadow spotShadowMap[ NUM_SPOT_LIGHT_SHADOWS ];
		#else
			uniform sampler2D spotShadowMap[ NUM_SPOT_LIGHT_SHADOWS ];
		#endif
		struct SpotLightShadow {
			float shadowIntensity;
			float shadowBias;
			float shadowNormalBias;
			float shadowRadius;
			vec2 shadowMapSize;
		};
		uniform SpotLightShadow spotLightShadows[ NUM_SPOT_LIGHT_SHADOWS ];
	#endif
	#if NUM_POINT_LIGHT_SHADOWS > 0
		#if defined( SHADOWMAP_TYPE_PCF )
			uniform samplerCubeShadow pointShadowMap[ NUM_POINT_LIGHT_SHADOWS ];
		#elif defined( SHADOWMAP_TYPE_BASIC )
			uniform samplerCube pointShadowMap[ NUM_POINT_LIGHT_SHADOWS ];
		#endif
		varying vec4 vPointShadowCoord[ NUM_POINT_LIGHT_SHADOWS ];
		struct PointLightShadow {
			float shadowIntensity;
			float shadowBias;
			float shadowNormalBias;
			float shadowRadius;
			vec2 shadowMapSize;
			float shadowCameraNear;
			float shadowCameraFar;
		};
		uniform PointLightShadow pointLightShadows[ NUM_POINT_LIGHT_SHADOWS ];
	#endif
	#if defined( SHADOWMAP_TYPE_PCF )
		float interleavedGradientNoise( vec2 position ) {
			return fract( 52.9829189 * fract( dot( position, vec2( 0.06711056, 0.00583715 ) ) ) );
		}
		vec2 vogelDiskSample( int sampleIndex, int samplesCount, float phi ) {
			const float goldenAngle = 2.399963229728653;
			float r = sqrt( ( float( sampleIndex ) + 0.5 ) / float( samplesCount ) );
			float theta = float( sampleIndex ) * goldenAngle + phi;
			return vec2( cos( theta ), sin( theta ) ) * r;
		}
	#endif
	#if defined( SHADOWMAP_TYPE_PCF )
		float getShadow( sampler2DShadow shadowMap, vec2 shadowMapSize, float shadowIntensity, float shadowBias, float shadowRadius, vec4 shadowCoord ) {
			float shadow = 1.0;
			shadowCoord.xyz /= shadowCoord.w;
			shadowCoord.z += shadowBias;
			bool inFrustum = shadowCoord.x >= 0.0 && shadowCoord.x <= 1.0 && shadowCoord.y >= 0.0 && shadowCoord.y <= 1.0;
			bool frustumTest = inFrustum && shadowCoord.z <= 1.0;
			if ( frustumTest ) {
				vec2 texelSize = vec2( 1.0 ) / shadowMapSize;
				float radius = shadowRadius * texelSize.x;
				float phi = interleavedGradientNoise( gl_FragCoord.xy ) * PI2;
				shadow = (
					texture( shadowMap, vec3( shadowCoord.xy + vogelDiskSample( 0, 5, phi ) * radius, shadowCoord.z ) ) +
					texture( shadowMap, vec3( shadowCoord.xy + vogelDiskSample( 1, 5, phi ) * radius, shadowCoord.z ) ) +
					texture( shadowMap, vec3( shadowCoord.xy + vogelDiskSample( 2, 5, phi ) * radius, shadowCoord.z ) ) +
					texture( shadowMap, vec3( shadowCoord.xy + vogelDiskSample( 3, 5, phi ) * radius, shadowCoord.z ) ) +
					texture( shadowMap, vec3( shadowCoord.xy + vogelDiskSample( 4, 5, phi ) * radius, shadowCoord.z ) )
				) * 0.2;
			}
			return mix( 1.0, shadow, shadowIntensity );
		}
	#elif defined( SHADOWMAP_TYPE_VSM )
		float getShadow( sampler2D shadowMap, vec2 shadowMapSize, float shadowIntensity, float shadowBias, float shadowRadius, vec4 shadowCoord ) {
			float shadow = 1.0;
			shadowCoord.xyz /= shadowCoord.w;
			#ifdef USE_REVERSED_DEPTH_BUFFER
				shadowCoord.z -= shadowBias;
			#else
				shadowCoord.z += shadowBias;
			#endif
			bool inFrustum = shadowCoord.x >= 0.0 && shadowCoord.x <= 1.0 && shadowCoord.y >= 0.0 && shadowCoord.y <= 1.0;
			bool frustumTest = inFrustum && shadowCoord.z <= 1.0;
			if ( frustumTest ) {
				vec2 distribution = texture2D( shadowMap, shadowCoord.xy ).rg;
				float mean = distribution.x;
				float variance = distribution.y * distribution.y;
				#ifdef USE_REVERSED_DEPTH_BUFFER
					float hard_shadow = step( mean, shadowCoord.z );
				#else
					float hard_shadow = step( shadowCoord.z, mean );
				#endif
				
				if ( hard_shadow == 1.0 ) {
					shadow = 1.0;
				} else {
					variance = max( variance, 0.0000001 );
					float d = shadowCoord.z - mean;
					float p_max = variance / ( variance + d * d );
					p_max = clamp( ( p_max - 0.3 ) / 0.65, 0.0, 1.0 );
					shadow = max( hard_shadow, p_max );
				}
			}
			return mix( 1.0, shadow, shadowIntensity );
		}
	#else
		float getShadow( sampler2D shadowMap, vec2 shadowMapSize, float shadowIntensity, float shadowBias, float shadowRadius, vec4 shadowCoord ) {
			float shadow = 1.0;
			shadowCoord.xyz /= shadowCoord.w;
			#ifdef USE_REVERSED_DEPTH_BUFFER
				shadowCoord.z -= shadowBias;
			#else
				shadowCoord.z += shadowBias;
			#endif
			bool inFrustum = shadowCoord.x >= 0.0 && shadowCoord.x <= 1.0 && shadowCoord.y >= 0.0 && shadowCoord.y <= 1.0;
			bool frustumTest = inFrustum && shadowCoord.z <= 1.0;
			if ( frustumTest ) {
				float depth = texture2D( shadowMap, shadowCoord.xy ).r;
				#ifdef USE_REVERSED_DEPTH_BUFFER
					shadow = step( depth, shadowCoord.z );
				#else
					shadow = step( shadowCoord.z, depth );
				#endif
			}
			return mix( 1.0, shadow, shadowIntensity );
		}
	#endif
	#if NUM_SUN_LIGHT_SHADOWS > 0
		float getSunShadow(
			#if defined( SHADOWMAP_TYPE_PCF )
				sampler2DShadow shadowMap,
			#else
				sampler2D shadowMap,
			#endif
			SunLightShadow sunLightShadow,
			int shadowIndex
		) {
			vec4 shadowWorldPosition = vec4( vSunShadowWorldPosition.xyz + vSunShadowWorldNormal * sunLightShadow.shadowNormalBias, 1.0 );
			float viewDepth = vSunShadowWorldPosition.w;
			int cascadeOffset = shadowIndex * SUN_LIGHT_CASCADES;
			float shadow = 1.0;
			for ( int i = SUN_LIGHT_CASCADES - 1; i >= 0; i -- ) {
				vec4 cascade = sunShadowCascade[ cascadeOffset + i ];
				if ( viewDepth >= cascade.x && viewDepth < cascade.y ) {
					float cascadeShadow = getShadow(
						shadowMap,
						sunLightShadow.shadowMapSize,
						sunLightShadow.shadowIntensity,
						sunLightShadow.shadowBias,
						sunLightShadow.shadowRadius,
						sunShadowMatrix[ cascadeOffset + i ] * shadowWorldPosition
					);
					shadow = mix( cascadeShadow, shadow, smoothstep( cascade.z, cascade.y, viewDepth ) );
				}
			}
			return shadow;
		}
	#endif
	#if NUM_POINT_LIGHT_SHADOWS > 0
	#if defined( SHADOWMAP_TYPE_PCF )
	float getPointShadow( samplerCubeShadow shadowMap, vec2 shadowMapSize, float shadowIntensity, float shadowBias, float shadowRadius, vec4 shadowCoord, float shadowCameraNear, float shadowCameraFar ) {
		float shadow = 1.0;
		vec3 lightToPosition = shadowCoord.xyz;
		vec3 bd3D = normalize( lightToPosition );
		vec3 absVec = abs( lightToPosition );
		float viewSpaceZ = max( max( absVec.x, absVec.y ), absVec.z );
		if ( viewSpaceZ - shadowCameraFar <= 0.0 && viewSpaceZ - shadowCameraNear >= 0.0 ) {
			#ifdef USE_REVERSED_DEPTH_BUFFER
				float dp = ( shadowCameraNear * ( shadowCameraFar - viewSpaceZ ) ) / ( viewSpaceZ * ( shadowCameraFar - shadowCameraNear ) );
				dp -= shadowBias;
			#else
				float dp = ( shadowCameraFar * ( viewSpaceZ - shadowCameraNear ) ) / ( viewSpaceZ * ( shadowCameraFar - shadowCameraNear ) );
				dp += shadowBias;
			#endif
			float texelSize = shadowRadius / shadowMapSize.x;
			vec3 absDir = abs( bd3D );
			vec3 tangent = absDir.x > absDir.z ? vec3( 0.0, 1.0, 0.0 ) : vec3( 1.0, 0.0, 0.0 );
			tangent = normalize( cross( bd3D, tangent ) );
			vec3 bitangent = cross( bd3D, tangent );
			float phi = interleavedGradientNoise( gl_FragCoord.xy ) * PI2;
			vec2 sample0 = vogelDiskSample( 0, 5, phi );
			vec2 sample1 = vogelDiskSample( 1, 5, phi );
			vec2 sample2 = vogelDiskSample( 2, 5, phi );
			vec2 sample3 = vogelDiskSample( 3, 5, phi );
			vec2 sample4 = vogelDiskSample( 4, 5, phi );
			shadow = (
				texture( shadowMap, vec4( bd3D + ( tangent * sample0.x + bitangent * sample0.y ) * texelSize, dp ) ) +
				texture( shadowMap, vec4( bd3D + ( tangent * sample1.x + bitangent * sample1.y ) * texelSize, dp ) ) +
				texture( shadowMap, vec4( bd3D + ( tangent * sample2.x + bitangent * sample2.y ) * texelSize, dp ) ) +
				texture( shadowMap, vec4( bd3D + ( tangent * sample3.x + bitangent * sample3.y ) * texelSize, dp ) ) +
				texture( shadowMap, vec4( bd3D + ( tangent * sample4.x + bitangent * sample4.y ) * texelSize, dp ) )
			) * 0.2;
		}
		return mix( 1.0, shadow, shadowIntensity );
	}
	#elif defined( SHADOWMAP_TYPE_BASIC )
	float getPointShadow( samplerCube shadowMap, vec2 shadowMapSize, float shadowIntensity, float shadowBias, float shadowRadius, vec4 shadowCoord, float shadowCameraNear, float shadowCameraFar ) {
		float shadow = 1.0;
		vec3 lightToPosition = shadowCoord.xyz;
		vec3 absVec = abs( lightToPosition );
		float viewSpaceZ = max( max( absVec.x, absVec.y ), absVec.z );
		if ( viewSpaceZ - shadowCameraFar <= 0.0 && viewSpaceZ - shadowCameraNear >= 0.0 ) {
			float dp = ( shadowCameraFar * ( viewSpaceZ - shadowCameraNear ) ) / ( viewSpaceZ * ( shadowCameraFar - shadowCameraNear ) );
			dp += shadowBias;
			vec3 bd3D = normalize( lightToPosition );
			float depth = textureCube( shadowMap, bd3D ).r;
			#ifdef USE_REVERSED_DEPTH_BUFFER
				depth = 1.0 - depth;
			#endif
			shadow = step( dp, depth );
		}
		return mix( 1.0, shadow, shadowIntensity );
	}
	#endif
	#endif
#endif`,pM=`#if NUM_SPOT_LIGHT_COORDS > 0
	uniform mat4 spotLightMatrix[ NUM_SPOT_LIGHT_COORDS ];
	varying vec4 vSpotLightCoord[ NUM_SPOT_LIGHT_COORDS ];
#endif
#ifdef USE_SHADOWMAP
	#if NUM_SUN_LIGHT_SHADOWS > 0
		varying vec4 vSunShadowWorldPosition;
		varying vec3 vSunShadowWorldNormal;
	#endif
	#if NUM_DIR_LIGHT_SHADOWS > 0
		uniform mat4 directionalShadowMatrix[ NUM_DIR_LIGHT_SHADOWS ];
		varying vec4 vDirectionalShadowCoord[ NUM_DIR_LIGHT_SHADOWS ];
		struct DirectionalLightShadow {
			float shadowIntensity;
			float shadowBias;
			float shadowNormalBias;
			float shadowRadius;
			vec2 shadowMapSize;
		};
		uniform DirectionalLightShadow directionalLightShadows[ NUM_DIR_LIGHT_SHADOWS ];
	#endif
	#if NUM_SPOT_LIGHT_SHADOWS > 0
		struct SpotLightShadow {
			float shadowIntensity;
			float shadowBias;
			float shadowNormalBias;
			float shadowRadius;
			vec2 shadowMapSize;
		};
		uniform SpotLightShadow spotLightShadows[ NUM_SPOT_LIGHT_SHADOWS ];
	#endif
	#if NUM_POINT_LIGHT_SHADOWS > 0
		uniform mat4 pointShadowMatrix[ NUM_POINT_LIGHT_SHADOWS ];
		varying vec4 vPointShadowCoord[ NUM_POINT_LIGHT_SHADOWS ];
		struct PointLightShadow {
			float shadowIntensity;
			float shadowBias;
			float shadowNormalBias;
			float shadowRadius;
			vec2 shadowMapSize;
			float shadowCameraNear;
			float shadowCameraFar;
		};
		uniform PointLightShadow pointLightShadows[ NUM_POINT_LIGHT_SHADOWS ];
	#endif
#endif`,mM=`#if ( defined( USE_SHADOWMAP ) && ( NUM_DIR_LIGHT_SHADOWS > 0 || NUM_SUN_LIGHT_SHADOWS > 0 || NUM_POINT_LIGHT_SHADOWS > 0 ) ) || ( NUM_SPOT_LIGHT_COORDS > 0 )
	#ifdef HAS_NORMAL
		vec3 shadowWorldNormal = transformNormalByInverseViewMatrix( transformedNormal, viewMatrix );
	#else
		vec3 shadowWorldNormal = vec3( 0.0 );
	#endif
	vec4 shadowWorldPosition;
#endif
#if defined( USE_SHADOWMAP )
	#if NUM_SUN_LIGHT_SHADOWS > 0
		vSunShadowWorldPosition = vec4( worldPosition.xyz, - mvPosition.z );
		vSunShadowWorldNormal = shadowWorldNormal;
	#endif
	#if NUM_DIR_LIGHT_SHADOWS > 0
		#pragma unroll_loop_start
		for ( int i = 0; i < NUM_DIR_LIGHT_SHADOWS; i ++ ) {
			shadowWorldPosition = worldPosition + vec4( shadowWorldNormal * directionalLightShadows[ i ].shadowNormalBias, 0 );
			vDirectionalShadowCoord[ i ] = directionalShadowMatrix[ i ] * shadowWorldPosition;
		}
		#pragma unroll_loop_end
	#endif
	#if NUM_POINT_LIGHT_SHADOWS > 0
		#pragma unroll_loop_start
		for ( int i = 0; i < NUM_POINT_LIGHT_SHADOWS; i ++ ) {
			shadowWorldPosition = worldPosition + vec4( shadowWorldNormal * pointLightShadows[ i ].shadowNormalBias, 0 );
			vPointShadowCoord[ i ] = pointShadowMatrix[ i ] * shadowWorldPosition;
		}
		#pragma unroll_loop_end
	#endif
#endif
#if NUM_SPOT_LIGHT_COORDS > 0
	#pragma unroll_loop_start
	for ( int i = 0; i < NUM_SPOT_LIGHT_COORDS; i ++ ) {
		shadowWorldPosition = worldPosition;
		#if ( defined( USE_SHADOWMAP ) && UNROLLED_LOOP_INDEX < NUM_SPOT_LIGHT_SHADOWS )
			shadowWorldPosition.xyz += shadowWorldNormal * spotLightShadows[ i ].shadowNormalBias;
		#endif
		vSpotLightCoord[ i ] = spotLightMatrix[ i ] * shadowWorldPosition;
	}
	#pragma unroll_loop_end
#endif`,gM=`float getShadowMask() {
	float shadow = 1.0;
	#ifdef USE_SHADOWMAP
	#if NUM_SUN_LIGHT_SHADOWS > 0
	SunLightShadow sunLight;
	#pragma unroll_loop_start
	for ( int i = 0; i < NUM_SUN_LIGHT_SHADOWS; i ++ ) {
		sunLight = sunLightShadows[ i ];
		shadow *= receiveShadow ? getSunShadow( sunShadowMap[ i ], sunLight, UNROLLED_LOOP_INDEX ) : 1.0;
	}
	#pragma unroll_loop_end
	#endif
	#if NUM_DIR_LIGHT_SHADOWS > 0
	DirectionalLightShadow directionalLight;
	#pragma unroll_loop_start
	for ( int i = 0; i < NUM_DIR_LIGHT_SHADOWS; i ++ ) {
		directionalLight = directionalLightShadows[ i ];
		shadow *= receiveShadow ? getShadow( directionalShadowMap[ i ], directionalLight.shadowMapSize, directionalLight.shadowIntensity, directionalLight.shadowBias, directionalLight.shadowRadius, vDirectionalShadowCoord[ i ] ) : 1.0;
	}
	#pragma unroll_loop_end
	#endif
	#if NUM_SPOT_LIGHT_SHADOWS > 0
	SpotLightShadow spotLight;
	#pragma unroll_loop_start
	for ( int i = 0; i < NUM_SPOT_LIGHT_SHADOWS; i ++ ) {
		spotLight = spotLightShadows[ i ];
		shadow *= receiveShadow ? getShadow( spotShadowMap[ i ], spotLight.shadowMapSize, spotLight.shadowIntensity, spotLight.shadowBias, spotLight.shadowRadius, vSpotLightCoord[ i ] ) : 1.0;
	}
	#pragma unroll_loop_end
	#endif
	#if NUM_POINT_LIGHT_SHADOWS > 0 && ( defined( SHADOWMAP_TYPE_PCF ) || defined( SHADOWMAP_TYPE_BASIC ) )
	PointLightShadow pointLight;
	#pragma unroll_loop_start
	for ( int i = 0; i < NUM_POINT_LIGHT_SHADOWS; i ++ ) {
		pointLight = pointLightShadows[ i ];
		shadow *= receiveShadow ? getPointShadow( pointShadowMap[ i ], pointLight.shadowMapSize, pointLight.shadowIntensity, pointLight.shadowBias, pointLight.shadowRadius, vPointShadowCoord[ i ], pointLight.shadowCameraNear, pointLight.shadowCameraFar ) : 1.0;
	}
	#pragma unroll_loop_end
	#endif
	#endif
	return shadow;
}`,_M=`#ifdef USE_SKINNING
	mat4 boneMatX = getBoneMatrix( skinIndex.x );
	mat4 boneMatY = getBoneMatrix( skinIndex.y );
	mat4 boneMatZ = getBoneMatrix( skinIndex.z );
	mat4 boneMatW = getBoneMatrix( skinIndex.w );
#endif`,xM=`#ifdef USE_SKINNING
	uniform mat4 bindMatrix;
	uniform mat4 bindMatrixInverse;
	uniform highp sampler2D boneTexture;
	mat4 getBoneMatrix( const in float i ) {
		int size = textureSize( boneTexture, 0 ).x;
		int j = int( i ) * 4;
		int x = j % size;
		int y = j / size;
		vec4 v1 = texelFetch( boneTexture, ivec2( x, y ), 0 );
		vec4 v2 = texelFetch( boneTexture, ivec2( x + 1, y ), 0 );
		vec4 v3 = texelFetch( boneTexture, ivec2( x + 2, y ), 0 );
		vec4 v4 = texelFetch( boneTexture, ivec2( x + 3, y ), 0 );
		return mat4( v1, v2, v3, v4 );
	}
#endif`,yM=`#ifdef USE_SKINNING
	vec4 skinVertex = bindMatrix * vec4( transformed, 1.0 );
	vec4 skinned = vec4( 0.0 );
	skinned += boneMatX * skinVertex * skinWeight.x;
	skinned += boneMatY * skinVertex * skinWeight.y;
	skinned += boneMatZ * skinVertex * skinWeight.z;
	skinned += boneMatW * skinVertex * skinWeight.w;
	transformed = ( bindMatrixInverse * skinned ).xyz;
#endif`,vM=`#ifdef USE_SKINNING
	mat4 skinMatrix = mat4( 0.0 );
	skinMatrix += skinWeight.x * boneMatX;
	skinMatrix += skinWeight.y * boneMatY;
	skinMatrix += skinWeight.z * boneMatZ;
	skinMatrix += skinWeight.w * boneMatW;
	skinMatrix = bindMatrixInverse * skinMatrix * bindMatrix;
	objectNormal = vec4( skinMatrix * vec4( objectNormal, 0.0 ) ).xyz;
	#ifdef USE_TANGENT
		objectTangent = vec4( skinMatrix * vec4( objectTangent, 0.0 ) ).xyz;
	#endif
#endif`,SM=`float specularStrength;
#ifdef USE_SPECULARMAP
	vec4 texelSpecular = texture2D( specularMap, vSpecularMapUv );
	specularStrength = texelSpecular.r;
#else
	specularStrength = 1.0;
#endif`,bM=`#ifdef USE_SPECULARMAP
	uniform sampler2D specularMap;
#endif`,MM=`#if defined( TONE_MAPPING )
	gl_FragColor.rgb = toneMapping( gl_FragColor.rgb );
#endif`,TM=`#ifndef saturate
#define saturate( a ) clamp( a, 0.0, 1.0 )
#endif
uniform float toneMappingExposure;
vec3 LinearToneMapping( vec3 color ) {
	return saturate( toneMappingExposure * color );
}
vec3 ReinhardToneMapping( vec3 color ) {
	color *= toneMappingExposure;
	return saturate( color / ( vec3( 1.0 ) + color ) );
}
vec3 CineonToneMapping( vec3 color ) {
	color *= toneMappingExposure;
	color = max( vec3( 0.0 ), color - 0.004 );
	return pow( ( color * ( 6.2 * color + 0.5 ) ) / ( color * ( 6.2 * color + 1.7 ) + 0.06 ), vec3( 2.2 ) );
}
vec3 RRTAndODTFit( vec3 v ) {
	vec3 a = v * ( v + 0.0245786 ) - 0.000090537;
	vec3 b = v * ( 0.983729 * v + 0.4329510 ) + 0.238081;
	return a / b;
}
vec3 ACESFilmicToneMapping( vec3 color ) {
	const mat3 ACESInputMat = mat3(
		vec3( 0.59719, 0.07600, 0.02840 ),		vec3( 0.35458, 0.90834, 0.13383 ),
		vec3( 0.04823, 0.01566, 0.83777 )
	);
	const mat3 ACESOutputMat = mat3(
		vec3(  1.60475, -0.10208, -0.00327 ),		vec3( -0.53108,  1.10813, -0.07276 ),
		vec3( -0.07367, -0.00605,  1.07602 )
	);
	color *= toneMappingExposure / 0.6;
	color = ACESInputMat * color;
	color = RRTAndODTFit( color );
	color = ACESOutputMat * color;
	return saturate( color );
}
const mat3 LINEAR_REC2020_TO_LINEAR_SRGB = mat3(
	vec3( 1.6605, - 0.1246, - 0.0182 ),
	vec3( - 0.5876, 1.1329, - 0.1006 ),
	vec3( - 0.0728, - 0.0083, 1.1187 )
);
const mat3 LINEAR_SRGB_TO_LINEAR_REC2020 = mat3(
	vec3( 0.6274, 0.0691, 0.0164 ),
	vec3( 0.3293, 0.9195, 0.0880 ),
	vec3( 0.0433, 0.0113, 0.8956 )
);
vec3 agxDefaultContrastApprox( vec3 x ) {
	vec3 x2 = x * x;
	vec3 x4 = x2 * x2;
	return + 15.5 * x4 * x2
		- 40.14 * x4 * x
		+ 31.96 * x4
		- 6.868 * x2 * x
		+ 0.4298 * x2
		+ 0.1191 * x
		- 0.00232;
}
vec3 AgXToneMapping( vec3 color ) {
	const mat3 AgXInsetMatrix = mat3(
		vec3( 0.856627153315983, 0.137318972929847, 0.11189821299995 ),
		vec3( 0.0951212405381588, 0.761241990602591, 0.0767994186031903 ),
		vec3( 0.0482516061458583, 0.101439036467562, 0.811302368396859 )
	);
	const mat3 AgXOutsetMatrix = mat3(
		vec3( 1.1271005818144368, - 0.1413297634984383, - 0.14132976349843826 ),
		vec3( - 0.11060664309660323, 1.157823702216272, - 0.11060664309660294 ),
		vec3( - 0.016493938717834573, - 0.016493938717834257, 1.2519364065950405 )
	);
	const float AgxMinEv = - 12.47393;	const float AgxMaxEv = 4.026069;
	color *= toneMappingExposure;
	color = LINEAR_SRGB_TO_LINEAR_REC2020 * color;
	color = AgXInsetMatrix * color;
	color = max( color, 1e-10 );	color = log2( color );
	color = ( color - AgxMinEv ) / ( AgxMaxEv - AgxMinEv );
	color = clamp( color, 0.0, 1.0 );
	color = agxDefaultContrastApprox( color );
	color = AgXOutsetMatrix * color;
	color = pow( max( vec3( 0.0 ), color ), vec3( 2.2 ) );
	color = LINEAR_REC2020_TO_LINEAR_SRGB * color;
	color = clamp( color, 0.0, 1.0 );
	return color;
}
vec3 NeutralToneMapping( vec3 color ) {
	const float StartCompression = 0.8 - 0.04;
	const float Desaturation = 0.15;
	color *= toneMappingExposure;
	float x = min( color.r, min( color.g, color.b ) );
	float offset = x < 0.08 ? x - 6.25 * x * x : 0.04;
	color -= offset;
	float peak = max( color.r, max( color.g, color.b ) );
	if ( peak < StartCompression ) return color;
	float d = 1. - StartCompression;
	float newPeak = 1. - d * d / ( peak + d - StartCompression );
	color *= newPeak / peak;
	float g = 1. - 1. / ( Desaturation * ( peak - newPeak ) + 1. );
	return mix( color, vec3( newPeak ), g );
}
vec3 CustomToneMapping( vec3 color ) { return color; }`,wM=`#ifdef USE_TRANSMISSION
	material.transmission = transmission;
	material.transmissionAlpha = 1.0;
	material.thickness = thickness;
	material.attenuationDistance = attenuationDistance;
	material.attenuationColor = attenuationColor;
	#ifdef USE_TRANSMISSIONMAP
		material.transmission *= texture2D( transmissionMap, vTransmissionMapUv ).r;
	#endif
	#ifdef USE_THICKNESSMAP
		material.thickness *= texture2D( thicknessMap, vThicknessMapUv ).g;
	#endif
	vec3 pos = vWorldPosition;
	vec3 v = normalize( cameraPosition - pos );
	vec3 n = transformNormalByInverseViewMatrix( normal, viewMatrix );
	vec4 transmitted = getIBLVolumeRefraction(
		n, v, material.roughness, material.diffuseContribution, material.specularColorBlended, material.specularF90,
		pos, modelMatrix, viewMatrix, projectionMatrix, material.dispersion, material.ior, material.thickness,
		material.attenuationColor, material.attenuationDistance );
	material.transmissionAlpha = mix( material.transmissionAlpha, transmitted.a, material.transmission );
	totalDiffuse = mix( totalDiffuse, transmitted.rgb, material.transmission );
#endif`,EM=`#ifdef USE_TRANSMISSION
	uniform float transmission;
	uniform float thickness;
	uniform float attenuationDistance;
	uniform vec3 attenuationColor;
	#ifdef USE_TRANSMISSIONMAP
		uniform sampler2D transmissionMap;
	#endif
	#ifdef USE_THICKNESSMAP
		uniform sampler2D thicknessMap;
	#endif
	uniform vec2 transmissionSamplerSize;
	uniform sampler2D transmissionSamplerMap;
	uniform mat4 modelMatrix;
	uniform mat4 projectionMatrix;
	varying vec3 vWorldPosition;
	float w0( float a ) {
		return ( 1.0 / 6.0 ) * ( a * ( a * ( - a + 3.0 ) - 3.0 ) + 1.0 );
	}
	float w1( float a ) {
		return ( 1.0 / 6.0 ) * ( a *  a * ( 3.0 * a - 6.0 ) + 4.0 );
	}
	float w2( float a ){
		return ( 1.0 / 6.0 ) * ( a * ( a * ( - 3.0 * a + 3.0 ) + 3.0 ) + 1.0 );
	}
	float w3( float a ) {
		return ( 1.0 / 6.0 ) * ( a * a * a );
	}
	float g0( float a ) {
		return w0( a ) + w1( a );
	}
	float g1( float a ) {
		return w2( a ) + w3( a );
	}
	float h0( float a ) {
		return - 1.0 + w1( a ) / ( w0( a ) + w1( a ) );
	}
	float h1( float a ) {
		return 1.0 + w3( a ) / ( w2( a ) + w3( a ) );
	}
	vec4 bicubic( sampler2D tex, vec2 uv, vec4 texelSize, float lod ) {
		uv = uv * texelSize.zw + 0.5;
		vec2 iuv = floor( uv );
		vec2 fuv = fract( uv );
		float g0x = g0( fuv.x );
		float g1x = g1( fuv.x );
		float h0x = h0( fuv.x );
		float h1x = h1( fuv.x );
		float h0y = h0( fuv.y );
		float h1y = h1( fuv.y );
		vec2 p0 = ( vec2( iuv.x + h0x, iuv.y + h0y ) - 0.5 ) * texelSize.xy;
		vec2 p1 = ( vec2( iuv.x + h1x, iuv.y + h0y ) - 0.5 ) * texelSize.xy;
		vec2 p2 = ( vec2( iuv.x + h0x, iuv.y + h1y ) - 0.5 ) * texelSize.xy;
		vec2 p3 = ( vec2( iuv.x + h1x, iuv.y + h1y ) - 0.5 ) * texelSize.xy;
		return g0( fuv.y ) * ( g0x * textureLod( tex, p0, lod ) + g1x * textureLod( tex, p1, lod ) ) +
			g1( fuv.y ) * ( g0x * textureLod( tex, p2, lod ) + g1x * textureLod( tex, p3, lod ) );
	}
	vec4 textureBicubic( sampler2D sampler, vec2 uv, float lod ) {
		vec2 fLodSize = vec2( textureSize( sampler, int( lod ) ) );
		vec2 cLodSize = vec2( textureSize( sampler, int( lod + 1.0 ) ) );
		vec2 fLodSizeInv = 1.0 / fLodSize;
		vec2 cLodSizeInv = 1.0 / cLodSize;
		vec4 fSample = bicubic( sampler, uv, vec4( fLodSizeInv, fLodSize ), floor( lod ) );
		vec4 cSample = bicubic( sampler, uv, vec4( cLodSizeInv, cLodSize ), ceil( lod ) );
		return mix( fSample, cSample, fract( lod ) );
	}
	vec3 getVolumeTransmissionRay( const in vec3 n, const in vec3 v, const in float thickness, const in float ior, const in mat4 modelMatrix ) {
		vec3 refractionVector = refract( - v, normalize( n ), 1.0 / ior );
		vec3 modelScale;
		modelScale.x = length( vec3( modelMatrix[ 0 ].xyz ) );
		modelScale.y = length( vec3( modelMatrix[ 1 ].xyz ) );
		modelScale.z = length( vec3( modelMatrix[ 2 ].xyz ) );
		return normalize( refractionVector ) * thickness * modelScale;
	}
	float applyIorToRoughness( const in float roughness, const in float ior ) {
		return roughness * clamp( ior * 2.0 - 2.0, 0.0, 1.0 );
	}
	vec4 getTransmissionSample( const in vec2 fragCoord, const in float roughness, const in float ior ) {
		float lod = log2( transmissionSamplerSize.x ) * applyIorToRoughness( roughness, ior );
		return textureBicubic( transmissionSamplerMap, fragCoord.xy, lod );
	}
	vec3 volumeAttenuation( const in float transmissionDistance, const in vec3 attenuationColor, const in float attenuationDistance ) {
		if ( isinf( attenuationDistance ) ) {
			return vec3( 1.0 );
		} else {
			vec3 attenuationCoefficient = -log( attenuationColor ) / attenuationDistance;
			vec3 transmittance = exp( - attenuationCoefficient * transmissionDistance );			return transmittance;
		}
	}
	vec4 getIBLVolumeRefraction( const in vec3 n, const in vec3 v, const in float roughness, const in vec3 diffuseColor,
		const in vec3 specularColor, const in float specularF90, const in vec3 position, const in mat4 modelMatrix,
		const in mat4 viewMatrix, const in mat4 projMatrix, const in float dispersion, const in float ior, const in float thickness,
		const in vec3 attenuationColor, const in float attenuationDistance ) {
		vec4 transmittedLight;
		vec3 transmittance;
		#ifdef USE_DISPERSION
			float halfSpread = ( ior - 1.0 ) * 0.025 * dispersion;
			vec3 iors = vec3( ior - halfSpread, ior, ior + halfSpread );
			for ( int i = 0; i < 3; i ++ ) {
				vec3 transmissionRay = getVolumeTransmissionRay( n, v, thickness, iors[ i ], modelMatrix );
				vec3 refractedRayExit = position + transmissionRay;
				vec4 ndcPos = projMatrix * viewMatrix * vec4( refractedRayExit, 1.0 );
				vec2 refractionCoords = ndcPos.xy / ndcPos.w;
				refractionCoords += 1.0;
				refractionCoords /= 2.0;
				vec4 transmissionSample = getTransmissionSample( refractionCoords, roughness, iors[ i ] );
				transmittedLight[ i ] = transmissionSample[ i ];
				transmittedLight.a += transmissionSample.a;
				transmittance[ i ] = diffuseColor[ i ] * volumeAttenuation( length( transmissionRay ), attenuationColor, attenuationDistance )[ i ];
			}
			transmittedLight.a /= 3.0;
		#else
			vec3 transmissionRay = getVolumeTransmissionRay( n, v, thickness, ior, modelMatrix );
			vec3 refractedRayExit = position + transmissionRay;
			vec4 ndcPos = projMatrix * viewMatrix * vec4( refractedRayExit, 1.0 );
			vec2 refractionCoords = ndcPos.xy / ndcPos.w;
			refractionCoords += 1.0;
			refractionCoords /= 2.0;
			transmittedLight = getTransmissionSample( refractionCoords, roughness, ior );
			transmittance = diffuseColor * volumeAttenuation( length( transmissionRay ), attenuationColor, attenuationDistance );
		#endif
		vec3 attenuatedColor = transmittance * transmittedLight.rgb;
		vec3 F = EnvironmentBRDF( n, v, specularColor, specularF90, roughness );
		float transmittanceFactor = ( transmittance.r + transmittance.g + transmittance.b ) / 3.0;
		return vec4( ( 1.0 - F ) * attenuatedColor, 1.0 - ( 1.0 - transmittedLight.a ) * transmittanceFactor );
	}
#endif`,AM=`#if defined( USE_UV ) || defined( USE_ANISOTROPY )
	varying vec2 vUv;
#endif
#ifdef USE_MAP
	varying vec2 vMapUv;
#endif
#ifdef USE_ALPHAMAP
	varying vec2 vAlphaMapUv;
#endif
#ifdef USE_LIGHTMAP
	varying vec2 vLightMapUv;
#endif
#ifdef USE_AOMAP
	varying vec2 vAoMapUv;
#endif
#ifdef USE_BUMPMAP
	varying vec2 vBumpMapUv;
#endif
#ifdef USE_NORMALMAP
	varying vec2 vNormalMapUv;
#endif
#ifdef USE_EMISSIVEMAP
	varying vec2 vEmissiveMapUv;
#endif
#ifdef USE_METALNESSMAP
	varying vec2 vMetalnessMapUv;
#endif
#ifdef USE_ROUGHNESSMAP
	varying vec2 vRoughnessMapUv;
#endif
#ifdef USE_ANISOTROPYMAP
	varying vec2 vAnisotropyMapUv;
#endif
#ifdef USE_CLEARCOATMAP
	varying vec2 vClearcoatMapUv;
#endif
#ifdef USE_CLEARCOAT_NORMALMAP
	varying vec2 vClearcoatNormalMapUv;
#endif
#ifdef USE_CLEARCOAT_ROUGHNESSMAP
	varying vec2 vClearcoatRoughnessMapUv;
#endif
#ifdef USE_IRIDESCENCEMAP
	varying vec2 vIridescenceMapUv;
#endif
#ifdef USE_IRIDESCENCE_THICKNESSMAP
	varying vec2 vIridescenceThicknessMapUv;
#endif
#ifdef USE_SHEEN_COLORMAP
	varying vec2 vSheenColorMapUv;
#endif
#ifdef USE_SHEEN_ROUGHNESSMAP
	varying vec2 vSheenRoughnessMapUv;
#endif
#ifdef USE_SPECULARMAP
	varying vec2 vSpecularMapUv;
#endif
#ifdef USE_SPECULAR_COLORMAP
	varying vec2 vSpecularColorMapUv;
#endif
#ifdef USE_SPECULAR_INTENSITYMAP
	varying vec2 vSpecularIntensityMapUv;
#endif
#ifdef USE_TRANSMISSIONMAP
	uniform mat3 transmissionMapTransform;
	varying vec2 vTransmissionMapUv;
#endif
#ifdef USE_THICKNESSMAP
	uniform mat3 thicknessMapTransform;
	varying vec2 vThicknessMapUv;
#endif`,CM=`#if defined( USE_UV ) || defined( USE_ANISOTROPY )
	varying vec2 vUv;
#endif
#ifdef USE_MAP
	uniform mat3 mapTransform;
	varying vec2 vMapUv;
#endif
#ifdef USE_ALPHAMAP
	uniform mat3 alphaMapTransform;
	varying vec2 vAlphaMapUv;
#endif
#ifdef USE_LIGHTMAP
	uniform mat3 lightMapTransform;
	varying vec2 vLightMapUv;
#endif
#ifdef USE_AOMAP
	uniform mat3 aoMapTransform;
	varying vec2 vAoMapUv;
#endif
#ifdef USE_BUMPMAP
	uniform mat3 bumpMapTransform;
	varying vec2 vBumpMapUv;
#endif
#ifdef USE_NORMALMAP
	uniform mat3 normalMapTransform;
	varying vec2 vNormalMapUv;
#endif
#ifdef USE_DISPLACEMENTMAP
	uniform mat3 displacementMapTransform;
	varying vec2 vDisplacementMapUv;
#endif
#ifdef USE_EMISSIVEMAP
	uniform mat3 emissiveMapTransform;
	varying vec2 vEmissiveMapUv;
#endif
#ifdef USE_METALNESSMAP
	uniform mat3 metalnessMapTransform;
	varying vec2 vMetalnessMapUv;
#endif
#ifdef USE_ROUGHNESSMAP
	uniform mat3 roughnessMapTransform;
	varying vec2 vRoughnessMapUv;
#endif
#ifdef USE_ANISOTROPYMAP
	uniform mat3 anisotropyMapTransform;
	varying vec2 vAnisotropyMapUv;
#endif
#ifdef USE_CLEARCOATMAP
	uniform mat3 clearcoatMapTransform;
	varying vec2 vClearcoatMapUv;
#endif
#ifdef USE_CLEARCOAT_NORMALMAP
	uniform mat3 clearcoatNormalMapTransform;
	varying vec2 vClearcoatNormalMapUv;
#endif
#ifdef USE_CLEARCOAT_ROUGHNESSMAP
	uniform mat3 clearcoatRoughnessMapTransform;
	varying vec2 vClearcoatRoughnessMapUv;
#endif
#ifdef USE_SHEEN_COLORMAP
	uniform mat3 sheenColorMapTransform;
	varying vec2 vSheenColorMapUv;
#endif
#ifdef USE_SHEEN_ROUGHNESSMAP
	uniform mat3 sheenRoughnessMapTransform;
	varying vec2 vSheenRoughnessMapUv;
#endif
#ifdef USE_IRIDESCENCEMAP
	uniform mat3 iridescenceMapTransform;
	varying vec2 vIridescenceMapUv;
#endif
#ifdef USE_IRIDESCENCE_THICKNESSMAP
	uniform mat3 iridescenceThicknessMapTransform;
	varying vec2 vIridescenceThicknessMapUv;
#endif
#ifdef USE_SPECULARMAP
	uniform mat3 specularMapTransform;
	varying vec2 vSpecularMapUv;
#endif
#ifdef USE_SPECULAR_COLORMAP
	uniform mat3 specularColorMapTransform;
	varying vec2 vSpecularColorMapUv;
#endif
#ifdef USE_SPECULAR_INTENSITYMAP
	uniform mat3 specularIntensityMapTransform;
	varying vec2 vSpecularIntensityMapUv;
#endif
#ifdef USE_TRANSMISSIONMAP
	uniform mat3 transmissionMapTransform;
	varying vec2 vTransmissionMapUv;
#endif
#ifdef USE_THICKNESSMAP
	uniform mat3 thicknessMapTransform;
	varying vec2 vThicknessMapUv;
#endif`,RM=`#if defined( USE_UV ) || defined( USE_ANISOTROPY )
	vUv = vec3( uv, 1 ).xy;
#endif
#ifdef USE_MAP
	vMapUv = ( mapTransform * vec3( MAP_UV, 1 ) ).xy;
#endif
#ifdef USE_ALPHAMAP
	vAlphaMapUv = ( alphaMapTransform * vec3( ALPHAMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_LIGHTMAP
	vLightMapUv = ( lightMapTransform * vec3( LIGHTMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_AOMAP
	vAoMapUv = ( aoMapTransform * vec3( AOMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_BUMPMAP
	vBumpMapUv = ( bumpMapTransform * vec3( BUMPMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_NORMALMAP
	vNormalMapUv = ( normalMapTransform * vec3( NORMALMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_DISPLACEMENTMAP
	vDisplacementMapUv = ( displacementMapTransform * vec3( DISPLACEMENTMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_EMISSIVEMAP
	vEmissiveMapUv = ( emissiveMapTransform * vec3( EMISSIVEMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_METALNESSMAP
	vMetalnessMapUv = ( metalnessMapTransform * vec3( METALNESSMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_ROUGHNESSMAP
	vRoughnessMapUv = ( roughnessMapTransform * vec3( ROUGHNESSMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_ANISOTROPYMAP
	vAnisotropyMapUv = ( anisotropyMapTransform * vec3( ANISOTROPYMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_CLEARCOATMAP
	vClearcoatMapUv = ( clearcoatMapTransform * vec3( CLEARCOATMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_CLEARCOAT_NORMALMAP
	vClearcoatNormalMapUv = ( clearcoatNormalMapTransform * vec3( CLEARCOAT_NORMALMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_CLEARCOAT_ROUGHNESSMAP
	vClearcoatRoughnessMapUv = ( clearcoatRoughnessMapTransform * vec3( CLEARCOAT_ROUGHNESSMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_IRIDESCENCEMAP
	vIridescenceMapUv = ( iridescenceMapTransform * vec3( IRIDESCENCEMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_IRIDESCENCE_THICKNESSMAP
	vIridescenceThicknessMapUv = ( iridescenceThicknessMapTransform * vec3( IRIDESCENCE_THICKNESSMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_SHEEN_COLORMAP
	vSheenColorMapUv = ( sheenColorMapTransform * vec3( SHEEN_COLORMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_SHEEN_ROUGHNESSMAP
	vSheenRoughnessMapUv = ( sheenRoughnessMapTransform * vec3( SHEEN_ROUGHNESSMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_SPECULARMAP
	vSpecularMapUv = ( specularMapTransform * vec3( SPECULARMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_SPECULAR_COLORMAP
	vSpecularColorMapUv = ( specularColorMapTransform * vec3( SPECULAR_COLORMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_SPECULAR_INTENSITYMAP
	vSpecularIntensityMapUv = ( specularIntensityMapTransform * vec3( SPECULAR_INTENSITYMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_TRANSMISSIONMAP
	vTransmissionMapUv = ( transmissionMapTransform * vec3( TRANSMISSIONMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_THICKNESSMAP
	vThicknessMapUv = ( thicknessMapTransform * vec3( THICKNESSMAP_UV, 1 ) ).xy;
#endif`,PM=`#if defined( USE_ENVMAP ) || defined( DISTANCE ) || defined ( USE_SHADOWMAP ) || defined ( USE_TRANSMISSION ) || NUM_SPOT_LIGHT_COORDS > 0
	vec4 worldPosition = vec4( transformed, 1.0 );
	#ifdef USE_BATCHING
		worldPosition = batchingMatrix * worldPosition;
	#endif
	#ifdef USE_INSTANCING
		worldPosition = instanceMatrix * worldPosition;
	#endif
	worldPosition = modelMatrix * worldPosition;
#endif`,IM=`varying vec2 vUv;
uniform mat3 uvTransform;
void main() {
	vUv = ( uvTransform * vec3( uv, 1 ) ).xy;
	gl_Position = vec4( position.xy, 1.0, 1.0 );
}`,LM=`uniform sampler2D t2D;
uniform float backgroundIntensity;
varying vec2 vUv;
void main() {
	vec4 texColor = texture2D( t2D, vUv );
	#ifdef DECODE_VIDEO_TEXTURE
		texColor = vec4( mix( pow( texColor.rgb * 0.9478672986 + vec3( 0.0521327014 ), vec3( 2.4 ) ), texColor.rgb * 0.0773993808, vec3( lessThanEqual( texColor.rgb, vec3( 0.04045 ) ) ) ), texColor.w );
	#endif
	texColor.rgb *= backgroundIntensity;
	gl_FragColor = texColor;
	#include <tonemapping_fragment>
	#include <colorspace_fragment>
}`,NM=`varying vec3 vWorldDirection;
#include <common>
void main() {
	vWorldDirection = transformDirection( position, modelMatrix );
	#include <begin_vertex>
	#include <project_vertex>
	gl_Position.z = gl_Position.w;
}`,UM=`#ifdef ENVMAP_TYPE_CUBE
	uniform samplerCube envMap;
#elif defined( ENVMAP_TYPE_CUBE_UV )
	uniform sampler2D envMap;
#endif
uniform float backgroundBlurriness;
uniform float backgroundIntensity;
uniform mat3 backgroundRotation;
varying vec3 vWorldDirection;
#include <cube_uv_reflection_fragment>
void main() {
	#ifdef ENVMAP_TYPE_CUBE
		vec4 texColor = textureCube( envMap, backgroundRotation * vWorldDirection );
	#elif defined( ENVMAP_TYPE_CUBE_UV )
		vec4 texColor = textureCubeUV( envMap, backgroundRotation * vWorldDirection, backgroundBlurriness );
	#else
		vec4 texColor = vec4( 0.0, 0.0, 0.0, 1.0 );
	#endif
	texColor.rgb *= backgroundIntensity;
	gl_FragColor = texColor;
	#include <tonemapping_fragment>
	#include <colorspace_fragment>
}`,DM=`varying vec3 vWorldDirection;
#include <common>
void main() {
	vWorldDirection = transformDirection( position, modelMatrix );
	#include <begin_vertex>
	#include <project_vertex>
	gl_Position.z = gl_Position.w;
}`,OM=`uniform samplerCube tCube;
uniform float tFlip;
uniform float opacity;
varying vec3 vWorldDirection;
void main() {
	vec4 texColor = textureCube( tCube, vec3( tFlip * vWorldDirection.x, vWorldDirection.yz ) );
	gl_FragColor = texColor;
	gl_FragColor.a *= opacity;
	#include <tonemapping_fragment>
	#include <colorspace_fragment>
}`,FM=`#include <common>
#include <batching_pars_vertex>
#include <uv_pars_vertex>
#include <displacementmap_pars_vertex>
#include <morphtarget_pars_vertex>
#include <skinning_pars_vertex>
#include <logdepthbuf_pars_vertex>
#include <clipping_planes_pars_vertex>
varying vec2 vHighPrecisionZW;
void main() {
	#include <uv_vertex>
	#include <batching_vertex>
	#include <skinbase_vertex>
	#include <morphinstance_vertex>
	#ifdef USE_DISPLACEMENTMAP
		#include <beginnormal_vertex>
		#include <morphnormal_vertex>
		#include <skinnormal_vertex>
	#endif
	#include <begin_vertex>
	#include <morphtarget_vertex>
	#include <skinning_vertex>
	#include <displacementmap_vertex>
	#include <project_vertex>
	#include <logdepthbuf_vertex>
	#include <clipping_planes_vertex>
	vHighPrecisionZW = gl_Position.zw;
}`,BM=`#if DEPTH_PACKING == 3200
	uniform float opacity;
#endif
#include <common>
#include <packing>
#include <uv_pars_fragment>
#include <map_pars_fragment>
#include <alphamap_pars_fragment>
#include <alphatest_pars_fragment>
#include <alphahash_pars_fragment>
#include <logdepthbuf_pars_fragment>
#include <clipping_planes_pars_fragment>
varying vec2 vHighPrecisionZW;
void main() {
	vec4 diffuseColor = vec4( 1.0 );
	#include <clipping_planes_fragment>
	#if DEPTH_PACKING == 3200
		diffuseColor.a = opacity;
	#endif
	#include <map_fragment>
	#include <alphamap_fragment>
	#include <alphatest_fragment>
	#include <alphahash_fragment>
	#include <logdepthbuf_fragment>
	#ifdef USE_REVERSED_DEPTH_BUFFER
		float fragCoordZ = vHighPrecisionZW[ 0 ] / vHighPrecisionZW[ 1 ];
	#else
		float fragCoordZ = 0.5 * vHighPrecisionZW[ 0 ] / vHighPrecisionZW[ 1 ] + 0.5;
	#endif
	#if DEPTH_PACKING == 3200
		gl_FragColor = vec4( vec3( 1.0 - fragCoordZ ), opacity );
	#elif DEPTH_PACKING == 3201
		gl_FragColor = packDepthToRGBA( fragCoordZ );
	#elif DEPTH_PACKING == 3202
		gl_FragColor = vec4( packDepthToRGB( fragCoordZ ), 1.0 );
	#elif DEPTH_PACKING == 3203
		gl_FragColor = vec4( packDepthToRG( fragCoordZ ), 0.0, 1.0 );
	#endif
}`,kM=`#define DISTANCE
varying vec3 vWorldPosition;
#include <common>
#include <batching_pars_vertex>
#include <uv_pars_vertex>
#include <displacementmap_pars_vertex>
#include <morphtarget_pars_vertex>
#include <skinning_pars_vertex>
#include <clipping_planes_pars_vertex>
void main() {
	#include <uv_vertex>
	#include <batching_vertex>
	#include <skinbase_vertex>
	#include <morphinstance_vertex>
	#ifdef USE_DISPLACEMENTMAP
		#include <beginnormal_vertex>
		#include <morphnormal_vertex>
		#include <skinnormal_vertex>
	#endif
	#include <begin_vertex>
	#include <morphtarget_vertex>
	#include <skinning_vertex>
	#include <displacementmap_vertex>
	#include <project_vertex>
	#include <worldpos_vertex>
	#include <clipping_planes_vertex>
	vWorldPosition = worldPosition.xyz;
}`,VM=`#define DISTANCE
uniform vec3 referencePosition;
uniform float nearDistance;
uniform float farDistance;
varying vec3 vWorldPosition;
#include <common>
#include <uv_pars_fragment>
#include <map_pars_fragment>
#include <alphamap_pars_fragment>
#include <alphatest_pars_fragment>
#include <alphahash_pars_fragment>
#include <clipping_planes_pars_fragment>
void main() {
	vec4 diffuseColor = vec4( 1.0 );
	#include <clipping_planes_fragment>
	#include <map_fragment>
	#include <alphamap_fragment>
	#include <alphatest_fragment>
	#include <alphahash_fragment>
	float dist = length( vWorldPosition - referencePosition );
	dist = ( dist - nearDistance ) / ( farDistance - nearDistance );
	dist = saturate( dist );
	gl_FragColor = vec4( dist, 0.0, 0.0, 1.0 );
}`,zM=`varying vec3 vWorldDirection;
#include <common>
void main() {
	vWorldDirection = transformDirection( position, modelMatrix );
	#include <begin_vertex>
	#include <project_vertex>
}`,GM=`uniform sampler2D tEquirect;
varying vec3 vWorldDirection;
#include <common>
void main() {
	vec3 direction = normalize( vWorldDirection );
	vec2 sampleUV = equirectUv( direction );
	gl_FragColor = texture2D( tEquirect, sampleUV );
	#include <tonemapping_fragment>
	#include <colorspace_fragment>
}`,HM=`uniform float scale;
attribute float lineDistance;
varying float vLineDistance;
#include <common>
#include <uv_pars_vertex>
#include <color_pars_vertex>
#include <fog_pars_vertex>
#include <morphtarget_pars_vertex>
#include <logdepthbuf_pars_vertex>
#include <clipping_planes_pars_vertex>
void main() {
	vLineDistance = scale * lineDistance;
	#include <uv_vertex>
	#include <color_vertex>
	#include <morphinstance_vertex>
	#include <morphcolor_vertex>
	#include <begin_vertex>
	#include <morphtarget_vertex>
	#include <project_vertex>
	#include <logdepthbuf_vertex>
	#include <clipping_planes_vertex>
	#include <fog_vertex>
}`,WM=`uniform vec3 diffuse;
uniform float opacity;
uniform float dashSize;
uniform float totalSize;
varying float vLineDistance;
#include <common>
#include <color_pars_fragment>
#include <uv_pars_fragment>
#include <map_pars_fragment>
#include <fog_pars_fragment>
#include <logdepthbuf_pars_fragment>
#include <clipping_planes_pars_fragment>
void main() {
	vec4 diffuseColor = vec4( diffuse, opacity );
	#include <clipping_planes_fragment>
	if ( mod( vLineDistance, totalSize ) > dashSize ) {
		discard;
	}
	vec3 outgoingLight = vec3( 0.0 );
	#include <logdepthbuf_fragment>
	#include <map_fragment>
	#include <color_fragment>
	outgoingLight = diffuseColor.rgb;
	#include <opaque_fragment>
	#include <tonemapping_fragment>
	#include <colorspace_fragment>
	#include <fog_fragment>
	#include <premultiplied_alpha_fragment>
}`,$M=`#include <common>
#include <batching_pars_vertex>
#include <uv_pars_vertex>
#include <envmap_pars_vertex>
#include <color_pars_vertex>
#include <fog_pars_vertex>
#include <morphtarget_pars_vertex>
#include <skinning_pars_vertex>
#include <logdepthbuf_pars_vertex>
#include <clipping_planes_pars_vertex>
void main() {
	#include <uv_vertex>
	#include <color_vertex>
	#include <morphinstance_vertex>
	#include <morphcolor_vertex>
	#include <batching_vertex>
	#if defined ( USE_ENVMAP ) || defined ( USE_SKINNING )
		#include <beginnormal_vertex>
		#include <morphnormal_vertex>
		#include <skinbase_vertex>
		#include <skinnormal_vertex>
		#include <defaultnormal_vertex>
	#endif
	#include <begin_vertex>
	#include <morphtarget_vertex>
	#include <skinning_vertex>
	#include <project_vertex>
	#include <logdepthbuf_vertex>
	#include <clipping_planes_vertex>
	#include <worldpos_vertex>
	#include <envmap_vertex>
	#include <fog_vertex>
}`,XM=`uniform vec3 diffuse;
uniform float opacity;
#ifndef FLAT_SHADED
	varying vec3 vNormal;
#endif
#include <common>
#include <dithering_pars_fragment>
#include <color_pars_fragment>
#include <uv_pars_fragment>
#include <map_pars_fragment>
#include <alphamap_pars_fragment>
#include <alphatest_pars_fragment>
#include <alphahash_pars_fragment>
#include <aomap_pars_fragment>
#include <lightmap_pars_fragment>
#include <envmap_common_pars_fragment>
#include <envmap_pars_fragment>
#include <fog_pars_fragment>
#include <specularmap_pars_fragment>
#include <logdepthbuf_pars_fragment>
#include <clipping_planes_pars_fragment>
void main() {
	vec4 diffuseColor = vec4( diffuse, opacity );
	#include <clipping_planes_fragment>
	#include <logdepthbuf_fragment>
	#include <map_fragment>
	#include <color_fragment>
	#include <alphamap_fragment>
	#include <alphatest_fragment>
	#include <alphahash_fragment>
	#include <specularmap_fragment>
	ReflectedLight reflectedLight = ReflectedLight( vec3( 0.0 ), vec3( 0.0 ), vec3( 0.0 ), vec3( 0.0 ) );
	#ifdef USE_LIGHTMAP
		vec4 lightMapTexel = texture2D( lightMap, vLightMapUv );
		reflectedLight.indirectDiffuse += lightMapTexel.rgb * lightMapIntensity * RECIPROCAL_PI;
	#else
		reflectedLight.indirectDiffuse += vec3( 1.0 );
	#endif
	#include <aomap_fragment>
	reflectedLight.indirectDiffuse *= diffuseColor.rgb;
	vec3 outgoingLight = reflectedLight.indirectDiffuse;
	#include <envmap_fragment>
	#include <opaque_fragment>
	#include <tonemapping_fragment>
	#include <colorspace_fragment>
	#include <fog_fragment>
	#include <premultiplied_alpha_fragment>
	#include <dithering_fragment>
}`,qM=`#define LAMBERT
varying vec3 vViewPosition;
#include <common>
#include <batching_pars_vertex>
#include <uv_pars_vertex>
#include <displacementmap_pars_vertex>
#include <envmap_pars_vertex>
#include <color_pars_vertex>
#include <fog_pars_vertex>
#include <normal_pars_vertex>
#include <morphtarget_pars_vertex>
#include <skinning_pars_vertex>
#include <shadowmap_pars_vertex>
#include <logdepthbuf_pars_vertex>
#include <clipping_planes_pars_vertex>
void main() {
	#include <uv_vertex>
	#include <color_vertex>
	#include <morphinstance_vertex>
	#include <morphcolor_vertex>
	#include <batching_vertex>
	#include <beginnormal_vertex>
	#include <morphnormal_vertex>
	#include <skinbase_vertex>
	#include <skinnormal_vertex>
	#include <defaultnormal_vertex>
	#include <normal_vertex>
	#include <begin_vertex>
	#include <morphtarget_vertex>
	#include <skinning_vertex>
	#include <displacementmap_vertex>
	#include <project_vertex>
	#include <logdepthbuf_vertex>
	#include <clipping_planes_vertex>
	vViewPosition = - mvPosition.xyz;
	#include <worldpos_vertex>
	#include <envmap_vertex>
	#include <shadowmap_vertex>
	#include <fog_vertex>
}`,YM=`#define LAMBERT
uniform vec3 diffuse;
uniform vec3 emissive;
uniform float opacity;
#include <common>
#include <dithering_pars_fragment>
#include <color_pars_fragment>
#include <uv_pars_fragment>
#include <map_pars_fragment>
#include <alphamap_pars_fragment>
#include <alphatest_pars_fragment>
#include <alphahash_pars_fragment>
#include <aomap_pars_fragment>
#include <lightmap_pars_fragment>
#include <emissivemap_pars_fragment>
#include <cube_uv_reflection_fragment>
#include <envmap_common_pars_fragment>
#include <envmap_pars_fragment>
#include <envmap_physical_pars_fragment>
#include <fog_pars_fragment>
#include <bsdfs>
#include <lights_pars_begin>
#include <normal_pars_fragment>
#include <lights_lambert_pars_fragment>
#include <shadowmap_pars_fragment>
#include <bumpmap_pars_fragment>
#include <normalmap_pars_fragment>
#include <specularmap_pars_fragment>
#include <logdepthbuf_pars_fragment>
#include <clipping_planes_pars_fragment>
void main() {
	vec4 diffuseColor = vec4( diffuse, opacity );
	#include <clipping_planes_fragment>
	ReflectedLight reflectedLight = ReflectedLight( vec3( 0.0 ), vec3( 0.0 ), vec3( 0.0 ), vec3( 0.0 ) );
	vec3 totalEmissiveRadiance = emissive;
	#include <logdepthbuf_fragment>
	#include <map_fragment>
	#include <color_fragment>
	#include <alphamap_fragment>
	#include <alphatest_fragment>
	#include <alphahash_fragment>
	#include <specularmap_fragment>
	#include <normal_fragment_begin>
	#include <normal_fragment_maps>
	#include <emissivemap_fragment>
	#include <lights_lambert_fragment>
	#include <lights_fragment_begin>
	#include <lights_fragment_maps>
	#include <lights_fragment_end>
	#include <aomap_fragment>
	vec3 outgoingLight = reflectedLight.directDiffuse + reflectedLight.indirectDiffuse + totalEmissiveRadiance;
	#include <envmap_fragment>
	#include <opaque_fragment>
	#include <tonemapping_fragment>
	#include <colorspace_fragment>
	#include <fog_fragment>
	#include <premultiplied_alpha_fragment>
	#include <dithering_fragment>
}`,ZM=`#define MATCAP
varying vec3 vViewPosition;
#include <common>
#include <batching_pars_vertex>
#include <uv_pars_vertex>
#include <color_pars_vertex>
#include <displacementmap_pars_vertex>
#include <fog_pars_vertex>
#include <normal_pars_vertex>
#include <morphtarget_pars_vertex>
#include <skinning_pars_vertex>
#include <logdepthbuf_pars_vertex>
#include <clipping_planes_pars_vertex>
void main() {
	#include <uv_vertex>
	#include <color_vertex>
	#include <morphinstance_vertex>
	#include <morphcolor_vertex>
	#include <batching_vertex>
	#include <beginnormal_vertex>
	#include <morphnormal_vertex>
	#include <skinbase_vertex>
	#include <skinnormal_vertex>
	#include <defaultnormal_vertex>
	#include <normal_vertex>
	#include <begin_vertex>
	#include <morphtarget_vertex>
	#include <skinning_vertex>
	#include <displacementmap_vertex>
	#include <project_vertex>
	#include <logdepthbuf_vertex>
	#include <clipping_planes_vertex>
	#include <fog_vertex>
	vViewPosition = - mvPosition.xyz;
}`,KM=`#define MATCAP
uniform vec3 diffuse;
uniform float opacity;
uniform sampler2D matcap;
varying vec3 vViewPosition;
#include <common>
#include <dithering_pars_fragment>
#include <color_pars_fragment>
#include <uv_pars_fragment>
#include <map_pars_fragment>
#include <alphamap_pars_fragment>
#include <alphatest_pars_fragment>
#include <alphahash_pars_fragment>
#include <fog_pars_fragment>
#include <normal_pars_fragment>
#include <bumpmap_pars_fragment>
#include <normalmap_pars_fragment>
#include <logdepthbuf_pars_fragment>
#include <clipping_planes_pars_fragment>
void main() {
	vec4 diffuseColor = vec4( diffuse, opacity );
	#include <clipping_planes_fragment>
	#include <logdepthbuf_fragment>
	#include <map_fragment>
	#include <color_fragment>
	#include <alphamap_fragment>
	#include <alphatest_fragment>
	#include <alphahash_fragment>
	#include <normal_fragment_begin>
	#include <normal_fragment_maps>
	vec3 viewDir = normalize( vViewPosition );
	vec3 x = normalize( vec3( viewDir.z, 0.0, - viewDir.x ) );
	vec3 y = cross( viewDir, x );
	vec2 uv = vec2( dot( x, normal ), dot( y, normal ) ) * 0.495 + 0.5;
	#ifdef USE_MATCAP
		vec4 matcapColor = texture2D( matcap, uv );
	#else
		vec4 matcapColor = vec4( vec3( mix( 0.2, 0.8, uv.y ) ), 1.0 );
	#endif
	vec3 outgoingLight = diffuseColor.rgb * matcapColor.rgb;
	#include <opaque_fragment>
	#include <tonemapping_fragment>
	#include <colorspace_fragment>
	#include <fog_fragment>
	#include <premultiplied_alpha_fragment>
	#include <dithering_fragment>
}`,JM=`#define NORMAL
#if defined( FLAT_SHADED ) || defined( USE_BUMPMAP ) || defined( USE_NORMALMAP_TANGENTSPACE )
	varying vec3 vViewPosition;
#endif
#include <common>
#include <batching_pars_vertex>
#include <uv_pars_vertex>
#include <displacementmap_pars_vertex>
#include <normal_pars_vertex>
#include <morphtarget_pars_vertex>
#include <skinning_pars_vertex>
#include <logdepthbuf_pars_vertex>
#include <clipping_planes_pars_vertex>
void main() {
	#include <uv_vertex>
	#include <batching_vertex>
	#include <beginnormal_vertex>
	#include <morphinstance_vertex>
	#include <morphnormal_vertex>
	#include <skinbase_vertex>
	#include <skinnormal_vertex>
	#include <defaultnormal_vertex>
	#include <normal_vertex>
	#include <begin_vertex>
	#include <morphtarget_vertex>
	#include <skinning_vertex>
	#include <displacementmap_vertex>
	#include <project_vertex>
	#include <logdepthbuf_vertex>
	#include <clipping_planes_vertex>
#if defined( FLAT_SHADED ) || defined( USE_BUMPMAP ) || defined( USE_NORMALMAP_TANGENTSPACE )
	vViewPosition = - mvPosition.xyz;
#endif
}`,jM=`#define NORMAL
uniform float opacity;
#if defined( FLAT_SHADED ) || defined( USE_BUMPMAP ) || defined( USE_NORMALMAP_TANGENTSPACE )
	varying vec3 vViewPosition;
#endif
#include <uv_pars_fragment>
#include <normal_pars_fragment>
#include <bumpmap_pars_fragment>
#include <normalmap_pars_fragment>
#include <logdepthbuf_pars_fragment>
#include <clipping_planes_pars_fragment>
void main() {
	vec4 diffuseColor = vec4( 0.0, 0.0, 0.0, opacity );
	#include <clipping_planes_fragment>
	#include <logdepthbuf_fragment>
	#include <normal_fragment_begin>
	#include <normal_fragment_maps>
	gl_FragColor = vec4( normalize( normal ) * 0.5 + 0.5, diffuseColor.a );
	#ifdef OPAQUE
		gl_FragColor.a = 1.0;
	#endif
}`,QM=`#define PHONG
varying vec3 vViewPosition;
#include <common>
#include <batching_pars_vertex>
#include <uv_pars_vertex>
#include <displacementmap_pars_vertex>
#include <envmap_pars_vertex>
#include <color_pars_vertex>
#include <fog_pars_vertex>
#include <normal_pars_vertex>
#include <morphtarget_pars_vertex>
#include <skinning_pars_vertex>
#include <shadowmap_pars_vertex>
#include <logdepthbuf_pars_vertex>
#include <clipping_planes_pars_vertex>
void main() {
	#include <uv_vertex>
	#include <color_vertex>
	#include <morphcolor_vertex>
	#include <batching_vertex>
	#include <beginnormal_vertex>
	#include <morphinstance_vertex>
	#include <morphnormal_vertex>
	#include <skinbase_vertex>
	#include <skinnormal_vertex>
	#include <defaultnormal_vertex>
	#include <normal_vertex>
	#include <begin_vertex>
	#include <morphtarget_vertex>
	#include <skinning_vertex>
	#include <displacementmap_vertex>
	#include <project_vertex>
	#include <logdepthbuf_vertex>
	#include <clipping_planes_vertex>
	vViewPosition = - mvPosition.xyz;
	#include <worldpos_vertex>
	#include <envmap_vertex>
	#include <shadowmap_vertex>
	#include <fog_vertex>
}`,tT=`#define PHONG
uniform vec3 diffuse;
uniform vec3 emissive;
uniform vec3 specular;
uniform float shininess;
uniform float opacity;
#include <common>
#include <dithering_pars_fragment>
#include <color_pars_fragment>
#include <uv_pars_fragment>
#include <map_pars_fragment>
#include <alphamap_pars_fragment>
#include <alphatest_pars_fragment>
#include <alphahash_pars_fragment>
#include <aomap_pars_fragment>
#include <lightmap_pars_fragment>
#include <emissivemap_pars_fragment>
#include <cube_uv_reflection_fragment>
#include <envmap_common_pars_fragment>
#include <envmap_pars_fragment>
#include <envmap_physical_pars_fragment>
#include <fog_pars_fragment>
#include <bsdfs>
#include <lights_pars_begin>
#include <normal_pars_fragment>
#include <lights_phong_pars_fragment>
#include <shadowmap_pars_fragment>
#include <bumpmap_pars_fragment>
#include <normalmap_pars_fragment>
#include <specularmap_pars_fragment>
#include <logdepthbuf_pars_fragment>
#include <clipping_planes_pars_fragment>
void main() {
	vec4 diffuseColor = vec4( diffuse, opacity );
	#include <clipping_planes_fragment>
	ReflectedLight reflectedLight = ReflectedLight( vec3( 0.0 ), vec3( 0.0 ), vec3( 0.0 ), vec3( 0.0 ) );
	vec3 totalEmissiveRadiance = emissive;
	#include <logdepthbuf_fragment>
	#include <map_fragment>
	#include <color_fragment>
	#include <alphamap_fragment>
	#include <alphatest_fragment>
	#include <alphahash_fragment>
	#include <specularmap_fragment>
	#include <normal_fragment_begin>
	#include <normal_fragment_maps>
	#include <emissivemap_fragment>
	#include <lights_phong_fragment>
	#include <lights_fragment_begin>
	#include <lights_fragment_maps>
	#include <lights_fragment_end>
	#include <aomap_fragment>
	vec3 outgoingLight = reflectedLight.directDiffuse + reflectedLight.indirectDiffuse + reflectedLight.directSpecular + reflectedLight.indirectSpecular + totalEmissiveRadiance;
	#include <envmap_fragment>
	#include <opaque_fragment>
	#include <tonemapping_fragment>
	#include <colorspace_fragment>
	#include <fog_fragment>
	#include <premultiplied_alpha_fragment>
	#include <dithering_fragment>
}`,eT=`#define STANDARD
varying vec3 vViewPosition;
#ifdef USE_TRANSMISSION
	varying vec3 vWorldPosition;
#endif
#include <common>
#include <batching_pars_vertex>
#include <uv_pars_vertex>
#include <displacementmap_pars_vertex>
#include <color_pars_vertex>
#include <fog_pars_vertex>
#include <normal_pars_vertex>
#include <morphtarget_pars_vertex>
#include <skinning_pars_vertex>
#include <shadowmap_pars_vertex>
#include <logdepthbuf_pars_vertex>
#include <clipping_planes_pars_vertex>
void main() {
	#include <uv_vertex>
	#include <color_vertex>
	#include <morphinstance_vertex>
	#include <morphcolor_vertex>
	#include <batching_vertex>
	#include <beginnormal_vertex>
	#include <morphnormal_vertex>
	#include <skinbase_vertex>
	#include <skinnormal_vertex>
	#include <defaultnormal_vertex>
	#include <normal_vertex>
	#include <begin_vertex>
	#include <morphtarget_vertex>
	#include <skinning_vertex>
	#include <displacementmap_vertex>
	#include <project_vertex>
	#include <logdepthbuf_vertex>
	#include <clipping_planes_vertex>
	vViewPosition = - mvPosition.xyz;
	#include <worldpos_vertex>
	#include <shadowmap_vertex>
	#include <fog_vertex>
#ifdef USE_TRANSMISSION
	vWorldPosition = worldPosition.xyz;
#endif
}`,nT=`#define STANDARD
#ifdef PHYSICAL
	#define IOR
	#define USE_SPECULAR
#endif
uniform vec3 diffuse;
uniform vec3 emissive;
uniform float roughness;
uniform float metalness;
uniform float opacity;
#ifdef IOR
	uniform float ior;
#endif
#ifdef USE_SPECULAR
	uniform float specularIntensity;
	uniform vec3 specularColor;
	#ifdef USE_SPECULAR_COLORMAP
		uniform sampler2D specularColorMap;
	#endif
	#ifdef USE_SPECULAR_INTENSITYMAP
		uniform sampler2D specularIntensityMap;
	#endif
#endif
#ifdef USE_CLEARCOAT
	uniform float clearcoat;
	uniform float clearcoatRoughness;
#endif
#ifdef USE_DISPERSION
	uniform float dispersion;
#endif
#ifdef USE_RETROREFLECTION
	uniform float retroreflectivity;
#endif
#ifdef USE_IRIDESCENCE
	uniform float iridescence;
	uniform float iridescenceIOR;
	uniform float iridescenceThicknessMinimum;
	uniform float iridescenceThicknessMaximum;
#endif
#ifdef USE_SHEEN
	uniform vec3 sheenColor;
	uniform float sheenRoughness;
	#ifdef USE_SHEEN_COLORMAP
		uniform sampler2D sheenColorMap;
	#endif
	#ifdef USE_SHEEN_ROUGHNESSMAP
		uniform sampler2D sheenRoughnessMap;
	#endif
#endif
#ifdef USE_ANISOTROPY
	uniform vec2 anisotropyVector;
	#ifdef USE_ANISOTROPYMAP
		uniform sampler2D anisotropyMap;
	#endif
#endif
varying vec3 vViewPosition;
#include <common>
#include <dithering_pars_fragment>
#include <color_pars_fragment>
#include <uv_pars_fragment>
#include <map_pars_fragment>
#include <alphamap_pars_fragment>
#include <alphatest_pars_fragment>
#include <alphahash_pars_fragment>
#include <aomap_pars_fragment>
#include <lightmap_pars_fragment>
#include <emissivemap_pars_fragment>
#include <iridescence_fragment>
#include <cube_uv_reflection_fragment>
#include <envmap_common_pars_fragment>
#include <envmap_physical_pars_fragment>
#include <fog_pars_fragment>
#include <lights_pars_begin>
#include <normal_pars_fragment>
#include <lights_physical_pars_fragment>
#include <transmission_pars_fragment>
#include <shadowmap_pars_fragment>
#include <bumpmap_pars_fragment>
#include <normalmap_pars_fragment>
#include <clearcoat_pars_fragment>
#include <iridescence_pars_fragment>
#include <roughnessmap_pars_fragment>
#include <metalnessmap_pars_fragment>
#include <logdepthbuf_pars_fragment>
#include <clipping_planes_pars_fragment>
void main() {
	vec4 diffuseColor = vec4( diffuse, opacity );
	#include <clipping_planes_fragment>
	ReflectedLight reflectedLight = ReflectedLight( vec3( 0.0 ), vec3( 0.0 ), vec3( 0.0 ), vec3( 0.0 ) );
	vec3 totalEmissiveRadiance = emissive;
	#include <logdepthbuf_fragment>
	#include <map_fragment>
	#include <color_fragment>
	#include <alphamap_fragment>
	#include <alphatest_fragment>
	#include <alphahash_fragment>
	#include <roughnessmap_fragment>
	#include <metalnessmap_fragment>
	#include <normal_fragment_begin>
	#include <normal_fragment_maps>
	#include <clearcoat_normal_fragment_begin>
	#include <clearcoat_normal_fragment_maps>
	#include <emissivemap_fragment>
	#include <lights_physical_fragment>
	#include <lights_fragment_begin>
	#include <lights_fragment_maps>
	#include <lights_fragment_end>
	#include <aomap_fragment>
	vec3 totalDiffuse = reflectedLight.directDiffuse + reflectedLight.indirectDiffuse;
	vec3 totalSpecular = reflectedLight.directSpecular + reflectedLight.indirectSpecular;
	#include <transmission_fragment>
	vec3 outgoingLight = totalDiffuse + totalSpecular + totalEmissiveRadiance;
	#ifdef USE_SHEEN
 
		outgoingLight = outgoingLight + sheenSpecularDirect + sheenSpecularIndirect;
 
 	#endif
	#ifdef USE_CLEARCOAT
		float dotNVcc = saturate( dot( geometryClearcoatNormal, geometryViewDir ) );
		vec3 Fcc = F_Schlick( material.clearcoatF0, material.clearcoatF90, dotNVcc );
		outgoingLight = outgoingLight * ( 1.0 - material.clearcoat * Fcc ) + ( clearcoatSpecularDirect + clearcoatSpecularIndirect ) * material.clearcoat;
	#endif
	#include <opaque_fragment>
	#include <tonemapping_fragment>
	#include <colorspace_fragment>
	#include <fog_fragment>
	#include <premultiplied_alpha_fragment>
	#include <dithering_fragment>
}`,iT=`#define TOON
varying vec3 vViewPosition;
#include <common>
#include <batching_pars_vertex>
#include <uv_pars_vertex>
#include <displacementmap_pars_vertex>
#include <color_pars_vertex>
#include <fog_pars_vertex>
#include <normal_pars_vertex>
#include <morphtarget_pars_vertex>
#include <skinning_pars_vertex>
#include <shadowmap_pars_vertex>
#include <logdepthbuf_pars_vertex>
#include <clipping_planes_pars_vertex>
void main() {
	#include <uv_vertex>
	#include <color_vertex>
	#include <morphinstance_vertex>
	#include <morphcolor_vertex>
	#include <batching_vertex>
	#include <beginnormal_vertex>
	#include <morphnormal_vertex>
	#include <skinbase_vertex>
	#include <skinnormal_vertex>
	#include <defaultnormal_vertex>
	#include <normal_vertex>
	#include <begin_vertex>
	#include <morphtarget_vertex>
	#include <skinning_vertex>
	#include <displacementmap_vertex>
	#include <project_vertex>
	#include <logdepthbuf_vertex>
	#include <clipping_planes_vertex>
	vViewPosition = - mvPosition.xyz;
	#include <worldpos_vertex>
	#include <shadowmap_vertex>
	#include <fog_vertex>
}`,sT=`#define TOON
uniform vec3 diffuse;
uniform vec3 emissive;
uniform float opacity;
#include <common>
#include <dithering_pars_fragment>
#include <color_pars_fragment>
#include <uv_pars_fragment>
#include <map_pars_fragment>
#include <alphamap_pars_fragment>
#include <alphatest_pars_fragment>
#include <alphahash_pars_fragment>
#include <aomap_pars_fragment>
#include <lightmap_pars_fragment>
#include <emissivemap_pars_fragment>
#include <gradientmap_pars_fragment>
#include <fog_pars_fragment>
#include <bsdfs>
#include <lights_pars_begin>
#include <normal_pars_fragment>
#include <lights_toon_pars_fragment>
#include <shadowmap_pars_fragment>
#include <bumpmap_pars_fragment>
#include <normalmap_pars_fragment>
#include <logdepthbuf_pars_fragment>
#include <clipping_planes_pars_fragment>
void main() {
	vec4 diffuseColor = vec4( diffuse, opacity );
	#include <clipping_planes_fragment>
	ReflectedLight reflectedLight = ReflectedLight( vec3( 0.0 ), vec3( 0.0 ), vec3( 0.0 ), vec3( 0.0 ) );
	vec3 totalEmissiveRadiance = emissive;
	#include <logdepthbuf_fragment>
	#include <map_fragment>
	#include <color_fragment>
	#include <alphamap_fragment>
	#include <alphatest_fragment>
	#include <alphahash_fragment>
	#include <normal_fragment_begin>
	#include <normal_fragment_maps>
	#include <emissivemap_fragment>
	#include <lights_toon_fragment>
	#include <lights_fragment_begin>
	#include <lights_fragment_maps>
	#include <lights_fragment_end>
	#include <aomap_fragment>
	vec3 outgoingLight = reflectedLight.directDiffuse + reflectedLight.indirectDiffuse + totalEmissiveRadiance;
	#include <opaque_fragment>
	#include <tonemapping_fragment>
	#include <colorspace_fragment>
	#include <fog_fragment>
	#include <premultiplied_alpha_fragment>
	#include <dithering_fragment>
}`,rT=`uniform float size;
uniform float scale;
#include <common>
#include <color_pars_vertex>
#include <fog_pars_vertex>
#include <morphtarget_pars_vertex>
#include <logdepthbuf_pars_vertex>
#include <clipping_planes_pars_vertex>
#ifdef USE_POINTS_UV
	varying vec2 vUv;
	uniform mat3 uvTransform;
#endif
void main() {
	#ifdef USE_POINTS_UV
		vUv = ( uvTransform * vec3( uv, 1 ) ).xy;
	#endif
	#include <color_vertex>
	#include <morphinstance_vertex>
	#include <morphcolor_vertex>
	#include <begin_vertex>
	#include <morphtarget_vertex>
	#include <project_vertex>
	gl_PointSize = size;
	#ifdef USE_SIZEATTENUATION
		bool isPerspective = isPerspectiveMatrix( projectionMatrix );
		if ( isPerspective ) gl_PointSize *= ( scale / - mvPosition.z );
	#endif
	#include <logdepthbuf_vertex>
	#include <clipping_planes_vertex>
	#include <worldpos_vertex>
	#include <fog_vertex>
}`,oT=`uniform vec3 diffuse;
uniform float opacity;
#include <common>
#include <color_pars_fragment>
#include <map_particle_pars_fragment>
#include <alphatest_pars_fragment>
#include <alphahash_pars_fragment>
#include <fog_pars_fragment>
#include <logdepthbuf_pars_fragment>
#include <clipping_planes_pars_fragment>
void main() {
	vec4 diffuseColor = vec4( diffuse, opacity );
	#include <clipping_planes_fragment>
	vec3 outgoingLight = vec3( 0.0 );
	#include <logdepthbuf_fragment>
	#include <map_particle_fragment>
	#include <color_fragment>
	#include <alphatest_fragment>
	#include <alphahash_fragment>
	outgoingLight = diffuseColor.rgb;
	#include <opaque_fragment>
	#include <tonemapping_fragment>
	#include <colorspace_fragment>
	#include <fog_fragment>
	#include <premultiplied_alpha_fragment>
}`,aT=`#include <common>
#include <batching_pars_vertex>
#include <fog_pars_vertex>
#include <morphtarget_pars_vertex>
#include <skinning_pars_vertex>
#include <logdepthbuf_pars_vertex>
#include <shadowmap_pars_vertex>
void main() {
	#include <batching_vertex>
	#include <beginnormal_vertex>
	#include <morphinstance_vertex>
	#include <morphnormal_vertex>
	#include <skinbase_vertex>
	#include <skinnormal_vertex>
	#include <defaultnormal_vertex>
	#include <begin_vertex>
	#include <morphtarget_vertex>
	#include <skinning_vertex>
	#include <project_vertex>
	#include <logdepthbuf_vertex>
	#include <worldpos_vertex>
	#include <shadowmap_vertex>
	#include <fog_vertex>
}`,cT=`uniform vec3 color;
uniform float opacity;
#include <common>
#include <fog_pars_fragment>
#include <bsdfs>
#include <lights_pars_begin>
#include <logdepthbuf_pars_fragment>
#include <shadowmap_pars_fragment>
#include <shadowmask_pars_fragment>
void main() {
	#include <logdepthbuf_fragment>
	gl_FragColor = vec4( color, opacity * ( 1.0 - getShadowMask() ) );
	#include <tonemapping_fragment>
	#include <colorspace_fragment>
	#include <fog_fragment>
	#include <premultiplied_alpha_fragment>
}`,lT=`uniform float rotation;
uniform vec2 center;
#include <common>
#include <uv_pars_vertex>
#include <fog_pars_vertex>
#include <logdepthbuf_pars_vertex>
#include <clipping_planes_pars_vertex>
void main() {
	#include <uv_vertex>
	vec4 mvPosition = modelViewMatrix[ 3 ];
	vec2 scale = vec2( length( modelMatrix[ 0 ].xyz ), length( modelMatrix[ 1 ].xyz ) );
	#ifndef USE_SIZEATTENUATION
		bool isPerspective = isPerspectiveMatrix( projectionMatrix );
		if ( isPerspective ) scale *= - mvPosition.z;
	#endif
	vec2 alignedPosition = ( position.xy - ( center - vec2( 0.5 ) ) ) * scale;
	vec2 rotatedPosition;
	rotatedPosition.x = cos( rotation ) * alignedPosition.x - sin( rotation ) * alignedPosition.y;
	rotatedPosition.y = sin( rotation ) * alignedPosition.x + cos( rotation ) * alignedPosition.y;
	mvPosition.xy += rotatedPosition;
	gl_Position = projectionMatrix * mvPosition;
	#include <logdepthbuf_vertex>
	#include <clipping_planes_vertex>
	#include <fog_vertex>
}`,uT=`uniform vec3 diffuse;
uniform float opacity;
#include <common>
#include <uv_pars_fragment>
#include <map_pars_fragment>
#include <alphamap_pars_fragment>
#include <alphatest_pars_fragment>
#include <alphahash_pars_fragment>
#include <fog_pars_fragment>
#include <logdepthbuf_pars_fragment>
#include <clipping_planes_pars_fragment>
void main() {
	vec4 diffuseColor = vec4( diffuse, opacity );
	#include <clipping_planes_fragment>
	vec3 outgoingLight = vec3( 0.0 );
	#include <logdepthbuf_fragment>
	#include <map_fragment>
	#include <alphamap_fragment>
	#include <alphatest_fragment>
	#include <alphahash_fragment>
	outgoingLight = diffuseColor.rgb;
	#include <opaque_fragment>
	#include <tonemapping_fragment>
	#include <colorspace_fragment>
	#include <fog_fragment>
}`,Xt={alphahash_fragment:IS,alphahash_pars_fragment:LS,alphamap_fragment:NS,alphamap_pars_fragment:US,alphatest_fragment:DS,alphatest_pars_fragment:OS,aomap_fragment:FS,aomap_pars_fragment:BS,batching_pars_vertex:kS,batching_vertex:VS,begin_vertex:zS,beginnormal_vertex:GS,bsdfs:HS,iridescence_fragment:WS,bumpmap_pars_fragment:$S,clipping_planes_fragment:XS,clipping_planes_pars_fragment:qS,clipping_planes_pars_vertex:YS,clipping_planes_vertex:ZS,color_fragment:KS,color_pars_fragment:JS,color_pars_vertex:jS,color_vertex:QS,common:tb,cube_uv_reflection_fragment:eb,defaultnormal_vertex:nb,displacementmap_pars_vertex:ib,displacementmap_vertex:sb,emissivemap_fragment:rb,emissivemap_pars_fragment:ob,colorspace_fragment:ab,colorspace_pars_fragment:cb,envmap_fragment:lb,envmap_common_pars_fragment:ub,envmap_pars_fragment:hb,envmap_pars_vertex:fb,envmap_physical_pars_fragment:Mb,envmap_vertex:db,fog_vertex:pb,fog_pars_vertex:mb,fog_fragment:gb,fog_pars_fragment:_b,gradientmap_pars_fragment:xb,lightmap_pars_fragment:yb,lights_lambert_fragment:vb,lights_lambert_pars_fragment:Sb,lights_pars_begin:bb,lights_toon_fragment:Tb,lights_toon_pars_fragment:wb,lights_phong_fragment:Eb,lights_phong_pars_fragment:Ab,lights_physical_fragment:Cb,lights_physical_pars_fragment:Rb,lights_fragment_begin:Pb,lights_fragment_maps:Ib,lights_fragment_end:Lb,lightprobes_pars_fragment:Nb,logdepthbuf_fragment:Ub,logdepthbuf_pars_fragment:Db,logdepthbuf_pars_vertex:Ob,logdepthbuf_vertex:Fb,map_fragment:Bb,map_pars_fragment:kb,map_particle_fragment:Vb,map_particle_pars_fragment:zb,metalnessmap_fragment:Gb,metalnessmap_pars_fragment:Hb,morphinstance_vertex:Wb,morphcolor_vertex:$b,morphnormal_vertex:Xb,morphtarget_pars_vertex:qb,morphtarget_vertex:Yb,normal_fragment_begin:Zb,normal_fragment_maps:Kb,normal_pars_fragment:Jb,normal_pars_vertex:jb,normal_vertex:Qb,normalmap_pars_fragment:tM,clearcoat_normal_fragment_begin:eM,clearcoat_normal_fragment_maps:nM,clearcoat_pars_fragment:iM,iridescence_pars_fragment:sM,opaque_fragment:rM,packing:oM,premultiplied_alpha_fragment:aM,project_vertex:cM,dithering_fragment:lM,dithering_pars_fragment:uM,roughnessmap_fragment:hM,roughnessmap_pars_fragment:fM,shadowmap_pars_fragment:dM,shadowmap_pars_vertex:pM,shadowmap_vertex:mM,shadowmask_pars_fragment:gM,skinbase_vertex:_M,skinning_pars_vertex:xM,skinning_vertex:yM,skinnormal_vertex:vM,specularmap_fragment:SM,specularmap_pars_fragment:bM,tonemapping_fragment:MM,tonemapping_pars_fragment:TM,transmission_fragment:wM,transmission_pars_fragment:EM,uv_pars_fragment:AM,uv_pars_vertex:CM,uv_vertex:RM,worldpos_vertex:PM,background_vert:IM,background_frag:LM,backgroundCube_vert:NM,backgroundCube_frag:UM,cube_vert:DM,cube_frag:OM,depth_vert:FM,depth_frag:BM,distance_vert:kM,distance_frag:VM,equirect_vert:zM,equirect_frag:GM,linedashed_vert:HM,linedashed_frag:WM,meshbasic_vert:$M,meshbasic_frag:XM,meshlambert_vert:qM,meshlambert_frag:YM,meshmatcap_vert:ZM,meshmatcap_frag:KM,meshnormal_vert:JM,meshnormal_frag:jM,meshphong_vert:QM,meshphong_frag:tT,meshphysical_vert:eT,meshphysical_frag:nT,meshtoon_vert:iT,meshtoon_frag:sT,points_vert:rT,points_frag:oT,shadow_vert:aT,shadow_frag:cT,sprite_vert:lT,sprite_frag:uT},mt={common:{diffuse:{value:new ne(16777215)},opacity:{value:1},map:{value:null},mapTransform:{value:new Vt},alphaMap:{value:null},alphaMapTransform:{value:new Vt},alphaTest:{value:0}},specularmap:{specularMap:{value:null},specularMapTransform:{value:new Vt}},envmap:{envMap:{value:null},envMapRotation:{value:new Vt},reflectivity:{value:1},ior:{value:1.5},refractionRatio:{value:.98},dfgLUT:{value:null}},aomap:{aoMap:{value:null},aoMapIntensity:{value:1},aoMapTransform:{value:new Vt}},lightmap:{lightMap:{value:null},lightMapIntensity:{value:1},lightMapTransform:{value:new Vt}},bumpmap:{bumpMap:{value:null},bumpMapTransform:{value:new Vt},bumpScale:{value:1}},normalmap:{normalMap:{value:null},normalMapTransform:{value:new Vt},normalScale:{value:new re(1,1)}},displacementmap:{displacementMap:{value:null},displacementMapTransform:{value:new Vt},displacementScale:{value:1},displacementBias:{value:0}},emissivemap:{emissiveMap:{value:null},emissiveMapTransform:{value:new Vt}},metalnessmap:{metalnessMap:{value:null},metalnessMapTransform:{value:new Vt}},roughnessmap:{roughnessMap:{value:null},roughnessMapTransform:{value:new Vt}},gradientmap:{gradientMap:{value:null}},fog:{fogDensity:{value:25e-5},fogNear:{value:1},fogFar:{value:2e3},fogColor:{value:new ne(16777215)}},lights:{ambientLightColor:{value:[]},lightProbe:{value:[]},sunLights:{value:[],properties:{direction:{},color:{}}},sunLightShadows:{value:[],properties:{shadowIntensity:1,shadowBias:{},shadowNormalBias:{},shadowRadius:{},shadowMapSize:{}}},sunShadowMatrix:{value:[]},sunShadowCascade:{value:[]},directionalLights:{value:[],properties:{direction:{},color:{}}},directionalLightShadows:{value:[],properties:{shadowIntensity:1,shadowBias:{},shadowNormalBias:{},shadowRadius:{},shadowMapSize:{}}},directionalShadowMatrix:{value:[]},spotLights:{value:[],properties:{color:{},position:{},direction:{},distance:{},coneCos:{},penumbraCos:{},decay:{}}},spotLightShadows:{value:[],properties:{shadowIntensity:1,shadowBias:{},shadowNormalBias:{},shadowRadius:{},shadowMapSize:{}}},spotLightMap:{value:[]},spotLightMatrix:{value:[]},pointLights:{value:[],properties:{color:{},position:{},decay:{},distance:{}}},pointLightShadows:{value:[],properties:{shadowIntensity:1,shadowBias:{},shadowNormalBias:{},shadowRadius:{},shadowMapSize:{},shadowCameraNear:{},shadowCameraFar:{}}},pointShadowMatrix:{value:[]},hemisphereLights:{value:[],properties:{direction:{},skyColor:{},groundColor:{}}},rectAreaLights:{value:[],properties:{color:{},position:{},width:{},height:{}}},ltc_1:{value:null},ltc_2:{value:null},probesSH:{value:null},probesMin:{value:new W},probesMax:{value:new W},probesResolution:{value:new W}},points:{diffuse:{value:new ne(16777215)},opacity:{value:1},size:{value:1},scale:{value:1},map:{value:null},alphaMap:{value:null},alphaMapTransform:{value:new Vt},alphaTest:{value:0},uvTransform:{value:new Vt}},sprite:{diffuse:{value:new ne(16777215)},opacity:{value:1},center:{value:new re(.5,.5)},rotation:{value:0},map:{value:null},mapTransform:{value:new Vt},alphaMap:{value:null},alphaMapTransform:{value:new Vt},alphaTest:{value:0}}},di={basic:{uniforms:Qe([mt.common,mt.specularmap,mt.envmap,mt.aomap,mt.lightmap,mt.fog]),vertexShader:Xt.meshbasic_vert,fragmentShader:Xt.meshbasic_frag},lambert:{uniforms:Qe([mt.common,mt.specularmap,mt.envmap,mt.aomap,mt.lightmap,mt.emissivemap,mt.bumpmap,mt.normalmap,mt.displacementmap,mt.fog,mt.lights,{emissive:{value:new ne(0)},envMapIntensity:{value:1}}]),vertexShader:Xt.meshlambert_vert,fragmentShader:Xt.meshlambert_frag},phong:{uniforms:Qe([mt.common,mt.specularmap,mt.envmap,mt.aomap,mt.lightmap,mt.emissivemap,mt.bumpmap,mt.normalmap,mt.displacementmap,mt.fog,mt.lights,{emissive:{value:new ne(0)},specular:{value:new ne(1118481)},shininess:{value:30},envMapIntensity:{value:1}}]),vertexShader:Xt.meshphong_vert,fragmentShader:Xt.meshphong_frag},standard:{uniforms:Qe([mt.common,mt.envmap,mt.aomap,mt.lightmap,mt.emissivemap,mt.bumpmap,mt.normalmap,mt.displacementmap,mt.roughnessmap,mt.metalnessmap,mt.fog,mt.lights,{emissive:{value:new ne(0)},roughness:{value:1},metalness:{value:0},envMapIntensity:{value:1}}]),vertexShader:Xt.meshphysical_vert,fragmentShader:Xt.meshphysical_frag},toon:{uniforms:Qe([mt.common,mt.aomap,mt.lightmap,mt.emissivemap,mt.bumpmap,mt.normalmap,mt.displacementmap,mt.gradientmap,mt.fog,mt.lights,{emissive:{value:new ne(0)}}]),vertexShader:Xt.meshtoon_vert,fragmentShader:Xt.meshtoon_frag},matcap:{uniforms:Qe([mt.common,mt.bumpmap,mt.normalmap,mt.displacementmap,mt.fog,{matcap:{value:null}}]),vertexShader:Xt.meshmatcap_vert,fragmentShader:Xt.meshmatcap_frag},points:{uniforms:Qe([mt.points,mt.fog]),vertexShader:Xt.points_vert,fragmentShader:Xt.points_frag},dashed:{uniforms:Qe([mt.common,mt.fog,{scale:{value:1},dashSize:{value:1},totalSize:{value:2}}]),vertexShader:Xt.linedashed_vert,fragmentShader:Xt.linedashed_frag},depth:{uniforms:Qe([mt.common,mt.displacementmap]),vertexShader:Xt.depth_vert,fragmentShader:Xt.depth_frag},normal:{uniforms:Qe([mt.common,mt.bumpmap,mt.normalmap,mt.displacementmap,{opacity:{value:1}}]),vertexShader:Xt.meshnormal_vert,fragmentShader:Xt.meshnormal_frag},sprite:{uniforms:Qe([mt.sprite,mt.fog]),vertexShader:Xt.sprite_vert,fragmentShader:Xt.sprite_frag},background:{uniforms:{uvTransform:{value:new Vt},t2D:{value:null},backgroundIntensity:{value:1}},vertexShader:Xt.background_vert,fragmentShader:Xt.background_frag},backgroundCube:{uniforms:{envMap:{value:null},backgroundBlurriness:{value:0},backgroundIntensity:{value:1},backgroundRotation:{value:new Vt}},vertexShader:Xt.backgroundCube_vert,fragmentShader:Xt.backgroundCube_frag},cube:{uniforms:{tCube:{value:null},tFlip:{value:-1},opacity:{value:1}},vertexShader:Xt.cube_vert,fragmentShader:Xt.cube_frag},equirect:{uniforms:{tEquirect:{value:null}},vertexShader:Xt.equirect_vert,fragmentShader:Xt.equirect_frag},distance:{uniforms:Qe([mt.common,mt.displacementmap,{referencePosition:{value:new W},nearDistance:{value:1},farDistance:{value:1e3}}]),vertexShader:Xt.distance_vert,fragmentShader:Xt.distance_frag},shadow:{uniforms:Qe([mt.lights,mt.fog,{color:{value:new ne(0)},opacity:{value:1}}]),vertexShader:Xt.shadow_vert,fragmentShader:Xt.shadow_frag}};di.physical={uniforms:Qe([di.standard.uniforms,{clearcoat:{value:0},clearcoatMap:{value:null},clearcoatMapTransform:{value:new Vt},clearcoatNormalMap:{value:null},clearcoatNormalMapTransform:{value:new Vt},clearcoatNormalScale:{value:new re(1,1)},clearcoatRoughness:{value:0},clearcoatRoughnessMap:{value:null},clearcoatRoughnessMapTransform:{value:new Vt},dispersion:{value:0},retroreflectivity:{value:0},iridescence:{value:0},iridescenceMap:{value:null},iridescenceMapTransform:{value:new Vt},iridescenceIOR:{value:1.3},iridescenceThicknessMinimum:{value:100},iridescenceThicknessMaximum:{value:400},iridescenceThicknessMap:{value:null},iridescenceThicknessMapTransform:{value:new Vt},sheen:{value:0},sheenColor:{value:new ne(0)},sheenColorMap:{value:null},sheenColorMapTransform:{value:new Vt},sheenRoughness:{value:1},sheenRoughnessMap:{value:null},sheenRoughnessMapTransform:{value:new Vt},transmission:{value:0},transmissionMap:{value:null},transmissionMapTransform:{value:new Vt},transmissionSamplerSize:{value:new re},transmissionSamplerMap:{value:null},thickness:{value:0},thicknessMap:{value:null},thicknessMapTransform:{value:new Vt},attenuationDistance:{value:0},attenuationColor:{value:new ne(0)},specularColor:{value:new ne(1,1,1)},specularColorMap:{value:null},specularColorMapTransform:{value:new Vt},specularIntensity:{value:1},specularIntensityMap:{value:null},specularIntensityMapTransform:{value:new Vt},anisotropyVector:{value:new re},anisotropyMap:{value:null},anisotropyMapTransform:{value:new Vt}}]),vertexShader:Xt.meshphysical_vert,fragmentShader:Xt.meshphysical_frag};var ku={r:0,b:0,g:0},hT=new Ce,F_=new Vt;F_.set(-1,0,0,0,1,0,0,0,1);function fT(n,t,e,i,s,r){let o=new ne(0),a=s===!0?0:1,l,c,u=null,f=0,h=null;function m(M){let P=M.isScene===!0?M.background:null;if(P&&P.isTexture){let b=M.backgroundBlurriness>0;P=t.get(P,b)}return P}function _(M){let P=!1,b=m(M);b===null?p(o,a):b&&b.isColor&&(p(b,1),P=!0);let E=n.xr.getEnvironmentBlendMode();E==="additive"?e.buffers.color.setClear(0,0,0,1,r):E==="alpha-blend"&&e.buffers.color.setClear(0,0,0,0,r),(n.autoClear||P)&&(e.buffers.depth.setTest(!0),e.buffers.depth.setMask(!0),e.buffers.color.setMask(!0),n.clear(n.autoClearColor,n.autoClearDepth,n.autoClearStencil))}function S(M,P){let b=m(P);b&&(b.isCubeTexture||b.mapping===ya)?(c===void 0&&(c=new In(new zr(1,1,1),new Sn({name:"BackgroundCubeMaterial",uniforms:Xs(di.backgroundCube.uniforms),vertexShader:di.backgroundCube.vertexShader,fragmentShader:di.backgroundCube.fragmentShader,side:rn,depthTest:!1,depthWrite:!1,fog:!1,allowOverride:!1})),c.geometry.deleteAttribute("normal"),c.geometry.deleteAttribute("uv"),c.onBeforeRender=function(E,w,A){this.matrixWorld.copyPosition(A.matrixWorld)},Object.defineProperty(c.material,"envMap",{get:function(){return this.uniforms.envMap.value}}),i.update(c)),c.material.uniforms.envMap.value=b,c.material.uniforms.backgroundBlurriness.value=P.backgroundBlurriness,c.material.uniforms.backgroundIntensity.value=P.backgroundIntensity,c.material.uniforms.backgroundRotation.value.setFromMatrix4(hT.makeRotationFromEuler(P.backgroundRotation)).transpose(),b.isCubeTexture&&b.isRenderTargetTexture===!1&&c.material.uniforms.backgroundRotation.value.premultiply(F_),c.material.toneMapped=Kt.getTransfer(b.colorSpace)!==ce,(u!==b||f!==b.version||h!==n.toneMapping)&&(c.material.needsUpdate=!0,u=b,f=b.version,h=n.toneMapping),c.layers.enableAll(),M.unshift(c,c.geometry,c.material,0,0,null)):b&&b.isTexture&&(l===void 0&&(l=new In(new da(2,2),new Sn({name:"BackgroundMaterial",uniforms:Xs(di.background.uniforms),vertexShader:di.background.vertexShader,fragmentShader:di.background.fragmentShader,side:as,depthTest:!1,depthWrite:!1,fog:!1,allowOverride:!1})),l.geometry.deleteAttribute("normal"),Object.defineProperty(l.material,"map",{get:function(){return this.uniforms.t2D.value}}),i.update(l)),l.material.uniforms.t2D.value=b,l.material.uniforms.backgroundIntensity.value=P.backgroundIntensity,l.material.toneMapped=Kt.getTransfer(b.colorSpace)!==ce,b.matrixAutoUpdate===!0&&b.updateMatrix(),l.material.uniforms.uvTransform.value.copy(b.matrix),(u!==b||f!==b.version||h!==n.toneMapping)&&(l.material.needsUpdate=!0,u=b,f=b.version,h=n.toneMapping),l.layers.enableAll(),M.unshift(l,l.geometry,l.material,0,0,null))}function p(M,P){M.getRGB(ku,Rd(n)),e.buffers.color.setClear(ku.r,ku.g,ku.b,P,r)}function d(){c!==void 0&&(c.geometry.dispose(),c.material.dispose(),c=void 0),l!==void 0&&(l.geometry.dispose(),l.material.dispose(),l=void 0)}return{getClearColor:function(){return o},setClearColor:function(M,P=1){o.set(M),a=P,p(o,a)},getClearAlpha:function(){return a},setClearAlpha:function(M){a=M,p(o,a)},render:_,addToRenderList:S,dispose:d}}function dT(n,t){let e=n.getParameter(n.MAX_VERTEX_ATTRIBS),i={},s=h(null),r=s,o=!1;function a(F,V,I,R,N){let B=!1,k=f(F,R,I,V);r!==k&&(r=k,c(r.object)),B=m(F,R,I,N),B&&_(F,R,I,N),N!==null&&t.update(N,n.ELEMENT_ARRAY_BUFFER),(B||o)&&(o=!1,b(F,V,I,R),N!==null&&n.bindBuffer(n.ELEMENT_ARRAY_BUFFER,t.get(N).buffer))}function l(){return n.createVertexArray()}function c(F){return n.bindVertexArray(F)}function u(F){return n.deleteVertexArray(F)}function f(F,V,I,R){let N=R.wireframe===!0,B=i[V.id];B===void 0&&(B={},i[V.id]=B);let k=F.isInstancedMesh===!0?F.id:0,Y=B[k];Y===void 0&&(Y={},B[k]=Y);let $=Y[I.id];$===void 0&&($={},Y[I.id]=$);let J=$[N];return J===void 0&&(J=h(l()),$[N]=J),J}function h(F){let V=[],I=[],R=[];for(let N=0;N<e;N++)V[N]=0,I[N]=0,R[N]=0;return{geometry:null,program:null,wireframe:!1,newAttributes:V,enabledAttributes:I,attributeDivisors:R,object:F,attributes:{},index:null}}function m(F,V,I,R){let N=r.attributes,B=V.attributes,k=0,Y=I.getAttributes();for(let $ in Y)if(Y[$].location>=0){let q=N[$],st=B[$];if(st===void 0&&($==="instanceMatrix"&&F.instanceMatrix&&(st=F.instanceMatrix),$==="instanceColor"&&F.instanceColor&&(st=F.instanceColor)),q===void 0||q.attribute!==st||st&&q.data!==st.data)return!0;k++}return r.attributesNum!==k||r.index!==R}function _(F,V,I,R){let N={},B=V.attributes,k=0,Y=I.getAttributes();for(let $ in Y)if(Y[$].location>=0){let q=B[$];q===void 0&&($==="instanceMatrix"&&F.instanceMatrix&&(q=F.instanceMatrix),$==="instanceColor"&&F.instanceColor&&(q=F.instanceColor));let st={};st.attribute=q,q&&q.data&&(st.data=q.data),N[$]=st,k++}r.attributes=N,r.attributesNum=k,r.index=R}function S(){let F=r.newAttributes;for(let V=0,I=F.length;V<I;V++)F[V]=0}function p(F){d(F,0)}function d(F,V){let I=r.newAttributes,R=r.enabledAttributes,N=r.attributeDivisors;I[F]=1,R[F]===0&&(n.enableVertexAttribArray(F),R[F]=1),N[F]!==V&&(n.vertexAttribDivisor(F,V),N[F]=V)}function M(){let F=r.newAttributes,V=r.enabledAttributes;for(let I=0,R=V.length;I<R;I++)V[I]!==F[I]&&(n.disableVertexAttribArray(I),V[I]=0)}function P(F,V,I,R,N,B,k){k===!0?n.vertexAttribIPointer(F,V,I,N,B):n.vertexAttribPointer(F,V,I,R,N,B)}function b(F,V,I,R){S();let N=R.attributes,B=I.getAttributes(),k=V.defaultAttributeValues;for(let Y in B){let $=B[Y];if($.location>=0){let J=N[Y];if(J===void 0&&(Y==="instanceMatrix"&&F.instanceMatrix&&(J=F.instanceMatrix),Y==="instanceColor"&&F.instanceColor&&(J=F.instanceColor)),J!==void 0){let q=J.normalized,st=J.itemSize,rt=t.get(J);if(rt===void 0)continue;let Mt=rt.buffer,Ct=rt.type,kt=rt.bytesPerElement,K=Ct===n.INT||Ct===n.UNSIGNED_INT||J.gpuType===eu;if(J.isInterleavedBufferAttribute){let tt=J.data,xt=tt.stride,Nt=J.offset;if(tt.isInstancedInterleavedBuffer){for(let ct=0;ct<$.locationSize;ct++)d($.location+ct,tt.meshPerAttribute);F.isInstancedMesh!==!0&&R._maxInstanceCount===void 0&&(R._maxInstanceCount=tt.meshPerAttribute*tt.count)}else for(let ct=0;ct<$.locationSize;ct++)p($.location+ct);n.bindBuffer(n.ARRAY_BUFFER,Mt);for(let ct=0;ct<$.locationSize;ct++)P($.location+ct,st/$.locationSize,Ct,q,xt*kt,(Nt+st/$.locationSize*ct)*kt,K)}else{if(J.isInstancedBufferAttribute){for(let tt=0;tt<$.locationSize;tt++)d($.location+tt,J.meshPerAttribute);F.isInstancedMesh!==!0&&R._maxInstanceCount===void 0&&(R._maxInstanceCount=J.meshPerAttribute*J.count)}else for(let tt=0;tt<$.locationSize;tt++)p($.location+tt);n.bindBuffer(n.ARRAY_BUFFER,Mt);for(let tt=0;tt<$.locationSize;tt++)P($.location+tt,st/$.locationSize,Ct,q,st*kt,st/$.locationSize*tt*kt,K)}}else if(k!==void 0){let q=k[Y];if(q!==void 0)switch(q.length){case 2:n.vertexAttrib2fv($.location,q);break;case 3:n.vertexAttrib3fv($.location,q);break;case 4:n.vertexAttrib4fv($.location,q);break;default:n.vertexAttrib1fv($.location,q)}}}}M()}function E(){T();for(let F in i){let V=i[F];for(let I in V){let R=V[I];for(let N in R){let B=R[N];for(let k in B)u(B[k].object),delete B[k];delete R[N]}}delete i[F]}}function w(F){if(i[F.id]===void 0)return;let V=i[F.id];for(let I in V){let R=V[I];for(let N in R){let B=R[N];for(let k in B)u(B[k].object),delete B[k];delete R[N]}}delete i[F.id]}function A(F){for(let V in i){let I=i[V];for(let R in I){let N=I[R];if(N[F.id]===void 0)continue;let B=N[F.id];for(let k in B)u(B[k].object),delete B[k];delete N[F.id]}}}function x(F){for(let V in i){let I=i[V],R=F.isInstancedMesh===!0?F.id:0,N=I[R];if(N!==void 0){for(let B in N){let k=N[B];for(let Y in k)u(k[Y].object),delete k[Y];delete N[B]}delete I[R],Object.keys(I).length===0&&delete i[V]}}}function T(){L(),o=!0,r!==s&&(r=s,c(r.object))}function L(){s.geometry=null,s.program=null,s.wireframe=!1}return{setup:a,reset:T,resetDefaultState:L,dispose:E,releaseStatesOfGeometry:w,releaseStatesOfObject:x,releaseStatesOfProgram:A,initAttributes:S,enableAttribute:p,disableUnusedAttributes:M}}function pT(n,t,e){let i;function s(l){i=l}function r(l,c){n.drawArrays(i,l,c),e.update(c,i,1)}function o(l,c,u){u!==0&&(n.drawArraysInstanced(i,l,c,u),e.update(c,i,u))}function a(l,c,u){if(u===0)return;t.get("WEBGL_multi_draw").multiDrawArraysWEBGL(i,l,0,c,0,u);let h=0;for(let m=0;m<u;m++)h+=c[m];e.update(h,i,1)}this.setMode=s,this.render=r,this.renderInstances=o,this.renderMultiDraw=a}function mT(n,t,e,i){let s;function r(){if(s!==void 0)return s;if(t.has("EXT_texture_filter_anisotropic")===!0){let A=t.get("EXT_texture_filter_anisotropic");s=n.getParameter(A.MAX_TEXTURE_MAX_ANISOTROPY_EXT)}else s=0;return s}function o(A){return!(A!==Ln&&i.convert(A)!==n.getParameter(n.IMPLEMENTATION_COLOR_READ_FORMAT))}function a(A){let x=A===Kn&&(t.has("EXT_color_buffer_half_float")||t.has("EXT_color_buffer_float"));return!(A!==Mn&&A!==Zn&&!x&&i.convert(A)!==n.getParameter(n.IMPLEMENTATION_COLOR_READ_TYPE))}function l(A){if(A==="highp"){if(n.getShaderPrecisionFormat(n.VERTEX_SHADER,n.HIGH_FLOAT).precision>0&&n.getShaderPrecisionFormat(n.FRAGMENT_SHADER,n.HIGH_FLOAT).precision>0)return"highp";A="mediump"}return A==="mediump"&&n.getShaderPrecisionFormat(n.VERTEX_SHADER,n.MEDIUM_FLOAT).precision>0&&n.getShaderPrecisionFormat(n.FRAGMENT_SHADER,n.MEDIUM_FLOAT).precision>0?"mediump":"lowp"}let c=e.precision!==void 0?e.precision:"highp",u=l(c);u!==c&&(Dt("WebGLRenderer:",c,"not supported, using",u,"instead."),c=u);let f=e.logarithmicDepthBuffer===!0,h=e.reversedDepthBuffer===!0&&t.has("EXT_clip_control");e.reversedDepthBuffer===!0&&h===!1&&Dt("WebGLRenderer: Unable to use reversed depth buffer due to missing EXT_clip_control extension. Fallback to default depth buffer.");let m=n.getParameter(n.MAX_TEXTURE_IMAGE_UNITS),_=n.getParameter(n.MAX_VERTEX_TEXTURE_IMAGE_UNITS),S=n.getParameter(n.MAX_TEXTURE_SIZE),p=n.getParameter(n.MAX_CUBE_MAP_TEXTURE_SIZE),d=n.getParameter(n.MAX_VERTEX_ATTRIBS),M=n.getParameter(n.MAX_VERTEX_UNIFORM_VECTORS),P=n.getParameter(n.MAX_VARYING_VECTORS),b=n.getParameter(n.MAX_FRAGMENT_UNIFORM_VECTORS),E=n.getParameter(n.MAX_SAMPLES),w=n.getParameter(n.SAMPLES);return{isWebGL2:!0,getMaxAnisotropy:r,getMaxPrecision:l,textureFormatReadable:o,textureTypeReadable:a,precision:c,logarithmicDepthBuffer:f,reversedDepthBuffer:h,maxTextures:m,maxVertexTextures:_,maxTextureSize:S,maxCubemapSize:p,maxAttributes:d,maxVertexUniforms:M,maxVaryings:P,maxFragmentUniforms:b,maxSamples:E,samples:w}}function gT(n){let t=this,e=null,i=0,s=!1,r=!1,o=new $n,a=new Vt,l={value:null,needsUpdate:!1};this.uniform=l,this.numPlanes=0,this.numIntersection=0,this.init=function(f,h){let m=f.length!==0||h||i!==0||s;return s=h,i=f.length,m},this.beginShadows=function(){r=!0,u(null)},this.endShadows=function(){r=!1},this.setGlobalState=function(f,h){e=u(f,h,0)},this.setState=function(f,h,m){let _=f.clippingPlanes,S=f.clipIntersection,p=f.clipShadows,d=n.get(f);if(!s||_===null||_.length===0||r&&!p)r?u(null):c();else{let M=r?0:i,P=M*4,b=d.clippingState||null;l.value=b,b=u(_,h,P,m);for(let E=0;E!==P;++E)b[E]=e[E];d.clippingState=b,this.numIntersection=S?this.numPlanes:0,this.numPlanes+=M}};function c(){l.value!==e&&(l.value=e,l.needsUpdate=i>0),t.numPlanes=i,t.numIntersection=0}function u(f,h,m,_){let S=f!==null?f.length:0,p=null;if(S!==0){if(p=l.value,_!==!0||p===null){let d=m+S*4,M=h.matrixWorldInverse;a.getNormalMatrix(M),(p===null||p.length<d)&&(p=new Float32Array(d));for(let P=0,b=m;P!==S;++P,b+=4)o.copy(f[P]).applyMatrix4(M,a),o.normal.toArray(p,b),p[b+3]=o.constant}l.value=p,l.needsUpdate=!0}return t.numPlanes=S,t.numIntersection=0,p}}var qr=4,_T=6,xT=20,yT=256,Ca=new _a,m_=new ne,Nd=null,Ud=0,Dd=0,Od=!1,vT=new W,qs=new W,zu=class{constructor(t){this._renderer=t,this._pingPongRenderTarget=null,this._lodMax=0,this._cubeSize=0,this._sizeLods=[],this._lodMeshes=[],this._backgroundBox=null,this._cubemapMaterial=null,this._equirectMaterial=null,this._blurMaterial=null,this._ggxMaterial=null}fromScene(t,e=0,i=.1,s=100,r={}){let{size:o=256,position:a=vT}=r;Nd=this._renderer.getRenderTarget(),Ud=this._renderer.getActiveCubeFace(),Dd=this._renderer.getActiveMipmapLevel(),Od=this._renderer.xr.enabled,this._renderer.xr.enabled=!1,this._setSize(o);let l=this._allocateTargets();return l.depthBuffer=!0,this._sceneToCubeUV(t,i,s,l,a),e>0&&this._blur(l,0,0,e),this._applyPMREM(l),this._cleanup(l),l}fromEquirectangular(t,e=null){return this._fromTexture(t,e)}fromCubemap(t,e=null){return this._fromTexture(t,e)}compileCubemapShader(){this._cubemapMaterial===null&&(this._cubemapMaterial=x_(),this._compileMaterial(this._cubemapMaterial))}compileEquirectangularShader(){this._equirectMaterial===null&&(this._equirectMaterial=__(),this._compileMaterial(this._equirectMaterial))}dispose(){this._dispose(),this._cubemapMaterial!==null&&this._cubemapMaterial.dispose(),this._equirectMaterial!==null&&this._equirectMaterial.dispose(),this._backgroundBox!==null&&(this._backgroundBox.geometry.dispose(),this._backgroundBox.material.dispose())}_setSize(t){this._lodMax=Math.floor(Math.log2(t)),this._cubeSize=Math.pow(2,this._lodMax)}_dispose(){this._blurMaterial!==null&&this._blurMaterial.dispose(),this._ggxMaterial!==null&&this._ggxMaterial.dispose(),this._pingPongRenderTarget!==null&&this._pingPongRenderTarget.dispose();for(let t=0;t<this._lodMeshes.length;t++)this._lodMeshes[t].geometry.dispose()}_cleanup(t){this._renderer.setRenderTarget(Nd,Ud,Dd),this._renderer.xr.enabled=Od,t.scissorTest=!1,Xr(t,0,0,t.width,t.height)}_fromTexture(t,e){t.mapping===cs||t.mapping===$s?this._setSize(t.image.length===0?16:t.image[0].width||t.image[0].image.width):this._setSize(t.image.width/4),Nd=this._renderer.getRenderTarget(),Ud=this._renderer.getActiveCubeFace(),Dd=this._renderer.getActiveMipmapLevel(),Od=this._renderer.xr.enabled,this._renderer.xr.enabled=!1;let i=e||this._allocateTargets();return this._textureToCubeUV(t,i),this._applyPMREM(i),this._cleanup(i),i}_allocateTargets(){let t=3*Math.max(this._cubeSize,112),e=4*this._cubeSize,i={magFilter:$e,minFilter:$e,generateMipmaps:!1,type:Kn,format:Ln,colorSpace:Jo,depthBuffer:!1},s=g_(t,e,i);if(this._pingPongRenderTarget===null||this._pingPongRenderTarget.width!==t||this._pingPongRenderTarget.height!==e){this._pingPongRenderTarget!==null&&this._dispose(),this._pingPongRenderTarget=g_(t,e,i);let{_lodMax:r}=this;({lodMeshes:this._lodMeshes,sizeLods:this._sizeLods}=ST(r)),this._blurMaterial=MT(r,t,e),this._ggxMaterial=bT(r,t,e)}return s}_compileMaterial(t){let e=new In(new vn,t);this._renderer.compile(e,Ca)}_sceneToCubeUV(t,e,i,s,r){let l=new je(90,1,e,i),c=[1,-1,1,1,1,1],u=[1,1,1,-1,-1,-1],f=this._renderer,h=f.autoClear,m=f.toneMapping;f.getClearColor(m_),f.toneMapping=qn,f.autoClear=!1,f.state.buffers.depth.getReversed()&&(f.setRenderTarget(s),f.clearDepth(),f.setRenderTarget(null)),this._backgroundBox===null&&(this._backgroundBox=new In(new zr,new aa({name:"PMREM.Background",side:rn,depthWrite:!1,depthTest:!1})));let S=this._backgroundBox,p=S.material,d=!1,M=t.background;M?M.isColor&&(p.color.copy(M),t.background=null,d=!0):(p.color.copy(m_),d=!0);for(let P=0;P<6;P++){let b=P%3;b===0?(l.up.set(0,c[P],0),l.position.set(r.x,r.y,r.z),l.lookAt(r.x+u[P],r.y,r.z)):b===1?(l.up.set(0,0,c[P]),l.position.set(r.x,r.y,r.z),l.lookAt(r.x,r.y+u[P],r.z)):(l.up.set(0,c[P],0),l.position.set(r.x,r.y,r.z),l.lookAt(r.x,r.y,r.z+u[P]));let E=this._cubeSize;Xr(s,b*E,P>2?E:0,E,E),f.setRenderTarget(s),d&&f.render(S,l),f.render(t,l)}f.toneMapping=m,f.autoClear=h,t.background=M}_textureToCubeUV(t,e){let i=this._renderer,s=t.mapping===cs||t.mapping===$s;s?(this._cubemapMaterial===null&&(this._cubemapMaterial=x_()),this._cubemapMaterial.uniforms.flipEnvMap.value=t.isRenderTargetTexture===!1?-1:1):this._equirectMaterial===null&&(this._equirectMaterial=__());let r=s?this._cubemapMaterial:this._equirectMaterial,o=this._lodMeshes[0];o.material=r;let a=r.uniforms;a.envMap.value=t;let l=this._cubeSize;Xr(e,0,0,3*l,2*l),i.setRenderTarget(e),i.render(o,Ca)}_applyPMREM(t){let e=this._renderer,i=e.autoClear;e.autoClear=!1;let s=this._lodMeshes.length;for(let r=1;r<s;r++)this._applyGGXFilter(t,r-1,r);e.autoClear=i}_applyGGXFilter(t,e,i){let s=this._renderer,r=this._pingPongRenderTarget,o=this._ggxMaterial,a=this._lodMeshes[i];a.material=o;let l=o.uniforms,c=i/(this._lodMeshes.length-1),u=e/(this._lodMeshes.length-1),f=Math.sqrt(c*c-u*u),h=c*1.25,m=f*h,{_lodMax:_}=this,S=this._sizeLods[i],p=3*S*(i>_-qr?i-_+qr:0),d=4*(this._cubeSize-S);l.envMap.value=t.texture,l.roughness.value=m,l.mipInt.value=_-e,Xr(r,p,d,3*S,2*S),s.setRenderTarget(r),s.render(a,Ca),l.envMap.value=r.texture,l.roughness.value=0,l.mipInt.value=_-i,Xr(t,p,d,3*S,2*S),s.setRenderTarget(t),s.render(a,Ca)}_blur(t,e,i,s){let r=this._pingPongRenderTarget,o=Math.min(s,Math.PI)/Math.SQRT2;this._blurPass(t,r,e,i,o),this._blurPass(r,t,i,i,o)}_blurPass(t,e,i,s,r){let o=this._renderer,a=this._blurMaterial,l=this._lodMeshes[s];l.material=a;let c=a.uniforms;c.envMap.value=t.texture,c.sigma.value=r,c.mipInt.value=this._lodMax-i;let u=this._sizeLods[s],f=3*u*(s>this._lodMax-qr?s-this._lodMax+qr:0),h=4*(this._cubeSize-u);Xr(e,f,h,3*u,2*u),o.setRenderTarget(e),o.render(l,Ca)}};function ST(n){let t=[],e=[],i=n,s=n-qr+1+_T;for(let r=0;r<s;r++){let o=Math.pow(2,i);t.push(o);let a=1/(o-2),l=-a,c=1+a,u=[l,l,c,l,c,c,l,l,c,c,l,c],f=6,h=6,m=3,_=new Float32Array(m*h*f),S=new Float32Array(m*h*f);for(let d=0;d<f;d++){let M=d%3*2/3-1,P=d>2?0:-1,b=[M,P,0,M+2/3,P,0,M+2/3,P+1,0,M,P,0,M+2/3,P+1,0,M,P+1,0];_.set(b,m*h*d);for(let E=0;E<h;E++){let w=u[E*2]*2-1,A=u[E*2+1]*2-1;d===0?qs.set(1,A,w):d===1?qs.set(-w,1,-A):d===2?qs.set(-w,A,1):d===3?qs.set(-1,A,-w):d===4?qs.set(-w,-1,A):qs.set(w,A,-1),qs.toArray(S,(d*h+E)*m)}}let p=new vn;p.setAttribute("position",new Pn(_,m)),p.setAttribute("outputDirection",new Pn(S,m)),e.push(new In(p,null)),i>qr&&i--}return{lodMeshes:e,sizeLods:t}}function g_(n,t,e){let i=new dn(n,t,e);return i.texture.mapping=ya,i.texture.name="PMREM.cubeUv",i.scissorTest=!0,i}function Xr(n,t,e,i,s){n.viewport.set(t,e,i,s),n.scissor.set(t,e,i,s)}function bT(n,t,e){return new Sn({name:"PMREMGGXConvolution",defines:{GGX_SAMPLES:yT,CUBEUV_TEXEL_WIDTH:1/t,CUBEUV_TEXEL_HEIGHT:1/e,CUBEUV_MAX_MIP:`${n}.0`},uniforms:{envMap:{value:null},roughness:{value:0},mipInt:{value:0}},vertexShader:Wu(),fragmentShader:`

			precision highp float;
			precision highp int;

			varying vec3 vOutputDirection;

			uniform sampler2D envMap;
			uniform float roughness;
			uniform float mipInt;

			#define ENVMAP_TYPE_CUBE_UV
			#include <cube_uv_reflection_fragment>

			#define PI 3.14159265359

			// Van der Corput radical inverse
			float radicalInverse_VdC(uint bits) {
				bits = (bits << 16u) | (bits >> 16u);
				bits = ((bits & 0x55555555u) << 1u) | ((bits & 0xAAAAAAAAu) >> 1u);
				bits = ((bits & 0x33333333u) << 2u) | ((bits & 0xCCCCCCCCu) >> 2u);
				bits = ((bits & 0x0F0F0F0Fu) << 4u) | ((bits & 0xF0F0F0F0u) >> 4u);
				bits = ((bits & 0x00FF00FFu) << 8u) | ((bits & 0xFF00FF00u) >> 8u);
				return float(bits) * 2.3283064365386963e-10; // / 0x100000000
			}

			// Hammersley sequence
			vec2 hammersley(uint i, uint N) {
				return vec2(float(i) / float(N), radicalInverse_VdC(i));
			}

			// GGX VNDF importance sampling (Eric Heitz 2018)
			// "Sampling the GGX Distribution of Visible Normals"
			// https://jcgt.org/published/0007/04/01/
			vec3 importanceSampleGGX_VNDF(vec2 Xi, vec3 V, float roughness) {
				float alpha = roughness * roughness;

				// Section 4.1: Orthonormal basis
				vec3 T1 = vec3(1.0, 0.0, 0.0);
				vec3 T2 = cross(V, T1);

				// Section 4.2: Parameterization of projected area
				float r = sqrt(Xi.x);
				float phi = 2.0 * PI * Xi.y;
				float t1 = r * cos(phi);
				float t2 = r * sin(phi);
				float s = 0.5 * (1.0 + V.z);
				t2 = (1.0 - s) * sqrt(1.0 - t1 * t1) + s * t2;

				// Section 4.3: Reprojection onto hemisphere
				vec3 Nh = t1 * T1 + t2 * T2 + sqrt(max(0.0, 1.0 - t1 * t1 - t2 * t2)) * V;

				// Section 3.4: Transform back to ellipsoid configuration
				return normalize(vec3(alpha * Nh.x, alpha * Nh.y, max(0.0, Nh.z)));
			}

			void main() {
				vec3 N = normalize(vOutputDirection);
				vec3 V = N; // Assume view direction equals normal for pre-filtering

				vec3 prefilteredColor = vec3(0.0);
				float totalWeight = 0.0;

				// For very low roughness, just sample the environment directly
				if (roughness < 0.001) {
					gl_FragColor = vec4(bilinearCubeUV(envMap, N, mipInt), 1.0);
					return;
				}

				// Tangent space basis for VNDF sampling
				vec3 up = abs(N.z) < 0.999 ? vec3(0.0, 0.0, 1.0) : vec3(1.0, 0.0, 0.0);
				vec3 tangent = normalize(cross(up, N));
				vec3 bitangent = cross(N, tangent);

				for(uint i = 0u; i < uint(GGX_SAMPLES); i++) {
					vec2 Xi = hammersley(i, uint(GGX_SAMPLES));

					// For PMREM, V = N, so in tangent space V is always (0, 0, 1)
					vec3 H_tangent = importanceSampleGGX_VNDF(Xi, vec3(0.0, 0.0, 1.0), roughness);

					// Transform H back to world space
					vec3 H = normalize(tangent * H_tangent.x + bitangent * H_tangent.y + N * H_tangent.z);
					vec3 L = normalize(2.0 * dot(V, H) * H - V);

					float NdotL = max(dot(N, L), 0.0);

					if(NdotL > 0.0) {
						// Sample environment at fixed mip level
						// VNDF importance sampling handles the distribution filtering
						vec3 sampleColor = bilinearCubeUV(envMap, L, mipInt);

						// Weight by NdotL for the split-sum approximation
						// VNDF PDF naturally accounts for the visible microfacet distribution
						prefilteredColor += sampleColor * NdotL;
						totalWeight += NdotL;
					}
				}

				if (totalWeight > 0.0) {
					prefilteredColor = prefilteredColor / totalWeight;
				}

				gl_FragColor = vec4(prefilteredColor, 1.0);
			}
		`,blending:hi,depthTest:!1,depthWrite:!1})}function MT(n,t,e){return new Sn({name:"SphericalGaussianBlur",defines:{SAMPLES:xT,CUBEUV_TEXEL_WIDTH:1/t,CUBEUV_TEXEL_HEIGHT:1/e,CUBEUV_MAX_MIP:`${n}.0`},uniforms:{envMap:{value:null},sigma:{value:0},mipInt:{value:0}},vertexShader:Wu(),fragmentShader:`

			precision highp float;
			precision highp int;

			varying vec3 vOutputDirection;

			uniform sampler2D envMap;
			uniform float sigma;
			uniform float mipInt;

			#define ENVMAP_TYPE_CUBE_UV
			#include <cube_uv_reflection_fragment>

			#define PI 3.14159265359
			#define GOLDEN_ANGLE 2.39996322973

			void main() {

				if ( sigma == 0.0 ) {

					gl_FragColor = vec4( bilinearCubeUV( envMap, vOutputDirection, mipInt ), 1.0 );
					return;

				}

				vec3 outputDirection = normalize( vOutputDirection );

				vec3 up = abs( outputDirection.z ) < 0.999 ? vec3( 0.0, 0.0, 1.0 ) : vec3( 1.0, 0.0, 0.0 );
				vec3 tangent = normalize( cross( up, outputDirection ) );
				vec3 bitangent = cross( outputDirection, tangent );

				// Truncate the kernel at three standard deviations or at the antipode.
				float thetaMax = min( 3.0 * sigma, PI );
				float truncation = 1.0 - exp( - 0.5 * thetaMax * thetaMax / ( sigma * sigma ) );

				vec3 accumColor = vec3( 0.0 );
				float accumWeight = 0.0;

				for ( int i = 0; i < SAMPLES; i ++ ) {

					// Stratified inverse-CDF sampling of the Gaussian, placed on a golden-angle spiral.
					float stratum = ( float( i ) + 0.5 ) / float( SAMPLES );
					float theta = sigma * sqrt( - 2.0 * log( 1.0 - stratum * truncation ) );
					float phi = float( i ) * GOLDEN_ANGLE;

					vec3 offset = cos( phi ) * tangent + sin( phi ) * bitangent;
					vec3 sampleDirection = cos( theta ) * outputDirection + sin( theta ) * offset;

					// Correct the planar sample density to solid angle.
					float weight = sin( theta ) / theta;

					accumColor += weight * bilinearCubeUV( envMap, sampleDirection, mipInt );
					accumWeight += weight;

				}

				gl_FragColor = vec4( accumColor / accumWeight, 1.0 );

			}
		`,blending:hi,depthTest:!1,depthWrite:!1})}function __(){return new Sn({name:"EquirectangularToCubeUV",uniforms:{envMap:{value:null}},vertexShader:Wu(),fragmentShader:`

			precision mediump float;
			precision mediump int;

			varying vec3 vOutputDirection;

			uniform sampler2D envMap;

			#include <common>

			void main() {

				vec3 outputDirection = normalize( vOutputDirection );
				vec2 uv = equirectUv( outputDirection );

				gl_FragColor = vec4( texture2D ( envMap, uv ).rgb, 1.0 );

			}
		`,blending:hi,depthTest:!1,depthWrite:!1})}function x_(){return new Sn({name:"CubemapToCubeUV",uniforms:{envMap:{value:null},flipEnvMap:{value:-1}},vertexShader:Wu(),fragmentShader:`

			precision mediump float;
			precision mediump int;

			uniform float flipEnvMap;

			varying vec3 vOutputDirection;

			uniform samplerCube envMap;

			void main() {

				gl_FragColor = textureCube( envMap, vec3( flipEnvMap * vOutputDirection.x, vOutputDirection.yz ) );

			}
		`,blending:hi,depthTest:!1,depthWrite:!1})}function Wu(){return`

		precision mediump float;
		precision mediump int;

		attribute vec3 outputDirection;

		varying vec3 vOutputDirection;

		void main() {

			vOutputDirection = outputDirection;
			gl_Position = vec4( position, 1.0 );

		}
	`}var Gu=class extends dn{constructor(t=1,e={}){super(t,t,e),this.isWebGLCubeRenderTarget=!0;let i={width:t,height:t,depth:1},s=[i,i,i,i,i,i];this.texture=new ua(s),this._setTextureOptions(e),this.texture.isRenderTargetTexture=!0}fromEquirectangularTexture(t,e){this.texture.type=e.type,this.texture.colorSpace=e.colorSpace,this.texture.generateMipmaps=e.generateMipmaps,this.texture.minFilter=e.minFilter,this.texture.magFilter=e.magFilter;let i={uniforms:{tEquirect:{value:null}},vertexShader:`

				varying vec3 vWorldDirection;

				vec3 transformDirection( in vec3 dir, in mat4 matrix ) {

					return normalize( ( matrix * vec4( dir, 0.0 ) ).xyz );

				}

				void main() {

					vWorldDirection = transformDirection( position, modelMatrix );

					#include <begin_vertex>
					#include <project_vertex>

				}
			`,fragmentShader:`

				uniform sampler2D tEquirect;

				varying vec3 vWorldDirection;

				#include <common>

				void main() {

					vec3 direction = normalize( vWorldDirection );

					vec2 sampleUV = equirectUv( direction );

					gl_FragColor = texture2D( tEquirect, sampleUV );

				}
			`},s=new zr(5,5,5),r=new Sn({name:"CubemapFromEquirect",uniforms:Xs(i.uniforms),vertexShader:i.vertexShader,fragmentShader:i.fragmentShader,side:rn,blending:hi});r.uniforms.tEquirect.value=e;let o=new In(s,r),a=e.minFilter;return e.minFilter===ls&&(e.minFilter=$e),new Kl(1,10,this).update(t,o),e.minFilter=a,o.geometry.dispose(),o.material.dispose(),this}clear(t,e=!0,i=!0,s=!0){let r=t.getRenderTarget();for(let o=0;o<6;o++)t.setRenderTarget(this,o),t.clear(e,i,s);t.setRenderTarget(r)}};function TT(n){let t=new WeakMap,e=new WeakMap,i=null;function s(h,m=!1){return h==null?null:m?o(h):r(h)}function r(h){if(h&&h.isTexture){let m=h.mapping;if(m===jl||m===Ql)if(t.has(h)){let _=t.get(h).texture;return a(_,h.mapping)}else{let _=h.image;if(_&&_.height>0){let S=new Gu(_.height);return S.fromEquirectangularTexture(n,h),t.set(h,S),h.addEventListener("dispose",c),a(S.texture,h.mapping)}else return null}}return h}function o(h){if(h&&h.isTexture){let m=h.mapping,_=m===jl||m===Ql,S=m===cs||m===$s;if(_||S){let p=e.get(h),d=p!==void 0?p.texture.pmremVersion:0;if(h.isRenderTargetTexture&&h.pmremVersion!==d)return i===null&&(i=new zu(n)),p=_?i.fromEquirectangular(h,p):i.fromCubemap(h,p),p.texture.pmremVersion=h.pmremVersion,e.set(h,p),p.texture;if(p!==void 0)return p.texture;{let M=h.image;return _&&M&&M.height>0||S&&M&&l(M)?(i===null&&(i=new zu(n)),p=_?i.fromEquirectangular(h):i.fromCubemap(h),p.texture.pmremVersion=h.pmremVersion,e.set(h,p),h.addEventListener("dispose",u),p.texture):null}}}return h}function a(h,m){return m===jl?h.mapping=cs:m===Ql&&(h.mapping=$s),h}function l(h){let m=0,_=6;for(let S=0;S<_;S++)h[S]!==void 0&&m++;return m===_}function c(h){let m=h.target;m.removeEventListener("dispose",c);let _=t.get(m);_!==void 0&&(t.delete(m),_.dispose())}function u(h){let m=h.target;m.removeEventListener("dispose",u);let _=e.get(m);_!==void 0&&(e.delete(m),_.dispose())}function f(){t=new WeakMap,e=new WeakMap,i!==null&&(i.dispose(),i=null)}return{get:s,dispose:f}}function wT(n){let t={};function e(i){if(t[i]!==void 0)return t[i];let s=n.getExtension(i);return t[i]=s,s}return{has:function(i){return e(i)!==null},init:function(){e("EXT_color_buffer_float"),e("WEBGL_clip_cull_distance"),e("OES_texture_float_linear"),e("EXT_color_buffer_half_float"),e("WEBGL_multisampled_render_to_texture"),e("WEBGL_render_shared_exponent")},get:function(i){let s=e(i);return s===null&&Gs("WebGLRenderer: "+i+" extension not supported."),s}}}function ET(n,t,e,i){let s={},r=new WeakMap;function o(f){let h=f.target;h.index!==null&&t.remove(h.index);for(let _ in h.attributes)t.remove(h.attributes[_]);h.removeEventListener("dispose",o),delete s[h.id];let m=r.get(h);m&&(t.remove(m),r.delete(h)),i.releaseStatesOfGeometry(h),h.isInstancedBufferGeometry===!0&&delete h._maxInstanceCount,e.memory.geometries--}function a(f,h){return s[h.id]===!0||(h.addEventListener("dispose",o),s[h.id]=!0,e.memory.geometries++),h}function l(f){let h=f.attributes;for(let m in h)t.update(h[m],n.ARRAY_BUFFER)}function c(f){let h=[],m=f.index,_=f.attributes.position,S=0;if(_===void 0)return;if(m!==null){let M=m.array;S=m.version;for(let P=0,b=M.length;P<b;P+=3){let E=M[P+0],w=M[P+1],A=M[P+2];h.push(E,w,w,A,A,E)}}else{let M=_.array;S=_.version;for(let P=0,b=M.length/3-1;P<b;P+=3){let E=P+0,w=P+1,A=P+2;h.push(E,w,w,A,A,E)}}let p=new(_.count>=65535?ra:sa)(h,1);p.version=S;let d=r.get(f);d&&t.remove(d),r.set(f,p)}function u(f){let h=r.get(f);if(h){let m=f.index;m!==null&&h.version<m.version&&c(f)}else c(f);return r.get(f)}return{get:a,update:l,getWireframeAttribute:u}}function AT(n,t,e){let i;function s(f){i=f}let r,o;function a(f){r=f.type,o=f.bytesPerElement}function l(f,h){n.drawElements(i,h,r,f*o),e.update(h,i,1)}function c(f,h,m){m!==0&&(n.drawElementsInstanced(i,h,r,f*o,m),e.update(h,i,m))}function u(f,h,m){if(m===0)return;t.get("WEBGL_multi_draw").multiDrawElementsWEBGL(i,h,0,r,f,0,m);let S=0;for(let p=0;p<m;p++)S+=h[p];e.update(S,i,1)}this.setMode=s,this.setIndex=a,this.render=l,this.renderInstances=c,this.renderMultiDraw=u}function CT(n){let t={geometries:0,textures:0},e={frame:0,calls:0,triangles:0,points:0,lines:0};function i(r,o,a){switch(e.calls++,o){case n.TRIANGLES:e.triangles+=a*(r/3);break;case n.LINES:e.lines+=a*(r/2);break;case n.LINE_STRIP:e.lines+=a*(r-1);break;case n.LINE_LOOP:e.lines+=a*r;break;case n.POINTS:e.points+=a*r;break;default:Bt("WebGLInfo: Unknown draw mode:",o);break}}function s(){e.calls=0,e.triangles=0,e.points=0,e.lines=0}return{memory:t,render:e,programs:null,autoReset:!0,reset:s,update:i}}function RT(n,t,e){let i=new WeakMap,s=new we;function r(o,a,l){let c=o.morphTargetInfluences,u=a.morphAttributes.position||a.morphAttributes.normal||a.morphAttributes.color,f=u!==void 0?u.length:0,h=i.get(a);if(h===void 0||h.count!==f){let T=function(){A.dispose(),i.delete(a),a.removeEventListener("dispose",T)};h!==void 0&&h.texture.dispose();let m=a.morphAttributes.position!==void 0,_=a.morphAttributes.normal!==void 0,S=a.morphAttributes.color!==void 0,p=a.morphAttributes.position||[],d=a.morphAttributes.normal||[],M=a.morphAttributes.color||[],P=0;m===!0&&(P=1),_===!0&&(P=2),S===!0&&(P=3);let b=a.attributes.position.count*P,E=1;b>t.maxTextureSize&&(E=Math.ceil(b/t.maxTextureSize),b=t.maxTextureSize);let w=new Float32Array(b*E*4*f),A=new ea(w,b,E,f);A.type=Zn,A.needsUpdate=!0;let x=P*4;for(let L=0;L<f;L++){let F=p[L],V=d[L],I=M[L],R=b*E*4*L;for(let N=0;N<F.count;N++){let B=N*x;m===!0&&(s.fromBufferAttribute(F,N),w[R+B+0]=s.x,w[R+B+1]=s.y,w[R+B+2]=s.z,w[R+B+3]=0),_===!0&&(s.fromBufferAttribute(V,N),w[R+B+4]=s.x,w[R+B+5]=s.y,w[R+B+6]=s.z,w[R+B+7]=0),S===!0&&(s.fromBufferAttribute(I,N),w[R+B+8]=s.x,w[R+B+9]=s.y,w[R+B+10]=s.z,w[R+B+11]=I.itemSize===4?s.w:1)}}h={count:f,texture:A,size:new re(b,E)},i.set(a,h),a.addEventListener("dispose",T)}if(o.isInstancedMesh===!0&&o.morphTexture!==null)l.getUniforms().setValue(n,"morphTexture",o.morphTexture,e);else{let m=0;for(let S=0;S<c.length;S++)m+=c[S];let _=a.morphTargetsRelative?1:1-m;l.getUniforms().setValue(n,"morphTargetBaseInfluence",_),l.getUniforms().setValue(n,"morphTargetInfluences",c)}l.getUniforms().setValue(n,"morphTargetsTexture",h.texture,e),l.getUniforms().setValue(n,"morphTargetsTextureSize",h.size)}return{update:r}}function PT(n,t,e,i,s){let r=new WeakMap;function o(c){let u=s.render.frame,f=c.geometry,h=t.get(c,f);if(r.get(h)!==u&&(t.update(h),r.set(h,u)),c.isInstancedMesh&&(c.hasEventListener("dispose",l)===!1&&c.addEventListener("dispose",l),r.get(c)!==u&&(e.update(c.instanceMatrix,n.ARRAY_BUFFER),c.instanceColor!==null&&e.update(c.instanceColor,n.ARRAY_BUFFER),r.set(c,u))),c.isSkinnedMesh){let m=c.skeleton;r.get(m)!==u&&(m.update(),r.set(m,u))}return h}function a(){r=new WeakMap}function l(c){let u=c.target;u.removeEventListener("dispose",l),i.releaseStatesOfObject(u),e.remove(u.instanceMatrix),u.instanceColor!==null&&e.remove(u.instanceColor)}return{update:o,dispose:a}}var IT={[hd]:"LINEAR_TONE_MAPPING",[fd]:"REINHARD_TONE_MAPPING",[dd]:"CINEON_TONE_MAPPING",[pd]:"ACES_FILMIC_TONE_MAPPING",[gd]:"AGX_TONE_MAPPING",[_d]:"NEUTRAL_TONE_MAPPING",[md]:"CUSTOM_TONE_MAPPING"};function LT(n,t,e,i,s,r){let o=new dn(t,e,{type:n,depthBuffer:s,stencilBuffer:r,samples:i?4:0,storeMultisampledDepthBuffer:!1,storeMultisampledStencilBuffer:!1,resolveDepthBuffer:!1,resolveStencilBuffer:!1}),a=null,l=null,c=new vn;c.setAttribute("position",new ze([-1,3,0,-1,-1,0,3,-1,0],3)),c.setAttribute("uv",new ze([0,2,0,0,2,0],2));let u=new Fl({uniforms:{tDiffuse:{value:null}},vertexShader:`
			precision highp float;

			uniform mat4 modelViewMatrix;
			uniform mat4 projectionMatrix;

			attribute vec3 position;
			attribute vec2 uv;

			varying vec2 vUv;

			void main() {
				vUv = uv;
				gl_Position = projectionMatrix * modelViewMatrix * vec4( position, 1.0 );
			}`,fragmentShader:`
			precision highp float;

			uniform sampler2D tDiffuse;

			varying vec2 vUv;

			#include <tonemapping_pars_fragment>
			#include <colorspace_pars_fragment>

			void main() {
				gl_FragColor = texture2D( tDiffuse, vUv );

				#ifdef LINEAR_TONE_MAPPING
					gl_FragColor.rgb = LinearToneMapping( gl_FragColor.rgb );
				#elif defined( REINHARD_TONE_MAPPING )
					gl_FragColor.rgb = ReinhardToneMapping( gl_FragColor.rgb );
				#elif defined( CINEON_TONE_MAPPING )
					gl_FragColor.rgb = CineonToneMapping( gl_FragColor.rgb );
				#elif defined( ACES_FILMIC_TONE_MAPPING )
					gl_FragColor.rgb = ACESFilmicToneMapping( gl_FragColor.rgb );
				#elif defined( AGX_TONE_MAPPING )
					gl_FragColor.rgb = AgXToneMapping( gl_FragColor.rgb );
				#elif defined( NEUTRAL_TONE_MAPPING )
					gl_FragColor.rgb = NeutralToneMapping( gl_FragColor.rgb );
				#elif defined( CUSTOM_TONE_MAPPING )
					gl_FragColor.rgb = CustomToneMapping( gl_FragColor.rgb );
				#endif

				#ifdef SRGB_TRANSFER
					gl_FragColor = sRGBTransferOETF( gl_FragColor );
				#endif
			}`,depthTest:!1,depthWrite:!1}),f=new In(c,u),h=new _a(-1,1,1,-1,0,1),m=null,_=null,S=!1,p,d=null,M=[],P=!1;this.setSize=function(b,E){o.setSize(b,E),a!==null&&a.setSize(b,E),l!==null&&l.setSize(b,E);for(let w=0;w<M.length;w++){let A=M[w];A.setSize&&A.setSize(b,E)}},this.setEffects=function(b){M=b,P=M.length>0&&M[0].isRenderPass===!0;let E=o.width,w=o.height;M.length>0&&a===null&&(a=new dn(E,w,{type:Kn,depthBuffer:!1,stencilBuffer:!1}),l=new dn(E,w,{type:Kn,depthBuffer:!1,stencilBuffer:!1}));for(let A=0;A<M.length;A++){let x=M[A];x.setSize&&x.setSize(E,w)}},this.begin=function(b,E){if(S||b.toneMapping===qn&&M.length===0)return!1;if(d=E,E!==null){let w=E.width,A=E.height;(o.width!==w||o.height!==A)&&this.setSize(w,A)}return P===!1&&b.setRenderTarget(o),p=b.toneMapping,b.toneMapping=qn,!0},this.hasRenderPass=function(){return P},this.end=function(b,E){b.toneMapping=p,S=!0;let w=o,A=a;for(let x=0;x<M.length;x++){let T=M[x];T.enabled!==!1&&(T.render(b,A,w,E),T.needsSwap!==!1&&(w=A,A=A===a?l:a))}if(m!==b.outputColorSpace||_!==b.toneMapping){m=b.outputColorSpace,_=b.toneMapping,u.defines={},Kt.getTransfer(m)===ce&&(u.defines.SRGB_TRANSFER="");let x=IT[_];x&&(u.defines[x]=""),u.needsUpdate=!0}u.uniforms.tDiffuse.value=w.texture,b.setRenderTarget(d),b.render(f,h),d=null,S=!1},this.isCompositing=function(){return S},this.dispose=function(){o.dispose(),a!==null&&a.dispose(),l!==null&&l.dispose(),c.dispose(),u.dispose()}}var B_=new fn,kd=new is(1,1),k_=new ea,V_=new Il,z_=new ua,y_=[],v_=[],S_=new Float32Array(16),b_=new Float32Array(9),M_=new Float32Array(4);function Zr(n,t,e){let i=n[0];if(i<=0||i>0)return n;let s=t*e,r=y_[s];if(r===void 0&&(r=new Float32Array(s),y_[s]=r),t!==0){i.toArray(r,0);for(let o=1,a=0;o!==t;++o)a+=e,n[o].toArray(r,a)}return r}function Ue(n,t){if(n.length!==t.length)return!1;for(let e=0,i=n.length;e<i;e++)if(n[e]!==t[e])return!1;return!0}function De(n,t){for(let e=0,i=t.length;e<i;e++)n[e]=t[e]}function $u(n,t){let e=v_[t];e===void 0&&(e=new Int32Array(t),v_[t]=e);for(let i=0;i!==t;++i)e[i]=n.allocateTextureUnit();return e}function NT(n,t){let e=this.cache;e[0]!==t&&(n.uniform1f(this.addr,t),e[0]=t)}function UT(n,t){let e=this.cache;if(t.x!==void 0)(e[0]!==t.x||e[1]!==t.y)&&(n.uniform2f(this.addr,t.x,t.y),e[0]=t.x,e[1]=t.y);else{if(Ue(e,t))return;n.uniform2fv(this.addr,t),De(e,t)}}function DT(n,t){let e=this.cache;if(t.x!==void 0)(e[0]!==t.x||e[1]!==t.y||e[2]!==t.z)&&(n.uniform3f(this.addr,t.x,t.y,t.z),e[0]=t.x,e[1]=t.y,e[2]=t.z);else if(t.r!==void 0)(e[0]!==t.r||e[1]!==t.g||e[2]!==t.b)&&(n.uniform3f(this.addr,t.r,t.g,t.b),e[0]=t.r,e[1]=t.g,e[2]=t.b);else{if(Ue(e,t))return;n.uniform3fv(this.addr,t),De(e,t)}}function OT(n,t){let e=this.cache;if(t.x!==void 0)(e[0]!==t.x||e[1]!==t.y||e[2]!==t.z||e[3]!==t.w)&&(n.uniform4f(this.addr,t.x,t.y,t.z,t.w),e[0]=t.x,e[1]=t.y,e[2]=t.z,e[3]=t.w);else{if(Ue(e,t))return;n.uniform4fv(this.addr,t),De(e,t)}}function FT(n,t){let e=this.cache,i=t.elements;if(i===void 0){if(Ue(e,t))return;n.uniformMatrix2fv(this.addr,!1,t),De(e,t)}else{if(Ue(e,i))return;M_.set(i),n.uniformMatrix2fv(this.addr,!1,M_),De(e,i)}}function BT(n,t){let e=this.cache,i=t.elements;if(i===void 0){if(Ue(e,t))return;n.uniformMatrix3fv(this.addr,!1,t),De(e,t)}else{if(Ue(e,i))return;b_.set(i),n.uniformMatrix3fv(this.addr,!1,b_),De(e,i)}}function kT(n,t){let e=this.cache,i=t.elements;if(i===void 0){if(Ue(e,t))return;n.uniformMatrix4fv(this.addr,!1,t),De(e,t)}else{if(Ue(e,i))return;S_.set(i),n.uniformMatrix4fv(this.addr,!1,S_),De(e,i)}}function VT(n,t){let e=this.cache;e[0]!==t&&(n.uniform1i(this.addr,t),e[0]=t)}function zT(n,t){let e=this.cache;if(t.x!==void 0)(e[0]!==t.x||e[1]!==t.y)&&(n.uniform2i(this.addr,t.x,t.y),e[0]=t.x,e[1]=t.y);else{if(Ue(e,t))return;n.uniform2iv(this.addr,t),De(e,t)}}function GT(n,t){let e=this.cache;if(t.x!==void 0)(e[0]!==t.x||e[1]!==t.y||e[2]!==t.z)&&(n.uniform3i(this.addr,t.x,t.y,t.z),e[0]=t.x,e[1]=t.y,e[2]=t.z);else{if(Ue(e,t))return;n.uniform3iv(this.addr,t),De(e,t)}}function HT(n,t){let e=this.cache;if(t.x!==void 0)(e[0]!==t.x||e[1]!==t.y||e[2]!==t.z||e[3]!==t.w)&&(n.uniform4i(this.addr,t.x,t.y,t.z,t.w),e[0]=t.x,e[1]=t.y,e[2]=t.z,e[3]=t.w);else{if(Ue(e,t))return;n.uniform4iv(this.addr,t),De(e,t)}}function WT(n,t){let e=this.cache;e[0]!==t&&(n.uniform1ui(this.addr,t),e[0]=t)}function $T(n,t){let e=this.cache;if(t.x!==void 0)(e[0]!==t.x||e[1]!==t.y)&&(n.uniform2ui(this.addr,t.x,t.y),e[0]=t.x,e[1]=t.y);else{if(Ue(e,t))return;n.uniform2uiv(this.addr,t),De(e,t)}}function XT(n,t){let e=this.cache;if(t.x!==void 0)(e[0]!==t.x||e[1]!==t.y||e[2]!==t.z)&&(n.uniform3ui(this.addr,t.x,t.y,t.z),e[0]=t.x,e[1]=t.y,e[2]=t.z);else{if(Ue(e,t))return;n.uniform3uiv(this.addr,t),De(e,t)}}function qT(n,t){let e=this.cache;if(t.x!==void 0)(e[0]!==t.x||e[1]!==t.y||e[2]!==t.z||e[3]!==t.w)&&(n.uniform4ui(this.addr,t.x,t.y,t.z,t.w),e[0]=t.x,e[1]=t.y,e[2]=t.z,e[3]=t.w);else{if(Ue(e,t))return;n.uniform4uiv(this.addr,t),De(e,t)}}function YT(n,t,e){let i=this.cache,s=e.allocateTextureUnit();i[0]!==s&&(n.uniform1i(this.addr,s),i[0]=s);let r;this.type===n.SAMPLER_2D_SHADOW?(kd.compareFunction=e.isReversedDepthBuffer()?Bu:Fu,r=kd):r=B_,e.setTexture2D(t||r,s)}function ZT(n,t,e){let i=this.cache,s=e.allocateTextureUnit();i[0]!==s&&(n.uniform1i(this.addr,s),i[0]=s),e.setTexture3D(t||V_,s)}function KT(n,t,e){let i=this.cache,s=e.allocateTextureUnit();i[0]!==s&&(n.uniform1i(this.addr,s),i[0]=s),e.setTextureCube(t||z_,s)}function JT(n,t,e){let i=this.cache,s=e.allocateTextureUnit();i[0]!==s&&(n.uniform1i(this.addr,s),i[0]=s),e.setTexture2DArray(t||k_,s)}function jT(n){switch(n){case 5126:return NT;case 35664:return UT;case 35665:return DT;case 35666:return OT;case 35674:return FT;case 35675:return BT;case 35676:return kT;case 5124:case 35670:return VT;case 35667:case 35671:return zT;case 35668:case 35672:return GT;case 35669:case 35673:return HT;case 5125:return WT;case 36294:return $T;case 36295:return XT;case 36296:return qT;case 35678:case 36198:case 36298:case 36306:case 35682:return YT;case 35679:case 36299:case 36307:return ZT;case 35680:case 36300:case 36308:case 36293:return KT;case 36289:case 36303:case 36311:case 36292:return JT}}function QT(n,t){n.uniform1fv(this.addr,t)}function tw(n,t){let e=Zr(t,this.size,2);n.uniform2fv(this.addr,e)}function ew(n,t){let e=Zr(t,this.size,3);n.uniform3fv(this.addr,e)}function nw(n,t){let e=Zr(t,this.size,4);n.uniform4fv(this.addr,e)}function iw(n,t){let e=Zr(t,this.size,4);n.uniformMatrix2fv(this.addr,!1,e)}function sw(n,t){let e=Zr(t,this.size,9);n.uniformMatrix3fv(this.addr,!1,e)}function rw(n,t){let e=Zr(t,this.size,16);n.uniformMatrix4fv(this.addr,!1,e)}function ow(n,t){n.uniform1iv(this.addr,t)}function aw(n,t){n.uniform2iv(this.addr,t)}function cw(n,t){n.uniform3iv(this.addr,t)}function lw(n,t){n.uniform4iv(this.addr,t)}function uw(n,t){n.uniform1uiv(this.addr,t)}function hw(n,t){n.uniform2uiv(this.addr,t)}function fw(n,t){n.uniform3uiv(this.addr,t)}function dw(n,t){n.uniform4uiv(this.addr,t)}function pw(n,t,e){let i=this.cache,s=t.length,r=$u(e,s);Ue(i,r)||(n.uniform1iv(this.addr,r),De(i,r));let o;this.type===n.SAMPLER_2D_SHADOW?o=kd:o=B_;for(let a=0;a!==s;++a)e.setTexture2D(t[a]||o,r[a])}function mw(n,t,e){let i=this.cache,s=t.length,r=$u(e,s);Ue(i,r)||(n.uniform1iv(this.addr,r),De(i,r));for(let o=0;o!==s;++o)e.setTexture3D(t[o]||V_,r[o])}function gw(n,t,e){let i=this.cache,s=t.length,r=$u(e,s);Ue(i,r)||(n.uniform1iv(this.addr,r),De(i,r));for(let o=0;o!==s;++o)e.setTextureCube(t[o]||z_,r[o])}function _w(n,t,e){let i=this.cache,s=t.length,r=$u(e,s);Ue(i,r)||(n.uniform1iv(this.addr,r),De(i,r));for(let o=0;o!==s;++o)e.setTexture2DArray(t[o]||k_,r[o])}function xw(n){switch(n){case 5126:return QT;case 35664:return tw;case 35665:return ew;case 35666:return nw;case 35674:return iw;case 35675:return sw;case 35676:return rw;case 5124:case 35670:return ow;case 35667:case 35671:return aw;case 35668:case 35672:return cw;case 35669:case 35673:return lw;case 5125:return uw;case 36294:return hw;case 36295:return fw;case 36296:return dw;case 35678:case 36198:case 36298:case 36306:case 35682:return pw;case 35679:case 36299:case 36307:return mw;case 35680:case 36300:case 36308:case 36293:return gw;case 36289:case 36303:case 36311:case 36292:return _w}}var Vd=class{constructor(t,e,i){this.id=t,this.addr=i,this.cache=[],this.type=e.type,this.setValue=jT(e.type)}},zd=class{constructor(t,e,i){this.id=t,this.addr=i,this.cache=[],this.type=e.type,this.size=e.size,this.setValue=xw(e.type)}},Gd=class{constructor(t){this.id=t,this.seq=[],this.map={}}setValue(t,e,i){let s=this.seq;for(let r=0,o=s.length;r!==o;++r){let a=s[r];a.setValue(t,e[a.id],i)}}},Fd=/(\w+)(\])?(\[|\.)?/g;function T_(n,t){n.seq.push(t),n.map[t.id]=t}function yw(n,t,e){let i=n.name,s=i.length;for(Fd.lastIndex=0;;){let r=Fd.exec(i),o=Fd.lastIndex,a=r[1],l=r[2]==="]",c=r[3];if(l&&(a=a|0),c===void 0||c==="["&&o+2===s){T_(e,c===void 0?new Vd(a,n,t):new zd(a,n,t));break}else{let f=e.map[a];f===void 0&&(f=new Gd(a),T_(e,f)),e=f}}}var Yr=class{constructor(t,e){this.seq=[],this.map={};let i=t.getProgramParameter(e,t.ACTIVE_UNIFORMS);for(let o=0;o<i;++o){let a=t.getActiveUniform(e,o),l=t.getUniformLocation(e,a.name);yw(a,l,this)}let s=[],r=[];for(let o of this.seq)o.type===t.SAMPLER_2D_SHADOW||o.type===t.SAMPLER_CUBE_SHADOW||o.type===t.SAMPLER_2D_ARRAY_SHADOW?s.push(o):r.push(o);s.length>0&&(this.seq=s.concat(r))}setValue(t,e,i,s){let r=this.map[e];r!==void 0&&r.setValue(t,i,s)}setOptional(t,e,i){let s=e[i];s!==void 0&&this.setValue(t,i,s)}static upload(t,e,i,s){for(let r=0,o=e.length;r!==o;++r){let a=e[r],l=i[a.id];l.needsUpdate!==!1&&a.setValue(t,l.value,s)}}static seqWithValue(t,e){let i=[];for(let s=0,r=t.length;s!==r;++s){let o=t[s];o.id in e&&i.push(o)}return i}};function w_(n,t,e){let i=n.createShader(t);return n.shaderSource(i,e),n.compileShader(i),i}var vw=37297,Sw=0;function bw(n,t){let e=n.split(`
`),i=[],s=Math.max(t-6,0),r=Math.min(t+6,e.length);for(let o=s;o<r;o++){let a=o+1;i.push(`${a===t?">":" "} ${a}: ${e[o]}`)}return i.join(`
`)}var E_=new Vt;function Mw(n){Kt._getMatrix(E_,Kt.workingColorSpace,n);let t=`mat3( ${E_.elements.map(e=>e.toFixed(4))} )`;switch(Kt.getTransfer(n)){case jo:return[t,"LinearTransferOETF"];case ce:return[t,"sRGBTransferOETF"];default:return Dt("WebGLProgram: Unsupported color space: ",n),[t,"LinearTransferOETF"]}}function A_(n,t,e){let i=n.getShaderParameter(t,n.COMPILE_STATUS),r=(n.getShaderInfoLog(t)||"").trim();if(i&&r==="")return"";let o=/ERROR: 0:(\d+)/.exec(r);if(o){let a=parseInt(o[1]);return e.toUpperCase()+`

`+r+`

`+bw(n.getShaderSource(t),a)}else return r}function Tw(n,t){let e=Mw(t);return[`vec4 ${n}( vec4 value ) {`,`	return ${e[1]}( vec4( value.rgb * ${e[0]}, value.a ) );`,"}"].join(`
`)}var ww={[hd]:"Linear",[fd]:"Reinhard",[dd]:"Cineon",[pd]:"ACESFilmic",[gd]:"AgX",[_d]:"Neutral",[md]:"Custom"};function Ew(n,t){let e=ww[t];return e===void 0?(Dt("WebGLProgram: Unsupported toneMapping:",t),"vec3 "+n+"( vec3 color ) { return LinearToneMapping( color ); }"):"vec3 "+n+"( vec3 color ) { return "+e+"ToneMapping( color ); }"}var Vu=new W;function Aw(){Kt.getLuminanceCoefficients(Vu);let n=Vu.x.toFixed(4),t=Vu.y.toFixed(4),e=Vu.z.toFixed(4);return["float luminance( const in vec3 rgb ) {",`	const vec3 weights = vec3( ${n}, ${t}, ${e} );`,"	return dot( weights, rgb );","}"].join(`
`)}function Cw(n){return[n.extensionClipCullDistance?"#extension GL_ANGLE_clip_cull_distance : require":"",n.extensionMultiDraw?"#extension GL_ANGLE_multi_draw : require":""].filter(Pa).join(`
`)}function Rw(n){let t=[];for(let e in n){let i=n[e];i!==!1&&t.push("#define "+e+" "+i)}return t.join(`
`)}function Pw(n,t){let e={},i=n.getProgramParameter(t,n.ACTIVE_ATTRIBUTES);for(let s=0;s<i;s++){let r=n.getActiveAttrib(t,s),o=r.name,a=1;r.type===n.FLOAT_MAT2&&(a=2),r.type===n.FLOAT_MAT3&&(a=3),r.type===n.FLOAT_MAT4&&(a=4),e[o]={type:r.type,location:n.getAttribLocation(t,o),locationSize:a}}return e}function Pa(n){return n!==""}function C_(n,t){let e=t.numSpotLightShadows+t.numSpotLightMaps-t.numSpotLightShadowsWithMaps;return n.replace(/NUM_SUN_LIGHTS/g,t.numSunLights).replace(/NUM_DIR_LIGHTS/g,t.numDirLights).replace(/NUM_SPOT_LIGHTS/g,t.numSpotLights).replace(/NUM_SPOT_LIGHT_MAPS/g,t.numSpotLightMaps).replace(/NUM_SPOT_LIGHT_COORDS/g,e).replace(/NUM_RECT_AREA_LIGHTS/g,t.numRectAreaLights).replace(/NUM_POINT_LIGHTS/g,t.numPointLights).replace(/NUM_HEMI_LIGHTS/g,t.numHemiLights).replace(/NUM_SUN_LIGHT_SHADOWS/g,t.numSunLightShadows).replace(/NUM_DIR_LIGHT_SHADOWS/g,t.numDirLightShadows).replace(/NUM_SPOT_LIGHT_SHADOWS_WITH_MAPS/g,t.numSpotLightShadowsWithMaps).replace(/NUM_SPOT_LIGHT_SHADOWS/g,t.numSpotLightShadows).replace(/NUM_POINT_LIGHT_SHADOWS/g,t.numPointLightShadows)}function R_(n,t){return n.replace(/NUM_CLIPPING_PLANES/g,t.numClippingPlanes).replace(/UNION_CLIPPING_PLANES/g,t.numClippingPlanes-t.numClipIntersection)}var Iw=/^[ \t]*#include +<([\w\d./]+)>/gm;function Hd(n){return n.replace(Iw,Nw)}var Lw=new Map;function Nw(n,t){let e=Xt[t];if(e===void 0){let i=Lw.get(t);if(i!==void 0)e=Xt[i],Dt('WebGLRenderer: Shader chunk "%s" has been deprecated. Use "%s" instead.',t,i);else throw new Error("THREE.WebGLProgram: Can not resolve #include <"+t+">")}return Hd(e)}var Uw=/#pragma unroll_loop_start\s+for\s*\(\s*int\s+i\s*=\s*(\d+)\s*;\s*i\s*<\s*(\d+)\s*;\s*i\s*\+\+\s*\)\s*{([\s\S]+?)}\s+#pragma unroll_loop_end/g;function P_(n){return n.replace(Uw,Dw)}function Dw(n,t,e,i){let s="";for(let r=parseInt(t);r<parseInt(e);r++)s+=i.replace(/\[\s*i\s*\]/g,"[ "+r+" ]").replace(/UNROLLED_LOOP_INDEX/g,r);return s}function I_(n){let t=`precision ${n.precision} float;
	precision ${n.precision} int;
	precision ${n.precision} sampler2D;
	precision ${n.precision} samplerCube;
	precision ${n.precision} sampler3D;
	precision ${n.precision} sampler2DArray;
	precision ${n.precision} sampler2DShadow;
	precision ${n.precision} samplerCubeShadow;
	precision ${n.precision} sampler2DArrayShadow;
	precision ${n.precision} isampler2D;
	precision ${n.precision} isampler3D;
	precision ${n.precision} isamplerCube;
	precision ${n.precision} isampler2DArray;
	precision ${n.precision} usampler2D;
	precision ${n.precision} usampler3D;
	precision ${n.precision} usamplerCube;
	precision ${n.precision} usampler2DArray;
	`;return n.precision==="highp"?t+=`
#define HIGH_PRECISION`:n.precision==="mediump"?t+=`
#define MEDIUM_PRECISION`:n.precision==="lowp"&&(t+=`
#define LOW_PRECISION`),t}var Ow={[xa]:"SHADOWMAP_TYPE_PCF",[Gr]:"SHADOWMAP_TYPE_VSM"};function Fw(n){return Ow[n.shadowMapType]||"SHADOWMAP_TYPE_BASIC"}var Bw={[cs]:"ENVMAP_TYPE_CUBE",[$s]:"ENVMAP_TYPE_CUBE",[ya]:"ENVMAP_TYPE_CUBE_UV"};function kw(n){return n.envMap===!1?"ENVMAP_TYPE_CUBE":Bw[n.envMapMode]||"ENVMAP_TYPE_CUBE"}var Vw={[$s]:"ENVMAP_MODE_REFRACTION"};function zw(n){return n.envMap===!1?"ENVMAP_MODE_REFLECTION":Vw[n.envMapMode]||"ENVMAP_MODE_REFLECTION"}var Gw={[ud]:"ENVMAP_BLENDING_MULTIPLY",[Y0]:"ENVMAP_BLENDING_MIX",[Z0]:"ENVMAP_BLENDING_ADD"};function Hw(n){return n.envMap===!1?"ENVMAP_BLENDING_NONE":Gw[n.combine]||"ENVMAP_BLENDING_NONE"}function Ww(n){let t=n.envMapCubeUVHeight;if(t===null)return null;let e=Math.log2(t)-2,i=1/t;return{texelWidth:1/(3*Math.max(Math.pow(2,e),112)),texelHeight:i,maxMip:e}}function $w(n,t,e,i){let s=n.getContext(),r=e.defines,o=e.vertexShader,a=e.fragmentShader,l=Fw(e),c=kw(e),u=zw(e),f=Hw(e),h=Ww(e),m=Cw(e),_=Rw(r),S=s.createProgram(),p,d,M=e.glslVersion?"#version "+e.glslVersion+`
`:"";e.isRawShaderMaterial?(p=["#define SHADER_TYPE "+e.shaderType,"#define SHADER_NAME "+e.shaderName,_].filter(Pa).join(`
`),p.length>0&&(p+=`
`),d=["#define SHADER_TYPE "+e.shaderType,"#define SHADER_NAME "+e.shaderName,_].filter(Pa).join(`
`),d.length>0&&(d+=`
`)):(p=[I_(e),"#define SHADER_TYPE "+e.shaderType,"#define SHADER_NAME "+e.shaderName,_,e.extensionClipCullDistance?"#define USE_CLIP_DISTANCE":"",e.batching?"#define USE_BATCHING":"",e.batchingColor?"#define USE_BATCHING_COLOR":"",e.instancing?"#define USE_INSTANCING":"",e.instancingColor?"#define USE_INSTANCING_COLOR":"",e.instancingMorph?"#define USE_INSTANCING_MORPH":"",e.useFog&&e.fog?"#define USE_FOG":"",e.useFog&&e.fogExp2?"#define FOG_EXP2":"",e.map?"#define USE_MAP":"",e.envMap?"#define USE_ENVMAP":"",e.envMap?"#define "+u:"",e.lightMap?"#define USE_LIGHTMAP":"",e.aoMap?"#define USE_AOMAP":"",e.bumpMap?"#define USE_BUMPMAP":"",e.normalMap?"#define USE_NORMALMAP":"",e.normalMapObjectSpace?"#define USE_NORMALMAP_OBJECTSPACE":"",e.normalMapTangentSpace?"#define USE_NORMALMAP_TANGENTSPACE":"",e.displacementMap?"#define USE_DISPLACEMENTMAP":"",e.emissiveMap?"#define USE_EMISSIVEMAP":"",e.anisotropy?"#define USE_ANISOTROPY":"",e.anisotropyMap?"#define USE_ANISOTROPYMAP":"",e.clearcoatMap?"#define USE_CLEARCOATMAP":"",e.clearcoatRoughnessMap?"#define USE_CLEARCOAT_ROUGHNESSMAP":"",e.clearcoatNormalMap?"#define USE_CLEARCOAT_NORMALMAP":"",e.iridescenceMap?"#define USE_IRIDESCENCEMAP":"",e.iridescenceThicknessMap?"#define USE_IRIDESCENCE_THICKNESSMAP":"",e.specularMap?"#define USE_SPECULARMAP":"",e.specularColorMap?"#define USE_SPECULAR_COLORMAP":"",e.specularIntensityMap?"#define USE_SPECULAR_INTENSITYMAP":"",e.roughnessMap?"#define USE_ROUGHNESSMAP":"",e.metalnessMap?"#define USE_METALNESSMAP":"",e.alphaMap?"#define USE_ALPHAMAP":"",e.alphaHash?"#define USE_ALPHAHASH":"",e.transmission?"#define USE_TRANSMISSION":"",e.transmissionMap?"#define USE_TRANSMISSIONMAP":"",e.thicknessMap?"#define USE_THICKNESSMAP":"",e.sheenColorMap?"#define USE_SHEEN_COLORMAP":"",e.sheenRoughnessMap?"#define USE_SHEEN_ROUGHNESSMAP":"",e.mapUv?"#define MAP_UV "+e.mapUv:"",e.alphaMapUv?"#define ALPHAMAP_UV "+e.alphaMapUv:"",e.lightMapUv?"#define LIGHTMAP_UV "+e.lightMapUv:"",e.aoMapUv?"#define AOMAP_UV "+e.aoMapUv:"",e.emissiveMapUv?"#define EMISSIVEMAP_UV "+e.emissiveMapUv:"",e.bumpMapUv?"#define BUMPMAP_UV "+e.bumpMapUv:"",e.normalMapUv?"#define NORMALMAP_UV "+e.normalMapUv:"",e.displacementMapUv?"#define DISPLACEMENTMAP_UV "+e.displacementMapUv:"",e.metalnessMapUv?"#define METALNESSMAP_UV "+e.metalnessMapUv:"",e.roughnessMapUv?"#define ROUGHNESSMAP_UV "+e.roughnessMapUv:"",e.anisotropyMapUv?"#define ANISOTROPYMAP_UV "+e.anisotropyMapUv:"",e.clearcoatMapUv?"#define CLEARCOATMAP_UV "+e.clearcoatMapUv:"",e.clearcoatNormalMapUv?"#define CLEARCOAT_NORMALMAP_UV "+e.clearcoatNormalMapUv:"",e.clearcoatRoughnessMapUv?"#define CLEARCOAT_ROUGHNESSMAP_UV "+e.clearcoatRoughnessMapUv:"",e.iridescenceMapUv?"#define IRIDESCENCEMAP_UV "+e.iridescenceMapUv:"",e.iridescenceThicknessMapUv?"#define IRIDESCENCE_THICKNESSMAP_UV "+e.iridescenceThicknessMapUv:"",e.sheenColorMapUv?"#define SHEEN_COLORMAP_UV "+e.sheenColorMapUv:"",e.sheenRoughnessMapUv?"#define SHEEN_ROUGHNESSMAP_UV "+e.sheenRoughnessMapUv:"",e.specularMapUv?"#define SPECULARMAP_UV "+e.specularMapUv:"",e.specularColorMapUv?"#define SPECULAR_COLORMAP_UV "+e.specularColorMapUv:"",e.specularIntensityMapUv?"#define SPECULAR_INTENSITYMAP_UV "+e.specularIntensityMapUv:"",e.transmissionMapUv?"#define TRANSMISSIONMAP_UV "+e.transmissionMapUv:"",e.thicknessMapUv?"#define THICKNESSMAP_UV "+e.thicknessMapUv:"",e.vertexTangents&&e.flatShading===!1?"#define USE_TANGENT":"",e.vertexNormals?"#define HAS_NORMAL":"",e.vertexColors?"#define USE_COLOR":"",e.vertexAlphas?"#define USE_COLOR_ALPHA":"",e.vertexUv1s?"#define USE_UV1":"",e.vertexUv2s?"#define USE_UV2":"",e.vertexUv3s?"#define USE_UV3":"",e.pointsUvs?"#define USE_POINTS_UV":"",e.flatShading?"#define FLAT_SHADED":"",e.skinning?"#define USE_SKINNING":"",e.morphTargets?"#define USE_MORPHTARGETS":"",e.morphNormals&&e.flatShading===!1?"#define USE_MORPHNORMALS":"",e.morphColors?"#define USE_MORPHCOLORS":"",e.morphTargetsCount>0?"#define MORPHTARGETS_TEXTURE_STRIDE "+e.morphTextureStride:"",e.morphTargetsCount>0?"#define MORPHTARGETS_COUNT "+e.morphTargetsCount:"",e.doubleSided?"#define DOUBLE_SIDED":"",e.flipSided?"#define FLIP_SIDED":"",e.shadowMapEnabled?"#define USE_SHADOWMAP":"",e.shadowMapEnabled?"#define "+l:"",e.sizeAttenuation?"#define USE_SIZEATTENUATION":"",e.numLightProbes>0?"#define USE_LIGHT_PROBES":"",e.logarithmicDepthBuffer?"#define USE_LOGARITHMIC_DEPTH_BUFFER":"",e.reversedDepthBuffer?"#define USE_REVERSED_DEPTH_BUFFER":"","uniform mat4 modelMatrix;","uniform mat4 modelViewMatrix;","uniform mat4 projectionMatrix;","uniform mat4 viewMatrix;","uniform mat3 normalMatrix;","uniform vec3 cameraPosition;","uniform bool isOrthographic;","#ifdef USE_INSTANCING","	attribute mat4 instanceMatrix;","#endif","#ifdef USE_INSTANCING_COLOR","	attribute vec3 instanceColor;","#endif","#ifdef USE_INSTANCING_MORPH","	uniform sampler2D morphTexture;","#endif","attribute vec3 position;","attribute vec3 normal;","attribute vec2 uv;","#ifdef USE_UV1","	attribute vec2 uv1;","#endif","#ifdef USE_UV2","	attribute vec2 uv2;","#endif","#ifdef USE_UV3","	attribute vec2 uv3;","#endif","#ifdef USE_TANGENT","	attribute vec4 tangent;","#endif","#if defined( USE_COLOR_ALPHA )","	attribute vec4 color;","#elif defined( USE_COLOR )","	attribute vec3 color;","#endif","#ifdef USE_SKINNING","	attribute vec4 skinIndex;","	attribute vec4 skinWeight;","#endif",`
`].filter(Pa).join(`
`),d=[I_(e),"#define SHADER_TYPE "+e.shaderType,"#define SHADER_NAME "+e.shaderName,_,e.useFog&&e.fog?"#define USE_FOG":"",e.useFog&&e.fogExp2?"#define FOG_EXP2":"",e.alphaToCoverage?"#define ALPHA_TO_COVERAGE":"",e.map?"#define USE_MAP":"",e.matcap?"#define USE_MATCAP":"",e.envMap?"#define USE_ENVMAP":"",e.envMap?"#define "+c:"",e.envMap?"#define "+u:"",e.envMap?"#define "+f:"",h?"#define CUBEUV_TEXEL_WIDTH "+h.texelWidth:"",h?"#define CUBEUV_TEXEL_HEIGHT "+h.texelHeight:"",h?"#define CUBEUV_MAX_MIP "+h.maxMip+".0":"",e.lightMap?"#define USE_LIGHTMAP":"",e.aoMap?"#define USE_AOMAP":"",e.bumpMap?"#define USE_BUMPMAP":"",e.normalMap?"#define USE_NORMALMAP":"",e.normalMapObjectSpace?"#define USE_NORMALMAP_OBJECTSPACE":"",e.normalMapTangentSpace?"#define USE_NORMALMAP_TANGENTSPACE":"",e.packedNormalMap?"#define USE_PACKED_NORMALMAP":"",e.emissiveMap?"#define USE_EMISSIVEMAP":"",e.anisotropy?"#define USE_ANISOTROPY":"",e.anisotropyMap?"#define USE_ANISOTROPYMAP":"",e.clearcoat?"#define USE_CLEARCOAT":"",e.clearcoatMap?"#define USE_CLEARCOATMAP":"",e.clearcoatRoughnessMap?"#define USE_CLEARCOAT_ROUGHNESSMAP":"",e.clearcoatNormalMap?"#define USE_CLEARCOAT_NORMALMAP":"",e.dispersion?"#define USE_DISPERSION":"",e.retroreflection?"#define USE_RETROREFLECTION":"",e.iridescence?"#define USE_IRIDESCENCE":"",e.iridescenceMap?"#define USE_IRIDESCENCEMAP":"",e.iridescenceThicknessMap?"#define USE_IRIDESCENCE_THICKNESSMAP":"",e.specularMap?"#define USE_SPECULARMAP":"",e.specularColorMap?"#define USE_SPECULAR_COLORMAP":"",e.specularIntensityMap?"#define USE_SPECULAR_INTENSITYMAP":"",e.roughnessMap?"#define USE_ROUGHNESSMAP":"",e.metalnessMap?"#define USE_METALNESSMAP":"",e.alphaMap?"#define USE_ALPHAMAP":"",e.alphaTest?"#define USE_ALPHATEST":"",e.alphaHash?"#define USE_ALPHAHASH":"",e.sheen?"#define USE_SHEEN":"",e.sheenColorMap?"#define USE_SHEEN_COLORMAP":"",e.sheenRoughnessMap?"#define USE_SHEEN_ROUGHNESSMAP":"",e.transmission?"#define USE_TRANSMISSION":"",e.transmissionMap?"#define USE_TRANSMISSIONMAP":"",e.thicknessMap?"#define USE_THICKNESSMAP":"",e.vertexTangents&&e.flatShading===!1?"#define USE_TANGENT":"",e.vertexColors||e.instancingColor?"#define USE_COLOR":"",e.vertexAlphas||e.batchingColor?"#define USE_COLOR_ALPHA":"",e.vertexUv1s?"#define USE_UV1":"",e.vertexUv2s?"#define USE_UV2":"",e.vertexUv3s?"#define USE_UV3":"",e.pointsUvs?"#define USE_POINTS_UV":"",e.gradientMap?"#define USE_GRADIENTMAP":"",e.flatShading?"#define FLAT_SHADED":"",e.doubleSided?"#define DOUBLE_SIDED":"",e.flipSided?"#define FLIP_SIDED":"",e.shadowMapEnabled?"#define USE_SHADOWMAP":"",e.shadowMapEnabled?"#define "+l:"",e.premultipliedAlpha?"#define PREMULTIPLIED_ALPHA":"",e.numLightProbes>0?"#define USE_LIGHT_PROBES":"",e.numLightProbeGrids>0?"#define USE_LIGHT_PROBES_GRID":"",e.decodeVideoTexture?"#define DECODE_VIDEO_TEXTURE":"",e.decodeVideoTextureEmissive?"#define DECODE_VIDEO_TEXTURE_EMISSIVE":"",e.logarithmicDepthBuffer?"#define USE_LOGARITHMIC_DEPTH_BUFFER":"",e.reversedDepthBuffer?"#define USE_REVERSED_DEPTH_BUFFER":"","uniform mat4 viewMatrix;","uniform vec3 cameraPosition;","uniform bool isOrthographic;",e.toneMapping!==qn?"#define TONE_MAPPING":"",e.toneMapping!==qn?Xt.tonemapping_pars_fragment:"",e.toneMapping!==qn?Ew("toneMapping",e.toneMapping):"",e.dithering?"#define DITHERING":"",e.opaque?"#define OPAQUE":"",Xt.colorspace_pars_fragment,Tw("linearToOutputTexel",e.outputColorSpace),Aw(),e.useDepthPacking?"#define DEPTH_PACKING "+e.depthPacking:"",`
`].filter(Pa).join(`
`)),o=Hd(o),o=C_(o,e),o=R_(o,e),a=Hd(a),a=C_(a,e),a=R_(a,e),o=P_(o),a=P_(a),e.isRawShaderMaterial!==!0&&(M=`#version 300 es
`,p=[m,"#define attribute in","#define varying out","#define texture2D texture"].join(`
`)+`
`+p,d=["#define varying in",e.glslVersion===Ad?"":"layout(location = 0) out highp vec4 pc_fragColor;",e.glslVersion===Ad?"":"#define gl_FragColor pc_fragColor","#define gl_FragDepthEXT gl_FragDepth","#define texture2D texture","#define textureCube texture","#define texture2DProj textureProj","#define texture2DLodEXT textureLod","#define texture2DProjLodEXT textureProjLod","#define textureCubeLodEXT textureLod","#define texture2DGradEXT textureGrad","#define texture2DProjGradEXT textureProjGrad","#define textureCubeGradEXT textureGrad"].join(`
`)+`
`+d);let P=M+p+o,b=M+d+a,E=w_(s,s.VERTEX_SHADER,P),w=w_(s,s.FRAGMENT_SHADER,b);s.attachShader(S,E),s.attachShader(S,w),e.index0AttributeName!==void 0?s.bindAttribLocation(S,0,e.index0AttributeName):e.hasPositionAttribute===!0&&s.bindAttribLocation(S,0,"position"),s.linkProgram(S);function A(F){if(n.debug.checkShaderErrors){let V=s.getProgramInfoLog(S)||"",I=s.getShaderInfoLog(E)||"",R=s.getShaderInfoLog(w)||"",N=V.trim(),B=I.trim(),k=R.trim(),Y=!0,$=!0;if(s.getProgramParameter(S,s.LINK_STATUS)===!1)if(Y=!1,typeof n.debug.onShaderError=="function")n.debug.onShaderError(s,S,E,w);else{let J=A_(s,E,"vertex"),q=A_(s,w,"fragment");Bt("WebGLProgram: Shader Error "+s.getError()+" - VALIDATE_STATUS "+s.getProgramParameter(S,s.VALIDATE_STATUS)+`

Material Name: `+F.name+`
Material Type: `+F.type+`

Program Info Log: `+N+`
`+J+`
`+q)}else N!==""?Dt("WebGLProgram: Program Info Log:",N):(B===""||k==="")&&($=!1);$&&(F.diagnostics={runnable:Y,programLog:N,vertexShader:{log:B,prefix:p},fragmentShader:{log:k,prefix:d}})}s.deleteShader(E),s.deleteShader(w),x=new Yr(s,S),T=Pw(s,S)}let x;this.getUniforms=function(){return x===void 0&&A(this),x};let T;this.getAttributes=function(){return T===void 0&&A(this),T};let L=e.rendererExtensionParallelShaderCompile===!1;return this.isReady=function(){return L===!1&&(L=s.getProgramParameter(S,vw)),L},this.destroy=function(){i.releaseStatesOfProgram(this),s.deleteProgram(S),this.program=void 0},this.type=e.shaderType,this.name=e.shaderName,this.id=Sw++,this.cacheKey=t,this.usedTimes=1,this.program=S,this.vertexShader=E,this.fragmentShader=w,this}var Xw=0,Wd=class{constructor(){this.shaderCache=new Map,this.materialCache=new Map}update(t,e,i){let s=this._getShaderCacheForMaterial(t);return s.has(e)===!1&&(s.add(e),e.usedTimes++),s.has(i)===!1&&(s.add(i),i.usedTimes++),this}remove(t){let e=this.materialCache.get(t);for(let i of e)i.usedTimes--,i.usedTimes===0&&this.shaderCache.delete(i.code);return this.materialCache.delete(t),this}getVertexShaderStage(t){return this._getShaderStage(t.vertexShader)}getFragmentShaderStage(t){return this._getShaderStage(t.fragmentShader)}dispose(){this.shaderCache.clear(),this.materialCache.clear()}_getShaderCacheForMaterial(t){let e=this.materialCache,i=e.get(t);return i===void 0&&(i=new Set,e.set(t,i)),i}_getShaderStage(t){let e=this.shaderCache,i=e.get(t);return i===void 0&&(i=new $d(t),e.set(t,i)),i}},$d=class{constructor(t){this.id=Xw++,this.code=t,this.usedTimes=0}};function qw(n){return n===hs||n===wa||n===Ea}function Yw(n,t,e,i,s,r){let o=new na,a=new Wd,l=new Set,c=[],u=new Map,f=i.logarithmicDepthBuffer,h=i.precision,m={MeshDepthMaterial:"depth",MeshDistanceMaterial:"distance",MeshNormalMaterial:"normal",MeshBasicMaterial:"basic",MeshLambertMaterial:"lambert",MeshPhongMaterial:"phong",MeshToonMaterial:"toon",MeshStandardMaterial:"physical",MeshPhysicalMaterial:"physical",MeshMatcapMaterial:"matcap",LineBasicMaterial:"basic",LineDashedMaterial:"dashed",PointsMaterial:"points",ShadowMaterial:"shadow",SpriteMaterial:"sprite"};function _(x){return l.add(x),x===0?"uv":`uv${x}`}function S(x,T,L,F,V,I){let R=F.fog,N=V.geometry,B=x.isMeshStandardMaterial||x.isMeshLambertMaterial||x.isMeshPhongMaterial?F.environment:null,k=x.isMeshStandardMaterial||x.isMeshLambertMaterial&&!x.envMap||x.isMeshPhongMaterial&&!x.envMap,Y=t.get(x.envMap||B,k),$=Y&&Y.mapping===ya?Y.image.height:null,J=m[x.type];x.precision!==null&&(h=i.getMaxPrecision(x.precision),h!==x.precision&&Dt("WebGLProgram.getParameters:",x.precision,"not supported, using",h,"instead."));let q=N.morphAttributes.position||N.morphAttributes.normal||N.morphAttributes.color,st=q!==void 0?q.length:0,rt=0;N.morphAttributes.position!==void 0&&(rt=1),N.morphAttributes.normal!==void 0&&(rt=2),N.morphAttributes.color!==void 0&&(rt=3);let Mt,Ct,kt,K;if(J){let pe=di[J];Mt=pe.vertexShader,Ct=pe.fragmentShader}else{Mt=x.vertexShader,Ct=x.fragmentShader;let pe=a.getVertexShaderStage(x),oe=a.getFragmentShaderStage(x);a.update(x,pe,oe),kt=pe.id,K=oe.id}let tt=n.getRenderTarget(),xt=n.state.buffers.depth.getReversed(),Nt=V.isInstancedMesh===!0,ct=V.isBatchedMesh===!0,Ft=!!x.map,Ee=!!x.matcap,Wt=!!Y,te=!!x.aoMap,le=!!x.lightMap,Gt=!!x.bumpMap&&x.wireframe===!1,ye=!!x.normalMap,Oe=!!x.displacementMap,on=!!x.emissiveMap,Me=!!x.metalnessMap,Pe=!!x.roughnessMap,O=x.anisotropy>0,Xe=x.clearcoat>0,ue=x.dispersion>0,C=x.retroreflectivity>0,g=x.iridescence>0,z=x.sheen>0,X=x.transmission>0,j=O&&!!x.anisotropyMap,at=Xe&&!!x.clearcoatMap,lt=Xe&&!!x.clearcoatNormalMap,Q=Xe&&!!x.clearcoatRoughnessMap,nt=g&&!!x.iridescenceMap,ut=g&&!!x.iridescenceThicknessMap,Pt=z&&!!x.sheenColorMap,pt=z&&!!x.sheenRoughnessMap,ht=!!x.specularMap,It=!!x.specularColorMap,Ut=!!x.specularIntensityMap,Ht=X&&!!x.transmissionMap,D=X&&!!x.thicknessMap,ft=!!x.gradientMap,et=!!x.alphaMap,dt=x.alphaTest>0,yt=!!x.alphaHash,it=!!x.extensions,Lt=qn;x.toneMapped&&(tt===null||tt.isXRRenderTarget===!0)&&(Lt=n.toneMapping);let Et={shaderID:J,shaderType:x.type,shaderName:x.name,vertexShader:Mt,fragmentShader:Ct,defines:x.defines,customVertexShaderID:kt,customFragmentShaderID:K,isRawShaderMaterial:x.isRawShaderMaterial===!0,glslVersion:x.glslVersion,precision:h,batching:ct,batchingColor:ct&&V._colorsTexture!==null,instancing:Nt,instancingColor:Nt&&V.instanceColor!==null,instancingMorph:Nt&&V.morphTexture!==null,outputColorSpace:tt===null?n.outputColorSpace:tt.isXRRenderTarget===!0?tt.texture.colorSpace:Kt.workingColorSpace,alphaToCoverage:!!x.alphaToCoverage,map:Ft,matcap:Ee,envMap:Wt,envMapMode:Wt&&Y.mapping,envMapCubeUVHeight:$,aoMap:te,lightMap:le,bumpMap:Gt,normalMap:ye,displacementMap:Oe,emissiveMap:on,normalMapObjectSpace:ye&&x.normalMapType===j0,normalMapTangentSpace:ye&&x.normalMapType===Ed,packedNormalMap:ye&&x.normalMapType===Ed&&qw(x.normalMap.format),metalnessMap:Me,roughnessMap:Pe,anisotropy:O,anisotropyMap:j,clearcoat:Xe,clearcoatMap:at,clearcoatNormalMap:lt,clearcoatRoughnessMap:Q,dispersion:ue,retroreflection:C,iridescence:g,iridescenceMap:nt,iridescenceThicknessMap:ut,sheen:z,sheenColorMap:Pt,sheenRoughnessMap:pt,specularMap:ht,specularColorMap:It,specularIntensityMap:Ut,transmission:X,transmissionMap:Ht,thicknessMap:D,gradientMap:ft,opaque:x.transparent===!1&&x.blending===Hr&&x.alphaToCoverage===!1,alphaMap:et,alphaTest:dt,alphaHash:yt,combine:x.combine,mapUv:Ft&&_(x.map.channel),aoMapUv:te&&_(x.aoMap.channel),lightMapUv:le&&_(x.lightMap.channel),bumpMapUv:Gt&&_(x.bumpMap.channel),normalMapUv:ye&&_(x.normalMap.channel),displacementMapUv:Oe&&_(x.displacementMap.channel),emissiveMapUv:on&&_(x.emissiveMap.channel),metalnessMapUv:Me&&_(x.metalnessMap.channel),roughnessMapUv:Pe&&_(x.roughnessMap.channel),anisotropyMapUv:j&&_(x.anisotropyMap.channel),clearcoatMapUv:at&&_(x.clearcoatMap.channel),clearcoatNormalMapUv:lt&&_(x.clearcoatNormalMap.channel),clearcoatRoughnessMapUv:Q&&_(x.clearcoatRoughnessMap.channel),iridescenceMapUv:nt&&_(x.iridescenceMap.channel),iridescenceThicknessMapUv:ut&&_(x.iridescenceThicknessMap.channel),sheenColorMapUv:Pt&&_(x.sheenColorMap.channel),sheenRoughnessMapUv:pt&&_(x.sheenRoughnessMap.channel),specularMapUv:ht&&_(x.specularMap.channel),specularColorMapUv:It&&_(x.specularColorMap.channel),specularIntensityMapUv:Ut&&_(x.specularIntensityMap.channel),transmissionMapUv:Ht&&_(x.transmissionMap.channel),thicknessMapUv:D&&_(x.thicknessMap.channel),alphaMapUv:et&&_(x.alphaMap.channel),vertexTangents:!!N.attributes.tangent&&(ye||O),vertexNormals:!!N.attributes.normal,vertexColors:x.vertexColors,vertexAlphas:x.vertexColors===!0&&!!N.attributes.color&&N.attributes.color.itemSize===4,pointsUvs:V.isPoints===!0&&!!N.attributes.uv&&(Ft||et),fog:!!R,useFog:x.fog===!0,fogExp2:!!R&&R.isFogExp2,flatShading:x.wireframe===!1&&(x.flatShading===!0||N.attributes.normal===void 0&&ye===!1&&(x.isMeshLambertMaterial||x.isMeshPhongMaterial||x.isMeshStandardMaterial||x.isMeshPhysicalMaterial)),sizeAttenuation:x.sizeAttenuation===!0,logarithmicDepthBuffer:f,reversedDepthBuffer:xt,skinning:V.isSkinnedMesh===!0,hasPositionAttribute:N.attributes.position!==void 0,morphTargets:N.morphAttributes.position!==void 0,morphNormals:N.morphAttributes.normal!==void 0,morphColors:N.morphAttributes.color!==void 0,morphTargetsCount:st,morphTextureStride:rt,numSunLights:T.sun.length,numDirLights:T.directional.length,numPointLights:T.point.length,numSpotLights:T.spot.length,numSpotLightMaps:T.spotLightMap.length,numRectAreaLights:T.rectArea.length,numHemiLights:T.hemi.length,numSunLightShadows:T.sunShadowMap.length,numDirLightShadows:T.directionalShadowMap.length,numPointLightShadows:T.pointShadowMap.length,numSpotLightShadows:T.spotShadowMap.length,numSpotLightShadowsWithMaps:T.numSpotLightShadowsWithMaps,numLightProbes:T.numLightProbes,numLightProbeGrids:I.length,numClippingPlanes:r.numPlanes,numClipIntersection:r.numIntersection,dithering:x.dithering,shadowMapEnabled:n.shadowMap.enabled&&L.length>0,shadowMapType:n.shadowMap.type,toneMapping:Lt,decodeVideoTexture:Ft&&x.map.isVideoTexture===!0&&Kt.getTransfer(x.map.colorSpace)===ce,decodeVideoTextureEmissive:on&&x.emissiveMap.isVideoTexture===!0&&Kt.getTransfer(x.emissiveMap.colorSpace)===ce,premultipliedAlpha:x.premultipliedAlpha,doubleSided:x.side===ui,flipSided:x.side===rn,useDepthPacking:x.depthPacking>=0,depthPacking:x.depthPacking||0,index0AttributeName:x.index0AttributeName,extensionClipCullDistance:it&&x.extensions.clipCullDistance===!0&&e.has("WEBGL_clip_cull_distance"),extensionMultiDraw:(it&&x.extensions.multiDraw===!0||ct)&&e.has("WEBGL_multi_draw"),rendererExtensionParallelShaderCompile:e.has("KHR_parallel_shader_compile"),customProgramCacheKey:x.customProgramCacheKey()};return Et.vertexUv1s=l.has(1),Et.vertexUv2s=l.has(2),Et.vertexUv3s=l.has(3),l.clear(),Et}function p(x){let T=[];if(x.shaderID?T.push(x.shaderID):(T.push(x.customVertexShaderID),T.push(x.customFragmentShaderID)),x.defines!==void 0)for(let L in x.defines)T.push(L),T.push(x.defines[L]);return x.isRawShaderMaterial===!1&&(d(T,x),M(T,x),T.push(n.outputColorSpace)),T.push(x.customProgramCacheKey),T.join()}function d(x,T){x.push(T.precision),x.push(T.outputColorSpace),x.push(T.envMapMode),x.push(T.envMapCubeUVHeight),x.push(T.mapUv),x.push(T.alphaMapUv),x.push(T.lightMapUv),x.push(T.aoMapUv),x.push(T.bumpMapUv),x.push(T.normalMapUv),x.push(T.displacementMapUv),x.push(T.emissiveMapUv),x.push(T.metalnessMapUv),x.push(T.roughnessMapUv),x.push(T.anisotropyMapUv),x.push(T.clearcoatMapUv),x.push(T.clearcoatNormalMapUv),x.push(T.clearcoatRoughnessMapUv),x.push(T.iridescenceMapUv),x.push(T.iridescenceThicknessMapUv),x.push(T.sheenColorMapUv),x.push(T.sheenRoughnessMapUv),x.push(T.specularMapUv),x.push(T.specularColorMapUv),x.push(T.specularIntensityMapUv),x.push(T.transmissionMapUv),x.push(T.thicknessMapUv),x.push(T.combine),x.push(T.fogExp2),x.push(T.sizeAttenuation),x.push(T.morphTargetsCount),x.push(T.morphAttributeCount),x.push(T.numSunLights),x.push(T.numDirLights),x.push(T.numPointLights),x.push(T.numSpotLights),x.push(T.numSpotLightMaps),x.push(T.numHemiLights),x.push(T.numRectAreaLights),x.push(T.numSunLightShadows),x.push(T.numDirLightShadows),x.push(T.numPointLightShadows),x.push(T.numSpotLightShadows),x.push(T.numSpotLightShadowsWithMaps),x.push(T.numLightProbes),x.push(T.shadowMapType),x.push(T.toneMapping),x.push(T.numClippingPlanes),x.push(T.numClipIntersection),x.push(T.depthPacking)}function M(x,T){o.disableAll(),T.instancing&&o.enable(0),T.instancingColor&&o.enable(1),T.instancingMorph&&o.enable(2),T.matcap&&o.enable(3),T.envMap&&o.enable(4),T.normalMapObjectSpace&&o.enable(5),T.normalMapTangentSpace&&o.enable(6),T.clearcoat&&o.enable(7),T.iridescence&&o.enable(8),T.alphaTest&&o.enable(9),T.vertexColors&&o.enable(10),T.vertexAlphas&&o.enable(11),T.vertexUv1s&&o.enable(12),T.vertexUv2s&&o.enable(13),T.vertexUv3s&&o.enable(14),T.vertexTangents&&o.enable(15),T.anisotropy&&o.enable(16),T.alphaHash&&o.enable(17),T.batching&&o.enable(18),T.dispersion&&o.enable(19),T.retroreflection&&o.enable(24),T.batchingColor&&o.enable(20),T.gradientMap&&o.enable(21),T.packedNormalMap&&o.enable(22),T.vertexNormals&&o.enable(23),x.push(o.mask),o.disableAll(),T.fog&&o.enable(0),T.useFog&&o.enable(1),T.flatShading&&o.enable(2),T.logarithmicDepthBuffer&&o.enable(3),T.reversedDepthBuffer&&o.enable(4),T.skinning&&o.enable(5),T.morphTargets&&o.enable(6),T.morphNormals&&o.enable(7),T.morphColors&&o.enable(8),T.premultipliedAlpha&&o.enable(9),T.shadowMapEnabled&&o.enable(10),T.doubleSided&&o.enable(11),T.flipSided&&o.enable(12),T.useDepthPacking&&o.enable(13),T.dithering&&o.enable(14),T.transmission&&o.enable(15),T.sheen&&o.enable(16),T.opaque&&o.enable(17),T.pointsUvs&&o.enable(18),T.decodeVideoTexture&&o.enable(19),T.decodeVideoTextureEmissive&&o.enable(20),T.alphaToCoverage&&o.enable(21),T.numLightProbeGrids>0&&o.enable(22),T.hasPositionAttribute&&o.enable(23),x.push(o.mask)}function P(x){let T=m[x.type],L;if(T){let F=di[T];L=f_.clone(F.uniforms)}else L=x.uniforms;return L}function b(x,T){let L=u.get(T);return L!==void 0?++L.usedTimes:(L=new $w(n,T,x,s),c.push(L),u.set(T,L)),L}function E(x){if(--x.usedTimes===0){let T=c.indexOf(x);c[T]=c[c.length-1],c.pop(),u.delete(x.cacheKey),x.destroy()}}function w(x){a.remove(x)}function A(){a.dispose()}return{getParameters:S,getProgramCacheKey:p,getUniforms:P,acquireProgram:b,releaseProgram:E,releaseShaderCache:w,programs:c,dispose:A}}function Zw(){let n=new WeakMap;function t(o){return n.has(o)}function e(o){let a=n.get(o);return a===void 0&&(a={},n.set(o,a)),a}function i(o){n.delete(o)}function s(o,a,l){n.get(o)[a]=l}function r(){n=new WeakMap}return{has:t,get:e,remove:i,update:s,dispose:r}}function Kw(n,t){return n.groupOrder!==t.groupOrder?n.groupOrder-t.groupOrder:n.renderOrder!==t.renderOrder?n.renderOrder-t.renderOrder:n.material.id!==t.material.id?n.material.id-t.material.id:n.materialVariant!==t.materialVariant?n.materialVariant-t.materialVariant:n.z!==t.z?n.z-t.z:n.id-t.id}function L_(n,t){return n.groupOrder!==t.groupOrder?n.groupOrder-t.groupOrder:n.renderOrder!==t.renderOrder?n.renderOrder-t.renderOrder:n.z!==t.z?t.z-n.z:n.id-t.id}function N_(){let n=[],t=0,e=[],i=[],s=[];function r(){t=0,e.length=0,i.length=0,s.length=0}function o(h){let m=0;return h.isInstancedMesh&&(m+=2),h.isSkinnedMesh&&(m+=1),m}function a(h,m,_,S,p,d){let M=n[t];return M===void 0?(M={id:h.id,object:h,geometry:m,material:_,materialVariant:o(h),groupOrder:S,renderOrder:h.renderOrder,z:p,group:d},n[t]=M):(M.id=h.id,M.object=h,M.geometry=m,M.material=_,M.materialVariant=o(h),M.groupOrder=S,M.renderOrder=h.renderOrder,M.z=p,M.group=d),t++,M}function l(h,m,_,S,p,d,M){M.reversedDepth===!0&&(p=-p);let P=a(h,m,_,S,p,d);_.transmission>0?i.push(P):_.transparent===!0?s.push(P):e.push(P)}function c(h,m,_,S,p,d){let M=a(h,m,_,S,p,d);_.transmission>0?i.unshift(M):_.transparent===!0?s.unshift(M):e.unshift(M)}function u(h,m){e.length>1&&e.sort(h||Kw),i.length>1&&i.sort(m||L_),s.length>1&&s.sort(m||L_)}function f(){for(let h=t,m=n.length;h<m;h++){let _=n[h];if(_.id===null)break;_.id=null,_.object=null,_.geometry=null,_.material=null,_.group=null}}return{opaque:e,transmissive:i,transparent:s,init:r,push:l,unshift:c,finish:f,sort:u}}function Jw(){let n=new WeakMap;function t(i,s){let r=n.get(i),o;return r===void 0?(o=new N_,n.set(i,[o])):s>=r.length?(o=new N_,r.push(o)):o=r[s],o}function e(){n=new WeakMap}return{get:t,dispose:e}}function jw(){let n={};return{get:function(t){if(n[t.id]!==void 0)return n[t.id];let e;switch(t.type){case"SunLight":case"DirectionalLight":e={direction:new W,color:new ne};break;case"SpotLight":e={position:new W,direction:new W,color:new ne,distance:0,coneCos:0,penumbraCos:0,decay:0};break;case"PointLight":e={position:new W,color:new ne,distance:0,decay:0};break;case"HemisphereLight":e={direction:new W,skyColor:new ne,groundColor:new ne};break;case"RectAreaLight":e={color:new ne,position:new W,halfWidth:new W,halfHeight:new W};break}return n[t.id]=e,e}}}function Qw(){let n={};return{get:function(t){if(n[t.id]!==void 0)return n[t.id];let e;switch(t.type){case"SunLight":case"DirectionalLight":e={shadowIntensity:1,shadowBias:0,shadowNormalBias:0,shadowRadius:1,shadowMapSize:new re};break;case"SpotLight":e={shadowIntensity:1,shadowBias:0,shadowNormalBias:0,shadowRadius:1,shadowMapSize:new re};break;case"PointLight":e={shadowIntensity:1,shadowBias:0,shadowNormalBias:0,shadowRadius:1,shadowMapSize:new re,shadowCameraNear:1,shadowCameraFar:1e3};break}return n[t.id]=e,e}}}var tE=0;function eE(n,t){return(t.castShadow?2:0)-(n.castShadow?2:0)+(t.map?1:0)-(n.map?1:0)}function nE(n){let t=new jw,e=Qw(),i={version:0,hash:{sunLength:-1,directionalLength:-1,pointLength:-1,spotLength:-1,rectAreaLength:-1,hemiLength:-1,numSunShadows:-1,numDirectionalShadows:-1,numPointShadows:-1,numSpotShadows:-1,numSpotMaps:-1,numLightProbes:-1},ambient:[0,0,0],probe:[],sun:[],sunShadow:[],sunShadowMap:[],sunShadowMatrix:[],sunShadowCascade:[],directional:[],directionalShadow:[],directionalShadowMap:[],directionalShadowMatrix:[],spot:[],spotLightMap:[],spotShadow:[],spotShadowMap:[],spotLightMatrix:[],rectArea:[],rectAreaLTC1:null,rectAreaLTC2:null,point:[],pointShadow:[],pointShadowMap:[],pointShadowMatrix:[],hemi:[],numSpotLightShadowsWithMaps:0,numLightProbes:0};for(let c=0;c<9;c++)i.probe.push(new W);let s=new W,r=new Ce,o=new Ce;function a(c){let u=0,f=0,h=0;for(let V=0;V<9;V++)i.probe[V].set(0,0,0);let m=0,_=0,S=0,p=0,d=0,M=0,P=0,b=0,E=0,w=0,A=0,x=0,T=0,L=0;c.sort(eE);for(let V=0,I=c.length;V<I;V++){let R=c[V],N=R.color,B=R.intensity,k=R.distance,Y=null;if(R.shadow&&R.shadow.map&&(R.shadow.map.texture.format===hs?Y=R.shadow.map.texture:Y=R.shadow.map.depthTexture||R.shadow.map.texture),R.isAmbientLight)u+=N.r*B,f+=N.g*B,h+=N.b*B;else if(R.isLightProbe){for(let $=0;$<9;$++)i.probe[$].addScaledVector(R.sh.coefficients[$],B);L++}else if(R.isSunLight){let $=t.get(R);if($.color.copy(R.color).multiplyScalar(R.intensity),R.castShadow){let J=R.shadow,q=e.get(R);q.shadowIntensity=J.intensity,q.shadowBias=J.bias,q.shadowNormalBias=J.normalBias,q.shadowRadius=J.radius,q.shadowMapSize.copy(J.mapSize).multiply(J.getFrameExtents()),i.sunShadow[_]=q,i.sunShadowMap[_]=Y;let st=J.getViewportCount();for(let rt=0;rt<st;rt++)i.sunShadowMatrix[S+rt]=J.getMatrix(rt),i.sunShadowCascade[S+rt]=J._cascadeData[rt];S+=st,_++}i.sun[m]=$,m++}else if(R.isDirectionalLight){let $=t.get(R);if($.color.copy(R.color).multiplyScalar(R.intensity),R.castShadow){let J=R.shadow,q=e.get(R);q.shadowIntensity=J.intensity,q.shadowBias=J.bias,q.shadowNormalBias=J.normalBias,q.shadowRadius=J.radius,q.shadowMapSize=J.mapSize,i.directionalShadow[p]=q,i.directionalShadowMap[p]=Y,i.directionalShadowMatrix[p]=R.shadow.matrix,E++}i.directional[p]=$,p++}else if(R.isSpotLight){let $=t.get(R);$.position.setFromMatrixPosition(R.matrixWorld),$.color.copy(N).multiplyScalar(B),$.distance=k,$.coneCos=Math.cos(R.angle),$.penumbraCos=Math.cos(R.angle*(1-R.penumbra)),$.decay=R.decay,i.spot[M]=$;let J=R.shadow;if(R.map&&(i.spotLightMap[x]=R.map,x++,J.updateMatrices(R),R.castShadow&&T++),i.spotLightMatrix[M]=J.matrix,R.castShadow){let q=e.get(R);q.shadowIntensity=J.intensity,q.shadowBias=J.bias,q.shadowNormalBias=J.normalBias,q.shadowRadius=J.radius,q.shadowMapSize=J.mapSize,i.spotShadow[M]=q,i.spotShadowMap[M]=Y,A++}M++}else if(R.isRectAreaLight){let $=t.get(R);$.color.copy(N).multiplyScalar(B),$.halfWidth.set(R.width*.5,0,0),$.halfHeight.set(0,R.height*.5,0),i.rectArea[P]=$,P++}else if(R.isPointLight){let $=t.get(R);if($.color.copy(R.color).multiplyScalar(R.intensity),$.distance=R.distance,$.decay=R.decay,R.castShadow){let J=R.shadow,q=e.get(R);q.shadowIntensity=J.intensity,q.shadowBias=J.bias,q.shadowNormalBias=J.normalBias,q.shadowRadius=J.radius,q.shadowMapSize=J.mapSize,q.shadowCameraNear=J.camera.near,q.shadowCameraFar=J.camera.far,i.pointShadow[d]=q,i.pointShadowMap[d]=Y,i.pointShadowMatrix[d]=R.shadow.matrix,w++}i.point[d]=$,d++}else if(R.isHemisphereLight){let $=t.get(R);$.skyColor.copy(R.color).multiplyScalar(B),$.groundColor.copy(R.groundColor).multiplyScalar(B),i.hemi[b]=$,b++}}P>0&&(n.has("OES_texture_float_linear")===!0?(i.rectAreaLTC1=mt.LTC_FLOAT_1,i.rectAreaLTC2=mt.LTC_FLOAT_2):(i.rectAreaLTC1=mt.LTC_HALF_1,i.rectAreaLTC2=mt.LTC_HALF_2)),i.ambient[0]=u,i.ambient[1]=f,i.ambient[2]=h;let F=i.hash;(F.sunLength!==m||F.directionalLength!==p||F.pointLength!==d||F.spotLength!==M||F.rectAreaLength!==P||F.hemiLength!==b||F.numSunShadows!==_||F.numDirectionalShadows!==E||F.numPointShadows!==w||F.numSpotShadows!==A||F.numSpotMaps!==x||F.numLightProbes!==L)&&(i.sun.length=m,i.directional.length=p,i.spot.length=M,i.rectArea.length=P,i.point.length=d,i.hemi.length=b,i.sunShadow.length=_,i.sunShadowMap.length=_,i.sunShadowMatrix.length=S,i.sunShadowCascade.length=S,i.directionalShadow.length=E,i.directionalShadowMap.length=E,i.directionalShadowMatrix.length=E,i.pointShadow.length=w,i.pointShadowMap.length=w,i.pointShadowMatrix.length=w,i.spotShadow.length=A,i.spotShadowMap.length=A,i.spotLightMatrix.length=A+x-T,i.spotLightMap.length=x,i.numSpotLightShadowsWithMaps=T,i.numLightProbes=L,F.sunLength=m,F.directionalLength=p,F.pointLength=d,F.spotLength=M,F.rectAreaLength=P,F.hemiLength=b,F.numSunShadows=_,F.numDirectionalShadows=E,F.numPointShadows=w,F.numSpotShadows=A,F.numSpotMaps=x,F.numLightProbes=L,i.version=tE++)}function l(c,u){let f=0,h=0,m=0,_=0,S=0,p=0,d=u.matrixWorldInverse;for(let M=0,P=c.length;M<P;M++){let b=c[M];if(b.isSunLight){let E=i.sun[f];E.direction.setFromMatrixPosition(b.matrixWorld),E.direction.transformDirection(d),f++}else if(b.isDirectionalLight){let E=i.directional[h];E.direction.setFromMatrixPosition(b.matrixWorld),s.setFromMatrixPosition(b.target.matrixWorld),E.direction.sub(s),E.direction.transformDirection(d),h++}else if(b.isSpotLight){let E=i.spot[_];E.position.setFromMatrixPosition(b.matrixWorld),E.position.applyMatrix4(d),E.direction.setFromMatrixPosition(b.matrixWorld),s.setFromMatrixPosition(b.target.matrixWorld),E.direction.sub(s),E.direction.transformDirection(d),_++}else if(b.isRectAreaLight){let E=i.rectArea[S];E.position.setFromMatrixPosition(b.matrixWorld),E.position.applyMatrix4(d),o.identity(),r.copy(b.matrixWorld),r.premultiply(d),o.extractRotation(r),E.halfWidth.set(b.width*.5,0,0),E.halfHeight.set(0,b.height*.5,0),E.halfWidth.applyMatrix4(o),E.halfHeight.applyMatrix4(o),S++}else if(b.isPointLight){let E=i.point[m];E.position.setFromMatrixPosition(b.matrixWorld),E.position.applyMatrix4(d),m++}else if(b.isHemisphereLight){let E=i.hemi[p];E.direction.setFromMatrixPosition(b.matrixWorld),E.direction.transformDirection(d),p++}}}return{setup:a,setupView:l,state:i}}function U_(n){let t=new nE(n),e=[],i=[],s=[];function r(h){f.camera=h,e.length=0,i.length=0,s.length=0}function o(h){e.push(h)}function a(h){i.push(h)}function l(h){s.push(h)}function c(){t.setup(e)}function u(h){t.setupView(e,h)}let f={lightsArray:e,shadowsArray:i,lightProbeGridArray:s,camera:null,lights:t,transmissionRenderTarget:{},textureUnits:0};return{init:r,state:f,setupLights:c,setupLightsView:u,pushLight:o,pushShadow:a,pushLightProbeGrid:l}}function iE(n){let t=new WeakMap;function e(s,r=0){let o=t.get(s),a;return o===void 0?(a=new U_(n),t.set(s,[a])):r>=o.length?(a=new U_(n),o.push(a)):a=o[r],a}function i(){t=new WeakMap}return{get:e,dispose:i}}var sE=`void main() {
	gl_Position = vec4( position, 1.0 );
}`,rE=`uniform sampler2D shadow_pass;
uniform vec2 resolution;
uniform float radius;
void main() {
	const float samples = float( VSM_SAMPLES );
	float mean = 0.0;
	float squared_mean = 0.0;
	float uvStride = samples <= 1.0 ? 0.0 : 2.0 / ( samples - 1.0 );
	float uvStart = samples <= 1.0 ? 0.0 : - 1.0;
	for ( float i = 0.0; i < samples; i ++ ) {
		float uvOffset = uvStart + i * uvStride;
		#ifdef HORIZONTAL_PASS
			vec2 distribution = texture2D( shadow_pass, ( gl_FragCoord.xy + vec2( uvOffset, 0.0 ) * radius ) / resolution ).rg;
			mean += distribution.x;
			squared_mean += distribution.y * distribution.y + distribution.x * distribution.x;
		#else
			float depth = texture2D( shadow_pass, ( gl_FragCoord.xy + vec2( 0.0, uvOffset ) * radius ) / resolution ).r;
			mean += depth;
			squared_mean += depth * depth;
		#endif
	}
	mean = mean / samples;
	squared_mean = squared_mean / samples;
	float std_dev = sqrt( max( 0.0, squared_mean - mean * mean ) );
	gl_FragColor = vec4( mean, std_dev, 0.0, 1.0 );
}`,oE=[new W(1,0,0),new W(-1,0,0),new W(0,1,0),new W(0,-1,0),new W(0,0,1),new W(0,0,-1)],aE=[new W(0,-1,0),new W(0,-1,0),new W(0,0,1),new W(0,0,-1),new W(0,-1,0),new W(0,-1,0)],D_=new Ce,Ra=new W,Bd=new W;function cE(n,t,e){let i=new ca,s=new re,r=new re,o=new we,a=new Bl,l=new kl,c={},u=e.maxTextureSize,f={[as]:rn,[rn]:as,[ui]:ui},h=new Sn({defines:{VSM_SAMPLES:8},uniforms:{shadow_pass:{value:null},resolution:{value:new re},radius:{value:4}},vertexShader:sE,fragmentShader:rE}),m=h.clone();m.defines.HORIZONTAL_PASS=1;let _=new vn;_.setAttribute("position",new Pn(new Float32Array([-1,-1,.5,3,-1,.5,-1,3,.5]),3));let S=new In(_,h),p=this;this.enabled=!1,this.autoUpdate=!0,this.needsUpdate=!1,this.type=xa;let d=this.type;this.render=function(w,A,x){if(p.enabled===!1||p.autoUpdate===!1&&p.needsUpdate===!1||w.length===0)return;this.type===R0&&(Dt("WebGLShadowMap: PCFSoftShadowMap has been removed. Using PCFShadowMap instead."),this.type=xa);let T=n.getRenderTarget(),L=n.getActiveCubeFace(),F=n.getActiveMipmapLevel(),V=n.state;V.setBlending(hi),V.buffers.depth.getReversed()===!0?V.buffers.color.setClear(0,0,0,0):V.buffers.color.setClear(1,1,1,1),V.buffers.depth.setTest(!0),V.setScissorTest(!1);let I=d!==this.type;I&&A.traverse(function(R){R.material&&(Array.isArray(R.material)?R.material.forEach(N=>N.needsUpdate=!0):R.material.needsUpdate=!0)});for(let R=0,N=w.length;R<N;R++){let B=w[R],k=B.shadow;if(k===void 0){Dt("WebGLShadowMap:",B,"has no shadow.");continue}if(k.autoUpdate===!1&&k.needsUpdate===!1)continue;s.copy(k.mapSize);let Y=k.getFrameExtents();s.multiply(Y),r.copy(k.mapSize),(s.x>u||s.y>u)&&(s.x>u&&(r.x=Math.floor(u/Y.x),s.x=r.x*Y.x,k.mapSize.x=r.x),s.y>u&&(r.y=Math.floor(u/Y.y),s.y=r.y*Y.y,k.mapSize.y=r.y));let $=n.state.buffers.depth.getReversed();if(k.camera._reversedDepth=$,k.map===null||I===!0){if(k.map!==null&&(k.map.depthTexture!==null&&(k.map.depthTexture.dispose(),k.map.depthTexture=null),k.map.dispose()),this.type===Gr){if(B.isPointLight){Dt("WebGLShadowMap: VSM shadow maps are not supported for PointLights. Use PCF or BasicShadowMap instead.");continue}k.map=new dn(s.x,s.y,{format:hs,type:Kn,minFilter:$e,magFilter:$e,generateMipmaps:!1}),k.map.texture.name=B.name+".shadowMap",k.map.depthTexture=new is(s.x,s.y,Zn),k.map.depthTexture.name=B.name+".shadowMapDepth",k.map.depthTexture.format=ai,k.map.depthTexture.compareFunction=null,k.map.depthTexture.minFilter=Ge,k.map.depthTexture.magFilter=Ge}else B.isPointLight?(k.map=new Gu(s.x),k.map.depthTexture=new Ol(s.x,Yn)):(k.map=new dn(s.x,s.y),k.map.depthTexture=new is(s.x,s.y,Yn)),k.map.depthTexture.name=B.name+".shadowMap",k.map.depthTexture.format=ai,this.type===xa?(k.map.depthTexture.compareFunction=$?Bu:Fu,k.map.depthTexture.minFilter=$e,k.map.depthTexture.magFilter=$e):(k.map.depthTexture.compareFunction=null,k.map.depthTexture.minFilter=Ge,k.map.depthTexture.magFilter=Ge);k.camera.updateProjectionMatrix()}k.map.isWebGLCubeRenderTarget!==!0&&(k.map.width!==s.x||k.map.height!==s.y)&&k.map.setSize(s.x,s.y);let J=k.map.isWebGLCubeRenderTarget?6:k.getViewportCount();B.isPointLight!==!0&&k.updateMatrices(B,x);for(let q=0;q<J;q++){let st=k.getCamera(q);if(B.isPointLight){let rt=k.camera,Mt=k.matrix,Ct=B.distance||rt.far;Ct!==rt.far&&(rt.far=Ct,rt.updateProjectionMatrix()),Ra.setFromMatrixPosition(B.matrixWorld),rt.position.copy(Ra),Bd.copy(rt.position),Bd.add(oE[q]),rt.up.copy(aE[q]),rt.lookAt(Bd),rt.updateMatrixWorld(),Mt.makeTranslation(-Ra.x,-Ra.y,-Ra.z),D_.multiplyMatrices(rt.projectionMatrix,rt.matrixWorldInverse),k._frustum.setFromProjectionMatrix(D_,rt.coordinateSystem,rt.reversedDepth)}if(k.map.isWebGLCubeRenderTarget)n.setRenderTarget(k.map,q),n.clear();else{q===0&&(n.setRenderTarget(k.map),n.clear());let rt=k.getViewport(q);o.set(r.x*rt.x,r.y*rt.y,r.x*rt.z,r.y*rt.w),V.viewport(o)}i=k.getFrustum(q),b(A,x,st,B,this.type)}k.isPointLightShadow!==!0&&this.type===Gr&&M(k,x),k.needsUpdate=!1}d=this.type,p.needsUpdate=!1,n.setRenderTarget(T,L,F)};function M(w,A){let x=t.update(S);h.defines.VSM_SAMPLES!==w.blurSamples&&(h.defines.VSM_SAMPLES=w.blurSamples,m.defines.VSM_SAMPLES=w.blurSamples,h.needsUpdate=!0,m.needsUpdate=!0),w.mapPass===null?w.mapPass=new dn(s.x,s.y,{format:hs,type:Kn}):(w.mapPass.width!==w.map.width||w.mapPass.height!==w.map.height)&&w.mapPass.setSize(w.map.width,w.map.height),h.uniforms.shadow_pass.value=w.map.depthTexture,h.uniforms.resolution.value.set(w.map.width,w.map.height),h.uniforms.radius.value=w.radius,n.setRenderTarget(w.mapPass),n.clear(),n.renderBufferDirect(A,null,x,h,S,null),m.uniforms.shadow_pass.value=w.mapPass.texture,m.uniforms.resolution.value.set(w.map.width,w.map.height),m.uniforms.radius.value=w.radius,n.setRenderTarget(w.map),n.clear(),n.renderBufferDirect(A,null,x,m,S,null)}function P(w,A,x,T){let L=null,F=x.isPointLight===!0?w.customDistanceMaterial:w.customDepthMaterial;if(F!==void 0)L=F;else if(L=x.isPointLight===!0?l:a,n.localClippingEnabled&&A.clipShadows===!0&&Array.isArray(A.clippingPlanes)&&A.clippingPlanes.length!==0||A.displacementMap&&A.displacementScale!==0||A.alphaMap&&A.alphaTest>0||A.map&&A.alphaTest>0||A.alphaToCoverage===!0){let V=L.uuid,I=A.uuid,R=c[V];R===void 0&&(R={},c[V]=R);let N=R[I];N===void 0&&(N=L.clone(),R[I]=N,A.addEventListener("dispose",E)),L=N}if(L.visible=A.visible,L.wireframe=A.wireframe,T===Gr?L.side=A.shadowSide!==null?A.shadowSide:A.side:L.side=A.shadowSide!==null?A.shadowSide:f[A.side],L.alphaMap=A.alphaMap,L.alphaTest=A.alphaToCoverage===!0?.5:A.alphaTest,L.map=A.map,L.clipShadows=A.clipShadows,L.clippingPlanes=A.clippingPlanes,L.clipIntersection=A.clipIntersection,L.displacementMap=A.displacementMap,L.displacementScale=A.displacementScale,L.displacementBias=A.displacementBias,L.wireframeLinewidth=A.wireframeLinewidth,L.linewidth=A.linewidth,x.isPointLight===!0&&L.isMeshDistanceMaterial===!0){let V=n.properties.get(L);V.light=x}return L}function b(w,A,x,T,L){if(w.visible===!1)return;if(w.layers.test(A.layers)&&(w.isMesh||w.isLine||w.isPoints)&&(w.castShadow||w.receiveShadow&&L===Gr)&&(!w.frustumCulled||w.intersectsFrustum(i))){w.modelViewMatrix.multiplyMatrices(x.matrixWorldInverse,w.matrixWorld);let I=t.update(w),R=w.material;if(Array.isArray(R)){let N=I.groups;for(let B=0,k=N.length;B<k;B++){let Y=N[B],$=R[Y.materialIndex];if($&&$.visible){let J=P(w,$,T,L);w.onBeforeShadow(n,w,A,x,I,J,Y),n.renderBufferDirect(x,null,I,J,w,Y),w.onAfterShadow(n,w,A,x,I,J,Y)}}}else if(R.visible){let N=P(w,R,T,L);w.onBeforeShadow(n,w,A,x,I,N,null),n.renderBufferDirect(x,null,I,N,w,null),w.onAfterShadow(n,w,A,x,I,N,null)}}let V=w.children;for(let I=0,R=V.length;I<R;I++)b(V[I],A,x,T,L)}function E(w){w.target.removeEventListener("dispose",E);for(let x in c){let T=c[x],L=w.target.uuid;L in T&&(T[L].dispose(),delete T[L])}}}function lE(n,t){function e(){let D=!1,ft=new we,et=null,dt=new we(0,0,0,0);return{setMask:function(yt){et!==yt&&!D&&(n.colorMask(yt,yt,yt,yt),et=yt)},setLocked:function(yt){D=yt},setClear:function(yt,it,Lt,Et,pe){pe===!0&&(yt*=Et,it*=Et,Lt*=Et),ft.set(yt,it,Lt,Et),dt.equals(ft)===!1&&(n.clearColor(yt,it,Lt,Et),dt.copy(ft))},reset:function(){D=!1,et=null,dt.set(-1,0,0,0)}}}function i(){let D=!1,ft=!1,et=null,dt=null,yt=null;return{setReversed:function(it){if(ft!==it){let Lt=t.get("EXT_clip_control");it?Lt.clipControlEXT(Lt.LOWER_LEFT_EXT,Lt.ZERO_TO_ONE_EXT):Lt.clipControlEXT(Lt.LOWER_LEFT_EXT,Lt.NEGATIVE_ONE_TO_ONE_EXT),ft=it;let Et=yt;yt=null,this.setClear(Et)}},getReversed:function(){return ft},setTest:function(it){it?tt(n.DEPTH_TEST):xt(n.DEPTH_TEST)},setMask:function(it){et!==it&&!D&&(n.depthMask(it),et=it)},setFunc:function(it){if(ft&&(it=u_[it]),dt!==it){switch(it){case xl:n.depthFunc(n.NEVER);break;case yl:n.depthFunc(n.ALWAYS);break;case vl:n.depthFunc(n.LESS);break;case Or:n.depthFunc(n.LEQUAL);break;case Sl:n.depthFunc(n.EQUAL);break;case bl:n.depthFunc(n.GEQUAL);break;case Ml:n.depthFunc(n.GREATER);break;case Tl:n.depthFunc(n.NOTEQUAL);break;default:n.depthFunc(n.LEQUAL)}dt=it}},setLocked:function(it){D=it},setClear:function(it){yt!==it&&(yt=it,ft&&(it=1-it),n.clearDepth(it))},reset:function(){D=!1,et=null,dt=null,yt=null,ft=!1}}}function s(){let D=!1,ft=null,et=null,dt=null,yt=null,it=null,Lt=null,Et=null,pe=null;return{setTest:function(oe){D||(oe?tt(n.STENCIL_TEST):xt(n.STENCIL_TEST))},setMask:function(oe){ft!==oe&&!D&&(n.stencilMask(oe),ft=oe)},setFunc:function(oe,Un,Jn){(et!==oe||dt!==Un||yt!==Jn)&&(n.stencilFunc(oe,Un,Jn),et=oe,dt=Un,yt=Jn)},setOp:function(oe,Un,Jn){(it!==oe||Lt!==Un||Et!==Jn)&&(n.stencilOp(oe,Un,Jn),it=oe,Lt=Un,Et=Jn)},setLocked:function(oe){D=oe},setClear:function(oe){pe!==oe&&(n.clearStencil(oe),pe=oe)},reset:function(){D=!1,ft=null,et=null,dt=null,yt=null,it=null,Lt=null,Et=null,pe=null}}}let r=new e,o=new i,a=new s,l=new WeakMap,c=new WeakMap,u={},f={},h={},m=new WeakMap,_=[],S=null,p=!1,d=null,M=null,P=null,b=null,E=null,w=null,A=null,x=new ne(0,0,0),T=0,L=!1,F=null,V=null,I=null,R=null,N=null,B=n.getParameter(n.MAX_COMBINED_TEXTURE_IMAGE_UNITS),k=!1,Y=0,$=n.getParameter(n.VERSION);$.indexOf("WebGL")!==-1?(Y=parseFloat(/^WebGL (\d)/.exec($)[1]),k=Y>=1):$.indexOf("OpenGL ES")!==-1&&(Y=parseFloat(/^OpenGL ES (\d)/.exec($)[1]),k=Y>=2);let J=null,q={},st=n.getParameter(n.SCISSOR_BOX),rt=n.getParameter(n.VIEWPORT),Mt=new we().fromArray(st),Ct=new we().fromArray(rt);function kt(D,ft,et,dt){let yt=new Uint8Array(4),it=n.createTexture();n.bindTexture(D,it),n.texParameteri(D,n.TEXTURE_MIN_FILTER,n.NEAREST),n.texParameteri(D,n.TEXTURE_MAG_FILTER,n.NEAREST);for(let Lt=0;Lt<et;Lt++)D===n.TEXTURE_3D||D===n.TEXTURE_2D_ARRAY?n.texImage3D(ft,0,n.RGBA,1,1,dt,0,n.RGBA,n.UNSIGNED_BYTE,yt):n.texImage2D(ft+Lt,0,n.RGBA,1,1,0,n.RGBA,n.UNSIGNED_BYTE,yt);return it}let K={};K[n.TEXTURE_2D]=kt(n.TEXTURE_2D,n.TEXTURE_2D,1),K[n.TEXTURE_CUBE_MAP]=kt(n.TEXTURE_CUBE_MAP,n.TEXTURE_CUBE_MAP_POSITIVE_X,6),K[n.TEXTURE_2D_ARRAY]=kt(n.TEXTURE_2D_ARRAY,n.TEXTURE_2D_ARRAY,1,1),K[n.TEXTURE_3D]=kt(n.TEXTURE_3D,n.TEXTURE_3D,1,1),r.setClear(0,0,0,1),o.setClear(1),a.setClear(0),tt(n.DEPTH_TEST),o.setFunc(Or),Gt(!1),ye(sd),tt(n.CULL_FACE),te(hi);function tt(D){u[D]!==!0&&(n.enable(D),u[D]=!0)}function xt(D){u[D]!==!1&&(n.disable(D),u[D]=!1)}function Nt(D,ft){return h[D]!==ft?(n.bindFramebuffer(D,ft),h[D]=ft,D===n.DRAW_FRAMEBUFFER&&(h[n.FRAMEBUFFER]=ft),D===n.FRAMEBUFFER&&(h[n.DRAW_FRAMEBUFFER]=ft),!0):!1}function ct(D,ft){let et=_,dt=!1;if(D){et=m.get(ft),et===void 0&&(et=[],m.set(ft,et));let yt=D.textures;if(et.length!==yt.length||et[0]!==n.COLOR_ATTACHMENT0){for(let it=0,Lt=yt.length;it<Lt;it++)et[it]=n.COLOR_ATTACHMENT0+it;et.length=yt.length,dt=!0}}else et[0]!==n.BACK&&(et[0]=n.BACK,dt=!0);dt&&n.drawBuffers(et)}function Ft(D){return S!==D?(n.useProgram(D),S=D,!0):!1}let Ee={[Ws]:n.FUNC_ADD,[I0]:n.FUNC_SUBTRACT,[L0]:n.FUNC_REVERSE_SUBTRACT};Ee[N0]=n.MIN,Ee[U0]=n.MAX;let Wt={[D0]:n.ZERO,[O0]:n.ONE,[F0]:n.SRC_COLOR,[cd]:n.SRC_ALPHA,[H0]:n.SRC_ALPHA_SATURATE,[z0]:n.DST_COLOR,[k0]:n.DST_ALPHA,[B0]:n.ONE_MINUS_SRC_COLOR,[ld]:n.ONE_MINUS_SRC_ALPHA,[G0]:n.ONE_MINUS_DST_COLOR,[V0]:n.ONE_MINUS_DST_ALPHA,[W0]:n.CONSTANT_COLOR,[$0]:n.ONE_MINUS_CONSTANT_COLOR,[X0]:n.CONSTANT_ALPHA,[q0]:n.ONE_MINUS_CONSTANT_ALPHA};function te(D,ft,et,dt,yt,it,Lt,Et,pe,oe){if(D===hi){p===!0&&(xt(n.BLEND),p=!1);return}if(p===!1&&(tt(n.BLEND),p=!0),D!==P0){if(D!==d||oe!==L){if((M!==Ws||E!==Ws)&&(n.blendEquation(n.FUNC_ADD),M=Ws,E=Ws),oe)switch(D){case Hr:n.blendFuncSeparate(n.ONE,n.ONE_MINUS_SRC_ALPHA,n.ONE,n.ONE_MINUS_SRC_ALPHA);break;case rd:n.blendFunc(n.ONE,n.ONE);break;case od:n.blendFuncSeparate(n.ZERO,n.ONE_MINUS_SRC_COLOR,n.ZERO,n.ONE);break;case ad:n.blendFuncSeparate(n.DST_COLOR,n.ONE_MINUS_SRC_ALPHA,n.ZERO,n.ONE);break;default:Bt("WebGLState: Invalid blending: ",D);break}else switch(D){case Hr:n.blendFuncSeparate(n.SRC_ALPHA,n.ONE_MINUS_SRC_ALPHA,n.ONE,n.ONE_MINUS_SRC_ALPHA);break;case rd:n.blendFuncSeparate(n.SRC_ALPHA,n.ONE,n.ONE,n.ONE);break;case od:Bt("WebGLState: SubtractiveBlending requires material.premultipliedAlpha = true");break;case ad:Bt("WebGLState: MultiplyBlending requires material.premultipliedAlpha = true");break;default:Bt("WebGLState: Invalid blending: ",D);break}P=null,b=null,w=null,A=null,x.set(0,0,0),T=0,d=D,L=oe}return}yt=yt||ft,it=it||et,Lt=Lt||dt,(ft!==M||yt!==E)&&(n.blendEquationSeparate(Ee[ft],Ee[yt]),M=ft,E=yt),(et!==P||dt!==b||it!==w||Lt!==A)&&(n.blendFuncSeparate(Wt[et],Wt[dt],Wt[it],Wt[Lt]),P=et,b=dt,w=it,A=Lt),(Et.equals(x)===!1||pe!==T)&&(n.blendColor(Et.r,Et.g,Et.b,pe),x.copy(Et),T=pe),d=D,L=!1}function le(D,ft){D.side===ui?xt(n.CULL_FACE):tt(n.CULL_FACE);let et=D.side===rn;ft&&(et=!et),Gt(et),D.blending===Hr&&D.transparent===!1?te(hi):te(D.blending,D.blendEquation,D.blendSrc,D.blendDst,D.blendEquationAlpha,D.blendSrcAlpha,D.blendDstAlpha,D.blendColor,D.blendAlpha,D.premultipliedAlpha),o.setFunc(D.depthFunc),o.setTest(D.depthTest),o.setMask(D.depthWrite),r.setMask(D.colorWrite);let dt=D.stencilWrite;a.setTest(dt),dt&&(a.setMask(D.stencilWriteMask),a.setFunc(D.stencilFunc,D.stencilRef,D.stencilFuncMask),a.setOp(D.stencilFail,D.stencilZFail,D.stencilZPass)),on(D.polygonOffset,D.polygonOffsetFactor,D.polygonOffsetUnits),D.alphaToCoverage===!0?tt(n.SAMPLE_ALPHA_TO_COVERAGE):xt(n.SAMPLE_ALPHA_TO_COVERAGE)}function Gt(D){F!==D&&(D?n.frontFace(n.CW):n.frontFace(n.CCW),F=D)}function ye(D){D!==A0?(tt(n.CULL_FACE),D!==V&&(D===sd?n.cullFace(n.BACK):D===C0?n.cullFace(n.FRONT):n.cullFace(n.FRONT_AND_BACK))):xt(n.CULL_FACE),V=D}function Oe(D){D!==I&&(k&&n.lineWidth(D),I=D)}function on(D,ft,et){D?(tt(n.POLYGON_OFFSET_FILL),(R!==ft||N!==et)&&(R=ft,N=et,o.getReversed()&&(ft=-ft),n.polygonOffset(ft,et))):xt(n.POLYGON_OFFSET_FILL)}function Me(D){D?tt(n.SCISSOR_TEST):xt(n.SCISSOR_TEST)}function Pe(D){D===void 0&&(D=n.TEXTURE0+B-1),J!==D&&(n.activeTexture(D),J=D)}function O(D,ft,et){et===void 0&&(J===null?et=n.TEXTURE0+B-1:et=J);let dt=q[et];dt===void 0&&(dt={type:void 0,texture:void 0},q[et]=dt),(dt.type!==D||dt.texture!==ft)&&(J!==et&&(n.activeTexture(et),J=et),n.bindTexture(D,ft||K[D]),dt.type=D,dt.texture=ft)}function Xe(){let D=q[J];D!==void 0&&D.type!==void 0&&(n.bindTexture(D.type,null),D.type=void 0,D.texture=void 0)}function ue(){try{n.compressedTexImage2D(...arguments)}catch(D){Bt("WebGLState:",D)}}function C(){try{n.compressedTexImage3D(...arguments)}catch(D){Bt("WebGLState:",D)}}function g(){try{n.texSubImage2D(...arguments)}catch(D){Bt("WebGLState:",D)}}function z(){try{n.texSubImage3D(...arguments)}catch(D){Bt("WebGLState:",D)}}function X(){try{n.compressedTexSubImage2D(...arguments)}catch(D){Bt("WebGLState:",D)}}function j(){try{n.compressedTexSubImage3D(...arguments)}catch(D){Bt("WebGLState:",D)}}function at(){try{n.texStorage2D(...arguments)}catch(D){Bt("WebGLState:",D)}}function lt(){try{n.texStorage3D(...arguments)}catch(D){Bt("WebGLState:",D)}}function Q(){try{n.texImage2D(...arguments)}catch(D){Bt("WebGLState:",D)}}function nt(){try{n.texImage3D(...arguments)}catch(D){Bt("WebGLState:",D)}}function ut(D){return f[D]!==void 0?f[D]:n.getParameter(D)}function Pt(D,ft){f[D]!==ft&&(n.pixelStorei(D,ft),f[D]=ft)}function pt(D){Mt.equals(D)===!1&&(n.scissor(D.x,D.y,D.z,D.w),Mt.copy(D))}function ht(D){Ct.equals(D)===!1&&(n.viewport(D.x,D.y,D.z,D.w),Ct.copy(D))}function It(D,ft){let et=c.get(ft);et===void 0&&(et=new WeakMap,c.set(ft,et));let dt=et.get(D);dt===void 0&&(dt=n.getUniformBlockIndex(ft,D.name),et.set(D,dt))}function Ut(D,ft){let dt=c.get(ft).get(D);l.get(ft)!==dt&&(n.uniformBlockBinding(ft,dt,D.__bindingPointIndex),l.set(ft,dt))}function Ht(){n.disable(n.BLEND),n.disable(n.CULL_FACE),n.disable(n.DEPTH_TEST),n.disable(n.POLYGON_OFFSET_FILL),n.disable(n.SCISSOR_TEST),n.disable(n.STENCIL_TEST),n.disable(n.SAMPLE_ALPHA_TO_COVERAGE),n.blendEquation(n.FUNC_ADD),n.blendFunc(n.ONE,n.ZERO),n.blendFuncSeparate(n.ONE,n.ZERO,n.ONE,n.ZERO),n.blendColor(0,0,0,0),n.colorMask(!0,!0,!0,!0),n.clearColor(0,0,0,0),n.depthMask(!0),n.depthFunc(n.LESS),o.setReversed(!1),n.clearDepth(1),n.stencilMask(4294967295),n.stencilFunc(n.ALWAYS,0,4294967295),n.stencilOp(n.KEEP,n.KEEP,n.KEEP),n.clearStencil(0),n.cullFace(n.BACK),n.frontFace(n.CCW),n.polygonOffset(0,0),n.activeTexture(n.TEXTURE0),n.bindFramebuffer(n.FRAMEBUFFER,null),n.bindFramebuffer(n.DRAW_FRAMEBUFFER,null),n.bindFramebuffer(n.READ_FRAMEBUFFER,null),n.useProgram(null),n.lineWidth(1),n.scissor(0,0,n.canvas.width,n.canvas.height),n.viewport(0,0,n.canvas.width,n.canvas.height),n.pixelStorei(n.PACK_ALIGNMENT,4),n.pixelStorei(n.UNPACK_ALIGNMENT,4),n.pixelStorei(n.UNPACK_FLIP_Y_WEBGL,!1),n.pixelStorei(n.UNPACK_PREMULTIPLY_ALPHA_WEBGL,!1),n.pixelStorei(n.UNPACK_COLORSPACE_CONVERSION_WEBGL,n.BROWSER_DEFAULT_WEBGL),n.pixelStorei(n.PACK_ROW_LENGTH,0),n.pixelStorei(n.PACK_SKIP_PIXELS,0),n.pixelStorei(n.PACK_SKIP_ROWS,0),n.pixelStorei(n.UNPACK_ROW_LENGTH,0),n.pixelStorei(n.UNPACK_IMAGE_HEIGHT,0),n.pixelStorei(n.UNPACK_SKIP_PIXELS,0),n.pixelStorei(n.UNPACK_SKIP_ROWS,0),n.pixelStorei(n.UNPACK_SKIP_IMAGES,0),u={},f={},J=null,q={},h={},m=new WeakMap,_=[],S=null,p=!1,d=null,M=null,P=null,b=null,E=null,w=null,A=null,x=new ne(0,0,0),T=0,L=!1,F=null,V=null,I=null,R=null,N=null,Mt.set(0,0,n.canvas.width,n.canvas.height),Ct.set(0,0,n.canvas.width,n.canvas.height),r.reset(),o.reset(),a.reset()}return{buffers:{color:r,depth:o,stencil:a},enable:tt,disable:xt,bindFramebuffer:Nt,drawBuffers:ct,useProgram:Ft,setBlending:te,setMaterial:le,setFlipSided:Gt,setCullFace:ye,setLineWidth:Oe,setPolygonOffset:on,setScissorTest:Me,activeTexture:Pe,bindTexture:O,unbindTexture:Xe,compressedTexImage2D:ue,compressedTexImage3D:C,texImage2D:Q,texImage3D:nt,pixelStorei:Pt,getParameter:ut,updateUBOMapping:It,uniformBlockBinding:Ut,texStorage2D:at,texStorage3D:lt,texSubImage2D:g,texSubImage3D:z,compressedTexSubImage2D:X,compressedTexSubImage3D:j,scissor:pt,viewport:ht,reset:Ht}}function uE(n,t,e,i,s,r,o){let a=t.has("WEBGL_multisampled_render_to_texture")?t.get("WEBGL_multisampled_render_to_texture"):null,l=typeof navigator>"u"?!1:/OculusBrowser/g.test(navigator.userAgent),c=new re,u=new WeakMap,f=new Set,h,m=new WeakMap,_=!1;try{_=typeof OffscreenCanvas<"u"&&new OffscreenCanvas(1,1).getContext("2d")!==null}catch{}function S(C,g){return _?new OffscreenCanvas(C,g):ta("canvas")}function p(C,g,z){let X=1,j=ue(C);if((j.width>z||j.height>z)&&(X=z/Math.max(j.width,j.height)),X<1)if(typeof HTMLImageElement<"u"&&C instanceof HTMLImageElement||typeof HTMLCanvasElement<"u"&&C instanceof HTMLCanvasElement||typeof ImageBitmap<"u"&&C instanceof ImageBitmap||typeof VideoFrame<"u"&&C instanceof VideoFrame){let at=Math.floor(X*j.width),lt=Math.floor(X*j.height);h===void 0&&(h=S(at,lt));let Q=g?S(at,lt):h;return Q.width=at,Q.height=lt,Q.getContext("2d").drawImage(C,0,0,at,lt),Dt("WebGLRenderer: Texture has been resized from ("+j.width+"x"+j.height+") to ("+at+"x"+lt+")."),Q}else return"data"in C&&Dt("WebGLRenderer: Image in DataTexture is too big ("+j.width+"x"+j.height+")."),C;return C}function d(C){return C.generateMipmaps}function M(C){n.generateMipmap(C)}function P(C){return C.isWebGLCubeRenderTarget?n.TEXTURE_CUBE_MAP:C.isWebGL3DRenderTarget?n.TEXTURE_3D:C.isWebGLArrayRenderTarget||C.isCompressedArrayTexture?n.TEXTURE_2D_ARRAY:n.TEXTURE_2D}function b(C,g,z,X,j,at=!1){if(C!==null){if(n[C]!==void 0)return n[C];Dt("WebGLRenderer: Attempt to use non-existing WebGL internal format '"+C+"'")}let lt;X&&(lt=t.get("EXT_texture_norm16"),lt||Dt("WebGLRenderer: Unable to use normalized textures without EXT_texture_norm16 extension"));let Q=g;if(g===n.RED&&(z===n.FLOAT&&(Q=n.R32F),z===n.HALF_FLOAT&&(Q=n.R16F),z===n.UNSIGNED_BYTE&&(Q=n.R8),z===n.UNSIGNED_SHORT&&lt&&(Q=lt.R16_EXT),z===n.SHORT&&lt&&(Q=lt.R16_SNORM_EXT)),g===n.RED_INTEGER&&(z===n.UNSIGNED_BYTE&&(Q=n.R8UI),z===n.UNSIGNED_SHORT&&(Q=n.R16UI),z===n.UNSIGNED_INT&&(Q=n.R32UI),z===n.BYTE&&(Q=n.R8I),z===n.SHORT&&(Q=n.R16I),z===n.INT&&(Q=n.R32I)),g===n.RG&&(z===n.FLOAT&&(Q=n.RG32F),z===n.HALF_FLOAT&&(Q=n.RG16F),z===n.UNSIGNED_BYTE&&(Q=n.RG8),z===n.UNSIGNED_SHORT&&lt&&(Q=lt.RG16_EXT),z===n.SHORT&&lt&&(Q=lt.RG16_SNORM_EXT)),g===n.RG_INTEGER&&(z===n.UNSIGNED_BYTE&&(Q=n.RG8UI),z===n.UNSIGNED_SHORT&&(Q=n.RG16UI),z===n.UNSIGNED_INT&&(Q=n.RG32UI),z===n.BYTE&&(Q=n.RG8I),z===n.SHORT&&(Q=n.RG16I),z===n.INT&&(Q=n.RG32I)),g===n.RGB_INTEGER&&(z===n.UNSIGNED_BYTE&&(Q=n.RGB8UI),z===n.UNSIGNED_SHORT&&(Q=n.RGB16UI),z===n.UNSIGNED_INT&&(Q=n.RGB32UI),z===n.BYTE&&(Q=n.RGB8I),z===n.SHORT&&(Q=n.RGB16I),z===n.INT&&(Q=n.RGB32I)),g===n.RGBA_INTEGER&&(z===n.UNSIGNED_BYTE&&(Q=n.RGBA8UI),z===n.UNSIGNED_SHORT&&(Q=n.RGBA16UI),z===n.UNSIGNED_INT&&(Q=n.RGBA32UI),z===n.BYTE&&(Q=n.RGBA8I),z===n.SHORT&&(Q=n.RGBA16I),z===n.INT&&(Q=n.RGBA32I)),g===n.RGB&&(z===n.UNSIGNED_SHORT&&lt&&(Q=lt.RGB16_EXT),z===n.SHORT&&lt&&(Q=lt.RGB16_SNORM_EXT),z===n.UNSIGNED_INT_5_9_9_9_REV&&(Q=n.RGB9_E5),z===n.UNSIGNED_INT_10F_11F_11F_REV&&(Q=n.R11F_G11F_B10F)),g===n.RGBA){let nt=at?jo:Kt.getTransfer(j);z===n.FLOAT&&(Q=n.RGBA32F),z===n.HALF_FLOAT&&(Q=n.RGBA16F),z===n.UNSIGNED_BYTE&&(Q=nt===ce?n.SRGB8_ALPHA8:n.RGBA8),z===n.UNSIGNED_SHORT&&lt&&(Q=lt.RGBA16_EXT),z===n.SHORT&&lt&&(Q=lt.RGBA16_SNORM_EXT),z===n.UNSIGNED_SHORT_4_4_4_4&&(Q=n.RGBA4),z===n.UNSIGNED_SHORT_5_5_5_1&&(Q=n.RGB5_A1)}return(Q===n.R16F||Q===n.R32F||Q===n.RG16F||Q===n.RG32F||Q===n.RGBA16F||Q===n.RGBA32F)&&t.get("EXT_color_buffer_float"),Q}function E(C,g){let z;return C?g===null||g===Yn||g===$r?z=n.DEPTH24_STENCIL8:g===Zn?z=n.DEPTH32F_STENCIL8:g===Wr&&(z=n.DEPTH24_STENCIL8,Dt("DepthTexture: 16 bit depth attachment is not supported with stencil. Using 24-bit attachment.")):g===null||g===Yn||g===$r?z=n.DEPTH_COMPONENT24:g===Zn?z=n.DEPTH_COMPONENT32F:g===Wr&&(z=n.DEPTH_COMPONENT16),z}function w(C,g){return d(C)===!0||C.isFramebufferTexture&&C.minFilter!==Ge&&C.minFilter!==$e?Math.log2(Math.max(g.width,g.height))+1:C.mipmaps!==void 0&&C.mipmaps.length>0?C.mipmaps.length:C.isCompressedTexture&&Array.isArray(C.image)?g.mipmaps.length:1}function A(C){let g=C.target;g.removeEventListener("dispose",A),T(g),g.isVideoTexture&&u.delete(g),g.isHTMLTexture&&f.delete(g)}function x(C){let g=C.target;g.removeEventListener("dispose",x),F(g)}function T(C){let g=i.get(C);if(g.__webglInit===void 0)return;let z=C.source,X=m.get(z);if(X){let j=X[g.__cacheKey];j.usedTimes--,j.usedTimes===0&&L(C),Object.keys(X).length===0&&m.delete(z)}i.remove(C)}function L(C){let g=i.get(C);n.deleteTexture(g.__webglTexture);let z=C.source,X=m.get(z);delete X[g.__cacheKey],o.memory.textures--}function F(C){let g=i.get(C);if(C.depthTexture&&(C.depthTexture.dispose(),i.remove(C.depthTexture)),C.isWebGLCubeRenderTarget)for(let X=0;X<6;X++){if(Array.isArray(g.__webglFramebuffer[X]))for(let j=0;j<g.__webglFramebuffer[X].length;j++)n.deleteFramebuffer(g.__webglFramebuffer[X][j]);else n.deleteFramebuffer(g.__webglFramebuffer[X]);g.__webglDepthbuffer&&n.deleteRenderbuffer(g.__webglDepthbuffer[X])}else{if(Array.isArray(g.__webglFramebuffer))for(let X=0;X<g.__webglFramebuffer.length;X++)n.deleteFramebuffer(g.__webglFramebuffer[X]);else n.deleteFramebuffer(g.__webglFramebuffer);if(g.__webglDepthbuffer&&n.deleteRenderbuffer(g.__webglDepthbuffer),g.__webglMultisampledFramebuffer&&n.deleteFramebuffer(g.__webglMultisampledFramebuffer),g.__webglColorRenderbuffer)for(let X=0;X<g.__webglColorRenderbuffer.length;X++)g.__webglColorRenderbuffer[X]&&n.deleteRenderbuffer(g.__webglColorRenderbuffer[X]);g.__webglDepthRenderbuffer&&n.deleteRenderbuffer(g.__webglDepthRenderbuffer)}let z=C.textures;for(let X=0,j=z.length;X<j;X++){let at=i.get(z[X]);at.__webglTexture&&(n.deleteTexture(at.__webglTexture),o.memory.textures--),i.remove(z[X])}i.remove(C)}let V=0;function I(){V=0}function R(){return V}function N(C){V=C}function B(){let C=V;return C>=s.maxTextures&&Dt("WebGLTextures: Trying to use "+(C+1)+" texture units while this GPU supports only "+s.maxTextures),V+=1,C}function k(C){let g=[];return g.push(C.wrapS),g.push(C.wrapT),g.push(C.wrapR||0),g.push(C.magFilter),g.push(C.minFilter),g.push(C.anisotropy),g.push(C.internalFormat),g.push(C.format),g.push(C.type),g.push(C.generateMipmaps),g.push(C.premultiplyAlpha),g.push(C.flipY),g.push(C.unpackAlignment),g.push(C.colorSpace),g.join()}function Y(C,g){let z=i.get(C);if(C.isVideoTexture&&O(C),C.isRenderTargetTexture===!1&&C.isExternalTexture!==!0&&C.version>0&&z.__version!==C.version){let X=C.image;if(X===null)Dt("WebGLRenderer: Texture marked for update but no image data found.");else if(X.complete===!1)Dt("WebGLRenderer: Texture marked for update but image is incomplete");else{xt(z,C,g);return}}else C.isExternalTexture&&(z.__webglTexture=C.sourceTexture?C.sourceTexture:null);e.bindTexture(n.TEXTURE_2D,z.__webglTexture,n.TEXTURE0+g)}function $(C,g){let z=i.get(C);if(C.isRenderTargetTexture===!1&&C.version>0&&z.__version!==C.version){xt(z,C,g);return}else C.isExternalTexture&&(z.__webglTexture=C.sourceTexture?C.sourceTexture:null);e.bindTexture(n.TEXTURE_2D_ARRAY,z.__webglTexture,n.TEXTURE0+g)}function J(C,g){let z=i.get(C);if(C.isRenderTargetTexture===!1&&C.version>0&&z.__version!==C.version){xt(z,C,g);return}e.bindTexture(n.TEXTURE_3D,z.__webglTexture,n.TEXTURE0+g)}function q(C,g){let z=i.get(C);if(C.isCubeDepthTexture!==!0&&C.version>0&&z.__version!==C.version){Nt(z,C,g);return}e.bindTexture(n.TEXTURE_CUBE_MAP,z.__webglTexture,n.TEXTURE0+g)}let st={[wl]:n.REPEAT,[oi]:n.CLAMP_TO_EDGE,[El]:n.MIRRORED_REPEAT},rt={[Ge]:n.NEAREST,[K0]:n.NEAREST_MIPMAP_NEAREST,[va]:n.NEAREST_MIPMAP_LINEAR,[$e]:n.LINEAR,[tu]:n.LINEAR_MIPMAP_NEAREST,[ls]:n.LINEAR_MIPMAP_LINEAR},Mt={[t_]:n.NEVER,[r_]:n.ALWAYS,[e_]:n.LESS,[Fu]:n.LEQUAL,[n_]:n.EQUAL,[Bu]:n.GEQUAL,[i_]:n.GREATER,[s_]:n.NOTEQUAL};function Ct(C,g){if(g.type===Zn&&t.has("OES_texture_float_linear")===!1&&(g.magFilter===$e||g.magFilter===tu||g.magFilter===va||g.magFilter===ls||g.minFilter===$e||g.minFilter===tu||g.minFilter===va||g.minFilter===ls)&&Dt("WebGLRenderer: Unable to use linear filtering with floating point textures. OES_texture_float_linear not supported on this device."),n.texParameteri(C,n.TEXTURE_WRAP_S,st[g.wrapS]),n.texParameteri(C,n.TEXTURE_WRAP_T,st[g.wrapT]),(C===n.TEXTURE_3D||C===n.TEXTURE_2D_ARRAY)&&n.texParameteri(C,n.TEXTURE_WRAP_R,st[g.wrapR]),n.texParameteri(C,n.TEXTURE_MAG_FILTER,rt[g.magFilter]),n.texParameteri(C,n.TEXTURE_MIN_FILTER,rt[g.minFilter]),g.compareFunction&&(n.texParameteri(C,n.TEXTURE_COMPARE_MODE,n.COMPARE_REF_TO_TEXTURE),n.texParameteri(C,n.TEXTURE_COMPARE_FUNC,Mt[g.compareFunction])),t.has("EXT_texture_filter_anisotropic")===!0){if(g.magFilter===Ge||g.minFilter!==va&&g.minFilter!==ls||g.type===Zn&&t.has("OES_texture_float_linear")===!1)return;if(g.anisotropy>1||i.get(g).__currentAnisotropy){let z=t.get("EXT_texture_filter_anisotropic");n.texParameterf(C,z.TEXTURE_MAX_ANISOTROPY_EXT,Math.min(g.anisotropy,s.getMaxAnisotropy())),i.get(g).__currentAnisotropy=g.anisotropy}}}function kt(C,g){let z=!1;C.__webglInit===void 0&&(C.__webglInit=!0,g.addEventListener("dispose",A));let X=g.source,j=m.get(X);j===void 0&&(j={},m.set(X,j));let at=k(g);if(at!==C.__cacheKey){j[at]===void 0&&(j[at]={texture:n.createTexture(),usedTimes:0},o.memory.textures++,z=!0),j[at].usedTimes++;let lt=j[C.__cacheKey];lt!==void 0&&(j[C.__cacheKey].usedTimes--,lt.usedTimes===0&&L(g)),C.__cacheKey=at,C.__webglTexture=j[at].texture}return z}function K(C,g,z){return Math.floor(Math.floor(C/z)/g)}function tt(C,g,z,X){let at=C.updateRanges;if(at.length===0)e.texSubImage2D(n.TEXTURE_2D,0,0,0,g.width,g.height,z,X,g.data);else{at.sort((Pt,pt)=>Pt.start-pt.start);let lt=0;for(let Pt=1;Pt<at.length;Pt++){let pt=at[lt],ht=at[Pt],It=pt.start+pt.count,Ut=K(ht.start,g.width,4),Ht=K(pt.start,g.width,4);ht.start<=It+1&&Ut===Ht&&K(ht.start+ht.count-1,g.width,4)===Ut?pt.count=Math.max(pt.count,ht.start+ht.count-pt.start):(++lt,at[lt]=ht)}at.length=lt+1;let Q=e.getParameter(n.UNPACK_ROW_LENGTH),nt=e.getParameter(n.UNPACK_SKIP_PIXELS),ut=e.getParameter(n.UNPACK_SKIP_ROWS);e.pixelStorei(n.UNPACK_ROW_LENGTH,g.width);for(let Pt=0,pt=at.length;Pt<pt;Pt++){let ht=at[Pt],It=Math.floor(ht.start/4),Ut=Math.ceil(ht.count/4),Ht=It%g.width,D=Math.floor(It/g.width),ft=Ut,et=1;e.pixelStorei(n.UNPACK_SKIP_PIXELS,Ht),e.pixelStorei(n.UNPACK_SKIP_ROWS,D),e.texSubImage2D(n.TEXTURE_2D,0,Ht,D,ft,et,z,X,g.data)}C.clearUpdateRanges(),e.pixelStorei(n.UNPACK_ROW_LENGTH,Q),e.pixelStorei(n.UNPACK_SKIP_PIXELS,nt),e.pixelStorei(n.UNPACK_SKIP_ROWS,ut)}}function xt(C,g,z){let X=n.TEXTURE_2D;(g.isDataArrayTexture||g.isCompressedArrayTexture)&&(X=n.TEXTURE_2D_ARRAY),g.isData3DTexture&&(X=n.TEXTURE_3D);let j=kt(C,g),at=g.source;e.bindTexture(X,C.__webglTexture,n.TEXTURE0+z);let lt=i.get(at);if(at.version!==lt.__version||j===!0){if(e.activeTexture(n.TEXTURE0+z),(typeof ImageBitmap<"u"&&g.image instanceof ImageBitmap)===!1){let et=Kt.getPrimaries(Kt.workingColorSpace),dt=g.colorSpace===Li?null:Kt.getPrimaries(g.colorSpace),yt=g.colorSpace===Li||et===dt?n.NONE:n.BROWSER_DEFAULT_WEBGL;e.pixelStorei(n.UNPACK_FLIP_Y_WEBGL,g.flipY),e.pixelStorei(n.UNPACK_PREMULTIPLY_ALPHA_WEBGL,g.premultiplyAlpha),e.pixelStorei(n.UNPACK_COLORSPACE_CONVERSION_WEBGL,yt)}e.pixelStorei(n.UNPACK_ALIGNMENT,g.unpackAlignment);let nt=p(g.image,!1,s.maxTextureSize);nt=Xe(g,nt);let ut=r.convert(g.format,g.colorSpace),Pt=r.convert(g.type),pt=b(g.internalFormat,ut,Pt,g.normalized,g.colorSpace,g.isVideoTexture);Ct(X,g);let ht,It=g.mipmaps,Ut=g.isVideoTexture!==!0,Ht=lt.__version===void 0||j===!0,D=at.dataReady,ft=w(g,nt);if(g.isDepthTexture)pt=E(g.format===us,g.type),Ht&&(Ut?e.texStorage2D(n.TEXTURE_2D,1,pt,nt.width,nt.height):e.texImage2D(n.TEXTURE_2D,0,pt,nt.width,nt.height,0,ut,Pt,null));else if(g.isDataTexture)if(It.length>0){Ut&&Ht&&e.texStorage2D(n.TEXTURE_2D,ft,pt,It[0].width,It[0].height);for(let et=0,dt=It.length;et<dt;et++)ht=It[et],Ut?D&&e.texSubImage2D(n.TEXTURE_2D,et,0,0,ht.width,ht.height,ut,Pt,ht.data):e.texImage2D(n.TEXTURE_2D,et,pt,ht.width,ht.height,0,ut,Pt,ht.data);g.generateMipmaps=!1}else Ut?(Ht&&e.texStorage2D(n.TEXTURE_2D,ft,pt,nt.width,nt.height),D&&tt(g,nt,ut,Pt)):e.texImage2D(n.TEXTURE_2D,0,pt,nt.width,nt.height,0,ut,Pt,nt.data);else if(g.isCompressedTexture)if(g.isCompressedArrayTexture){Ut&&Ht&&e.texStorage3D(n.TEXTURE_2D_ARRAY,ft,pt,It[0].width,It[0].height,nt.depth);for(let et=0,dt=It.length;et<dt;et++)if(ht=It[et],g.format!==Ln)if(ut!==null)if(Ut){if(D)if(g.layerUpdates.size>0){let yt=Ld(ht.width,ht.height,g.format,g.type);for(let it of g.layerUpdates){let Lt=ht.data.subarray(it*yt/ht.data.BYTES_PER_ELEMENT,(it+1)*yt/ht.data.BYTES_PER_ELEMENT);e.compressedTexSubImage3D(n.TEXTURE_2D_ARRAY,et,0,0,it,ht.width,ht.height,1,ut,Lt)}}else e.compressedTexSubImage3D(n.TEXTURE_2D_ARRAY,et,0,0,0,ht.width,ht.height,nt.depth,ut,ht.data)}else e.compressedTexImage3D(n.TEXTURE_2D_ARRAY,et,pt,ht.width,ht.height,nt.depth,0,ht.data,0,0);else Dt("WebGLRenderer: Attempt to load unsupported compressed texture format in .uploadTexture()");else Ut?D&&e.texSubImage3D(n.TEXTURE_2D_ARRAY,et,0,0,0,ht.width,ht.height,nt.depth,ut,Pt,ht.data):e.texImage3D(n.TEXTURE_2D_ARRAY,et,pt,ht.width,ht.height,nt.depth,0,ut,Pt,ht.data);g.layerUpdates.size>0&&g.clearLayerUpdates()}else{Ut&&Ht&&e.texStorage2D(n.TEXTURE_2D,ft,pt,It[0].width,It[0].height);for(let et=0,dt=It.length;et<dt;et++)ht=It[et],g.format!==Ln?ut!==null?Ut?D&&e.compressedTexSubImage2D(n.TEXTURE_2D,et,0,0,ht.width,ht.height,ut,ht.data):e.compressedTexImage2D(n.TEXTURE_2D,et,pt,ht.width,ht.height,0,ht.data):Dt("WebGLRenderer: Attempt to load unsupported compressed texture format in .uploadTexture()"):Ut?D&&e.texSubImage2D(n.TEXTURE_2D,et,0,0,ht.width,ht.height,ut,Pt,ht.data):e.texImage2D(n.TEXTURE_2D,et,pt,ht.width,ht.height,0,ut,Pt,ht.data)}else if(g.isDataArrayTexture)if(Ut){if(Ht&&e.texStorage3D(n.TEXTURE_2D_ARRAY,ft,pt,nt.width,nt.height,nt.depth),D)if(g.layerUpdates.size>0){let et=Ld(nt.width,nt.height,g.format,g.type);for(let dt of g.layerUpdates){let yt=nt.data.subarray(dt*et/nt.data.BYTES_PER_ELEMENT,(dt+1)*et/nt.data.BYTES_PER_ELEMENT);e.texSubImage3D(n.TEXTURE_2D_ARRAY,0,0,0,dt,nt.width,nt.height,1,ut,Pt,yt)}g.clearLayerUpdates()}else e.texSubImage3D(n.TEXTURE_2D_ARRAY,0,0,0,0,nt.width,nt.height,nt.depth,ut,Pt,nt.data)}else e.texImage3D(n.TEXTURE_2D_ARRAY,0,pt,nt.width,nt.height,nt.depth,0,ut,Pt,nt.data);else if(g.isData3DTexture)Ut?(Ht&&e.texStorage3D(n.TEXTURE_3D,ft,pt,nt.width,nt.height,nt.depth),D&&e.texSubImage3D(n.TEXTURE_3D,0,0,0,0,nt.width,nt.height,nt.depth,ut,Pt,nt.data)):e.texImage3D(n.TEXTURE_3D,0,pt,nt.width,nt.height,nt.depth,0,ut,Pt,nt.data);else if(g.isFramebufferTexture){if(Ht)if(Ut)e.texStorage2D(n.TEXTURE_2D,ft,pt,nt.width,nt.height);else{let et=nt.width,dt=nt.height;for(let yt=0;yt<ft;yt++)e.texImage2D(n.TEXTURE_2D,yt,pt,et,dt,0,ut,Pt,null),et>>=1,dt>>=1}}else if(g.isHTMLTexture){if("texElementImage2D"in n){let et=n.canvas;if(et.hasAttribute("layoutsubtree")||et.setAttribute("layoutsubtree","true"),nt.parentNode!==et){et.appendChild(nt),f.add(g),et.onpaint=dt=>{let yt=dt.changedElements;for(let it of f)yt.includes(it.image)&&(it.needsUpdate=!0)},et.requestPaint();return}if(n.texElementImage2D.length===3)n.texElementImage2D(n.TEXTURE_2D,n.RGBA8,nt);else{let yt=n.RGBA,it=n.RGBA,Lt=n.UNSIGNED_BYTE;n.texElementImage2D(n.TEXTURE_2D,0,yt,it,Lt,nt)}n.texParameteri(n.TEXTURE_2D,n.TEXTURE_MIN_FILTER,n.LINEAR),n.texParameteri(n.TEXTURE_2D,n.TEXTURE_WRAP_S,n.CLAMP_TO_EDGE),n.texParameteri(n.TEXTURE_2D,n.TEXTURE_WRAP_T,n.CLAMP_TO_EDGE)}}else if(It.length>0){if(Ut&&Ht){let et=ue(It[0]);e.texStorage2D(n.TEXTURE_2D,ft,pt,et.width,et.height)}for(let et=0,dt=It.length;et<dt;et++)ht=It[et],Ut?D&&e.texSubImage2D(n.TEXTURE_2D,et,0,0,ut,Pt,ht):e.texImage2D(n.TEXTURE_2D,et,pt,ut,Pt,ht);g.generateMipmaps=!1}else if(Ut){if(Ht){let et=ue(nt);e.texStorage2D(n.TEXTURE_2D,ft,pt,et.width,et.height)}D&&e.texSubImage2D(n.TEXTURE_2D,0,0,0,ut,Pt,nt)}else e.texImage2D(n.TEXTURE_2D,0,pt,ut,Pt,nt);d(g)&&M(X),lt.__version=at.version,g.onUpdate&&g.onUpdate(g)}C.__version=g.version}function Nt(C,g,z){if(g.image.length!==6)return;let X=kt(C,g),j=g.source;e.bindTexture(n.TEXTURE_CUBE_MAP,C.__webglTexture,n.TEXTURE0+z);let at=i.get(j);if(j.version!==at.__version||X===!0){e.activeTexture(n.TEXTURE0+z);let lt=Kt.getPrimaries(Kt.workingColorSpace),Q=g.colorSpace===Li?null:Kt.getPrimaries(g.colorSpace),nt=g.colorSpace===Li||lt===Q?n.NONE:n.BROWSER_DEFAULT_WEBGL;e.pixelStorei(n.UNPACK_FLIP_Y_WEBGL,g.flipY),e.pixelStorei(n.UNPACK_PREMULTIPLY_ALPHA_WEBGL,g.premultiplyAlpha),e.pixelStorei(n.UNPACK_ALIGNMENT,g.unpackAlignment),e.pixelStorei(n.UNPACK_COLORSPACE_CONVERSION_WEBGL,nt);let ut=g.isCompressedTexture||g.image[0].isCompressedTexture,Pt=g.image[0]&&g.image[0].isDataTexture,pt=[];for(let it=0;it<6;it++)!ut&&!Pt?pt[it]=p(g.image[it],!0,s.maxCubemapSize):pt[it]=Pt?g.image[it].image:g.image[it],pt[it]=Xe(g,pt[it]);let ht=pt[0],It=r.convert(g.format,g.colorSpace),Ut=r.convert(g.type),Ht=b(g.internalFormat,It,Ut,g.normalized,g.colorSpace),D=g.isVideoTexture!==!0,ft=at.__version===void 0||X===!0,et=j.dataReady,dt=w(g,ht);Ct(n.TEXTURE_CUBE_MAP,g);let yt;if(ut){D&&ft&&e.texStorage2D(n.TEXTURE_CUBE_MAP,dt,Ht,ht.width,ht.height);for(let it=0;it<6;it++){yt=pt[it].mipmaps;for(let Lt=0;Lt<yt.length;Lt++){let Et=yt[Lt];g.format!==Ln?It!==null?D?et&&e.compressedTexSubImage2D(n.TEXTURE_CUBE_MAP_POSITIVE_X+it,Lt,0,0,Et.width,Et.height,It,Et.data):e.compressedTexImage2D(n.TEXTURE_CUBE_MAP_POSITIVE_X+it,Lt,Ht,Et.width,Et.height,0,Et.data):Dt("WebGLRenderer: Attempt to load unsupported compressed texture format in .setTextureCube()"):D?et&&e.texSubImage2D(n.TEXTURE_CUBE_MAP_POSITIVE_X+it,Lt,0,0,Et.width,Et.height,It,Ut,Et.data):e.texImage2D(n.TEXTURE_CUBE_MAP_POSITIVE_X+it,Lt,Ht,Et.width,Et.height,0,It,Ut,Et.data)}}}else{if(yt=g.mipmaps,D&&ft){yt.length>0&&dt++;let it=ue(pt[0]);e.texStorage2D(n.TEXTURE_CUBE_MAP,dt,Ht,it.width,it.height)}for(let it=0;it<6;it++)if(Pt){D?et&&e.texSubImage2D(n.TEXTURE_CUBE_MAP_POSITIVE_X+it,0,0,0,pt[it].width,pt[it].height,It,Ut,pt[it].data):e.texImage2D(n.TEXTURE_CUBE_MAP_POSITIVE_X+it,0,Ht,pt[it].width,pt[it].height,0,It,Ut,pt[it].data);for(let Lt=0;Lt<yt.length;Lt++){let pe=yt[Lt].image[it].image;D?et&&e.texSubImage2D(n.TEXTURE_CUBE_MAP_POSITIVE_X+it,Lt+1,0,0,pe.width,pe.height,It,Ut,pe.data):e.texImage2D(n.TEXTURE_CUBE_MAP_POSITIVE_X+it,Lt+1,Ht,pe.width,pe.height,0,It,Ut,pe.data)}}else{D?et&&e.texSubImage2D(n.TEXTURE_CUBE_MAP_POSITIVE_X+it,0,0,0,It,Ut,pt[it]):e.texImage2D(n.TEXTURE_CUBE_MAP_POSITIVE_X+it,0,Ht,It,Ut,pt[it]);for(let Lt=0;Lt<yt.length;Lt++){let Et=yt[Lt];D?et&&e.texSubImage2D(n.TEXTURE_CUBE_MAP_POSITIVE_X+it,Lt+1,0,0,It,Ut,Et.image[it]):e.texImage2D(n.TEXTURE_CUBE_MAP_POSITIVE_X+it,Lt+1,Ht,It,Ut,Et.image[it])}}}d(g)&&M(n.TEXTURE_CUBE_MAP),at.__version=j.version,g.onUpdate&&g.onUpdate(g)}C.__version=g.version}function ct(C,g,z,X,j,at){let lt=r.convert(z.format,z.colorSpace),Q=r.convert(z.type),nt=b(z.internalFormat,lt,Q,z.normalized,z.colorSpace),ut=i.get(g),Pt=i.get(z);if(Pt.__renderTarget=g,!ut.__hasExternalTextures){let pt=Math.max(1,g.width>>at),ht=Math.max(1,g.height>>at);j===n.TEXTURE_3D||j===n.TEXTURE_2D_ARRAY?e.texImage3D(j,at,nt,pt,ht,g.depth,0,lt,Q,null):e.texImage2D(j,at,nt,pt,ht,0,lt,Q,null)}e.bindFramebuffer(n.FRAMEBUFFER,C),Pe(g)?a.framebufferTexture2DMultisampleEXT(n.FRAMEBUFFER,X,j,Pt.__webglTexture,0,Me(g)):(j===n.TEXTURE_2D||j>=n.TEXTURE_CUBE_MAP_POSITIVE_X&&j<=n.TEXTURE_CUBE_MAP_NEGATIVE_Z)&&n.framebufferTexture2D(n.FRAMEBUFFER,X,j,Pt.__webglTexture,at),e.bindFramebuffer(n.FRAMEBUFFER,null)}function Ft(C,g,z){if(n.bindRenderbuffer(n.RENDERBUFFER,C),g.depthBuffer){let X=g.depthTexture,j=X&&X.isDepthTexture?X.type:null,at=E(g.stencilBuffer,j),lt=g.stencilBuffer?n.DEPTH_STENCIL_ATTACHMENT:n.DEPTH_ATTACHMENT;Pe(g)?a.renderbufferStorageMultisampleEXT(n.RENDERBUFFER,Me(g),at,g.width,g.height):z?n.renderbufferStorageMultisample(n.RENDERBUFFER,Me(g),at,g.width,g.height):n.renderbufferStorage(n.RENDERBUFFER,at,g.width,g.height),n.framebufferRenderbuffer(n.FRAMEBUFFER,lt,n.RENDERBUFFER,C)}else{let X=g.textures;for(let j=0;j<X.length;j++){let at=X[j],lt=r.convert(at.format,at.colorSpace),Q=r.convert(at.type),nt=b(at.internalFormat,lt,Q,at.normalized,at.colorSpace);Pe(g)?a.renderbufferStorageMultisampleEXT(n.RENDERBUFFER,Me(g),nt,g.width,g.height):z?n.renderbufferStorageMultisample(n.RENDERBUFFER,Me(g),nt,g.width,g.height):n.renderbufferStorage(n.RENDERBUFFER,nt,g.width,g.height)}}n.bindRenderbuffer(n.RENDERBUFFER,null)}function Ee(C,g,z){let X=g.isWebGLCubeRenderTarget===!0;if(e.bindFramebuffer(n.FRAMEBUFFER,C),!(g.depthTexture&&g.depthTexture.isDepthTexture))throw new Error("THREE.WebGLTextures: renderTarget.depthTexture must be an instance of THREE.DepthTexture.");let j=i.get(g.depthTexture);if(j.__renderTarget=g,(!j.__webglTexture||g.depthTexture.image.width!==g.width||g.depthTexture.image.height!==g.height)&&(g.depthTexture.image.width=g.width,g.depthTexture.image.height=g.height,g.depthTexture.needsUpdate=!0),X){if(j.__webglInit===void 0&&(j.__webglInit=!0,g.depthTexture.addEventListener("dispose",A)),j.__webglTexture===void 0){j.__webglTexture=n.createTexture(),e.bindTexture(n.TEXTURE_CUBE_MAP,j.__webglTexture),Ct(n.TEXTURE_CUBE_MAP,g.depthTexture);let ut=r.convert(g.depthTexture.format),Pt=r.convert(g.depthTexture.type),pt;g.depthTexture.format===ai?pt=n.DEPTH_COMPONENT24:g.depthTexture.format===us&&(pt=n.DEPTH24_STENCIL8);for(let ht=0;ht<6;ht++)n.texImage2D(n.TEXTURE_CUBE_MAP_POSITIVE_X+ht,0,pt,g.width,g.height,0,ut,Pt,null)}}else Y(g.depthTexture,0);let at=j.__webglTexture,lt=Me(g),Q=X?n.TEXTURE_CUBE_MAP_POSITIVE_X+z:n.TEXTURE_2D,nt=g.depthTexture.format===us?n.DEPTH_STENCIL_ATTACHMENT:n.DEPTH_ATTACHMENT;if(g.depthTexture.format===ai)Pe(g)?a.framebufferTexture2DMultisampleEXT(n.FRAMEBUFFER,nt,Q,at,0,lt):n.framebufferTexture2D(n.FRAMEBUFFER,nt,Q,at,0);else if(g.depthTexture.format===us)Pe(g)?a.framebufferTexture2DMultisampleEXT(n.FRAMEBUFFER,nt,Q,at,0,lt):n.framebufferTexture2D(n.FRAMEBUFFER,nt,Q,at,0);else throw new Error("THREE.WebGLTextures: Unknown depthTexture format.")}function Wt(C){let g=i.get(C),z=C.isWebGLCubeRenderTarget===!0;if(g.__boundDepthTexture!==C.depthTexture){let X=C.depthTexture;if(g.__depthDisposeCallback&&g.__depthDisposeCallback(),X){let j=()=>{delete g.__boundDepthTexture,delete g.__depthDisposeCallback,X.removeEventListener("dispose",j)};X.addEventListener("dispose",j),g.__depthDisposeCallback=j}g.__boundDepthTexture=X}if(C.depthTexture&&!g.__autoAllocateDepthBuffer)if(z)for(let X=0;X<6;X++)Ee(g.__webglFramebuffer[X],C,X);else{let X=C.texture.mipmaps;X&&X.length>0?Ee(g.__webglFramebuffer[0],C,0):Ee(g.__webglFramebuffer,C,0)}else if(z){g.__webglDepthbuffer=[];for(let X=0;X<6;X++)if(e.bindFramebuffer(n.FRAMEBUFFER,g.__webglFramebuffer[X]),g.__webglDepthbuffer[X]===void 0)g.__webglDepthbuffer[X]=n.createRenderbuffer(),Ft(g.__webglDepthbuffer[X],C,!1);else{let j=C.stencilBuffer?n.DEPTH_STENCIL_ATTACHMENT:n.DEPTH_ATTACHMENT,at=g.__webglDepthbuffer[X];n.bindRenderbuffer(n.RENDERBUFFER,at),n.framebufferRenderbuffer(n.FRAMEBUFFER,j,n.RENDERBUFFER,at)}}else{let X=C.texture.mipmaps;if(X&&X.length>0?e.bindFramebuffer(n.FRAMEBUFFER,g.__webglFramebuffer[0]):e.bindFramebuffer(n.FRAMEBUFFER,g.__webglFramebuffer),g.__webglDepthbuffer===void 0)g.__webglDepthbuffer=n.createRenderbuffer(),Ft(g.__webglDepthbuffer,C,!1);else{let j=C.stencilBuffer?n.DEPTH_STENCIL_ATTACHMENT:n.DEPTH_ATTACHMENT,at=g.__webglDepthbuffer;n.bindRenderbuffer(n.RENDERBUFFER,at),n.framebufferRenderbuffer(n.FRAMEBUFFER,j,n.RENDERBUFFER,at)}}e.bindFramebuffer(n.FRAMEBUFFER,null)}function te(C,g,z){let X=i.get(C);g!==void 0&&ct(X.__webglFramebuffer,C,C.texture,n.COLOR_ATTACHMENT0,n.TEXTURE_2D,0),z!==void 0&&Wt(C)}function le(C){let g=C.texture,z=i.get(C),X=i.get(g);C.addEventListener("dispose",x);let j=C.textures,at=C.isWebGLCubeRenderTarget===!0,lt=j.length>1;if(lt||(X.__webglTexture===void 0&&(X.__webglTexture=n.createTexture()),X.__version=g.version,o.memory.textures++),at){z.__webglFramebuffer=[];for(let Q=0;Q<6;Q++)if(g.mipmaps&&g.mipmaps.length>0){z.__webglFramebuffer[Q]=[];for(let nt=0;nt<g.mipmaps.length;nt++)z.__webglFramebuffer[Q][nt]=n.createFramebuffer()}else z.__webglFramebuffer[Q]=n.createFramebuffer()}else{if(g.mipmaps&&g.mipmaps.length>0){z.__webglFramebuffer=[];for(let Q=0;Q<g.mipmaps.length;Q++)z.__webglFramebuffer[Q]=n.createFramebuffer()}else z.__webglFramebuffer=n.createFramebuffer();if(lt)for(let Q=0,nt=j.length;Q<nt;Q++){let ut=i.get(j[Q]);ut.__webglTexture===void 0&&(ut.__webglTexture=n.createTexture(),o.memory.textures++)}if(C.samples>0&&Pe(C)===!1){z.__webglMultisampledFramebuffer=n.createFramebuffer(),z.__webglColorRenderbuffer=[],e.bindFramebuffer(n.FRAMEBUFFER,z.__webglMultisampledFramebuffer);for(let Q=0;Q<j.length;Q++){let nt=j[Q];z.__webglColorRenderbuffer[Q]=n.createRenderbuffer(),n.bindRenderbuffer(n.RENDERBUFFER,z.__webglColorRenderbuffer[Q]);let ut=r.convert(nt.format,nt.colorSpace),Pt=r.convert(nt.type),pt=b(nt.internalFormat,ut,Pt,nt.normalized,nt.colorSpace,C.isXRRenderTarget===!0),ht=Me(C);n.renderbufferStorageMultisample(n.RENDERBUFFER,ht,pt,C.width,C.height),n.framebufferRenderbuffer(n.FRAMEBUFFER,n.COLOR_ATTACHMENT0+Q,n.RENDERBUFFER,z.__webglColorRenderbuffer[Q])}n.bindRenderbuffer(n.RENDERBUFFER,null),C.depthBuffer&&(z.__webglDepthRenderbuffer=n.createRenderbuffer(),Ft(z.__webglDepthRenderbuffer,C,!0)),e.bindFramebuffer(n.FRAMEBUFFER,null)}}if(at){e.bindTexture(n.TEXTURE_CUBE_MAP,X.__webglTexture),Ct(n.TEXTURE_CUBE_MAP,g);for(let Q=0;Q<6;Q++)if(g.mipmaps&&g.mipmaps.length>0)for(let nt=0;nt<g.mipmaps.length;nt++)ct(z.__webglFramebuffer[Q][nt],C,g,n.COLOR_ATTACHMENT0,n.TEXTURE_CUBE_MAP_POSITIVE_X+Q,nt);else ct(z.__webglFramebuffer[Q],C,g,n.COLOR_ATTACHMENT0,n.TEXTURE_CUBE_MAP_POSITIVE_X+Q,0);d(g)&&M(n.TEXTURE_CUBE_MAP),e.unbindTexture()}else if(lt){for(let Q=0,nt=j.length;Q<nt;Q++){let ut=j[Q],Pt=i.get(ut),pt=n.TEXTURE_2D;(C.isWebGL3DRenderTarget||C.isWebGLArrayRenderTarget)&&(pt=C.isWebGL3DRenderTarget?n.TEXTURE_3D:n.TEXTURE_2D_ARRAY),e.bindTexture(pt,Pt.__webglTexture),Ct(pt,ut),ct(z.__webglFramebuffer,C,ut,n.COLOR_ATTACHMENT0+Q,pt,0),d(ut)&&M(pt)}e.unbindTexture()}else{let Q=n.TEXTURE_2D;if((C.isWebGL3DRenderTarget||C.isWebGLArrayRenderTarget)&&(Q=C.isWebGL3DRenderTarget?n.TEXTURE_3D:n.TEXTURE_2D_ARRAY),e.bindTexture(Q,X.__webglTexture),Ct(Q,g),g.mipmaps&&g.mipmaps.length>0)for(let nt=0;nt<g.mipmaps.length;nt++)ct(z.__webglFramebuffer[nt],C,g,n.COLOR_ATTACHMENT0,Q,nt);else ct(z.__webglFramebuffer,C,g,n.COLOR_ATTACHMENT0,Q,0);d(g)&&M(Q),e.unbindTexture()}C.depthBuffer&&Wt(C)}function Gt(C){let g=C.textures;for(let z=0,X=g.length;z<X;z++){let j=g[z];if(d(j)){let at=P(C),lt=i.get(j).__webglTexture;e.bindTexture(at,lt),M(at),e.unbindTexture()}}}let ye=[],Oe=[];function on(C){if(C.samples>0){if(Pe(C)===!1){let g=C.textures,z=C.width,X=C.height,j=n.COLOR_BUFFER_BIT,at=C.stencilBuffer?n.DEPTH_STENCIL_ATTACHMENT:n.DEPTH_ATTACHMENT,lt=i.get(C),Q=g.length>1;if(Q)for(let ut=0;ut<g.length;ut++)e.bindFramebuffer(n.FRAMEBUFFER,lt.__webglMultisampledFramebuffer),n.framebufferRenderbuffer(n.FRAMEBUFFER,n.COLOR_ATTACHMENT0+ut,n.RENDERBUFFER,null),e.bindFramebuffer(n.FRAMEBUFFER,lt.__webglFramebuffer),n.framebufferTexture2D(n.DRAW_FRAMEBUFFER,n.COLOR_ATTACHMENT0+ut,n.TEXTURE_2D,null,0);e.bindFramebuffer(n.READ_FRAMEBUFFER,lt.__webglMultisampledFramebuffer);let nt=C.texture.mipmaps;nt&&nt.length>0?e.bindFramebuffer(n.DRAW_FRAMEBUFFER,lt.__webglFramebuffer[0]):e.bindFramebuffer(n.DRAW_FRAMEBUFFER,lt.__webglFramebuffer);for(let ut=0;ut<g.length;ut++){if(C.resolveDepthBuffer&&(C.depthBuffer&&(j|=n.DEPTH_BUFFER_BIT),C.stencilBuffer&&C.resolveStencilBuffer&&(j|=n.STENCIL_BUFFER_BIT)),Q){n.framebufferRenderbuffer(n.READ_FRAMEBUFFER,n.COLOR_ATTACHMENT0,n.RENDERBUFFER,lt.__webglColorRenderbuffer[ut]);let Pt=i.get(g[ut]).__webglTexture;n.framebufferTexture2D(n.DRAW_FRAMEBUFFER,n.COLOR_ATTACHMENT0,n.TEXTURE_2D,Pt,0)}n.blitFramebuffer(0,0,z,X,0,0,z,X,j,n.NEAREST),l===!0&&(ye.length=0,Oe.length=0,ye.push(n.COLOR_ATTACHMENT0+ut),C.depthBuffer&&C.storeMultisampledDepthBuffer===!1&&(ye.push(at),Oe.push(at),n.invalidateFramebuffer(n.DRAW_FRAMEBUFFER,Oe)),n.invalidateFramebuffer(n.READ_FRAMEBUFFER,ye))}if(e.bindFramebuffer(n.READ_FRAMEBUFFER,null),e.bindFramebuffer(n.DRAW_FRAMEBUFFER,null),Q)for(let ut=0;ut<g.length;ut++){e.bindFramebuffer(n.FRAMEBUFFER,lt.__webglMultisampledFramebuffer),n.framebufferRenderbuffer(n.FRAMEBUFFER,n.COLOR_ATTACHMENT0+ut,n.RENDERBUFFER,lt.__webglColorRenderbuffer[ut]);let Pt=i.get(g[ut]).__webglTexture;e.bindFramebuffer(n.FRAMEBUFFER,lt.__webglFramebuffer),n.framebufferTexture2D(n.DRAW_FRAMEBUFFER,n.COLOR_ATTACHMENT0+ut,n.TEXTURE_2D,Pt,0)}e.bindFramebuffer(n.DRAW_FRAMEBUFFER,lt.__webglMultisampledFramebuffer)}else if(C.depthBuffer&&C.storeMultisampledDepthBuffer===!1&&l){let g=C.stencilBuffer?n.DEPTH_STENCIL_ATTACHMENT:n.DEPTH_ATTACHMENT;n.invalidateFramebuffer(n.DRAW_FRAMEBUFFER,[g])}}}function Me(C){return Math.min(s.maxSamples,C.samples)}function Pe(C){let g=i.get(C);return C.samples>0&&t.has("WEBGL_multisampled_render_to_texture")===!0&&g.__useRenderToTexture!==!1}function O(C){let g=o.render.frame;u.get(C)!==g&&(u.set(C,g),C.update())}function Xe(C,g){let z=C.colorSpace,X=C.format,j=C.type;return C.isCompressedTexture===!0||C.isVideoTexture===!0||z!==Jo&&z!==Li&&(Kt.getTransfer(z)===ce?(X!==Ln||j!==Mn)&&Dt("WebGLTextures: sRGB encoded textures have to use RGBAFormat and UnsignedByteType."):Bt("WebGLTextures: Unsupported texture color space:",z)),g}function ue(C){return typeof HTMLImageElement<"u"&&C instanceof HTMLImageElement?(c.width=C.naturalWidth||C.width,c.height=C.naturalHeight||C.height):typeof VideoFrame<"u"&&C instanceof VideoFrame?(c.width=C.displayWidth,c.height=C.displayHeight):(c.width=C.width,c.height=C.height),c}this.allocateTextureUnit=B,this.resetTextureUnits=I,this.getTextureUnits=R,this.setTextureUnits=N,this.setTexture2D=Y,this.setTexture2DArray=$,this.setTexture3D=J,this.setTextureCube=q,this.rebindTextures=te,this.setupRenderTarget=le,this.updateRenderTargetMipmap=Gt,this.updateMultisampleRenderTarget=on,this.setupDepthRenderbuffer=Wt,this.setupFrameBufferTexture=ct,this.useMultisampledRTT=Pe,this.isReversedDepthBuffer=function(){return e.buffers.depth.getReversed()}}function hE(n,t){function e(i,s=Li){let r,o=Kt.getTransfer(s);if(i===Mn)return n.UNSIGNED_BYTE;if(i===nu)return n.UNSIGNED_SHORT_4_4_4_4;if(i===iu)return n.UNSIGNED_SHORT_5_5_5_1;if(i===Sd)return n.UNSIGNED_INT_5_9_9_9_REV;if(i===bd)return n.UNSIGNED_INT_10F_11F_11F_REV;if(i===yd)return n.BYTE;if(i===vd)return n.SHORT;if(i===Wr)return n.UNSIGNED_SHORT;if(i===eu)return n.INT;if(i===Yn)return n.UNSIGNED_INT;if(i===Zn)return n.FLOAT;if(i===Kn)return n.HALF_FLOAT;if(i===Md)return n.ALPHA;if(i===Td)return n.RGB;if(i===Ln)return n.RGBA;if(i===ai)return n.DEPTH_COMPONENT;if(i===us)return n.DEPTH_STENCIL;if(i===wd)return n.RED;if(i===su)return n.RED_INTEGER;if(i===hs)return n.RG;if(i===ru)return n.RG_INTEGER;if(i===ou)return n.RGBA_INTEGER;if(i===Sa||i===ba||i===Ma||i===Ta)if(o===ce)if(r=t.get("WEBGL_compressed_texture_s3tc_srgb"),r!==null){if(i===Sa)return r.COMPRESSED_SRGB_S3TC_DXT1_EXT;if(i===ba)return r.COMPRESSED_SRGB_ALPHA_S3TC_DXT1_EXT;if(i===Ma)return r.COMPRESSED_SRGB_ALPHA_S3TC_DXT3_EXT;if(i===Ta)return r.COMPRESSED_SRGB_ALPHA_S3TC_DXT5_EXT}else return null;else if(r=t.get("WEBGL_compressed_texture_s3tc"),r!==null){if(i===Sa)return r.COMPRESSED_RGB_S3TC_DXT1_EXT;if(i===ba)return r.COMPRESSED_RGBA_S3TC_DXT1_EXT;if(i===Ma)return r.COMPRESSED_RGBA_S3TC_DXT3_EXT;if(i===Ta)return r.COMPRESSED_RGBA_S3TC_DXT5_EXT}else return null;if(i===au||i===cu||i===lu||i===uu)if(r=t.get("WEBGL_compressed_texture_pvrtc"),r!==null){if(i===au)return r.COMPRESSED_RGB_PVRTC_4BPPV1_IMG;if(i===cu)return r.COMPRESSED_RGB_PVRTC_2BPPV1_IMG;if(i===lu)return r.COMPRESSED_RGBA_PVRTC_4BPPV1_IMG;if(i===uu)return r.COMPRESSED_RGBA_PVRTC_2BPPV1_IMG}else return null;if(i===hu||i===fu||i===du||i===pu||i===mu||i===wa||i===gu)if(r=t.get("WEBGL_compressed_texture_etc"),r!==null){if(i===hu||i===fu)return o===ce?r.COMPRESSED_SRGB8_ETC2:r.COMPRESSED_RGB8_ETC2;if(i===du)return o===ce?r.COMPRESSED_SRGB8_ALPHA8_ETC2_EAC:r.COMPRESSED_RGBA8_ETC2_EAC;if(i===pu)return r.COMPRESSED_R11_EAC;if(i===mu)return r.COMPRESSED_SIGNED_R11_EAC;if(i===wa)return r.COMPRESSED_RG11_EAC;if(i===gu)return r.COMPRESSED_SIGNED_RG11_EAC}else return null;if(i===_u||i===xu||i===yu||i===vu||i===Su||i===bu||i===Mu||i===Tu||i===wu||i===Eu||i===Au||i===Cu||i===Ru||i===Pu)if(r=t.get("WEBGL_compressed_texture_astc"),r!==null){if(i===_u)return o===ce?r.COMPRESSED_SRGB8_ALPHA8_ASTC_4x4_KHR:r.COMPRESSED_RGBA_ASTC_4x4_KHR;if(i===xu)return o===ce?r.COMPRESSED_SRGB8_ALPHA8_ASTC_5x4_KHR:r.COMPRESSED_RGBA_ASTC_5x4_KHR;if(i===yu)return o===ce?r.COMPRESSED_SRGB8_ALPHA8_ASTC_5x5_KHR:r.COMPRESSED_RGBA_ASTC_5x5_KHR;if(i===vu)return o===ce?r.COMPRESSED_SRGB8_ALPHA8_ASTC_6x5_KHR:r.COMPRESSED_RGBA_ASTC_6x5_KHR;if(i===Su)return o===ce?r.COMPRESSED_SRGB8_ALPHA8_ASTC_6x6_KHR:r.COMPRESSED_RGBA_ASTC_6x6_KHR;if(i===bu)return o===ce?r.COMPRESSED_SRGB8_ALPHA8_ASTC_8x5_KHR:r.COMPRESSED_RGBA_ASTC_8x5_KHR;if(i===Mu)return o===ce?r.COMPRESSED_SRGB8_ALPHA8_ASTC_8x6_KHR:r.COMPRESSED_RGBA_ASTC_8x6_KHR;if(i===Tu)return o===ce?r.COMPRESSED_SRGB8_ALPHA8_ASTC_8x8_KHR:r.COMPRESSED_RGBA_ASTC_8x8_KHR;if(i===wu)return o===ce?r.COMPRESSED_SRGB8_ALPHA8_ASTC_10x5_KHR:r.COMPRESSED_RGBA_ASTC_10x5_KHR;if(i===Eu)return o===ce?r.COMPRESSED_SRGB8_ALPHA8_ASTC_10x6_KHR:r.COMPRESSED_RGBA_ASTC_10x6_KHR;if(i===Au)return o===ce?r.COMPRESSED_SRGB8_ALPHA8_ASTC_10x8_KHR:r.COMPRESSED_RGBA_ASTC_10x8_KHR;if(i===Cu)return o===ce?r.COMPRESSED_SRGB8_ALPHA8_ASTC_10x10_KHR:r.COMPRESSED_RGBA_ASTC_10x10_KHR;if(i===Ru)return o===ce?r.COMPRESSED_SRGB8_ALPHA8_ASTC_12x10_KHR:r.COMPRESSED_RGBA_ASTC_12x10_KHR;if(i===Pu)return o===ce?r.COMPRESSED_SRGB8_ALPHA8_ASTC_12x12_KHR:r.COMPRESSED_RGBA_ASTC_12x12_KHR}else return null;if(i===Iu||i===Lu||i===Nu)if(r=t.get("EXT_texture_compression_bptc"),r!==null){if(i===Iu)return o===ce?r.COMPRESSED_SRGB_ALPHA_BPTC_UNORM_EXT:r.COMPRESSED_RGBA_BPTC_UNORM_EXT;if(i===Lu)return r.COMPRESSED_RGB_BPTC_SIGNED_FLOAT_EXT;if(i===Nu)return r.COMPRESSED_RGB_BPTC_UNSIGNED_FLOAT_EXT}else return null;if(i===Uu||i===Du||i===Ea||i===Ou)if(r=t.get("EXT_texture_compression_rgtc"),r!==null){if(i===Uu)return r.COMPRESSED_RED_RGTC1_EXT;if(i===Du)return r.COMPRESSED_SIGNED_RED_RGTC1_EXT;if(i===Ea)return r.COMPRESSED_RED_GREEN_RGTC2_EXT;if(i===Ou)return r.COMPRESSED_SIGNED_RED_GREEN_RGTC2_EXT}else return null;return i===$r?n.UNSIGNED_INT_24_8:n[i]!==void 0?n[i]:null}return{convert:e}}var fE=`
void main() {

	gl_Position = vec4( position, 1.0 );

}`,dE=`
uniform sampler2DArray depthColor;
uniform float depthWidth;
uniform float depthHeight;

void main() {

	vec2 coord = vec2( gl_FragCoord.x / depthWidth, gl_FragCoord.y / depthHeight );

	if ( coord.x >= 1.0 ) {

		gl_FragDepth = texture( depthColor, vec3( coord.x - 1.0, coord.y, 1 ) ).r;

	} else {

		gl_FragDepth = texture( depthColor, vec3( coord.x, coord.y, 0 ) ).r;

	}

}`,Xd=class{constructor(){this.texture=null,this.mesh=null,this.depthNear=0,this.depthFar=0}init(t,e){if(this.texture===null){let i=new ha(t.texture);(t.depthNear!==e.depthNear||t.depthFar!==e.depthFar)&&(this.depthNear=t.depthNear,this.depthFar=t.depthFar),this.texture=i}}getMesh(t){if(this.texture!==null&&this.mesh===null){let e=t.cameras[0].viewport,i=new Sn({vertexShader:fE,fragmentShader:dE,uniforms:{depthColor:{value:this.texture},depthWidth:{value:e.z},depthHeight:{value:e.w}}});this.mesh=new In(new da(20,20),i)}return this.mesh}reset(){this.texture=null,this.mesh=null}getDepthTexture(){return this.texture}},qd=class extends ci{constructor(t,e){super();let i=this,s=null,r=1,o=null,a="local-floor",l=1,c=null,u=null,f=null,h=null,m=null,_=null,S=typeof XRWebGLBinding<"u",p=new Xd,d={},M=e.getContextAttributes(),P=null,b=null,E=[],w=[],A=new re,x=null,T=null,L=new je;L.viewport=new we;let F=new je;F.viewport=new we;let V=[L,F],I=new Jl,R=null,N=null;this.cameraAutoUpdate=!0,this.enabled=!1,this.isPresenting=!1,this.getController=function(K){let tt=E[K];return tt===void 0&&(tt=new kr,E[K]=tt),tt.getTargetRaySpace()},this.getControllerGrip=function(K){let tt=E[K];return tt===void 0&&(tt=new kr,E[K]=tt),tt.getGripSpace()},this.getHand=function(K){let tt=E[K];return tt===void 0&&(tt=new kr,E[K]=tt),tt.getHandSpace()};function B(K){let tt=w.indexOf(K.inputSource);if(tt===-1)return;let xt=E[tt];xt!==void 0&&(xt.update(K.inputSource,K.frame,c||o),xt.dispatchEvent({type:K.type,data:K.inputSource}))}function k(){s.removeEventListener("select",B),s.removeEventListener("selectstart",B),s.removeEventListener("selectend",B),s.removeEventListener("squeeze",B),s.removeEventListener("squeezestart",B),s.removeEventListener("squeezeend",B),s.removeEventListener("end",k),s.removeEventListener("inputsourceschange",Y);for(let K=0;K<E.length;K++){let tt=w[K];tt!==null&&(w[K]=null,E[K].disconnect(tt))}R=null,N=null,p.reset();for(let K in d)delete d[K];if(t.setRenderTarget(P),m=null,h=null,f=null,s=null,b=null,kt.stop(),i.isPresenting=!1,t.setPixelRatio(x),t.setSize(A.width,A.height,!1),T!==null){let K=T.camera;K.fov=T.fov,K.zoom=T.zoom,K.updateProjectionMatrix(),T=null}i.dispatchEvent({type:"sessionend"})}this.setFramebufferScaleFactor=function(K){r=K,i.isPresenting===!0&&Dt("WebXRManager: Cannot change framebuffer scale while presenting.")},this.setReferenceSpaceType=function(K){a=K,i.isPresenting===!0&&Dt("WebXRManager: Cannot change reference space type while presenting.")},this.getReferenceSpace=function(){return c||o},this.setReferenceSpace=function(K){c=K},this.getBaseLayer=function(){return h!==null?h:m},this.getBinding=function(){return f===null&&S&&(f=new XRWebGLBinding(s,e)),f},this.getFrame=function(){return _},this.getSession=function(){return s},this.setSession=async function(K){if(s=K,s!==null){if(P=t.getRenderTarget(),s.addEventListener("select",B),s.addEventListener("selectstart",B),s.addEventListener("selectend",B),s.addEventListener("squeeze",B),s.addEventListener("squeezestart",B),s.addEventListener("squeezeend",B),s.addEventListener("end",k),s.addEventListener("inputsourceschange",Y),M.xrCompatible!==!0&&await e.makeXRCompatible(),x=t.getPixelRatio(),t.getSize(A),S&&"createProjectionLayer"in XRWebGLBinding.prototype){let xt=null,Nt=null,ct=null;M.depth&&(ct=M.stencil?e.DEPTH24_STENCIL8:e.DEPTH_COMPONENT24,xt=M.stencil?us:ai,Nt=M.stencil?$r:Yn);let Ft={colorFormat:e.RGBA8,depthFormat:ct,scaleFactor:r};f=this.getBinding(),h=f.createProjectionLayer(Ft),s.updateRenderState({layers:[h]}),t.setPixelRatio(1),t.setSize(h.textureWidth,h.textureHeight,!1),b=new dn(h.textureWidth,h.textureHeight,{format:Ln,type:Mn,depthTexture:new is(h.textureWidth,h.textureHeight,Nt,void 0,void 0,void 0,void 0,void 0,void 0,xt),stencilBuffer:M.stencil,colorSpace:t.outputColorSpace,samples:M.antialias?4:0,resolveDepthBuffer:h.ignoreDepthValues===!1,resolveStencilBuffer:h.ignoreDepthValues===!1,storeMultisampledDepthBuffer:h.ignoreDepthValues===!1,storeMultisampledStencilBuffer:h.ignoreDepthValues===!1})}else{let xt={antialias:M.antialias,alpha:!0,depth:M.depth,stencil:M.stencil,framebufferScaleFactor:r};m=new XRWebGLLayer(s,e,xt),s.updateRenderState({baseLayer:m}),t.setPixelRatio(1),t.setSize(m.framebufferWidth,m.framebufferHeight,!1),b=new dn(m.framebufferWidth,m.framebufferHeight,{format:Ln,type:Mn,colorSpace:t.outputColorSpace,stencilBuffer:M.stencil,resolveDepthBuffer:m.ignoreDepthValues===!1,resolveStencilBuffer:m.ignoreDepthValues===!1,storeMultisampledDepthBuffer:m.ignoreDepthValues===!1,storeMultisampledStencilBuffer:m.ignoreDepthValues===!1})}b.isXRRenderTarget=!0,this.setFoveation(l),c=null,o=await s.requestReferenceSpace(a),kt.setContext(s),kt.start(),i.isPresenting=!0,i.dispatchEvent({type:"sessionstart"})}},this.getEnvironmentBlendMode=function(){if(s!==null)return s.environmentBlendMode},this.getDepthTexture=function(){return p.getDepthTexture()};function Y(K){for(let tt=0;tt<K.removed.length;tt++){let xt=K.removed[tt],Nt=w.indexOf(xt);Nt>=0&&(w[Nt]=null,E[Nt].disconnect(xt))}for(let tt=0;tt<K.added.length;tt++){let xt=K.added[tt],Nt=w.indexOf(xt);if(Nt===-1){for(let Ft=0;Ft<E.length;Ft++)if(Ft>=w.length){w.push(xt),Nt=Ft;break}else if(w[Ft]===null){w[Ft]=xt,Nt=Ft;break}if(Nt===-1)break}let ct=E[Nt];ct&&ct.connect(xt)}}let $=new W,J=new W;function q(K,tt,xt){$.setFromMatrixPosition(tt.matrixWorld),J.setFromMatrixPosition(xt.matrixWorld);let Nt=$.distanceTo(J),ct=tt.projectionMatrix.elements,Ft=xt.projectionMatrix.elements,Ee=ct[14]/(ct[10]-1),Wt=ct[14]/(ct[10]+1),te=(ct[9]+1)/ct[5],le=(ct[9]-1)/ct[5],Gt=(ct[8]-1)/ct[0],ye=(Ft[8]+1)/Ft[0],Oe=Ee*Gt,on=Ee*ye,Me=Nt/(-Gt+ye),Pe=Me*-Gt;if(tt.matrixWorld.decompose(K.position,K.quaternion,K.scale),K.translateX(Pe),K.translateZ(Me),K.matrixWorld.compose(K.position,K.quaternion,K.scale),K.matrixWorldInverse.copy(K.matrixWorld).invert(),ct[10]===-1)K.projectionMatrix.copy(tt.projectionMatrix),K.projectionMatrixInverse.copy(tt.projectionMatrixInverse);else{let O=Ee+Me,Xe=Wt+Me,ue=Oe-Pe,C=on+(Nt-Pe),g=te*Wt/Xe*O,z=le*Wt/Xe*O;K.projectionMatrix.makePerspective(ue,C,g,z,O,Xe),K.projectionMatrixInverse.copy(K.projectionMatrix).invert()}}function st(K,tt){tt===null?K.matrixWorld.copy(K.matrix):K.matrixWorld.multiplyMatrices(tt.matrixWorld,K.matrix),K.matrixWorldInverse.copy(K.matrixWorld).invert()}this.updateCamera=function(K){if(s===null)return;let tt=K.near,xt=K.far;p.texture!==null&&(p.depthNear>0&&(tt=p.depthNear),p.depthFar>0&&(xt=p.depthFar)),I.near=F.near=L.near=tt,I.far=F.far=L.far=xt,(R!==I.near||N!==I.far)&&(s.updateRenderState({depthNear:I.near,depthFar:I.far}),R=I.near,N=I.far),I.layers.mask=K.layers.mask|6,L.layers.mask=I.layers.mask&-5,F.layers.mask=I.layers.mask&-3;let Nt=K.parent,ct=I.cameras;st(I,Nt);for(let Ft=0;Ft<ct.length;Ft++)st(ct[Ft],Nt);ct.length===2?q(I,L,F):I.projectionMatrix.copy(L.projectionMatrix),T===null&&K.isPerspectiveCamera&&(T={camera:K,fov:K.fov,zoom:K.zoom}),rt(K,I,Nt)};function rt(K,tt,xt){xt===null?K.matrix.copy(tt.matrixWorld):(K.matrix.copy(xt.matrixWorld),K.matrix.invert(),K.matrix.multiply(tt.matrixWorld)),K.matrix.decompose(K.position,K.quaternion,K.scale),K.updateMatrixWorld(!0),K.projectionMatrix.copy(tt.projectionMatrix),K.projectionMatrixInverse.copy(tt.projectionMatrixInverse),K.isPerspectiveCamera&&(K.fov=Cl*2*Math.atan(1/K.projectionMatrix.elements[5]),K.zoom=1)}this.getCamera=function(){return I},this.getFoveation=function(){if(!(h===null&&m===null))return l},this.setFoveation=function(K){l=K,h!==null&&(h.fixedFoveation=K),m!==null&&m.fixedFoveation!==void 0&&(m.fixedFoveation=K)},this.hasDepthSensing=function(){return p.texture!==null},this.getDepthSensingMesh=function(){return p.getMesh(I)},this.getCameraTexture=function(K){return d[K]};let Mt=null;function Ct(K,tt){if(u=tt.getViewerPose(c||o),_=tt,u!==null){let xt=u.views;m!==null&&(t.setRenderTargetFramebuffer(b,m.framebuffer),t.setRenderTarget(b));let Nt=!1;xt.length!==I.cameras.length&&(I.cameras.length=0,Nt=!0);for(let Wt=0;Wt<xt.length;Wt++){let te=xt[Wt],le=null;if(m!==null)le=m.getViewport(te);else{let ye=f.getViewSubImage(h,te);le=ye.viewport,Wt===0&&(t.setRenderTargetTextures(b,ye.colorTexture,ye.depthStencilTexture),t.setRenderTarget(b))}let Gt=V[Wt];Gt===void 0&&(Gt=new je,Gt.layers.enable(Wt),Gt.viewport=new we,V[Wt]=Gt),Gt.matrix.fromArray(te.transform.matrix),Gt.matrix.decompose(Gt.position,Gt.quaternion,Gt.scale),Gt.projectionMatrix.fromArray(te.projectionMatrix),Gt.projectionMatrixInverse.copy(Gt.projectionMatrix).invert(),Gt.viewport.set(le.x,le.y,le.width,le.height),Wt===0&&(I.matrix.copy(Gt.matrix),I.matrix.decompose(I.position,I.quaternion,I.scale)),Nt===!0&&I.cameras.push(Gt)}let ct=s.enabledFeatures;if(ct&&ct.includes("depth-sensing")&&s.depthUsage=="gpu-optimized"&&S){f=i.getBinding();let Wt=f.getDepthInformation(xt[0]);Wt&&Wt.isValid&&Wt.texture&&p.init(Wt,s.renderState)}if(ct&&ct.includes("camera-access")&&S){t.state.unbindTexture(),f=i.getBinding();for(let Wt=0;Wt<xt.length;Wt++){let te=xt[Wt].camera;if(te){let le=d[te];le||(le=new ha,d[te]=le);let Gt=f.getCameraImage(te);le.sourceTexture=Gt}}}}for(let xt=0;xt<E.length;xt++){let Nt=w[xt],ct=E[xt];Nt!==null&&ct!==void 0&&ct.update(Nt,tt,c||o)}Mt&&Mt(K,tt),tt.detectedPlanes&&i.dispatchEvent({type:"planesdetected",data:tt}),_=null}let kt=new O_;kt.setAnimationLoop(Ct),this.setAnimationLoop=function(K){Mt=K},this.dispose=function(){}}},pE=new Ce,G_=new Vt;G_.set(-1,0,0,0,1,0,0,0,1);function mE(n,t){function e(p,d){p.matrixAutoUpdate===!0&&p.updateMatrix(),d.value.copy(p.matrix)}function i(p,d){d.color.getRGB(p.fogColor.value,Rd(n)),d.isFog?(p.fogNear.value=d.near,p.fogFar.value=d.far):d.isFogExp2&&(p.fogDensity.value=d.density)}function s(p,d,M,P,b){d.isNodeMaterial?d.uniformsNeedUpdate=!1:d.isMeshBasicMaterial?r(p,d):d.isMeshLambertMaterial?(r(p,d),d.envMap&&(p.envMapIntensity.value=d.envMapIntensity)):d.isMeshToonMaterial?(r(p,d),f(p,d)):d.isMeshPhongMaterial?(r(p,d),u(p,d),d.envMap&&(p.envMapIntensity.value=d.envMapIntensity)):d.isMeshStandardMaterial?(r(p,d),h(p,d),d.isMeshPhysicalMaterial&&m(p,d,b)):d.isMeshMatcapMaterial?(r(p,d),_(p,d)):d.isMeshDepthMaterial?r(p,d):d.isMeshDistanceMaterial?(r(p,d),S(p,d)):d.isMeshNormalMaterial?r(p,d):d.isLineBasicMaterial?(o(p,d),d.isLineDashedMaterial&&a(p,d)):d.isPointsMaterial?l(p,d,M,P):d.isSpriteMaterial?c(p,d):d.isShadowMaterial?(p.color.value.copy(d.color),p.opacity.value=d.opacity):d.isShaderMaterial&&(d.uniformsNeedUpdate=!1)}function r(p,d){p.opacity.value=d.opacity,d.color&&p.diffuse.value.copy(d.color),d.emissive&&p.emissive.value.copy(d.emissive).multiplyScalar(d.emissiveIntensity),d.map&&(p.map.value=d.map,e(d.map,p.mapTransform)),d.alphaMap&&(p.alphaMap.value=d.alphaMap,e(d.alphaMap,p.alphaMapTransform)),d.bumpMap&&(p.bumpMap.value=d.bumpMap,e(d.bumpMap,p.bumpMapTransform),p.bumpScale.value=d.bumpScale,d.side===rn&&(p.bumpScale.value*=-1)),d.normalMap&&(p.normalMap.value=d.normalMap,e(d.normalMap,p.normalMapTransform),p.normalScale.value.copy(d.normalScale),d.side===rn&&p.normalScale.value.negate()),d.displacementMap&&(p.displacementMap.value=d.displacementMap,e(d.displacementMap,p.displacementMapTransform),p.displacementScale.value=d.displacementScale,p.displacementBias.value=d.displacementBias),d.emissiveMap&&(p.emissiveMap.value=d.emissiveMap,e(d.emissiveMap,p.emissiveMapTransform)),d.specularMap&&(p.specularMap.value=d.specularMap,e(d.specularMap,p.specularMapTransform)),d.alphaTest>0&&(p.alphaTest.value=d.alphaTest);let M=t.get(d),P=M.envMap,b=M.envMapRotation;P&&(p.envMap.value=P,p.envMapRotation.value.setFromMatrix4(pE.makeRotationFromEuler(b)).transpose(),P.isCubeTexture&&P.isRenderTargetTexture===!1&&p.envMapRotation.value.premultiply(G_),p.reflectivity.value=d.reflectivity,p.ior.value=d.ior,p.refractionRatio.value=d.refractionRatio),d.lightMap&&(p.lightMap.value=d.lightMap,p.lightMapIntensity.value=d.lightMapIntensity,e(d.lightMap,p.lightMapTransform)),d.aoMap&&(p.aoMap.value=d.aoMap,p.aoMapIntensity.value=d.aoMapIntensity,e(d.aoMap,p.aoMapTransform))}function o(p,d){p.diffuse.value.copy(d.color),p.opacity.value=d.opacity,d.map&&(p.map.value=d.map,e(d.map,p.mapTransform))}function a(p,d){p.dashSize.value=d.dashSize,p.totalSize.value=d.dashSize+d.gapSize,p.scale.value=d.scale}function l(p,d,M,P){p.diffuse.value.copy(d.color),p.opacity.value=d.opacity,p.size.value=d.size*M,p.scale.value=P*.5,d.map&&(p.map.value=d.map,e(d.map,p.uvTransform)),d.alphaMap&&(p.alphaMap.value=d.alphaMap,e(d.alphaMap,p.alphaMapTransform)),d.alphaTest>0&&(p.alphaTest.value=d.alphaTest)}function c(p,d){p.diffuse.value.copy(d.color),p.opacity.value=d.opacity,p.rotation.value=d.rotation,d.map&&(p.map.value=d.map,e(d.map,p.mapTransform)),d.alphaMap&&(p.alphaMap.value=d.alphaMap,e(d.alphaMap,p.alphaMapTransform)),d.alphaTest>0&&(p.alphaTest.value=d.alphaTest)}function u(p,d){p.specular.value.copy(d.specular),p.shininess.value=Math.max(d.shininess,1e-4)}function f(p,d){d.gradientMap&&(p.gradientMap.value=d.gradientMap)}function h(p,d){p.metalness.value=d.metalness,d.metalnessMap&&(p.metalnessMap.value=d.metalnessMap,e(d.metalnessMap,p.metalnessMapTransform)),p.roughness.value=d.roughness,d.roughnessMap&&(p.roughnessMap.value=d.roughnessMap,e(d.roughnessMap,p.roughnessMapTransform)),d.envMap&&(p.envMapIntensity.value=d.envMapIntensity)}function m(p,d,M){p.ior.value=d.ior,d.sheen>0&&(p.sheenColor.value.copy(d.sheenColor).multiplyScalar(d.sheen),p.sheenRoughness.value=d.sheenRoughness,d.sheenColorMap&&(p.sheenColorMap.value=d.sheenColorMap,e(d.sheenColorMap,p.sheenColorMapTransform)),d.sheenRoughnessMap&&(p.sheenRoughnessMap.value=d.sheenRoughnessMap,e(d.sheenRoughnessMap,p.sheenRoughnessMapTransform))),d.clearcoat>0&&(p.clearcoat.value=d.clearcoat,p.clearcoatRoughness.value=d.clearcoatRoughness,d.clearcoatMap&&(p.clearcoatMap.value=d.clearcoatMap,e(d.clearcoatMap,p.clearcoatMapTransform)),d.clearcoatRoughnessMap&&(p.clearcoatRoughnessMap.value=d.clearcoatRoughnessMap,e(d.clearcoatRoughnessMap,p.clearcoatRoughnessMapTransform)),d.clearcoatNormalMap&&(p.clearcoatNormalMap.value=d.clearcoatNormalMap,e(d.clearcoatNormalMap,p.clearcoatNormalMapTransform),p.clearcoatNormalScale.value.copy(d.clearcoatNormalScale),d.side===rn&&p.clearcoatNormalScale.value.negate())),d.dispersion>0&&(p.dispersion.value=d.dispersion),d.retroreflectivity>0&&(p.retroreflectivity.value=d.retroreflectivity),d.iridescence>0&&(p.iridescence.value=d.iridescence,p.iridescenceIOR.value=d.iridescenceIOR,p.iridescenceThicknessMinimum.value=d.iridescenceThicknessRange[0],p.iridescenceThicknessMaximum.value=d.iridescenceThicknessRange[1],d.iridescenceMap&&(p.iridescenceMap.value=d.iridescenceMap,e(d.iridescenceMap,p.iridescenceMapTransform)),d.iridescenceThicknessMap&&(p.iridescenceThicknessMap.value=d.iridescenceThicknessMap,e(d.iridescenceThicknessMap,p.iridescenceThicknessMapTransform))),d.transmission>0&&(p.transmission.value=d.transmission,p.transmissionSamplerMap.value=M.texture,p.transmissionSamplerSize.value.set(M.width,M.height),d.transmissionMap&&(p.transmissionMap.value=d.transmissionMap,e(d.transmissionMap,p.transmissionMapTransform)),p.thickness.value=d.thickness,d.thicknessMap&&(p.thicknessMap.value=d.thicknessMap,e(d.thicknessMap,p.thicknessMapTransform)),p.attenuationDistance.value=d.attenuationDistance,p.attenuationColor.value.copy(d.attenuationColor)),d.anisotropy>0&&(p.anisotropyVector.value.set(d.anisotropy*Math.cos(d.anisotropyRotation),d.anisotropy*Math.sin(d.anisotropyRotation)),d.anisotropyMap&&(p.anisotropyMap.value=d.anisotropyMap,e(d.anisotropyMap,p.anisotropyMapTransform))),p.specularIntensity.value=d.specularIntensity,p.specularColor.value.copy(d.specularColor),d.specularColorMap&&(p.specularColorMap.value=d.specularColorMap,e(d.specularColorMap,p.specularColorMapTransform)),d.specularIntensityMap&&(p.specularIntensityMap.value=d.specularIntensityMap,e(d.specularIntensityMap,p.specularIntensityMapTransform))}function _(p,d){d.matcap&&(p.matcap.value=d.matcap)}function S(p,d){let M=t.get(d).light;p.referencePosition.value.setFromMatrixPosition(M.matrixWorld),p.nearDistance.value=M.shadow.camera.near,p.farDistance.value=M.shadow.camera.far}return{refreshFogUniforms:i,refreshMaterialUniforms:s}}function gE(n,t,e,i){let s={},r={},o=[],a=n.getParameter(n.MAX_UNIFORM_BUFFER_BINDINGS);function l(b,E){let w=E.program;i.uniformBlockBinding(b,w)}function c(b,E){let w=s[b.id];w===void 0&&(p(b),w=u(b),s[b.id]=w,b.addEventListener("dispose",M));let A=E.program;i.updateUBOMapping(b,A);let x=t.render.frame;r[b.id]!==x&&(h(b),r[b.id]=x)}function u(b){let E=f();b.__bindingPointIndex=E;let w=n.createBuffer(),A=b.__size,x=b.usage;return n.bindBuffer(n.UNIFORM_BUFFER,w),n.bufferData(n.UNIFORM_BUFFER,A,x),n.bindBuffer(n.UNIFORM_BUFFER,null),n.bindBufferBase(n.UNIFORM_BUFFER,E,w),w}function f(){for(let b=0;b<a;b++)if(o.indexOf(b)===-1)return o.push(b),b;return Bt("WebGLRenderer: Maximum number of simultaneously usable uniforms groups reached."),0}function h(b){let E=s[b.id],w=b.uniforms,A=b.__cache;n.bindBuffer(n.UNIFORM_BUFFER,E);for(let x=0,T=w.length;x<T;x++){let L=w[x];if(Array.isArray(L))for(let F=0,V=L.length;F<V;F++)m(L[F],x,F,A);else m(L,x,0,A)}n.bindBuffer(n.UNIFORM_BUFFER,null)}function m(b,E,w,A){if(S(b,E,w,A)===!0){let x=b.__offset,T=b.value;if(Array.isArray(T)){let L=0;for(let F=0;F<T.length;F++){let V=T[F],I=d(V);_(V,b.__data,L),typeof V!="number"&&typeof V!="boolean"&&!V.isMatrix3&&!ArrayBuffer.isView(V)&&(L+=I.storage/Float32Array.BYTES_PER_ELEMENT)}}else _(T,b.__data,0);n.bufferSubData(n.UNIFORM_BUFFER,x,b.__data)}}function _(b,E,w){typeof b=="number"||typeof b=="boolean"?E[0]=b:b.isMatrix3?(E[0]=b.elements[0],E[1]=b.elements[1],E[2]=b.elements[2],E[3]=0,E[4]=b.elements[3],E[5]=b.elements[4],E[6]=b.elements[5],E[7]=0,E[8]=b.elements[6],E[9]=b.elements[7],E[10]=b.elements[8],E[11]=0):ArrayBuffer.isView(b)?E.set(new b.constructor(b.buffer,b.byteOffset,E.length)):b.toArray(E,w)}function S(b,E,w,A){let x=b.value,T=E+"_"+w;if(A[T]===void 0)return typeof x=="number"||typeof x=="boolean"?A[T]=x:ArrayBuffer.isView(x)?A[T]=x.slice():A[T]=x.clone(),!0;{let L=A[T];if(typeof x=="number"||typeof x=="boolean"){if(L!==x)return A[T]=x,!0}else{if(ArrayBuffer.isView(x))return!0;if(L.equals(x)===!1)return L.copy(x),!0}}return!1}function p(b){let E=b.uniforms,w=0,A=16;for(let T=0,L=E.length;T<L;T++){let F=Array.isArray(E[T])?E[T]:[E[T]];for(let V=0,I=F.length;V<I;V++){let R=F[V],N=Array.isArray(R.value)?R.value:[R.value];for(let B=0,k=N.length;B<k;B++){let Y=N[B],$=d(Y),J=w%A,q=J%$.boundary,st=J+q;w+=q,st!==0&&A-st<$.storage&&(w+=A-st),R.__data=new Float32Array($.storage/Float32Array.BYTES_PER_ELEMENT),R.__offset=w,w+=$.storage}}}let x=w%A;return x>0&&(w+=A-x),b.__size=w,b.__cache={},this}function d(b){let E={boundary:0,storage:0};return typeof b=="number"||typeof b=="boolean"?(E.boundary=4,E.storage=4):b.isVector2?(E.boundary=8,E.storage=8):b.isVector3||b.isColor?(E.boundary=16,E.storage=12):b.isVector4?(E.boundary=16,E.storage=16):b.isMatrix3?(E.boundary=48,E.storage=48):b.isMatrix4?(E.boundary=64,E.storage=64):b.isTexture?Dt("WebGLRenderer: Texture samplers can not be part of an uniforms group."):ArrayBuffer.isView(b)?(E.boundary=16,E.storage=b.byteLength):Dt("WebGLRenderer: Unsupported uniform value type.",b),E}function M(b){let E=b.target;E.removeEventListener("dispose",M);let w=o.indexOf(E.__bindingPointIndex);o.splice(w,1),n.deleteBuffer(s[E.id]),delete s[E.id],delete r[E.id]}function P(){for(let b in s)n.deleteBuffer(s[b]);o=[],s={},r={}}return{bind:l,update:c,dispose:P}}var _E=new Uint16Array([12469,15057,12620,14925,13266,14620,13807,14376,14323,13990,14545,13625,14713,13328,14840,12882,14931,12528,14996,12233,15039,11829,15066,11525,15080,11295,15085,10976,15082,10705,15073,10495,13880,14564,13898,14542,13977,14430,14158,14124,14393,13732,14556,13410,14702,12996,14814,12596,14891,12291,14937,11834,14957,11489,14958,11194,14943,10803,14921,10506,14893,10278,14858,9960,14484,14039,14487,14025,14499,13941,14524,13740,14574,13468,14654,13106,14743,12678,14818,12344,14867,11893,14889,11509,14893,11180,14881,10751,14852,10428,14812,10128,14765,9754,14712,9466,14764,13480,14764,13475,14766,13440,14766,13347,14769,13070,14786,12713,14816,12387,14844,11957,14860,11549,14868,11215,14855,10751,14825,10403,14782,10044,14729,9651,14666,9352,14599,9029,14967,12835,14966,12831,14963,12804,14954,12723,14936,12564,14917,12347,14900,11958,14886,11569,14878,11247,14859,10765,14828,10401,14784,10011,14727,9600,14660,9289,14586,8893,14508,8533,15111,12234,15110,12234,15104,12216,15092,12156,15067,12010,15028,11776,14981,11500,14942,11205,14902,10752,14861,10393,14812,9991,14752,9570,14682,9252,14603,8808,14519,8445,14431,8145,15209,11449,15208,11451,15202,11451,15190,11438,15163,11384,15117,11274,15055,10979,14994,10648,14932,10343,14871,9936,14803,9532,14729,9218,14645,8742,14556,8381,14461,8020,14365,7603,15273,10603,15272,10607,15267,10619,15256,10631,15231,10614,15182,10535,15118,10389,15042,10167,14963,9787,14883,9447,14800,9115,14710,8665,14615,8318,14514,7911,14411,7507,14279,7198,15314,9675,15313,9683,15309,9712,15298,9759,15277,9797,15229,9773,15166,9668,15084,9487,14995,9274,14898,8910,14800,8539,14697,8234,14590,7790,14479,7409,14367,7067,14178,6621,15337,8619,15337,8631,15333,8677,15325,8769,15305,8871,15264,8940,15202,8909,15119,8775,15022,8565,14916,8328,14804,8009,14688,7614,14569,7287,14448,6888,14321,6483,14088,6171,15350,7402,15350,7419,15347,7480,15340,7613,15322,7804,15287,7973,15229,8057,15148,8012,15046,7846,14933,7611,14810,7357,14682,7069,14552,6656,14421,6316,14251,5948,14007,5528,15356,5942,15356,5977,15353,6119,15348,6294,15332,6551,15302,6824,15249,7044,15171,7122,15070,7050,14949,6861,14818,6611,14679,6349,14538,6067,14398,5651,14189,5311,13935,4958,15359,4123,15359,4153,15356,4296,15353,4646,15338,5160,15311,5508,15263,5829,15188,6042,15088,6094,14966,6001,14826,5796,14678,5543,14527,5287,14377,4985,14133,4586,13869,4257,15360,1563,15360,1642,15358,2076,15354,2636,15341,3350,15317,4019,15273,4429,15203,4732,15105,4911,14981,4932,14836,4818,14679,4621,14517,4386,14359,4156,14083,3795,13808,3437,15360,122,15360,137,15358,285,15355,636,15344,1274,15322,2177,15281,2765,15215,3223,15120,3451,14995,3569,14846,3567,14681,3466,14511,3305,14344,3121,14037,2800,13753,2467,15360,0,15360,1,15359,21,15355,89,15346,253,15325,479,15287,796,15225,1148,15133,1492,15008,1749,14856,1882,14685,1886,14506,1783,14324,1608,13996,1398,13702,1183]),fi=null;function xE(){return fi===null&&(fi=new Ll(_E,16,16,hs,Kn),fi.name="DFG_LUT",fi.minFilter=$e,fi.magFilter=$e,fi.wrapS=oi,fi.wrapT=oi,fi.generateMipmaps=!1,fi.needsUpdate=!0),fi}var Hu=class{constructor(t={}){let{canvas:e=a_(),context:i=null,depth:s=!0,stencil:r=!1,alpha:o=!1,antialias:a=!1,premultipliedAlpha:l=!0,preserveDrawingBuffer:c=!1,powerPreference:u="default",failIfMajorPerformanceCaveat:f=!1,reversedDepthBuffer:h=!1,outputBufferType:m=Mn}=t;this.isWebGLRenderer=!0;let _;if(i!==null){if(typeof WebGLRenderingContext<"u"&&i instanceof WebGLRenderingContext)throw new Error("THREE.WebGLRenderer: WebGL 1 is not supported since r163.");_=i.getContextAttributes().alpha}else _=o;let S=m,p=new Set([ou,ru,su]),d=new Set([Mn,Yn,Wr,$r,nu,iu]),M=new Uint32Array(4),P=new Int32Array(4),b=new W,E=null,w=null,A=[],x=[],T=null;this.domElement=e,this.debug={checkShaderErrors:!0,diagnostics:{keywords:!1},onShaderError:null},this.autoClear=!0,this.autoClearColor=!0,this.autoClearDepth=!0,this.autoClearStencil=!0,this.sortObjects=!0,this.clippingPlanes=[],this.localClippingEnabled=!1,this.toneMapping=qn,this.toneMappingExposure=1,this.transmissionResolutionScale=1;let L=this,F=!1,V=null,I=null,R=null,N=null;this._outputColorSpace=xn;let B=0,k=0,Y=null,$=-1,J=null,q=new we,st=new we,rt=null,Mt=new ne(0),Ct=0,kt=e.width,K=e.height,tt=1,xt=null,Nt=null,ct=new we(0,0,kt,K),Ft=new we(0,0,kt,K),Ee=!1,Wt=new ca,te=!1,le=!1,Gt=new Ce,ye=new W,Oe=new we,on={background:null,fog:null,environment:null,overrideMaterial:null,isScene:!0},Me=!1;function Pe(){return Y===null?tt:1}let O=i;function Xe(v,U){return e.getContext(v,U)}let ue,C,g,z,X,j,at,lt,Q,nt,ut,Pt,pt,ht,It,Ut,Ht,D,ft,et,dt,yt,it;try{let v={alpha:!0,depth:s,stencil:r,antialias:a,premultipliedAlpha:l,preserveDrawingBuffer:c,powerPreference:u,failIfMajorPerformanceCaveat:f};if("setAttribute"in e&&e.setAttribute("data-engine",`three.js r${"186"}`),e.addEventListener("webglcontextlost",pe,!1),e.addEventListener("webglcontextrestored",oe,!1),e.addEventListener("webglcontextcreationerror",Un,!1),O===null){let U="webgl2";if(O=Xe(U,v),O===null)throw Xe(U)?new Error("THREE.WebGLRenderer: Error creating WebGL context with your selected attributes."):new Error("THREE.WebGLRenderer: Error creating WebGL context.")}Lt()}catch(v){throw e.removeEventListener("webglcontextlost",pe,!1),e.removeEventListener("webglcontextrestored",oe,!1),e.removeEventListener("webglcontextcreationerror",Un,!1),Bt("WebGLRenderer: "+v.message),v}function Lt(){ue=new wT(O),ue.init(),dt=new hE(O,ue),C=new mT(O,ue,t,dt),g=new lE(O,ue),C.reversedDepthBuffer&&h&&g.buffers.depth.setReversed(!0),I=O.createFramebuffer(),R=O.createFramebuffer(),N=O.createFramebuffer(),z=new CT(O),X=new Zw,j=new uE(O,ue,g,X,C,dt,z),at=new TT(L),lt=new PS(O),yt=new dT(O,lt),Q=new ET(O,lt,z,yt),nt=new PT(O,Q,lt,yt,z),D=new RT(O,C,j),It=new gT(X),ut=new Yw(L,at,ue,C,yt,It),Pt=new mE(L,X),pt=new Jw,ht=new iE(ue),Ht=new fT(L,at,g,nt,_,l),Ut=new cE(L,nt,C),it=new gE(O,z,C,g),ft=new pT(O,ue,z),et=new AT(O,ue,z),z.programs=ut.programs,L.capabilities=C,L.extensions=ue,L.properties=X,L.renderLists=pt,L.shadowMap=Ut,L.state=g,L.info=z}S!==Mn&&(T=new LT(S,e.width,e.height,a,s,r));let Et=new qd(L,O);this.xr=Et,this.getContext=function(){return O},this.getContextAttributes=function(){return O.getContextAttributes()},this.forceContextLoss=function(){let v=ue.get("WEBGL_lose_context");v&&v.loseContext()},this.forceContextRestore=function(){let v=ue.get("WEBGL_lose_context");v&&v.restoreContext()},this.getPixelRatio=function(){return tt},this.setPixelRatio=function(v){v!==void 0&&(tt=v,this.setSize(kt,K,!1))},this.getSize=function(v){return v.set(kt,K)},this.setSize=function(v,U,Z=!0){if(Et.isPresenting){Dt("WebGLRenderer: Can't change size while VR device is presenting.");return}kt=v,K=U,e.width=Math.floor(v*tt),e.height=Math.floor(U*tt),Z===!0&&(e.style.width=v+"px",e.style.height=U+"px"),T!==null&&T.setSize(e.width,e.height),this.setViewport(0,0,v,U)},this.getDrawingBufferSize=function(v){return v.set(kt*tt,K*tt).floor()},this.setDrawingBufferSize=function(v,U,Z){kt=v,K=U,tt=Z,e.width=Math.floor(v*Z),e.height=Math.floor(U*Z),this.setViewport(0,0,v,U)},this.setEffects=function(v){if(S===Mn){Bt("WebGLRenderer: setEffects() requires outputBufferType set to HalfFloatType or FloatType.");return}if(v){for(let U=0;U<v.length;U++)if(v[U].isOutputPass===!0){Dt("WebGLRenderer: OutputPass is not needed in setEffects(). Tone mapping and color space conversion are applied automatically.");break}}T.setEffects(v||[])},this.getCurrentViewport=function(v){return v.copy(q)},this.getViewport=function(v){return v.copy(ct)},this.setViewport=function(v,U,Z,G){v.isVector4?ct.set(v.x,v.y,v.z,v.w):ct.set(v,U,Z,G),g.viewport(q.copy(ct).multiplyScalar(tt).round())},this.getScissor=function(v){return v.copy(Ft)},this.setScissor=function(v,U,Z,G){v.isVector4?Ft.set(v.x,v.y,v.z,v.w):Ft.set(v,U,Z,G),g.scissor(st.copy(Ft).multiplyScalar(tt).round())},this.getScissorTest=function(){return Ee},this.setScissorTest=function(v){g.setScissorTest(Ee=v)},this.setOpaqueSort=function(v){xt=v},this.setTransparentSort=function(v){Nt=v},this.getClearColor=function(v){return v.copy(Ht.getClearColor())},this.setClearColor=function(){Ht.setClearColor(...arguments)},this.getClearAlpha=function(){return Ht.getClearAlpha()},this.setClearAlpha=function(){Ht.setClearAlpha(...arguments)},this.clear=function(v=!0,U=!0,Z=!0){let G=0;if(v){let H=!1;if(Y!==null){let _t=Y.texture.format;H=p.has(_t)}if(H){let _t=Y.texture.type,St=d.has(_t),gt=Ht.getClearColor(),Tt=Ht.getClearAlpha(),Rt=gt.r,$t=gt.g,Yt=gt.b;St?(M[0]=Rt,M[1]=$t,M[2]=Yt,M[3]=Tt,O.clearBufferuiv(O.COLOR,0,M)):(P[0]=Rt,P[1]=$t,P[2]=Yt,P[3]=Tt,O.clearBufferiv(O.COLOR,0,P))}else G|=O.COLOR_BUFFER_BIT}U&&(G|=O.DEPTH_BUFFER_BIT,this.state.buffers.depth.setMask(!0)),Z&&(G|=O.STENCIL_BUFFER_BIT,this.state.buffers.stencil.setMask(4294967295)),G!==0&&O.clear(G)},this.clearColor=function(){this.clear(!0,!1,!1)},this.clearDepth=function(){this.clear(!1,!0,!1)},this.clearStencil=function(){this.clear(!1,!1,!0)},this.setNodesHandler=function(v){v.setRenderer(this),V=v},this.dispose=function(){e.removeEventListener("webglcontextlost",pe,!1),e.removeEventListener("webglcontextrestored",oe,!1),e.removeEventListener("webglcontextcreationerror",Un,!1),Ht.dispose(),pt.dispose(),ht.dispose(),X.dispose(),at.dispose(),nt.dispose(),yt.dispose(),it.dispose(),ut.dispose(),Et.dispose(),Et.removeEventListener("sessionstart",sp),Et.removeEventListener("sessionend",rp),gs.stop()};function pe(v){v.preventDefault(),Cd("WebGLRenderer: Context Lost."),F=!0}function oe(){Cd("WebGLRenderer: Context Restored."),F=!1;let v=z.autoReset,U=Ut.enabled,Z=Ut.autoUpdate,G=Ut.needsUpdate,H=Ut.type;Lt(),z.autoReset=v,Ut.enabled=U,Ut.autoUpdate=Z,Ut.needsUpdate=G,Ut.type=H}function Un(v){Bt("WebGLRenderer: A WebGL context could not be created. Reason: ",v.statusMessage)}function Jn(v){let U=v.target;U.removeEventListener("dispose",Jn),ix(U)}function ix(v){sx(v),X.remove(v)}function sx(v){let U=X.get(v).programs;U!==void 0&&(U.forEach(function(Z){ut.releaseProgram(Z)}),v.isShaderMaterial&&ut.releaseShaderCache(v))}this.renderBufferDirect=function(v,U,Z,G,H,_t){U===null&&(U=on);let St=H.isMesh&&H.matrixWorld.determinantAffine()<0,gt=ax(v,U,Z,G,H);g.setMaterial(G,St);let Tt=Z.index,Rt=1;if(G.wireframe===!0){if(Tt=Q.getWireframeAttribute(Z),Tt===void 0)return;Rt=2}let $t=Z.drawRange,Yt=Z.attributes.position,wt=$t.start*Rt,ae=($t.start+$t.count)*Rt;_t!==null&&(wt=Math.max(wt,_t.start*Rt),ae=Math.min(ae,(_t.start+_t.count)*Rt)),Tt!==null?(wt=Math.max(wt,0),ae=Math.min(ae,Tt.count)):Yt!=null&&(wt=Math.max(wt,0),ae=Math.min(ae,Yt.count));let Ie=ae-wt;if(Ie<0||Ie===1/0)return;yt.setup(H,G,gt,Z,Tt);let _e,de=ft;if(Tt!==null&&(_e=lt.get(Tt),de=et,de.setIndex(_e)),H.isMesh)G.wireframe===!0?(g.setLineWidth(G.wireframeLinewidth*Pe()),de.setMode(O.LINES)):de.setMode(O.TRIANGLES);else if(H.isLine){let qe=G.linewidth;qe===void 0&&(qe=1),g.setLineWidth(qe*Pe()),H.isLineSegments?de.setMode(O.LINES):H.isLineLoop?de.setMode(O.LINE_LOOP):de.setMode(O.LINE_STRIP)}else H.isPoints?de.setMode(O.POINTS):H.isSprite&&de.setMode(O.TRIANGLES);if(H.isBatchedMesh)if(ue.get("WEBGL_multi_draw"))de.renderMultiDraw(H._multiDrawStarts,H._multiDrawCounts,H._multiDrawCount);else{let qe=H._multiDrawStarts,vt=H._multiDrawCounts,tn=H._multiDrawCount,ie=Tt?lt.get(Tt).bytesPerElement:1,Tn=X.get(G).currentProgram.getUniforms();for(let jn=0;jn<tn;jn++)Tn.setValue(O,"_gl_DrawID",jn),de.render(qe[jn]/ie,vt[jn])}else if(H.isInstancedMesh)de.renderInstances(wt,Ie,H.count);else if(Z.isInstancedBufferGeometry){let qe=Z._maxInstanceCount!==void 0?Z._maxInstanceCount:1/0,vt=Math.min(Z.instanceCount,qe);de.renderInstances(wt,Ie,vt)}else de.render(wt,Ie)};function ip(v,U,Z,G){V!==null&&v.isNodeMaterial&&V.setObject(G,v),te===!0&&It.setState(v,Z,!1),v.transparent===!0&&v.side===ui&&v.forceSinglePass===!1?(v.side=rn,v.needsUpdate=!0,ka(v,U,G),v.side=as,v.needsUpdate=!0,ka(v,U,G),v.side=ui):ka(v,U,G)}this.compile=function(v,U,Z=null){Z===null&&(Z=v),V!==null&&V.renderStart(v,U,Z),w=ht.get(Z),w.init(U),x.push(w),Z.traverseVisible(function(H){H.isLight&&H.layers.test(U.layers)&&(w.pushLight(H),H.castShadow&&w.pushShadow(H))}),v!==Z&&v.traverseVisible(function(H){H.isLight&&H.layers.test(U.layers)&&(w.pushLight(H),H.castShadow&&w.pushShadow(H))}),w.setupLights(),V!==null&&V.updateLights(w.state.lightsArray),le=this.localClippingEnabled,te=It.init(this.clippingPlanes,le),te===!0&&It.setGlobalState(this.clippingPlanes,U),V!==null&&Ut.render(w.state.shadowsArray,Z,U);let G=new Set;return v.traverse(function(H){if(!(H.isMesh||H.isPoints||H.isLine||H.isSprite))return;let _t=H.material;if(_t)if(Array.isArray(_t))for(let St=0;St<_t.length;St++){let gt=_t[St];ip(gt,Z,U,H),G.add(gt)}else ip(_t,Z,U,H),G.add(_t)}),w=x.pop(),V!==null&&V.renderEnd(),G},this.compileAsync=function(v,U,Z=null){let G=this.compile(v,U,Z);return new Promise(H=>{function _t(){if(G.forEach(function(St){let Tt=X.get(St).currentProgram;(Tt===void 0||Tt.isReady())&&G.delete(St)}),G.size===0){H(v);return}setTimeout(_t,10)}ue.get("KHR_parallel_shader_compile")!==null?_t():setTimeout(_t,10)})};let th=null;function rx(v){th&&th(v)}function sp(){gs.stop()}function rp(){gs.start()}let gs=new O_;gs.setAnimationLoop(rx),typeof self<"u"&&gs.setContext(self),this.setAnimationLoop=function(v){th=v,Et.setAnimationLoop(v),v===null?gs.stop():gs.start()},Et.addEventListener("sessionstart",sp),Et.addEventListener("sessionend",rp),this.render=function(v,U){if(U!==void 0&&U.isCamera!==!0){Bt("WebGLRenderer.render: camera is not an instance of THREE.Camera.");return}if(F===!0)return;V!==null&&V.renderStart(v,U);let Z=Et.enabled===!0&&Et.isPresenting===!0,G=T!==null&&(Y===null||Z)&&T.begin(L,Y);if(v.matrixWorldAutoUpdate===!0&&v.updateMatrixWorld(),U.parent===null&&U.matrixWorldAutoUpdate===!0&&U.updateMatrixWorld(),Et.enabled===!0&&Et.isPresenting===!0&&(T===null||T.isCompositing()===!1)&&(Et.cameraAutoUpdate===!0&&Et.updateCamera(U),U=Et.getCamera()),v.isScene===!0&&v.onBeforeRender(L,v,U,Y),w=ht.get(v,x.length),w.init(U),w.state.textureUnits=j.getTextureUnits(),x.push(w),Gt.multiplyMatrices(U.projectionMatrix,U.matrixWorldInverse),Wt.setFromProjectionMatrix(Gt,Xn,U.reversedDepth),le=this.localClippingEnabled,te=It.init(this.clippingPlanes,le),E=pt.get(v,A.length),E.init(),A.push(E),Et.enabled===!0&&Et.isPresenting===!0){let St=L.xr.getDepthSensingMesh();St!==null&&eh(St,U,-1/0,L.sortObjects)}eh(v,U,0,L.sortObjects),E.finish(),V!==null&&V.updateLights(w.state.lightsArray),L.sortObjects===!0&&E.sort(xt,Nt),Me=Et.enabled===!1||Et.isPresenting===!1||Et.hasDepthSensing()===!1,Me&&Ht.addToRenderList(E,v),this.info.render.frame++,this.info.autoReset===!0&&this.info.reset(),te===!0&&It.beginShadows();let H=w.state.shadowsArray;if(Ut.render(H,v,U),te===!0&&It.endShadows(),(G&&T.hasRenderPass())===!1){let St=E.opaque,gt=E.transmissive;if(w.setupLights(),U.isArrayCamera){let Tt=U.cameras;if(gt.length>0)for(let Rt=0,$t=Tt.length;Rt<$t;Rt++){let Yt=Tt[Rt];ap(St,gt,v,Yt)}Me&&Ht.render(v);for(let Rt=0,$t=Tt.length;Rt<$t;Rt++){let Yt=Tt[Rt];op(E,v,Yt,Yt.viewport)}}else gt.length>0&&ap(St,gt,v,U),Me&&Ht.render(v),op(E,v,U)}Y!==null&&k===0&&(j.updateMultisampleRenderTarget(Y),j.updateRenderTargetMipmap(Y)),G&&T.end(L),v.isScene===!0&&v.onAfterRender(L,v,U),yt.resetDefaultState(),$=-1,J=null,x.pop(),x.length>0?(w=x[x.length-1],j.setTextureUnits(w.state.textureUnits),te===!0&&It.setGlobalState(L.clippingPlanes,w.state.camera)):w=null,A.pop(),A.length>0?E=A[A.length-1]:E=null,V!==null&&V.renderEnd()};function eh(v,U,Z,G){if(v.visible===!1)return;if(v.layers.test(U.layers)){if(v.isGroup)Z=v.renderOrder;else if(v.isLOD)v.autoUpdate===!0&&v.update(U);else if(v.isLightProbeGrid)w.pushLightProbeGrid(v);else if(v.isLight)w.pushLight(v),v.castShadow&&w.pushShadow(v);else if(v.isSprite){if(!v.frustumCulled||v.intersectsFrustum(Wt)){G&&Oe.setFromMatrixPosition(v.matrixWorld).applyMatrix4(Gt);let St=nt.update(v),gt=v.material;gt.visible&&E.push(v,St,gt,Z,Oe.z,null,U)}}else if((v.isMesh||v.isLine||v.isPoints)&&(!v.frustumCulled||v.intersectsFrustum(Wt))){let St=nt.update(v),gt=v.material;if(G&&(v.boundingSphere!==void 0?(v.boundingSphere===null&&v.computeBoundingSphere(),Oe.copy(v.boundingSphere.center)):(St.boundingSphere===null&&St.computeBoundingSphere(),Oe.copy(St.boundingSphere.center)),Oe.applyMatrix4(v.matrixWorld).applyMatrix4(Gt)),Array.isArray(gt)){let Tt=St.groups;for(let Rt=0,$t=Tt.length;Rt<$t;Rt++){let Yt=Tt[Rt],wt=gt[Yt.materialIndex];wt&&wt.visible&&E.push(v,St,wt,Z,Oe.z,Yt,U)}}else gt.visible&&E.push(v,St,gt,Z,Oe.z,null,U)}}let _t=v.children;for(let St=0,gt=_t.length;St<gt;St++)eh(_t[St],U,Z,G)}function op(v,U,Z,G){let{opaque:H,transmissive:_t,transparent:St}=v;w.setupLightsView(Z),te===!0&&It.setGlobalState(L.clippingPlanes,Z),G&&g.viewport(q.copy(G)),H.length>0&&Ba(H,U,Z),_t.length>0&&Ba(_t,U,Z),St.length>0&&Ba(St,U,Z),g.buffers.depth.setTest(!0),g.buffers.depth.setMask(!0),g.buffers.color.setMask(!0),g.setPolygonOffset(!1)}function ap(v,U,Z,G){if((Z.isScene===!0?Z.overrideMaterial:null)!==null)return;if(w.state.transmissionRenderTarget[G.id]===void 0){let wt=ue.has("EXT_color_buffer_half_float")||ue.has("EXT_color_buffer_float");w.state.transmissionRenderTarget[G.id]=new dn(1,1,{generateMipmaps:!0,type:wt?Kn:Mn,minFilter:ls,samples:Math.max(4,C.samples),stencilBuffer:r,resolveDepthBuffer:!1,resolveStencilBuffer:!1,storeMultisampledDepthBuffer:!1,storeMultisampledStencilBuffer:!1,colorSpace:Kt.workingColorSpace})}let _t=w.state.transmissionRenderTarget[G.id],St=G.viewport||q;_t.setSize(St.z*L.transmissionResolutionScale,St.w*L.transmissionResolutionScale);let gt=L.getRenderTarget(),Tt=L.getActiveCubeFace(),Rt=L.getActiveMipmapLevel();L.setRenderTarget(_t),L.getClearColor(Mt),Ct=L.getClearAlpha(),Ct<1&&L.setClearColor(16777215,.5),L.clear(),Me&&Ht.render(Z);let $t=L.toneMapping;L.toneMapping=qn;let Yt=G.viewport;if(G.viewport!==void 0&&(G.viewport=void 0),w.setupLightsView(G),te===!0&&It.setGlobalState(L.clippingPlanes,G),Ba(v,Z,G),j.updateMultisampleRenderTarget(_t),j.updateRenderTargetMipmap(_t),ue.has("WEBGL_multisampled_render_to_texture")===!1){let wt=!1;for(let ae=0,Ie=U.length;ae<Ie;ae++){let _e=U[ae],{object:de,geometry:qe,material:vt,group:tn}=_e;if(vt.side===ui&&de.layers.test(G.layers)){let ie=vt.side;vt.side=rn,vt.needsUpdate=!0,cp(de,Z,G,qe,vt,tn),vt.side=ie,vt.needsUpdate=!0,wt=!0}}wt===!0&&(j.updateMultisampleRenderTarget(_t),j.updateRenderTargetMipmap(_t))}L.setRenderTarget(gt,Tt,Rt),L.setClearColor(Mt,Ct),Yt!==void 0&&(G.viewport=Yt),L.toneMapping=$t}function Ba(v,U,Z){let G=U.isScene===!0?U.overrideMaterial:null;for(let H=0,_t=v.length;H<_t;H++){let St=v[H],{object:gt,geometry:Tt,group:Rt}=St,$t=St.material;$t.allowOverride===!0&&G!==null&&($t=G),gt.layers.test(Z.layers)&&cp(gt,U,Z,Tt,$t,Rt)}}function cp(v,U,Z,G,H,_t){V!==null&&H.isNodeMaterial&&V.setObject(v,H),v.onBeforeRender(L,U,Z,G,H,_t),v.modelViewMatrix.multiplyMatrices(Z.matrixWorldInverse,v.matrixWorld),v.normalMatrix.getNormalMatrix(v.modelViewMatrix),H.onBeforeRender(L,U,Z,G,v,_t),H.transparent===!0&&H.side===ui&&H.forceSinglePass===!1?(H.side=rn,H.needsUpdate=!0,L.renderBufferDirect(Z,U,G,H,v,_t),H.side=as,H.needsUpdate=!0,L.renderBufferDirect(Z,U,G,H,v,_t),H.side=ui):L.renderBufferDirect(Z,U,G,H,v,_t),v.onAfterRender(L,U,Z,G,H,_t)}function ka(v,U,Z){U.isScene!==!0&&(U=on);let G=X.get(v),H=w.state.lights,_t=w.state.shadowsArray,St=H.state.version,gt=ut.getParameters(v,H.state,_t,U,Z,w.state.lightProbeGridArray),Tt=ut.getProgramCacheKey(gt),Rt=G.programs;G.environment=v.isMeshStandardMaterial||v.isMeshLambertMaterial||v.isMeshPhongMaterial?U.environment:null,G.fog=U.fog;let $t=v.isMeshStandardMaterial||v.isMeshLambertMaterial&&!v.envMap||v.isMeshPhongMaterial&&!v.envMap;G.envMap=at.get(v.envMap||G.environment,$t),G.envMapRotation=G.environment!==null&&v.envMap===null?U.environmentRotation:v.envMapRotation,Rt===void 0&&(v.addEventListener("dispose",Jn),Rt=new Map,G.programs=Rt);let Yt=Rt.get(Tt);if(Yt!==void 0){if(G.currentProgram===Yt&&G.lightsStateVersion===St)return up(v,gt),Yt}else gt.uniforms=ut.getUniforms(v),V!==null&&v.isNodeMaterial&&V.build(v,Z,gt),v.onBeforeCompile(gt,L),Yt=ut.acquireProgram(gt,Tt),Rt.set(Tt,Yt),G.uniforms=gt.uniforms;let wt=G.uniforms;return(!v.isShaderMaterial&&!v.isRawShaderMaterial||v.clipping===!0)&&(wt.clippingPlanes=It.uniform),up(v,gt),G.needsLights=lx(v),G.lightsStateVersion=St,G.needsLights&&(wt.ambientLightColor.value=H.state.ambient,wt.lightProbe.value=H.state.probe,wt.sunLights.value=H.state.sun,wt.sunLightShadows.value=H.state.sunShadow,wt.directionalLights.value=H.state.directional,wt.directionalLightShadows.value=H.state.directionalShadow,wt.spotLights.value=H.state.spot,wt.spotLightShadows.value=H.state.spotShadow,wt.rectAreaLights.value=H.state.rectArea,wt.ltc_1.value=H.state.rectAreaLTC1,wt.ltc_2.value=H.state.rectAreaLTC2,wt.pointLights.value=H.state.point,wt.pointLightShadows.value=H.state.pointShadow,wt.hemisphereLights.value=H.state.hemi,wt.sunShadowMatrix.value=H.state.sunShadowMatrix,wt.sunShadowCascade.value=H.state.sunShadowCascade,wt.directionalShadowMatrix.value=H.state.directionalShadowMatrix,wt.spotLightMatrix.value=H.state.spotLightMatrix,wt.spotLightMap.value=H.state.spotLightMap,wt.pointShadowMatrix.value=H.state.pointShadowMatrix),G.lightProbeGrid=w.state.lightProbeGridArray.length>0,G.currentProgram=Yt,G.uniformsList=null,Yt}function lp(v){if(v.uniformsList===null){let U=v.currentProgram.getUniforms();v.uniformsList=Yr.seqWithValue(U.seq,v.uniforms)}return v.uniformsList}function up(v,U){let Z=X.get(v);Z.outputColorSpace=U.outputColorSpace,Z.batching=U.batching,Z.batchingColor=U.batchingColor,Z.instancing=U.instancing,Z.instancingColor=U.instancingColor,Z.instancingMorph=U.instancingMorph,Z.skinning=U.skinning,Z.morphTargets=U.morphTargets,Z.morphNormals=U.morphNormals,Z.morphColors=U.morphColors,Z.morphTargetsCount=U.morphTargetsCount,Z.numClippingPlanes=U.numClippingPlanes,Z.numIntersection=U.numClipIntersection,Z.vertexAlphas=U.vertexAlphas,Z.vertexTangents=U.vertexTangents,Z.toneMapping=U.toneMapping}function ox(v,U){if(v.length===0)return null;if(v.length===1)return v[0].texture!==null?v[0]:null;b.setFromMatrixPosition(U.matrixWorld);for(let Z=0,G=v.length;Z<G;Z++){let H=v[Z];if(H.texture!==null&&H.boundingBox.containsPoint(b))return H}return null}function ax(v,U,Z,G,H){U.isScene!==!0&&(U=on),j.resetTextureUnits();let _t=U.fog,St=G.isMeshStandardMaterial||G.isMeshLambertMaterial||G.isMeshPhongMaterial?U.environment:null,gt=Y===null?L.outputColorSpace:Y.isXRRenderTarget===!0?Y.texture.colorSpace:Kt.workingColorSpace,Tt=G.isMeshStandardMaterial||G.isMeshLambertMaterial&&!G.envMap||G.isMeshPhongMaterial&&!G.envMap,Rt=at.get(G.envMap||St,Tt),$t=G.vertexColors===!0&&!!Z.attributes.color&&Z.attributes.color.itemSize===4,Yt=!!Z.attributes.tangent&&(!!G.normalMap||G.anisotropy>0),wt=!!Z.morphAttributes.position,ae=!!Z.morphAttributes.normal,Ie=!!Z.morphAttributes.color,_e=qn;G.toneMapped&&(Y===null||Y.isXRRenderTarget===!0)&&(_e=L.toneMapping);let de=Z.morphAttributes.position||Z.morphAttributes.normal||Z.morphAttributes.color,qe=de!==void 0?de.length:0,vt=X.get(G),tn=w.state.lights;if(te===!0&&(le===!0||v!==J)){let me=v===J&&G.id===$;It.setState(G,v,me)}let ie=!1;G.version===vt.__version?(vt.needsLights&&vt.lightsStateVersion!==tn.state.version||vt.outputColorSpace!==gt||H.isBatchedMesh&&vt.batching===!1||!H.isBatchedMesh&&vt.batching===!0||H.isBatchedMesh&&vt.batchingColor===!0&&H._colorsTexture===null||H.isBatchedMesh&&vt.batchingColor===!1&&H._colorsTexture!==null||H.isInstancedMesh&&vt.instancing===!1||!H.isInstancedMesh&&vt.instancing===!0||H.isSkinnedMesh&&vt.skinning===!1||!H.isSkinnedMesh&&vt.skinning===!0||H.isInstancedMesh&&vt.instancingColor===!0&&H.instanceColor===null||H.isInstancedMesh&&vt.instancingColor===!1&&H.instanceColor!==null||H.isInstancedMesh&&vt.instancingMorph===!0&&H.morphTexture===null||H.isInstancedMesh&&vt.instancingMorph===!1&&H.morphTexture!==null||vt.envMap!==Rt||G.fog===!0&&vt.fog!==_t||vt.numClippingPlanes!==void 0&&(vt.numClippingPlanes!==It.numPlanes||vt.numIntersection!==It.numIntersection)||vt.vertexAlphas!==$t||vt.vertexTangents!==Yt||vt.morphTargets!==wt||vt.morphNormals!==ae||vt.morphColors!==Ie||vt.toneMapping!==_e||vt.morphTargetsCount!==qe||!!vt.lightProbeGrid!=w.state.lightProbeGridArray.length>0)&&(ie=!0):(ie=!0,vt.__version=G.version);let Tn=vt.currentProgram;ie===!0&&(Tn=ka(G,U,H),V&&G.isNodeMaterial&&V.onUpdateProgram(G,Tn,vt));let jn=!1,Ni=!1,Zs=!1,fe=Tn.getUniforms(),Re=vt.uniforms;if(g.useProgram(Tn.program)&&(jn=!0,Ni=!0,Zs=!0),G.id!==$&&($=G.id,Ni=!0),vt.needsLights){let me=ox(w.state.lightProbeGridArray,H);vt.lightProbeGrid!==me&&(vt.lightProbeGrid=me,Ni=!0)}if(jn||J!==v){g.buffers.depth.getReversed()&&v.reversedDepth!==!0&&(v._reversedDepth=!0,v.updateProjectionMatrix()),fe.setValue(O,"projectionMatrix",v.projectionMatrix),fe.setValue(O,"viewMatrix",v.matrixWorldInverse);let Di=fe.map.cameraPosition;Di!==void 0&&Di.setValue(O,ye.setFromMatrixPosition(v.matrixWorld)),C.logarithmicDepthBuffer&&fe.setValue(O,"logDepthBufFC",2/(Math.log(v.far+1)/Math.LN2)),(G.isMeshPhongMaterial||G.isMeshToonMaterial||G.isMeshLambertMaterial||G.isMeshBasicMaterial||G.isMeshStandardMaterial||G.isShaderMaterial)&&fe.setValue(O,"isOrthographic",v.isOrthographicCamera===!0),J!==v&&(J=v,Ni=!0,Zs=!0)}if(vt.needsLights&&(tn.state.sunShadowMap.length>0&&fe.setValue(O,"sunShadowMap",tn.state.sunShadowMap,j),tn.state.directionalShadowMap.length>0&&fe.setValue(O,"directionalShadowMap",tn.state.directionalShadowMap,j),tn.state.spotShadowMap.length>0&&fe.setValue(O,"spotShadowMap",tn.state.spotShadowMap,j),tn.state.pointShadowMap.length>0&&fe.setValue(O,"pointShadowMap",tn.state.pointShadowMap,j)),H.isSkinnedMesh){fe.setOptional(O,H,"bindMatrix"),fe.setOptional(O,H,"bindMatrixInverse");let me=H.skeleton;me&&(me.boneTexture===null&&me.computeBoneTexture(),fe.setValue(O,"boneTexture",me.boneTexture,j))}H.isBatchedMesh&&(fe.setOptional(O,H,"batchingTexture"),fe.setValue(O,"batchingTexture",H._matricesTexture,j),fe.setOptional(O,H,"batchingIdTexture"),fe.setValue(O,"batchingIdTexture",H._indirectTexture,j),fe.setOptional(O,H,"batchingColorTexture"),H._colorsTexture!==null&&fe.setValue(O,"batchingColorTexture",H._colorsTexture,j));let Ui=Z.morphAttributes;if((Ui.position!==void 0||Ui.normal!==void 0||Ui.color!==void 0)&&D.update(H,Z,Tn),(Ni||vt.receiveShadow!==H.receiveShadow)&&(vt.receiveShadow=H.receiveShadow,fe.setValue(O,"receiveShadow",H.receiveShadow)),(G.isMeshStandardMaterial||G.isMeshLambertMaterial||G.isMeshPhongMaterial)&&G.envMap===null&&U.environment!==null&&(Re.envMapIntensity.value=U.environmentIntensity),Re.dfgLUT!==void 0&&(Re.dfgLUT.value=xE()),Ni){if(fe.setValue(O,"toneMappingExposure",L.toneMappingExposure),vt.needsLights&&cx(Re,Zs),_t&&G.fog===!0&&Pt.refreshFogUniforms(Re,_t),Pt.refreshMaterialUniforms(Re,G,tt,K,w.state.transmissionRenderTarget[v.id]),vt.needsLights&&vt.lightProbeGrid){let me=vt.lightProbeGrid;Re.probesSH.value=me.texture,Re.probesMin.value.copy(me.boundingBox.min),Re.probesMax.value.copy(me.boundingBox.max),Re.probesResolution.value.copy(me.resolution)}Yr.upload(O,lp(vt),Re,j)}if(G.isShaderMaterial&&G.uniformsNeedUpdate===!0&&(Yr.upload(O,lp(vt),Re,j),G.uniformsNeedUpdate=!1),G.isSpriteMaterial&&fe.setValue(O,"center",H.center),fe.setValue(O,"modelViewMatrix",H.modelViewMatrix),fe.setValue(O,"normalMatrix",H.normalMatrix),fe.setValue(O,"modelMatrix",H.matrixWorld),G.uniformsGroups!==void 0){let me=G.uniformsGroups;for(let Di=0,Ks=me.length;Di<Ks;Di++){let fp=me[Di];it.update(fp,Tn),it.bind(fp,Tn)}}return Tn}function cx(v,U){v.ambientLightColor.needsUpdate=U,v.lightProbe.needsUpdate=U,v.sunLights.needsUpdate=U,v.sunLightShadows.needsUpdate=U,v.directionalLights.needsUpdate=U,v.directionalLightShadows.needsUpdate=U,v.pointLights.needsUpdate=U,v.pointLightShadows.needsUpdate=U,v.spotLights.needsUpdate=U,v.spotLightShadows.needsUpdate=U,v.rectAreaLights.needsUpdate=U,v.hemisphereLights.needsUpdate=U}function lx(v){return v.isMeshLambertMaterial||v.isMeshToonMaterial||v.isMeshPhongMaterial||v.isMeshStandardMaterial||v.isShadowMaterial||v.isShaderMaterial&&v.lights===!0}this.getActiveCubeFace=function(){return B},this.getActiveMipmapLevel=function(){return k},this.getRenderTarget=function(){return Y},this.setRenderTargetTextures=function(v,U,Z){let G=X.get(v);G.__autoAllocateDepthBuffer=v.resolveDepthBuffer===!1,G.__autoAllocateDepthBuffer===!1&&(G.__useRenderToTexture=!1),X.get(v.texture).__webglTexture=U,X.get(v.depthTexture).__webglTexture=G.__autoAllocateDepthBuffer?void 0:Z,G.__hasExternalTextures=!0},this.setRenderTargetFramebuffer=function(v,U){let Z=X.get(v);Z.__webglFramebuffer=U,Z.__useDefaultFramebuffer=U===void 0},this.setRenderTarget=function(v,U=0,Z=0){Y=v,B=U,k=Z;let G=null,H=!1,_t=!1;if(v){let gt=X.get(v);if(gt.__useDefaultFramebuffer!==void 0){g.bindFramebuffer(O.FRAMEBUFFER,gt.__webglFramebuffer),q.copy(v.viewport),st.copy(v.scissor),rt=v.scissorTest,g.viewport(q),g.scissor(st),g.setScissorTest(rt),$=-1;return}else if(gt.__webglFramebuffer===void 0)j.setupRenderTarget(v);else if(gt.__hasExternalTextures)j.rebindTextures(v,X.get(v.texture).__webglTexture,X.get(v.depthTexture).__webglTexture);else if(v.depthBuffer){let $t=v.depthTexture;if(gt.__boundDepthTexture!==$t){if($t!==null&&X.has($t)&&(v.width!==$t.image.width||v.height!==$t.image.height))throw new Error("THREE.WebGLRenderer: Attached DepthTexture is initialized to the incorrect size.");j.setupDepthRenderbuffer(v)}}let Tt=v.texture;(Tt.isData3DTexture||Tt.isDataArrayTexture||Tt.isCompressedArrayTexture)&&(_t=!0);let Rt=X.get(v).__webglFramebuffer;v.isWebGLCubeRenderTarget?(Array.isArray(Rt[U])?G=Rt[U][Z]:G=Rt[U],H=!0):v.samples>0&&j.useMultisampledRTT(v)===!1?G=X.get(v).__webglMultisampledFramebuffer:Array.isArray(Rt)?G=Rt[Z]:G=Rt,q.copy(v.viewport),st.copy(v.scissor),rt=v.scissorTest}else q.copy(ct).multiplyScalar(tt).floor(),st.copy(Ft).multiplyScalar(tt).floor(),rt=Ee;if(Z!==0&&(G=I),g.bindFramebuffer(O.FRAMEBUFFER,G)&&g.drawBuffers(v,G),g.viewport(q),g.scissor(st),g.setScissorTest(rt),H){let gt=X.get(v.texture);O.framebufferTexture2D(O.FRAMEBUFFER,O.COLOR_ATTACHMENT0,O.TEXTURE_CUBE_MAP_POSITIVE_X+U,gt.__webglTexture,Z)}else if(_t){let gt=U;for(let Tt=0;Tt<v.textures.length;Tt++){let Rt=X.get(v.textures[Tt]);O.framebufferTextureLayer(O.FRAMEBUFFER,O.COLOR_ATTACHMENT0+Tt,Rt.__webglTexture,Z,gt)}}else if(v!==null&&Z!==0){let gt=X.get(v.texture);O.framebufferTexture2D(O.FRAMEBUFFER,O.COLOR_ATTACHMENT0,O.TEXTURE_2D,gt.__webglTexture,Z)}$=-1};function hp(v){let U=X.get(v);return(U.__readFormat!==v.format||U.__readType!==v.type)&&(U.__readFormat=v.format,U.__readType=v.type,U.__formatReadable=C.textureFormatReadable(v.format),U.__typeReadable=C.textureTypeReadable(v.type)),U}this.readRenderTargetPixels=function(v,U,Z,G,H,_t,St,gt=0){if(!(v&&v.isWebGLRenderTarget)){Bt("WebGLRenderer.readRenderTargetPixels: renderTarget is not THREE.WebGLRenderTarget.");return}let Tt=X.get(v).__webglFramebuffer;if(v.isWebGLCubeRenderTarget&&St!==void 0&&(Tt=Tt[St]),Tt){g.bindFramebuffer(O.FRAMEBUFFER,Tt);try{let Rt=v.textures[gt],$t=Rt.format,Yt=Rt.type;v.textures.length>1&&O.readBuffer(O.COLOR_ATTACHMENT0+gt);let wt=hp(Rt);if(wt.__formatReadable===!1){Bt("WebGLRenderer.readRenderTargetPixels: renderTarget is not in RGBA or implementation defined format.");return}if(wt.__typeReadable===!1){Bt("WebGLRenderer.readRenderTargetPixels: renderTarget is not in UnsignedByteType or implementation defined type.");return}U>=0&&U<=v.width-G&&Z>=0&&Z<=v.height-H&&O.readPixels(U,Z,G,H,dt.convert($t),dt.convert(Yt),_t)}finally{let Rt=Y!==null?X.get(Y).__webglFramebuffer:null;g.bindFramebuffer(O.FRAMEBUFFER,Rt)}}},this.readRenderTargetPixelsAsync=async function(v,U,Z,G,H,_t,St,gt=0){if(!(v&&v.isWebGLRenderTarget))throw new Error("THREE.WebGLRenderer.readRenderTargetPixels: renderTarget is not THREE.WebGLRenderTarget.");let Tt=X.get(v).__webglFramebuffer;if(v.isWebGLCubeRenderTarget&&St!==void 0&&(Tt=Tt[St]),Tt)if(U>=0&&U<=v.width-G&&Z>=0&&Z<=v.height-H){g.bindFramebuffer(O.FRAMEBUFFER,Tt);let Rt=v.textures[gt],$t=Rt.format,Yt=Rt.type;v.textures.length>1&&O.readBuffer(O.COLOR_ATTACHMENT0+gt);let wt=hp(Rt);if(wt.__formatReadable===!1)throw new Error("THREE.WebGLRenderer.readRenderTargetPixelsAsync: renderTarget is not in RGBA or implementation defined format.");if(wt.__typeReadable===!1)throw new Error("THREE.WebGLRenderer.readRenderTargetPixelsAsync: renderTarget is not in UnsignedByteType or implementation defined type.");let ae=O.createBuffer();O.bindBuffer(O.PIXEL_PACK_BUFFER,ae),O.bufferData(O.PIXEL_PACK_BUFFER,_t.byteLength,O.STREAM_READ),O.readPixels(U,Z,G,H,dt.convert($t),dt.convert(Yt),0),O.bindBuffer(O.PIXEL_PACK_BUFFER,null);let Ie=Y!==null?X.get(Y).__webglFramebuffer:null;g.bindFramebuffer(O.FRAMEBUFFER,Ie);let _e=O.fenceSync(O.SYNC_GPU_COMMANDS_COMPLETE,0);return O.flush(),await l_(O,_e,4),O.bindBuffer(O.PIXEL_PACK_BUFFER,ae),O.getBufferSubData(O.PIXEL_PACK_BUFFER,0,_t),O.bindBuffer(O.PIXEL_PACK_BUFFER,null),O.deleteBuffer(ae),O.deleteSync(_e),_t}else throw new Error("THREE.WebGLRenderer.readRenderTargetPixelsAsync: requested read bounds are out of range.")},this.copyFramebufferToTexture=function(v,U=null,Z=0){let G=Math.pow(2,-Z),H=Math.floor(v.image.width*G),_t=Math.floor(v.image.height*G),St=U!==null?U.x:0,gt=U!==null?U.y:0;j.setTexture2D(v,0),O.copyTexSubImage2D(O.TEXTURE_2D,Z,0,0,St,gt,H,_t),g.unbindTexture()},this.copyTextureToTexture=function(v,U,Z=null,G=null,H=0,_t=0){let St,gt,Tt,Rt,$t,Yt,wt,ae,Ie,_e=v.isCompressedTexture?v.mipmaps[_t]:v.image;if(Z!==null)St=Z.max.x-Z.min.x,gt=Z.max.y-Z.min.y,Tt=Z.isBox3?Z.max.z-Z.min.z:1,Rt=Z.min.x,$t=Z.min.y,Yt=Z.isBox3?Z.min.z:0;else{let Re=Math.pow(2,-H);St=Math.floor(_e.width*Re),gt=Math.floor(_e.height*Re),v.isDataArrayTexture?Tt=_e.depth:v.isData3DTexture?Tt=Math.floor(_e.depth*Re):Tt=1,Rt=0,$t=0,Yt=0}G!==null?(wt=G.x,ae=G.y,Ie=G.z):(wt=0,ae=0,Ie=0);let de=dt.convert(U.format),qe=dt.convert(U.type),vt;U.isData3DTexture?(j.setTexture3D(U,0),vt=O.TEXTURE_3D):U.isDataArrayTexture||U.isCompressedArrayTexture?(j.setTexture2DArray(U,0),vt=O.TEXTURE_2D_ARRAY):(j.setTexture2D(U,0),vt=O.TEXTURE_2D),g.activeTexture(O.TEXTURE0),g.pixelStorei(O.UNPACK_FLIP_Y_WEBGL,U.flipY),g.pixelStorei(O.UNPACK_PREMULTIPLY_ALPHA_WEBGL,U.premultiplyAlpha),g.pixelStorei(O.UNPACK_ALIGNMENT,U.unpackAlignment);let tn=g.getParameter(O.UNPACK_ROW_LENGTH),ie=g.getParameter(O.UNPACK_IMAGE_HEIGHT),Tn=g.getParameter(O.UNPACK_SKIP_PIXELS),jn=g.getParameter(O.UNPACK_SKIP_ROWS),Ni=g.getParameter(O.UNPACK_SKIP_IMAGES);g.pixelStorei(O.UNPACK_ROW_LENGTH,_e.width),g.pixelStorei(O.UNPACK_IMAGE_HEIGHT,_e.height),g.pixelStorei(O.UNPACK_SKIP_PIXELS,Rt),g.pixelStorei(O.UNPACK_SKIP_ROWS,$t),g.pixelStorei(O.UNPACK_SKIP_IMAGES,Yt);let Zs=v.isDataArrayTexture||v.isData3DTexture,fe=U.isDataArrayTexture||U.isData3DTexture;if(v.isDepthTexture){let Re=X.get(v),Ui=X.get(U),me=X.get(Re.__renderTarget),Di=X.get(Ui.__renderTarget);g.bindFramebuffer(O.READ_FRAMEBUFFER,me.__webglFramebuffer),g.bindFramebuffer(O.DRAW_FRAMEBUFFER,Di.__webglFramebuffer);for(let Ks=0;Ks<Tt;Ks++)Zs&&(O.framebufferTextureLayer(O.READ_FRAMEBUFFER,O.COLOR_ATTACHMENT0,X.get(v).__webglTexture,H,Yt+Ks),O.framebufferTextureLayer(O.DRAW_FRAMEBUFFER,O.COLOR_ATTACHMENT0,X.get(U).__webglTexture,_t,Ie+Ks)),O.blitFramebuffer(Rt,$t,St,gt,wt,ae,St,gt,O.DEPTH_BUFFER_BIT,O.NEAREST);g.bindFramebuffer(O.READ_FRAMEBUFFER,null),g.bindFramebuffer(O.DRAW_FRAMEBUFFER,null)}else if(H!==0||v.isRenderTargetTexture||X.has(v)){let Re=X.get(v),Ui=X.get(U);g.bindFramebuffer(O.READ_FRAMEBUFFER,R),g.bindFramebuffer(O.DRAW_FRAMEBUFFER,N);for(let me=0;me<Tt;me++)Zs?O.framebufferTextureLayer(O.READ_FRAMEBUFFER,O.COLOR_ATTACHMENT0,Re.__webglTexture,H,Yt+me):O.framebufferTexture2D(O.READ_FRAMEBUFFER,O.COLOR_ATTACHMENT0,O.TEXTURE_2D,Re.__webglTexture,H),fe?O.framebufferTextureLayer(O.DRAW_FRAMEBUFFER,O.COLOR_ATTACHMENT0,Ui.__webglTexture,_t,Ie+me):O.framebufferTexture2D(O.DRAW_FRAMEBUFFER,O.COLOR_ATTACHMENT0,O.TEXTURE_2D,Ui.__webglTexture,_t),H!==0?O.blitFramebuffer(Rt,$t,St,gt,wt,ae,St,gt,O.COLOR_BUFFER_BIT,O.NEAREST):fe?O.copyTexSubImage3D(vt,_t,wt,ae,Ie+me,Rt,$t,St,gt):O.copyTexSubImage2D(vt,_t,wt,ae,Rt,$t,St,gt);g.bindFramebuffer(O.READ_FRAMEBUFFER,null),g.bindFramebuffer(O.DRAW_FRAMEBUFFER,null)}else fe?v.isDataTexture||v.isData3DTexture?O.texSubImage3D(vt,_t,wt,ae,Ie,St,gt,Tt,de,qe,_e.data):U.isCompressedArrayTexture?O.compressedTexSubImage3D(vt,_t,wt,ae,Ie,St,gt,Tt,de,_e.data):O.texSubImage3D(vt,_t,wt,ae,Ie,St,gt,Tt,de,qe,_e):v.isDataTexture?O.texSubImage2D(O.TEXTURE_2D,_t,wt,ae,St,gt,de,qe,_e.data):v.isCompressedTexture?O.compressedTexSubImage2D(O.TEXTURE_2D,_t,wt,ae,_e.width,_e.height,de,_e.data):O.texSubImage2D(O.TEXTURE_2D,_t,wt,ae,St,gt,de,qe,_e);g.pixelStorei(O.UNPACK_ROW_LENGTH,tn),g.pixelStorei(O.UNPACK_IMAGE_HEIGHT,ie),g.pixelStorei(O.UNPACK_SKIP_PIXELS,Tn),g.pixelStorei(O.UNPACK_SKIP_ROWS,jn),g.pixelStorei(O.UNPACK_SKIP_IMAGES,Ni),_t===0&&U.generateMipmaps&&O.generateMipmap(vt),g.unbindTexture()},this.initRenderTarget=function(v){X.get(v).__webglFramebuffer===void 0&&j.setupRenderTarget(v)},this.initTexture=function(v){v.isCubeTexture?j.setTextureCube(v,0):v.isData3DTexture?j.setTexture3D(v,0):v.isDataArrayTexture||v.isCompressedArrayTexture?j.setTexture2DArray(v,0):j.setTexture2D(v,0),g.unbindTexture()},this.resetState=function(){B=0,k=0,Y=null,g.reset(),yt.reset()},typeof __THREE_DEVTOOLS__<"u"&&__THREE_DEVTOOLS__.dispatchEvent(new CustomEvent("observe",{detail:this}))}get coordinateSystem(){return Xn}get outputColorSpace(){return this._outputColorSpace}set outputColorSpace(t){this._outputColorSpace=t;let e=this.getContext();e.drawingBufferColorSpace=Kt._getDrawingBufferColorSpace(t),e.unpackColorSpace=Kt._getUnpackColorSpace()}};function Ku(n,t=0){if(n===null||typeof n!="object")return String(n??"null");let e="  ".repeat(t);return Object.entries(n).map(([s,r])=>`${e}${s}: ${r!==null&&typeof r=="object"?`
`+Ku(r,t+1):String(r??"null")}`).join(`
`)}var ot=n=>document.getElementById(n),se=n=>Number(n).toLocaleString(void 0,{maximumFractionDigits:2}),Ua=n=>n?n.slice(0,10)+"\u2026"+n.slice(-6):"\u2014",Jt=(n,t)=>{ot(n).textContent=t},Zt=(n,t,e)=>{let i=document.createElement(n);return t!=null&&(i.textContent=t),e&&(i.className=e),i},Jr=(n,t,e="hash-link")=>{let i=Zt("a",n,e);return i.href=t,i},Z_=matchMedia("(prefers-reduced-motion: reduce)"),pi=!Z_.matches,ms="overview",Oa=null,K_=null,fs=[],Xu=null,La=0,qu=null,H_=0,Na=0,W_="transactions",Zu="",$_="",J_=!1,Yd=0,ps=null,Kr=0;async function j_(n=!1){let t=++Yd,e=Kr;ot("refresh-block-picker").disabled=!0;try{let i=await Ys({kind:"blocks_with_transactions",limit:30});if(t!==Yd)return;let s=ot("block-picker"),r=s.value;s.replaceChildren(new Option("Choose a block\u2026",""));for(let o of i.rows)s.add(new Option(`#${se(o.height)} \xB7 ${se(o.transactionCount)} transactions`,String(o.height)));s.value=r,J_=!0,Jt("block-picker-status",i.rows.length?"Select a block to display its transactions below.":"No populated blocks indexed yet. Refresh after transactions commit."),n&&e===Kr&&i.rows.length&&Kd(String(i.rows[0].height))}catch{Jt("block-picker-status","Could not load blocks. Check the node and refresh.")}finally{t===Yd&&(ot("refresh-block-picker").disabled=!1)}}async function Kd(n){let t=++Kr;La++,ps=null,Jt("selected-block-title",`2. Transactions \xB7 Block #${n}`),Jt("selected-block-summary","Loading block\u2026"),ot("selected-block-details").hidden=!0,Nn(ot("explorer-results"),"Loading transactions\u2026","Reading the selected block."),ot("explorer-more").hidden=!0;try{let e=await Ys({kind:"blocks",q:n,limit:1});if(t!==Kr)return;let i=e.rows[0];if(!i){Jt("selected-block-summary","This block is not indexed yet."),Nn(ot("explorer-results"),"Block not indexed","Choose a recent block above or refresh after the index catches up.");return}ps=i,ot("block-height").value=String(i.height),ot("block-picker").value=String(i.height),ot("selected-block-details").href="#block/"+i.height,ot("selected-block-details").hidden=!1,Jt("selected-block-title",`2. Transactions \xB7 Block #${se(i.height)}`),Jt("selected-block-summary",`${se(i.transactionCount)} transactions \xB7 Click a transaction hash to view its details and receipt.`),ot("explorer-kind").value="transactions",ot("explorer-query").value=String(i.height),await Fa(!1,!0)}catch{t===Kr&&(Jt("selected-block-summary","Block unavailable. Please retry."),Nn(ot("explorer-results"),"Could not load block","Check the node connection and try again."))}}var Zd=new Map;function Da(n,t,e=""){let i=ot(n),s=Zd.get(n);if(s?.animation?.stop(),t==null||!Number.isFinite(Number(t))){i.textContent="\u2014",Zd.delete(n);return}let r=Number(t),o={value:r};pi&&s&&s.value!==r?o.animation=Ho(s.value,r,{duration:.5,ease:"easeOut",onUpdate:a=>{i.textContent=se(n==="height"||n==="transaction-total"?Math.round(a):a)+e}}):i.textContent=se(r)+e,Zd.set(n,o)}function ds(n,t){n.replaceChildren();for(let[e,i]of t)n.append(Zt("dt",e),Zt("dd",i instanceof Node?"":i==null?"Unavailable":typeof i=="object"?Ku(i):String(i))),i instanceof Node&&n.lastChild.append(i)}function Jd(n,t){let e=Zt("table"),i=Zt("thead"),s=Zt("tr");n.forEach(o=>s.append(Zt("th",o))),i.append(s),e.append(i);let r=Zt("tbody");for(let o of t){let a=Zt("tr");for(let l of o){let c=Zt("td");c.append(l instanceof Node?l:document.createTextNode(String(l??"\u2014"))),a.append(c)}r.append(a)}return e.append(r),e}function Ju(n,t=""){return Zt("span",n,"badge "+t)}function Nn(n,t,e){n.replaceChildren();let i=Zt("div",null,"empty-state");i.append(Zt("strong",t),Zt("p",e)),n.append(i)}function jd(n,t=!1){return Jd(t?["Transaction","Block","Value","Status"]:["Transaction hash","Block / index","From \u2192 To","Value","Status"],n.map(e=>{let i=[Jr(Ua(e.hash),"#tx/"+e.hash),Jr(String(e.height)+(t?"":" / "+e.position),"#block/"+e.height,"block-link")];return t||i.push(Ua(e.receipt.from)+" \u2192 "+(e.receipt.to?Ua(e.receipt.to):"Contract creation")),i.push(e.transaction.valueWei+" wei",Ju(e.receipt.success?"Success":"Reverted",e.receipt.success?"":"error")),i}))}function Q_(n){return Jd(["Block","Transactions","Gas used","Time"],n.map(t=>[Jr("#"+se(t.height),"#block/"+t.height,"block-link"),t.transactions?Jr(se(t.transactions)+" txs","#block/"+t.height):Ju("Empty block","empty"),t.gasUsed==null?"\u2014":se(t.gasUsed),new Date(t.timestamp*1e3).toLocaleTimeString()]))}async function tx(n,t){let e=await fetch(n+(t?"?"+new URLSearchParams(t):""),{cache:"no-store",signal:AbortSignal.timeout(6e3)});if(!e.ok)throw Error(`API returned ${e.status}`);return Rm(await e.arrayBuffer())}var Ys=n=>tx("/dashboard/index",n);function Qd(n){K_=n,Da("transaction-total",n.indexedTransactions),Jt("index-lag",`SQLite ${n.journalMode.toUpperCase()} \xB7 indexed block ${se(n.indexedHeight)}`),ds(ot("index-details"),[["Schema version",n.schemaVersion??"Unversioned"],["Journal mode",n.journalMode.toUpperCase()],["Indexed height",se(n.indexedHeight)],["Last sampled head",Oa?se(Oa.height):"\u2014"],["Indexed transactions",se(n.indexedTransactions)],["Indexed logs",se(n.indexedLogs)],["Pruned blocks skipped",n.skippedPrunedBlocks],["Health",n.error||"Index available"],["Database",n.database]])}function vE(n){Oa=n;let t=n.runtime?.sqliteIndexerEnabled===!1;document.body.classList.toggle("sqlite-off",t),t&&ms!=="overview"&&tp("overview"),Da("height",n.height);let e=n.benchmarkTps,i=n.stress?.["Node PID"]===n.host?.processes?.[0]?.pid;Da("tps",e?.tps??(i?null:n.tps)),Da("cpu",n.host?.cpuPercent,"%"),Jt("head-age",`Head age ${Math.max(0,Math.floor(Date.now()/1e3)-n.headTimestamp)}s \xB7 chain ${n.chainId}`),Jt("tps-window",e?`Last completed round ${e.trial} \xB7 ${se(e.transactions)} txs / ${Number(e.seconds).toFixed(3)}s \xB7 ${new Date(e.timestamp*1e3).toLocaleTimeString()} \xB7 signing excluded`:i?"Waiting for the first completed stress round":`${se(n.windowTransactions)} txs / ${n.windowSeconds}s block window`),Jt("hero-backend",n.verification.backend.toUpperCase()),Jt("engine-backend",n.verification.backend),Jt("gpu-records",se(n.verification.gpu_records)),Jt("cpu-records",se(n.verification.cpu_records)),Jt("pending",se(n.pendingTransactions)),Jt("rayon",n.host?.rayonThreads??"\u2014"),Jt("block-interval",`Target ${n.targetBlockMs} ms`),document.querySelectorAll("[data-chain]").forEach(r=>r.textContent=n.chainId),ot("latest-blocks").replaceChildren(Q_(n.recentBlocks));let s=n.host||{};Jt("cpu-sample",s.sampleSeconds?`${s.sampleSeconds.toFixed(1)}s SAMPLE`:"SAMPLING"),ot("processes").replaceChildren(Jd(["Process","PID","CPU","Resident memory","OS threads"],(s.processes||[]).map(r=>[r.role,r.pid,r.cpuPercent==null?"Sampling\u2026":r.cpuPercent.toFixed(1)+"%",(r.residentBytes/1048576).toFixed(1)+" MiB",r.osThreads??"Unavailable"]))),ds(ot("worker-details"),[["Backend",n.verification.backend],["GPU runtime",n.verification.gpu_runtime||"mlx"],["GPU recoveries",se(n.verification.gpu_records)],["CPU recoveries",se(n.verification.cpu_records)],["Rayon threads",s.rayonThreads],["Logical CPU cores",s.logicalCpus],["Indexer threads",s.indexerThreads],["Hardware GPU utilization","Not sampled"]]),ds(ot("node-details"),[["Role",n.role],["Chain ID",n.chainId],["Pending transactions",n.pendingTransactions],["Target block interval",n.targetBlockMs+" ms"],["Retention",n.retention],["Retained blocks",n.retainedBlocks],["Upstream",n.upstream||"None configured"],["Sync transport",n.syncTransport],["Head hash",n.headHash]]),ds(ot("rocksdb"),Object.entries(n.rocksdb||{}).map(([r,o])=>[r.replace("rocksdb.",""),o==null?"Unavailable":se(o)])),ds(ot("paths"),[...Object.entries(n.endpoints||{}),...Object.entries(n.paths||{})]),ds(ot("runtime"),[...Object.entries(n.runtime||{}),...Object.entries(n.stress||{})]),SE(n.recentBlocks)}function SE(n){let t=ot("activity-chart"),e=[...n].reverse(),i=Math.max(1,...e.map(r=>r.transactions));Jt("chart-max",se(Math.max(...e.map(r=>r.transactions),0))),t.replaceChildren();let s="http://www.w3.org/2000/svg";for(let r=0;r<180;r+=45){let o=document.createElementNS(s,"line");for(let[a,l]of Object.entries({x1:0,x2:900,y1:r,y2:r,stroke:"#223145","stroke-dasharray":"3 6"}))o.setAttribute(a,l);t.append(o)}e.forEach((r,o)=>{let a=document.createElementNS(s,"a");a.setAttribute("href","#block/"+r.height);let l=document.createElementNS(s,"rect"),c=900/e.length,u=r.transactions/i*160;for(let[h,m]of Object.entries({x:o*c+7,y:175-Math.max(2,u),width:Math.max(2,c-14),height:Math.max(2,u),rx:4,fill:r.transactions?"#87dabb":"#293e4f"}))l.setAttribute(h,m);let f=document.createElementNS(s,"title");f.textContent=`Block ${r.height}: ${r.transactions} transactions`,l.append(f),a.append(l),t.append(a)})}function tp(n){let t={overview:"Overview",explorer:"Chain explorer",node:"Compute & workers",storage:"Storage & paths",logs:"Event logs"};t[n]||(n="overview");let e=ms!==n;ms=n,Jt("page-title",t[n]);for(let i of document.querySelectorAll("[data-page]"))i.hidden=i.dataset.page!==n;for(let i of document.querySelectorAll("[data-nav]"))i.classList.toggle("active",i.dataset.nav===n);e&&(scrollTo({top:0,behavior:"instant"}),pi&&Ho(document.querySelector(`[data-page="${n}"]`),{opacity:[0,1],y:[8,0]},{duration:.25}))}function ju(n,t=""){ot("explorer-kind").value=n,ot("explorer-query").value=t,location.hash="explorer",tp("explorer"),Fa()}async function Fa(n=!1,t=!1){!n&&!t&&(Kr++,ps=null,ot("block-picker").value="",Jt("selected-block-title","2. Transactions & search results"),Jt("selected-block-summary","Click a block or transaction to inspect its details."),ot("selected-block-details").hidden=!0);let e=++La,i=n?W_:ot("explorer-kind").value,s=n?Zu:ot("explorer-query").value.trim();n||(W_=i,Zu=s,fs=[],Xu=null,Nn(ot("explorer-results"),"Loading\u2026","Reading committed records from SQLite.")),ot("explorer-more").disabled=!0;try{let r=await Ys({kind:i,q:s,limit:50,...n?Xu:{}});if(e!==La)return;fs.push(...r.rows),Xu=r.next,Qd(r),Jt("explorer-context",`${se(fs.length)} ${i}${s?" \xB7 "+Ua(s):" \xB7 latest indexed"}`),fs.length?ot("explorer-results").replaceChildren(i==="blocks"?Q_(fs):jd(fs)):Nn(ot("explorer-results"),"No indexed matches","An empty block has no transactions. If the block just committed, allow the index to catch up."),ot("explorer-more").hidden=!Xu,ps&&ps.transactionCount===0&&Nn(ot("explorer-results"),`Block #${se(ps.height)} is empty`,"Choose a block from \u201CBlocks with transactions\u201D above to see transactions immediately.")}catch{e===La&&Nn(ot("explorer-results"),"Search unavailable","The node may be stopped, or the index may still be opening. Try again.")}finally{e===La&&(ot("explorer-more").disabled=!1)}}function X_(n){let t=Zt("dl",null,"properties detail-properties");return ds(t,n),t}function Yu(n,t){let e=Zt("details"),i=Zt("summary",n,"detail-section-title");return e.append(i,Zt("pre",typeof t=="string"?t:Ku(t),"json")),e}var q_;function bE(n){let t=Zt("button","Copy","icon-button");return t.addEventListener("click",async()=>{try{await navigator.clipboard.writeText(n),Jt("toast","Copied to clipboard")}catch{Jt("toast","Could not copy. Select the text to copy manually.")}ot("toast").hidden=!1,clearTimeout(q_),q_=setTimeout(()=>ot("toast").hidden=!0,2200)}),t}function Ia(n,t,e){let i=Zt("div",null,"detail-heading");i.append(Zt("div",n,"eyebrow"));let s=Zt("h2",t);if(s.id="detail-title",i.append(s),e){let r=Zt("div",null,"detail-hash");r.append(Zt("code",e),bE(e)),i.append(r)}return i}async function ME(n,t){let e=++Na,i=ot("detail-dialog"),s=ot("detail-content");s.replaceChildren(Ia("LOADING",n==="block"?"Block "+t:"Transaction")),i.open||(i.showModal(),pi&&Ho(i,{x:[35,0],opacity:[0,1]},{duration:.25})),i.scrollTop=0;try{let r=await Ys({kind:n==="block"?"blocks":"transactions",q:t,limit:1});if(e!==Na)return;let o=r.rows[0];if(!o){s.replaceChildren(Ia("NOT INDEXED",n==="block"?"Block "+t:"Transaction")),s.append(Zt("p","No indexed record yet. The index may be catching up, or this record may predate retained history.","empty-explainer"));return}if(n==="block"){let a=o.transactionCount??o.transactions;s.replaceChildren(Ia("COMMITTED BLOCK","Block #"+se(o.height),o.hash)),s.append(X_([["Transaction count",a===0?"0 \xB7 Empty block":se(a)],["Timestamp",new Date(o.timestamp*1e3).toLocaleString()],["Parent hash",Jr(Ua(o.parentHash),"#block/"+o.parentHash)],["State root",o.stateRoot]]));let l=Zt("h3",`Transactions (${se(a)})`,"detail-section-title");if(s.append(l),a===0){let c=Zt("div",null,"empty-explainer");c.append(Zt("strong","This is an empty block."),document.createTextNode("No transactions were included when this block was produced. The sequencer continues producing blocks while the stress generator prepares the next batch. This is not a missing transaction list.")),s.append(c);let u=Zt("button","Browse recent transactions \u2197","button primary mt-5");u.onclick=()=>ju("transactions"),s.append(u)}else{let c=Zt("div",null,"table-scroll"),u=Zt("button","Load more transactions \u2193","button mt-5");s.append(c,u);let f=null,h=[],m=!1,_=async()=>{if(!m){m=!0,u.disabled=!0;try{let S=await Ys({kind:"transactions",q:String(o.height),limit:50,...f||{}});if(e!==Na)return;h.push(...S.rows),f=S.next,l.textContent=`Transactions (${se(h.length)} of ${se(a)})`,c.replaceChildren(jd(h)),u.hidden=!f}catch{u.textContent="Retry loading transactions"}finally{m=!1,u.disabled=!1}}};u.onclick=_,await _()}s.append(Yu("Block metadata",{...o,transactions:void 0,transactionCount:a}))}else{let a=o.transaction,l=o.receipt;s.replaceChildren(Ia("SIGNED TRANSACTION","Transaction details",o.hash)),s.append(X_([["Status",Ju(l.success?"Success":"Reverted",l.success?"":"error")],["Block",Jr("#"+se(o.height),"#block/"+o.height,"block-link")],["Position in block",o.position],["From",l.from],["To",l.to||"Contract creation"],["Value",a.valueWei+" wei"],["Nonce",a.nonce],["Type",a.type===2?"EIP-1559 (type 2)":"Legacy (EIP-155)"],["Chain ID",a.chainId],["Gas used",se(l.gas_used)],["Gas limit",a.gasLimit],["Gas price / max fee",a.gasPriceWei+" wei"],["Contract created",l.contract_address||"None"]])),s.append(Yu("Input data",a.input),Yu(`Receipt \xB7 ${l.logs.length} event logs`,l),Yu("Raw signed transaction",o.raw))}}catch{e===Na&&s.replaceChildren(Ia("UNAVAILABLE","Could not load details"),Zt("p","The node may be stopped. Close and reopen this record to retry.","empty-explainer"))}}function ex(){let n=decodeURIComponent(location.hash.slice(1)||"overview");if(n.startsWith("block/")||n.startsWith("tx/")){let[t,...e]=n.split("/");ME(t,e.join("/"));return}Na++,ot("detail-dialog").open&&ot("detail-dialog").close(),tp(n),ms==="explorer"&&(J_?!fs.length&&!ps&&Fa():j_(!fs.length&&!Zu)),ms==="logs"&&Qu()}function ep(){location.hash=ms}async function Qu(n=!1){let t=++H_;n||($_=ot("log-query").value.trim(),qu=null),ot("logs-more").disabled=!0;try{let e=await Ys({kind:"logs",q:$_,limit:50,...n&&qu?{before:qu}:{}});if(t!==H_)return;Qd(e),n||ot("logs-results").replaceChildren();for(let i of e.rows){let s=Zt("details",null,"log-record"),r=Zt("summary");r.append(Zt("time",new Date(i.record.timestamp_ms).toLocaleString()),Ju(i.record.level,i.record.level==="error"?"error":""),Zt("strong",i.record.event)),s.append(r,Zt("pre",Ku(i.record),"json")),s.addEventListener("toggle",()=>{s.open&&(ot("live-logs").checked=!1)}),ot("logs-results").append(s)}qu=e.rows.at(-1)?.id,ot("logs-more").hidden=e.rows.length<50,Jt("log-status",`${se(e.indexedLogs)} indexed events \xB7 SQLite ${e.journalMode.toUpperCase()}`),!n&&!e.rows.length&&Nn(ot("logs-results"),"No matching events","Try an event name, level, or message word.")}catch{Jt("log-status","Log index unavailable \xB7 data may be stale")}finally{ot("logs-more").disabled=!1}}function Y_(n=!1){K_=null,Da("transaction-total",null);let t=n?"SQLite indexing is disabled":"SQLite index unavailable",e=n?"make stresstest runs with SQLite OFF. Use make stresstest2 for transaction search and indexed logs.":"The node is online, but indexed data is unavailable. Retrying automatically.";Jt("index-lag",t),ds(ot("index-details"),[["Status",t]]),Nn(ot("latest-transactions"),t,e),n&&(Nn(ot("explorer-results"),t,e),Nn(ot("logs-results"),t,e),Jt("block-picker-status",e),Jt("log-status",t))}async function nx(){if(!document.hidden){let n=!1;try{let t=await tx("/dashboard/stats");vE(t),n=!0,Jt("connection","\u25CF Node online"),ot("connection").classList.remove("stale"),Jt("updated",`Updated ${new Date().toLocaleTimeString()} \xB7 every 2s`)}catch{Jt("connection","Node unavailable"),ot("connection").classList.add("stale"),Jt("updated","Connection lost \xB7 displayed data may be stale")}if(n)if(Oa.runtime?.sqliteIndexerEnabled===!1)Y_(!0);else try{let t=await Ys({kind:"transactions",limit:6});Qd(t),t.rows.length?ot("latest-transactions").replaceChildren(jd(t.rows,!0)):Nn(ot("latest-transactions"),"No transactions yet","Transactions appear here once a block is indexed."),ms==="logs"&&ot("live-logs").checked&&!ot("detail-dialog").open&&await Qu()}catch{Y_()}}setTimeout(nx,2e3)}ot("explorer-form").onsubmit=n=>{n.preventDefault(),Fa()};ot("explorer-more").onclick=()=>Fa(!0);ot("recent-txs").onclick=()=>ju("transactions");ot("recent-blocks").onclick=()=>ju("blocks");ot("browse-blocks").onclick=()=>ju("blocks");ot("logs-form").onsubmit=n=>{n.preventDefault(),ot("live-logs").checked=!1,Qu()};ot("logs-more").onclick=()=>{ot("live-logs").checked=!1,Qu(!0)};ot("close-detail").onclick=ep;ot("detail-dialog").addEventListener("cancel",n=>{n.preventDefault(),ep()});ot("detail-dialog").addEventListener("click",n=>{n.target===ot("detail-dialog")&&n.clientX<ot("detail-dialog").getBoundingClientRect().left&&ep()});addEventListener("hashchange",ex);ot("block-picker").onchange=n=>{n.target.value&&Kd(n.target.value)};ot("block-jump-form").onsubmit=n=>{n.preventDefault(),Kd(ot("block-height").value.trim())};ot("refresh-block-picker").onclick=()=>j_(!ps&&!Zu);function TE(){let n=ot("orbit");try{let u=function(f){c=requestAnimationFrame(u),!(Oa?.runtime?.sqliteIndexerEnabled===!1||!pi||document.hidden||ms!=="overview"||ot("detail-dialog").open||f-a<50)&&(a=f,s.rotation.y=f*6e-5,t.render(e,i))},t=new Hu({canvas:n,alpha:!0,antialias:!1,powerPreference:"low-power"});t.setPixelRatio(Math.min(devicePixelRatio,1.5));let e=new ia,i=new je(40,1,.1,30);i.position.z=6;let s=new Pi,r=new Vr({color:10216139,transparent:!0,opacity:.24}),o=new fa(new pa(1.45,.22,8,60));s.add(new la(o,r)),s.rotation.x=.9,s.rotation.z=-.4,e.add(s);let a=0,l=new ResizeObserver(()=>{let f=n.clientWidth,h=n.clientHeight;f&&h&&(t.setSize(f,h,!1),i.aspect=f/h,i.updateProjectionMatrix())});l.observe(n);let c;c=requestAnimationFrame(u),addEventListener("pagehide",()=>{cancelAnimationFrame(c),l.disconnect(),o.dispose(),r.dispose(),t.dispose()},{once:!0})}catch{n.hidden=!0}}function np(){Jt("motion-toggle",pi?"Motion on":"Motion off"),ot("motion-toggle").setAttribute("aria-pressed",String(pi)),ot("orbit").hidden=!pi}ot("motion-toggle").onclick=()=>{pi=!pi,np()};Z_.addEventListener("change",n=>{pi=!n.matches,np()});np();ex();TE();nx();
/*! For license information please see dashboard.js.LEGAL.txt */
