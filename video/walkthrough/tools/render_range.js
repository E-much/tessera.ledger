// Render a time range of a canvas scene (window.renderFrame) to mp4.  usage: node render_range.js <scene.html> <out.mp4> <start> <end> [fps]
const {chromium}=require('playwright');const {spawn}=require('child_process');const path=require('path');
const [scene,out,a,b,f]=process.argv.slice(2);const fps=+(f||30),t0=+a,t1=+b;
(async()=>{const br=await chromium.launch();const p=await br.newPage({viewport:{width:1920,height:1080}});
  await p.goto('file://'+path.resolve(scene)+'?render=1');await p.evaluate(()=>window.ready);
  const ff=spawn('ffmpeg',['-y','-loglevel','error','-f','image2pipe','-framerate',String(fps),'-c:v','mjpeg','-i','-','-c:v','libx264','-crf','14','-pix_fmt','yuv420p',out],{stdio:['pipe','inherit','inherit']});
  for(let i=0;i<Math.round((t1-t0)*fps);i++){const d=await p.evaluate(([t,i])=>{renderFrame(t,i);return document.getElementById('c').toDataURL('image/jpeg',0.96)},[t0+i/fps,i]);
    if(!ff.stdin.write(Buffer.from(d.slice(23),'base64')))await new Promise(r=>ff.stdin.once('drain',r));}
  ff.stdin.end();await new Promise(r=>ff.on('close',r));await br.close();console.log('ok',out)})();
