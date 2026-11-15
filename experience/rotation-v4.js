import * as THREE from './vendor/three.module.js';
import {GLTFLoader} from './vendor/GLTFLoader.js';
import {MeshoptDecoder} from './vendor/meshopt_decoder.module.js';
import {RoomEnvironment} from './vendor/RoomEnvironment.js';
import {toCreasedNormals} from './vendor/BufferGeometryUtils.js';

const host=document.querySelector('#viewer'),status=document.querySelector('#status'),labels=document.querySelector('#labels');
const renderer=new THREE.WebGLRenderer({antialias:true,alpha:true,powerPreference:'default'});
renderer.setPixelRatio(Math.min(devicePixelRatio,2));renderer.setClearColor(0x081722,0);renderer.outputColorSpace=THREE.SRGBColorSpace;renderer.toneMapping=THREE.ACESFilmicToneMapping;renderer.toneMappingExposure=.95;
host.prepend(renderer.domElement);renderer.domElement.setAttribute('aria-label','ドラッグで360度回せる車両モデル');renderer.domElement.style.touchAction='pan-y';
const scene=new THREE.Scene(),camera=new THREE.PerspectiveCamera(28,1,.05,100);camera.position.set(5,2.6,6);camera.lookAt(0,.75,0);
const pmrem=new THREE.PMREMGenerator(renderer);const room=new RoomEnvironment();scene.environment=pmrem.fromScene(room,.04).texture;room.dispose();pmrem.dispose();
scene.add(new THREE.HemisphereLight(0xddefff,0x27343d,1.5));const light=new THREE.DirectionalLight(0xfff8ed,2.3);light.position.set(3,7,4);scene.add(light);const rim=new THREE.DirectionalLight(0xb4d9fa,1.8);rim.position.set(-5,4,-3);scene.add(rim);
const pivot=new THREE.Group();scene.add(pivot);
const floor=new THREE.Mesh(new THREE.CircleGeometry(3.7,80),new THREE.MeshStandardMaterial({color:0x142c37,roughness:.32,metalness:.25,transparent:true,opacity:.72}));floor.rotation.x=-Math.PI/2;floor.position.y=-.015;floor.visible=false;scene.add(floor);const shadowCanvas=document.createElement("canvas");shadowCanvas.width=shadowCanvas.height=128;const sx=shadowCanvas.getContext("2d"),sg=sx.createRadialGradient(64,64,7,64,64,64);sg.addColorStop(0,"#000000bb");sg.addColorStop(1,"#00000000");sx.fillStyle=sg;sx.fillRect(0,0,128,128);const shadow=new THREE.Mesh(new THREE.PlaneGeometry(3.5,6),new THREE.MeshBasicMaterial({map:new THREE.CanvasTexture(shadowCanvas),transparent:true,depthWrite:false}));shadow.rotation.x=-Math.PI/2;shadow.position.y=-.01;scene.add(shadow);
const loader=new GLTFLoader();loader.setMeshoptDecoder(MeshoptDecoder);
const vehicles=await fetch(new URL('./models/vehicles.json',import.meta.url)).then(r=>{if(!r.ok)throw Error('車両情報の読込失敗');return r.json()});
const names={kei:'軽自動車の例：スズキ・キャリイ',sedan:'セダンの例：レクサス・ES',suv:'SUVの例：トヨタ・カローラ クロス',minivan:'ミニバンの例：Kia・カーニバル'};
let model='',pending='',body=null,dimensions=new THREE.Vector3(1.8,1.4,4.1),yaw=.12,targetYaw=.12,color='#aab9c4',token=0,drag=null,raf=0,last=0,active='';const paintMaterials=[],cache=new Map();
const serviceNames={rear:'リアガラス',wind:'フロントガラス',window:'サイドガラス',hood:'ボンネット',body:'ボディ',wheel:'ホイール',head:'ヘッドライト',mould:'窓まわりのモール',emblem:'フロントの装飾部'};
const points={rear:[0,1.18,-1.40],wind:[0,1.22,.60],window:[.79,1.15,-.12],hood:[0,.86,1.26],body:[.88,.62,-.12],wheel:[.88,.36,.99],head:[.55,.65,1.91],mould:[.77,1.30,-.40],emblem:[0,.58,2.00]};
const buttons=Object.entries(serviceNames).map(([id,label])=>{const b=document.createElement('button');b.className='point';b.type='button';b.title=label;b.setAttribute('aria-label',label);b.dataset.part=id;b.textContent='';const notify=hover=>parent.postMessage({type:'crystal-retro-point',id,hover,point:{x:parseFloat(b.style.left),y:parseFloat(b.style.top)}},'*');b.onclick=()=>{active=id;notify(false);draw()};b.addEventListener('pointerenter',e=>{if(e.pointerType!=='touch')notify(true)});b.addEventListener('pointerleave',()=>parent.postMessage({type:'crystal-retro-leave'},'*'));labels.append(b);return {id,b}});
function requestDraw(){if(!raf)raf=requestAnimationFrame(animate)}
function paint(){for(const m of paintMaterials){m.color.set(color);m.needsUpdate=true}draw()}
function applyMaterials(root,record){paintMaterials.length=0;root.traverse(o=>{if(!o.isMesh)return;o.geometry=toCreasedNormals(o.geometry,Math.PI/3);o.castShadow=true;o.receiveShadow=true;o.frustumCulled=false;let mats=Array.isArray(o.material)?o.material:[o.material];mats=mats.map(original=>{const m=original.clone();m.envMapIntensity=1.1;
 if(record.paint?.materials.includes(m.name)&&!record.paint.textured){const p=new THREE.MeshPhysicalMaterial({name:m.name,color,metalness:.45,roughness:.24,clearcoat:1,clearcoatRoughness:.13,side:m.side});paintMaterials.push(p);return p}
 if(/tire|tyre/i.test(m.name)){m.color.set('#151a20');m.roughness=.88;m.metalness=0}
 if(/window|^glass/i.test(m.name)){m.color.set('#1c3442');m.transparent=false;m.opacity=1;m.roughness=.18;m.metalness=.3;m.depthWrite=true}
 if(/headlight.*glass|headlights/i.test(m.name)){m.color.set('#cbdfe8');m.transparent=false;m.opacity=1;m.roughness=.17;m.metalness=.5}
 return m});o.material=Array.isArray(o.material)?mats:mats[0];});}
