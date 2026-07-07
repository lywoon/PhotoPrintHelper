const photoInput = document.getElementById("photoInput");
const thumbs = document.getElementById("thumbs");
const paper = document.getElementById("paper");
const statusEl = document.getElementById("status");
const photoWidth = document.getElementById("photoWidth");
const photoHeight = document.getElementById("photoHeight");
const arrangeBtn = document.getElementById("arrangeBtn");
const printBtn = document.getElementById("printBtn");
const resetBtn = document.getElementById("resetBtn");
const printArea = document.getElementById("printArea");

let photos = [];
let isPrinting = false;
let shouldResetAfterPrint = false;

photoInput.addEventListener("change", loadPhotos);
arrangeBtn.addEventListener("click", arrangePhotos);
printBtn.addEventListener("click", printPhotos);
resetBtn.addEventListener("click", resetWork);

function setStatus(text){
  statusEl.textContent = text;
}

function readFile(file){
  return new Promise((resolve,reject)=>{
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

function loadImage(src){
  return new Promise(resolve=>{
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = () => resolve(img);
    img.src = src;
  });
}

async function loadPhotos(event){
  photos = [];
  thumbs.innerHTML = "";
  paper.innerHTML = "";
  printArea.innerHTML = "";

  const files = Array.from(event.target.files);

  if(files.length === 0){
    setStatus("배치 전");
    return;
  }

  setStatus("사진 불러오는 중...");

  for(const file of files){
    try{
      const src = await readFile(file);
      const img = await loadImage(src);

      photos.push({
        src,
        width: img.naturalWidth,
        height: img.naturalHeight
      });

      const thumb = document.createElement("img");
      thumb.className = "thumb";
      thumb.src = src;
      thumbs.appendChild(thumb);
    }catch(e){
      console.error(e);
    }
  }

  photoInput.value = "";
  setStatus(`${photos.length}장 불러옴`);
}

function getLayout(){
  const w = Number(photoWidth.value);
  const h = Number(photoHeight.value);
  const cols = Math.max(1, Math.floor(21 / w));
  const rows = Math.max(1, Math.floor(29.7 / h));
  const max = cols * rows;
  return {w,h,cols,rows,max};
}

function makeCells(target){
  target.innerHTML = "";
  const {w,h,cols,max} = getLayout();

  photos.slice(0,max).forEach((photo,index)=>{
    const x = index % cols;
    const y = Math.floor(index / cols);

    const cell = document.createElement("div");
    cell.className = "photoCell";
    cell.style.width = `${(w / 21) * 100}%`;
    cell.style.height = `${(h / 29.7) * 100}%`;
    cell.style.left = `${(x * w / 21) * 100}%`;
    cell.style.top = `${(y * h / 29.7) * 100}%`;

    const img = document.createElement("img");
    img.src = photo.src;
    img.draggable = false;

    cell.appendChild(img);
    target.appendChild(cell);
  });

  return Math.min(photos.length,max);
}

function arrangePhotos(){
  if(photos.length === 0){
    setStatus("사진이 없습니다");
    return;
  }

  const placed = makeCells(paper);
  setStatus(`사진 ${placed}장 배치 완료`);
}

async function printPhotos(){
  if(photos.length === 0){
    setStatus("사진이 없습니다");
    return;
  }

  if(paper.children.length === 0){
    arrangePhotos();
  }

  setStatus("인쇄 이미지 생성 중...");

  const dataUrl = await createPrintImage();

  printArea.innerHTML = "";

  const image = document.createElement("img");
  image.className = "printImage";
  image.src = dataUrl;
  printArea.appendChild(image);

  await waitImages(printArea);

  isPrinting = true;
  shouldResetAfterPrint = true;
  document.body.classList.add("printing");

  setStatus("인쇄 준비 완료");

  setTimeout(()=>{
    window.print();
  },600);
}

async function createPrintImage(){
  const {w,h,cols,max} = getLayout();

  const canvas = document.createElement("canvas");

  /* A4 비율 고정: 185mm x 261.6mm 인쇄영역에 맞춘 고해상도 이미지 */
  canvas.width = 1850;
  canvas.height = 2616;

  const ctx = canvas.getContext("2d");
  ctx.fillStyle = "#ffffff";
  ctx.fillRect(0,0,canvas.width,canvas.height);

  const pxPerCmX = canvas.width / 21;
  const pxPerCmY = canvas.height / 29.7;

  for(let i=0; i<Math.min(photos.length,max); i++){
    const photo = photos[i];
    const img = await loadImage(photo.src);

    const x = (i % cols) * w * pxPerCmX;
    const y = Math.floor(i / cols) * h * pxPerCmY;
    const cellW = w * pxPerCmX;
    const cellH = h * pxPerCmY;

    ctx.save();
    ctx.strokeStyle = "#999999";
    ctx.lineWidth = 2;
    ctx.strokeRect(x,y,cellW,cellH);

    const imgRatio = img.naturalWidth / img.naturalHeight;
    const cellRatio = cellW / cellH;

    let drawW, drawH, drawX, drawY;

    if(imgRatio > cellRatio){
      drawW = cellW;
      drawH = cellW / imgRatio;
      drawX = x;
      drawY = y + (cellH - drawH) / 2;
    }else{
      drawH = cellH;
      drawW = cellH * imgRatio;
      drawX = x + (cellW - drawW) / 2;
      drawY = y;
    }

    ctx.drawImage(img, drawX, drawY, drawW, drawH);
    ctx.restore();
  }

  return canvas.toDataURL("image/jpeg",0.96);
}

function waitImages(root){
  const imgs = Array.from(root.querySelectorAll("img"));

  return Promise.all(imgs.map(img=>{
    if(img.complete && img.naturalWidth > 0) return Promise.resolve();

    return new Promise(resolve=>{
      img.onload = resolve;
      img.onerror = resolve;
    });
  }));
}

function restoreAfterPrint(){
  if(!isPrinting && !shouldResetAfterPrint) return;

  isPrinting = false;
  document.body.classList.remove("printing");

  if(shouldResetAfterPrint){
    shouldResetAfterPrint = false;
    resetWork();
    return;
  }

  printArea.innerHTML = "";
}

function resetWork(){
  photos = [];
  thumbs.innerHTML = "";
  paper.innerHTML = "";
  printArea.innerHTML = "";
  photoInput.value = "";
  setStatus("배치 전");
}

window.addEventListener("afterprint", restoreAfterPrint);

if(window.matchMedia){
  const mediaQuery = window.matchMedia("print");

  if(mediaQuery.addEventListener){
    mediaQuery.addEventListener("change", event=>{
      if(!event.matches){
        restoreAfterPrint();
      }
    });
  }else if(mediaQuery.addListener){
    mediaQuery.addListener(event=>{
      if(!event.matches){
        restoreAfterPrint();
      }
    });
  }
}
