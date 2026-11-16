// usage: node render.js stills | node render.js video <startFrame> <endFrame> <out.mp4>
const {chromium}=require('playwright');const fs=require('fs');const {spawn}=require('child_process');const path=require('path');
const FPS=30;const tl=JSON.parse(fs.readFileSync(path.join(__dirname,'build/timeline.json')));
(async()=>{
  const b=await chromium.launch();const pg=await b.newPage({viewport:{width:1920,height:1080}});
  pg.on('pageerror',e=>console.error('PAGEERR',e.message));
  await pg.goto('file://'+path.join(__dirname,'render.html'));
  await pg.evaluate(async t=>{setTL(t);await document.fonts.load('400 20px "JBM"');await document.fonts.load('700 20px "JBM"');await document.fonts.load('300 20px "JBM"');await document.fonts.ready},tl);
  const mode=process.argv[2];
  if(mode==='stills'){fs.mkdirSync(path.join(__dirname,'build/stills'),{recursive:true});
    for(const [k,s] of tl.entries()){const T=s.start+s.dur*.62;const d=await pg.evaluate(T=>frameJPEG(T),T);
      fs.writeFileSync(path.join(__dirname,`build/stills/${String(k).padStart(2,'0')}_${s.id}.jpg`),Buffer.from(d.split(',')[1],'base64'))}
  }else{const s=+process.argv[3],e=+process.argv[4],out=process.argv[5];
    const ff=spawn('ffmpeg',['-y','-loglevel','error','-f','image2pipe','-framerate',String(FPS),'-c:v','mjpeg','-i','-','-c:v','libx264','-preset','medium','-crf','18','-pix_fmt','yuv420p',out],{stdio:['pipe','inherit','inherit']});
    for(let f=s;f<e;f++){const d=await pg.evaluate(T=>frameJPEG(T),f/FPS);const buf=Buffer.from(d.split(',')[1],'base64');
      if(!ff.stdin.write(buf))await new Promise(r=>ff.stdin.once('drain',r));if(f%300===0)console.log(out,f)}
    ff.stdin.end();await new Promise(r=>ff.on('close',r));}
  await b.close();
})();
