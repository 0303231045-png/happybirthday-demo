const canvas=document.getElementById('canvas');
const ctx=canvas.getContext('2d');
function resize(){
  canvas.width=window.innerWidth-260;
  canvas.height=window.innerHeight;
}
resize();
window.addEventListener('resize',resize);

let particles=[];
function buildText(txt,color){
  particles=[];
  const off=document.createElement('canvas');
  const offCtx=off.getContext('2d');
  off.width=canvas.width;
  off.height=canvas.height;
  offCtx.font='bold 120px sans-serif';
  offCtx.textAlign='center';
  offCtx.textBaseline='middle';
  offCtx.fillStyle='white';
  offCtx.fillText(txt,off.width/2,off.height/2);
  const data=offCtx.getImageData(0,0,off.width,off.height).data;
  for(let y=0;y<off.height;y+=6){
    for(let x=0;x<off.width;x+=6){
      const i=(y*off.width+x)*4;
      if(data[i+3]>128){
        particles.push({x,y,color});
      }
    }
  }
}
function animate(){
  ctx.clearRect(0,0,canvas.width,canvas.height);
  particles.forEach(p=>{
    ctx.fillStyle=p.color;
    ctx.fillRect(p.x,p.y,4,4);
  });
  requestAnimationFrame(animate);
}
animate();

document.getElementById('textMain').addEventListener('input',e=>{
  buildText(e.target.value,document.getElementById('textColor').value)
});
document.getElementById('textColor').addEventListener('input',e=>{
  buildText(document.getElementById('textMain').value,e.target.value)
});
document.getElementById('addMosaic').addEventListener('click',()=>{
  buildText(document.getElementById('textMain').value,document.getElementById('textColor').value)
});
document.getElementById('savePNG').addEventListener('click',()=>{
  const a=document.createElement('a');
  a.href=canvas.toDataURL("image/png");
  a.download="happybirthday.png";
  a.click();
});