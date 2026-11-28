// node render_phone3d.js still t1,t2 | node render_phone3d.js video f0 f1 out.mp4   (60 fps)
const {chromium}=require('playwright');const fs=require('fs');const {spawn}=require('child_process');
const R=__dirname,FPS=60;const words=JSON.parse(fs.readFileSync(R+'/clip_words.json'));const mk=fs.readFileSync(R+'/../assets/tessera_mark.path.txt','utf8').trim();
(async()=>{const b=await chromium.launch({args:['--allow-file-access-from-files']});const pg=await b.newPage({viewport:{width:1920,height:1080}});
 pg.on('pageerror',e=>console.error('PAGEERR',e.message));
 await pg.goto('file://'+R+'/phone3d.html');await pg.evaluate(async([w,m])=>{for(const v of[400,500,600,700,800])await document.fonts.load(v+' 20px "Inter Display"');for(const v of[400,500,600,700])await document.fonts.load(v+' 20px "Outfit"');await document.fonts.load('700 20px "JBM"');init(w,m)},[words,mk]);
 const shot=async t=>{await pg.evaluate(t=>renderAt(t),t);return await pg.screenshot({type:'jpeg',quality:92})};
 if(process.argv[2]==='still'){for(const t of process.argv[3].split(',').map(Number))fs.writeFileSync(`${R}/p3_${t}.jpg`,await shot(t));await b.close();return}
 const [f0,f1,out]=[+process.argv[3],+process.argv[4],process.argv[5]];
 // motion blur: 4 sub-frames per frame across a 180-degree shutter, averaged by ffmpeg
 const SUB=4,SHUT=0.5;
 const ff=spawn('ffmpeg',['-y','-loglevel','error','-f','image2pipe','-framerate',String(FPS*SUB),'-c:v','mjpeg','-i','-',
   '-vf',`tmix=frames=${SUB}:weights='1 1 1 1',select='eq(mod(n\\,${SUB})\\,${SUB-1})',setpts=N/${FPS}/TB`,'-c:v','libx264','-crf','17','-pix_fmt','yuv420p','-r',String(FPS),out],{stdio:['pipe','inherit','inherit']});
 for(let f=f0;f<f1;f++)for(let k=0;k<SUB;k++){const buf=await shot(f/FPS+k*(SHUT/FPS)/SUB);if(!ff.stdin.write(buf))await new Promise(r=>ff.stdin.once('drain',r))}
 ff.stdin.end();await new Promise(r=>ff.on('close',r));await b.close()})();