async function choose(key){if(!vehicles[key])return;if(model===key&&!pending){paint();return}if(pending===key)return;pending=key;const request=++token;status.hidden=false;status.textContent='車両を読み込んでいます…';
 try{let source=cache.get(key);if(!source){source=await loader.loadAsync(new URL('./models/'+vehicles[key].file,import.meta.url).href);cache.set(key,source)}if(request!==token)return;
 const root=source.scene.clone(true);if(key==='kei'){const discard=[];root.traverse(o=>{if(o.isMesh&&o.material?.name==='Zemin')discard.push(o)});discard.forEach(o=>o.removeFromParent());}root.updateMatrixWorld(true);let box=new THREE.Box3().setFromObject(root),size=box.getSize(new THREE.Vector3());
 // glTF assets are Y-up; normalize horizontal length and scale consistently.
 if(size.x>size.z)root.rotation.y=Math.PI/2;if(key==='minivan')root.rotation.y+=Math.PI;
 if(key==='kei'){let n=0,ax=0,az=0,xx=0,zz=0,xz=0;const v=new THREE.Vector3();root.traverse(o=>{if(!o.isMesh||o.material?.name!=='S_Boya')return;const a=o.geometry.attributes.position;for(let i=0;i<a.count;i+=3){v.fromBufferAttribute(a,i).applyMatrix4(o.matrixWorld);n++;ax+=v.x;az+=v.z;xx+=v.x*v.x;zz+=v.z*v.z;xz+=v.x*v.z;}});const theta=.5*Math.atan2(2*(xz-ax*az/n),(xx-ax*ax/n)-(zz-az*az/n));root.rotation.y=theta+Math.PI/2;}
 root.updateMatrixWorld(true);box=new THREE.Box3().setFromObject(root);size=box.getSize(new THREE.Vector3());root.scale.multiplyScalar(4.1/Math.max(size.x,size.z));root.updateMatrixWorld(true);box=new THREE.Box3().setFromObject(root);const center=box.getCenter(new THREE.Vector3());root.position.x-=center.x;root.position.z-=center.z;root.position.y-=box.min.y;
 root.updateMatrixWorld(true);dimensions=new THREE.Box3().setFromObject(root).getSize(new THREE.Vector3());applyMaterials(root,vehicles[key]);pivot.clear();pivot.add(root);body=root;model=key;pending='';yaw=targetYaw=.12;
 host.dataset.model=key;host.dataset.ready='true';document.querySelector('#model-name').textContent=names[key];status.hidden=true;parent.postMessage({type:'crystal-3d-ready',model:key},'*');requestDraw();
 }catch(e){if(request!==token)return;pending='';status.hidden=false;status.textContent='車両を読み込めませんでした。写真表示と部位名からの選択をご利用ください。';parent.postMessage({type:'crystal-3d-error',message:String(e.message)},'*');console.error(e);}}
