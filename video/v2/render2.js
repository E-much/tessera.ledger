// node v2/render2.js stills t1,t2,...   |   node v2/render2.js video <f0> <f1> <out.mp4>
const {chromium}=require('playwright');const fs=require('fs');const path=require('path');const {spawn}=require('child_process');
const R=path.resolve(__dirname,'..');const edl=JSON.parse(fs.readFileSync(R+'/build/v2/edl.json'));const mk=fs.readFileSync(R+'/assets/tessera_mark.path.txt','utf8');
(async()=>{const b=await chromium.launch({args:['--allow-file-access-from-files']});const pg=await b.newPage({viewport:{width:1920,height:1080}});
  pg.on('pageerror',e=>console.error('PAGEERR',e.message));pg.on('console',m=>{if(m.type()==='error')console.error('CONSOLE',m.text())});
  await pg.goto('file://'+R+'/v2/render2.html');
  await pg.evaluate(async([e,m])=>{init(e,m);for(const w of [300,400,500,700,800,900])await document.fonts.load(`${w} 20px "Inter"`);await document.fonts.load('300 20px "JBM"');await document.fonts.load('500 20px "JBM"');},[edl,mk]);
  const grab=async T=>Buffer.from((await pg.evaluate(T=>frameJPEG(T),T)).split(',')[1],'base64');
  if(process.argv[2]==='stills'){fs.mkdirSync(R+'/build/v2/stills',{recursive:true});
    for(const t of process.argv[3].split(',').map(Number))fs.writeFileSync(`${R}/build/v2/stills/${t.toFixed(2)}.jpg`,await grab(t));}
  else{const [s,e,out]=[+process.argv[3],+process.argv[4],process.argv[5]];
    const ff=spawn('ffmpeg',['-y','-loglevel','error','-f','image2pipe','-framerate','30','-c:v','mjpeg','-i','-','-c:v','libx264','-preset','medium','-crf','17','-pix_fmt','yuv420p',out],{stdio:['pipe','inherit','inherit']});
    for(let f=s;f<e;f++){const buf=await grab(f/30);if(!ff.stdin.write(buf))await new Promise(r=>ff.stdin.once('drain',r));if(f%600===0)console.log(out,f)}
    ff.stdin.end();await new Promise(r=>ff.on('close',r));}
  await b.close()})();
