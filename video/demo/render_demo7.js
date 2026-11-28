const {chromium}=require('playwright');const fs=require('fs');const {spawn}=require('child_process');
const R=__dirname;const words=JSON.parse(fs.readFileSync(R+'/clip_words.json'));const mk=fs.readFileSync(R+'/../assets/tessera_mark.path.txt','utf8');
(async()=>{const b=await chromium.launch({args:['--allow-file-access-from-files']});const pg=await b.newPage({viewport:{width:1920,height:1080}});
 pg.on('pageerror',e=>console.error('PAGEERR',e.message));
 await pg.goto('file://'+R+'/demo7.html');await pg.evaluate(async([w,m])=>{init(w,m);for(const v of[400,500,800])await document.fonts.load(`${v} 20px "Inter Display"`);for(const v of[400,500,600,700])await document.fonts.load(v+' 20px "Outfit"');await document.fonts.load('400 20px "JBM"')},[words,mk]);
 const grab=async t=>Buffer.from((await pg.evaluate(t=>frameJPEG(t),t)).split(',')[1],'base64');
 if(process.argv[2]==='still'){for(const t of process.argv[3].split(',').map(Number))fs.writeFileSync(`${R}/d7_${t}.jpg`,await grab(t));await b.close();return}
 const N=Math.ceil((6.8+7.35-1.7)*30);
 const ff=spawn('ffmpeg',['-y','-loglevel','error','-f','image2pipe','-framerate','30','-c:v','mjpeg','-i','-','-c:v','libx264','-crf','18','-pix_fmt','yuv420p',R+'/demo7_video.mp4'],{stdio:['pipe','inherit','inherit']});
 for(let f=0;f<N;f++){const buf=await grab(f/30);if(!ff.stdin.write(buf))await new Promise(r=>ff.stdin.once('drain',r))}
 ff.stdin.end();await new Promise(r=>ff.on('close',r));await b.close()})();
