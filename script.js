const photoInput = document.getElementById("photoInput");
const thumbs = document.getElementById("thumbs");
const paper = document.getElementById("paper");
const statusEl = document.getElementById("status");
const photoWidth = document.getElementById("photoWidth");
const photoHeight = document.getElementById("photoHeight");
const arrangeBtn = document.getElementById("arrangeBtn");
const preparePrintBtn = document.getElementById("preparePrintBtn");
const openPrintBtn = document.getElementById("openPrintBtn");
const printArea = document.getElementById("printArea");

let photos = [];
let isPrinting = false;
let isPrintPrepared = false;

photoInput.addEventListener("change", loadPhotos);
arrangeBtn.addEventListener("click", arrangePhotos);
preparePrintBtn.addEventListener("click", preparePrint);
openPrintBtn.addEventListener("click", openPrintPreview);

function setStatus(text){
  statusEl.textContent = text;
}

function setPrintReady(ready){
  isPrintPrepared = ready;
  openPrintBtn.hidden = !ready;
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
  setPrintReady(false);

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
  setPrintReady(false);

  if(photos.length === 0){
    setStatus("사진이 없습니다");
    return;
  }

  const placed = makeCells(paper);
  setStatus(`사진 ${placed}장 배치 완료`);
}

async function preparePrint(){
  if(photos.length === 0){
    setStatus("사진이 없습니다");
    return;
  }

  if(paper.children.length === 0){
    arrangePhotos();
  }

  printArea.innerHTML = "";

  const printPaper = document.createElement("div");
  printPaper.className = "printPaper";
  printArea.appendChild(printPaper);

  makeCells(printPaper);
  await waitImages(printArea);

  setPrintReady(true);
  setStatus("인쇄 준비 완료");
}

function openPrintPreview(){
  if(!isPrintPrepared){
    setStatus("먼저 인쇄 준비를 눌러주세요");
    return;
  }

  isPrinting = true;
  document.body.classList.add("printing");

  window.print();
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
  if(!isPrinting) return;

  isPrinting = false;
  document.body.classList.remove("printing");

  if(photos.length > 0 && paper.children.length === 0){
    arrangePhotos();
  }
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
