// Renders scene.html frame-by-frame and pipes JPEG frames into ffmpeg.
// usage: node render.js <fps> <out.mp4>
const {chromium}=require('playwright');const {spawn}=require('child_process');const path=require('path');
const fps=+(process.argv[2]||60), out=process.argv[3]||'frames.mp4', DUR=+(process.argv[4]||35);
(async()=>{
  const b=await chromium.launch();const p=await b.newPage({viewport:{width:1920,height:1080}});
  p.on('pageerror',e=>console.error('ERR',e.message));
  await p.goto('file://'+path.join(__dirname,'scene.html')+'?render=1');await p.evaluate(()=>window.ready);
  const ff=spawn('ffmpeg',['-y','-loglevel','error','-f','image2pipe','-framerate',String(fps),'-c:v','mjpeg','-i','-',
    '-c:v','libx264','-preset','slow','-crf','16','-pix_fmt','yuv420p',out],{stdio:['pipe','inherit','inherit']});
  const N=fps*DUR;
  for(let f=0;f<N;f++){
    const d=await p.evaluate(([t,f])=>{renderFrame(t,f);return document.getElementById('c').toDataURL('image/jpeg',0.96)},[f/fps,f]);
    if(!ff.stdin.write(Buffer.from(d.slice(23),'base64'))) await new Promise(r=>ff.stdin.once('drain',r));
    if(f%300==0)console.log('frame',f,'/',N);
  }
  ff.stdin.end();await new Promise(r=>ff.on('close',r));await b.close();console.log('done',out);
})();