function draw(){if(!body)return;pivot.rotation.y=yaw;pivot.updateMatrixWorld(true);renderer.render(scene,camera);host.dataset.yaw=String(yaw);const w=host.clientWidth,h=host.clientHeight;
 const H=dimensions.y,W=Math.min(2.15,dimensions.x);const locations={rear:[0,H*.79,-1.44],wind:[0,H*.83,model==='kei'?1.26:.55],window:[W*.40,H*.76,-.18],hood:[0,H*(model==='kei'?.50:.57),1.34],body:[W*.43,H*.48,-.20],wheel:[W*.43,H*.23,1.25],head:[W*.29,H*.43,1.89],mould:[W*.4,H*.83,-.45],emblem:[0,H*.36,2.00]};
 for(const {id,b} of buttons){const q=new THREE.Vector3(...locations[id]);q.applyMatrix4(pivot.matrixWorld);const facing=id==='rear'?Math.cos(yaw)<.35:(id==='head'||id==='emblem'||id==='hood')?Math.cos(yaw)>-.25:true;const v=q.project(camera);b.hidden=!facing||v.z>1;b.style.left=(v.x*.5+.5)*w+'px';b.style.top=(-v.y*.5+.5)*h+'px';b.classList.toggle('active',active===id);}
}
function animate(now){raf=0;const dt=Math.min(.05,(now-last)/1000||.016);last=now;const delta=targetYaw-yaw;yaw+=delta*(1-Math.exp(-dt*12));if(Math.abs(delta)<.0002)yaw=targetYaw;draw();if(Math.abs(targetYaw-yaw)>.0002)requestDraw()}
function resize(){const w=host.clientWidth,h=host.clientHeight;renderer.setSize(w,h,false);camera.aspect=w/h;camera.position.set(w/h<1.1?4.8:3.7,w/h<1.1?2.5:1.9,w/h<1.1?6.5:4.7);camera.lookAt(0,.78,0);camera.updateProjectionMatrix();draw()}
new ResizeObserver(resize).observe(host);resize();
renderer.domElement.addEventListener('pointerdown',e=>{drag={id:e.pointerId,x:e.clientX,y:e.clientY,start:targetYaw};renderer.domElement.setPointerCapture(e.pointerId);renderer.domElement.style.cursor='grabbing'});
renderer.domElement.addEventListener('pointermove',e=>{if(!drag||drag.id!==e.pointerId)return;targetYaw=drag.start+(e.clientX-drag.x)*.009;requestDraw()});
renderer.domElement.addEventListener('pointerup',()=>{drag=null;renderer.domElement.style.cursor='grab'});renderer.domElement.addEventListener('pointercancel',()=>{drag=null});
window.addEventListener('message',e=>{if(e.source!==parent)return;const d=e.data;if(d?.type==='crystal-retro-model')choose(d.model);if(d?.type==='crystal-retro-color'){color=d.hex;paint()}if(d?.type==='crystal-rotate'){targetYaw+=(d.direction<0?-1:1)*Math.PI/4;requestDraw()}if(d?.type==='crystal-view-rear'){targetYaw=Math.PI;active='rear';requestDraw()}if(d?.type==='crystal-view-front'){targetYaw=.12;requestDraw()}});
window.addEventListener('message',e=>{if(e.source===parent&&e.data?.type==='crystal-detail-cleared'){active='';draw()}});
window.addEventListener('keydown',e=>{if(e.key==='Escape')parent.postMessage({type:'crystal-detail-close'},'*')});
renderer.domElement.addEventListener('webglcontextlost',e=>{e.preventDefault();status.hidden=false;status.textContent='表示を再開するにはページを再読み込みしてください。'});
window.__crystal3D={choose,rotate:n=>{targetYaw+=n;requestDraw()},get state(){return {model,yaw,targetYaw,color,paintNames:paintMaterials.map(m=>m.name)}},get meshes(){const a=[];body?.traverse(o=>{if(o.isMesh){const b=new THREE.Box3().setFromObject(o),d=b.getSize(new THREE.Vector3()),c=b.getCenter(new THREE.Vector3());a.push({name:o.name,mat:o.material.name,size:d.toArray(),center:c.toArray()})}});return a}};
parent.postMessage({type:'crystal-3d-engine-ready'},'*');
choose('sedan');
