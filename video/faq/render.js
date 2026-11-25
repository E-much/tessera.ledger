// node faq/render.js still t1,t2,...  |  node faq/render.js video f0 f1 out.mp4
const {chromium}=require('playwright');const fs=require('fs');const path=require('path');const {spawn}=require('child_process');
const R=path.resolve(__dirname,'..');const tl=JSON.parse(fs.readFileSync(R+'/build/faq/timeline.json'));const mk=fs.readFileSync(R+'/assets/tessera_mark.path.txt','utf8');
(async()=>{const b=await chromium.launch({args:['--allow-file-access-from-files']});const pg=await b.newPage({viewport:{width:1920,height:1080}});
 pg.on('pageerror',e=>console.error('PAGEERR',e.message));
 await pg.goto('file://'+R+'/faq/render.html');
 await pg.evaluate(async([t,m])=>{for(const w of[400,500,600,700,800])await document.fonts.load(`${w} 20px "Inter Display"`);for(const w of[400,500,600,700])await document.fonts.load(`${w} 20px "Outfit"`);await document.fonts.load('400 20px "JBM"');await document.fonts.load('700 20px "JBM"');init(t,m)},[tl,mk]);
 const grab=async t=>Buffer.from((await pg.evaluate(t=>frameJPEG(t),t)).split(',')[1],'base64');
 if(process.argv[2]==='still'){fs.mkdirSync(R+'/build/faq/stills',{recursive:true});for(const t of process.argv[3].split(',').map(Number))fs.writeFileSync(`${R}/build/faq/stills/${t.toFixed(2).padStart(7,'0')}.jpg`,await grab(t));await b.close();return}
 const [f0,f1,out]=[+process.argv[3],+process.argv[4],process.argv[5]];
 const ff=spawn('ffmpeg',['-y','-loglevel','error','-f','image2pipe','-framerate','30','-c:v','mjpeg','-i','-','-c:v','libx264','-preset','medium','-crf','17','-pix_fmt','yuv420p',out],{stdio:['pipe','inherit','inherit']});
 for(let f=f0;f<f1;f++){const buf=await grab(f/30);if(!ff.stdin.write(buf))await new Promise(r=>ff.stdin.once('drain',r))}
 ff.stdin.end();await new Promise(r=>ff.on('close',r));await b.close()})();
