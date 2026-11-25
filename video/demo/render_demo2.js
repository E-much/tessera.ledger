const {chromium}=require('playwright');const fs=require('fs');const {spawn}=require('child_process');
const R=__dirname;const mk=fs.readFileSync(R+'/../assets/tessera_mark.path.txt','utf8');
(async()=>{const b=await chromium.launch({args:['--allow-file-access-from-files']});const pg=await b.newPage({viewport:{width:1920,height:1080}});
 pg.on('pageerror',e=>console.error('PAGEERR',e.message));
 await pg.goto('file://'+R+'/demo2.html');await pg.evaluate(async m=>{init(m);for(const w of[400,500,700])await document.fonts.load(`${w} 20px "Inter Display"`);await document.fonts.load('400 20px "JBM"')},mk);
 const grab=async t=>Buffer.from((await pg.evaluate(t=>frameJPEG(t),t)).split(',')[1],'base64');
 if(process.argv[2]==='still'){for(const t of process.argv[3].split(',').map(Number))fs.writeFileSync(`${R}/d2_${t}.jpg`,await grab(t));await b.close();return}
 const ff=spawn('ffmpeg',['-y','-loglevel','error','-f','image2pipe','-framerate','30','-c:v','mjpeg','-i','-','-c:v','libx264','-crf','17','-pix_fmt','yuv420p',R+'/demo2_video.mp4'],{stdio:['pipe','inherit','inherit']});
 for(let f=0;f<333;f++){const buf=await grab(f/30);if(!ff.stdin.write(buf))await new Promise(r=>ff.stdin.once('drain',r))}
 ff.stdin.end();await new Promise(r=>ff.on('close',r));await b.close()})();
