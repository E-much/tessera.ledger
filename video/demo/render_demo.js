const {chromium}=require('playwright');const fs=require('fs');const path=require('path');const {spawn}=require('child_process');
const R=__dirname;const S=JSON.parse(fs.readFileSync(R+'/speech.json'));const mk=fs.readFileSync(R+'/../assets/tessera_mark.path.txt','utf8');
(async()=>{const b=await chromium.launch({args:['--allow-file-access-from-files']});const pg=await b.newPage({viewport:{width:1920,height:1080}});
 pg.on('pageerror',e=>console.error('PAGEERR',e.message));
 await pg.goto('file://'+R+'/demo.html');await pg.evaluate(async([s,m])=>{init(s,m);for(const w of[400,500,700])await document.fonts.load(`${w} 20px "Inter"`);await document.fonts.load('400 20px "JBM"')},[S,mk]);
 if(process.argv[2]==='still'){for(const t of [0.9,2.4,3.6])fs.writeFileSync(`${R}/still_${t}.jpg`,Buffer.from((await pg.evaluate(t=>frameJPEG(t),t)).split(',')[1],'base64'));await b.close();return}
 const ff=spawn('ffmpeg',['-y','-loglevel','error','-f','image2pipe','-framerate','30','-c:v','mjpeg','-i','-','-c:v','libx264','-crf','18','-pix_fmt','yuv420p',R+'/demo_video.mp4'],{stdio:['pipe','inherit','inherit']});
 for(let f=0;f<165;f++){const buf=Buffer.from((await pg.evaluate(t=>frameJPEG(t),f/30)).split(',')[1],'base64');if(!ff.stdin.write(buf))await new Promise(r=>ff.stdin.once('drain',r))}
 ff.stdin.end();await new Promise(r=>ff.on('close',r));await b.close()})();
