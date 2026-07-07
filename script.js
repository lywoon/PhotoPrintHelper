const photoInput = document.getElementById("photoInput");
const thumbs = document.getElementById("thumbs");
const paper = document.getElementById("paper");
const statusEl = document.getElementById("status");
const photoWidth = document.getElementById("photoWidth");
const photoHeight = document.getElementById("photoHeight");
const arrangeBtn = document.getElementById("arrangeBtn");
const printBtn = document.getElementById("printBtn");
const printArea = document.getElementById("printArea");

let photos = [];

photoInput.addEventListener("change", loadPhotos);
arrangeBtn.addEventListener("click", arrangePhotos);
printBtn.addEventListener("click", printPhotos);

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
    setStatus("대기중");
    return;
  }

  setStatus("사진 불러오는 중...");

  for(const file of files){
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
  }

  photoInput.value = "";
  setStatus(`${photos.length}장 불러옴`);
}

function makeCells(target){
  target.innerHTML = "";

  const w = Number(photoWidth.value);
  const h = Number(photoHeight.value);

  const cols = Math.floor(21 / w);
  const rows = Math.floor(29.7 / h);
  const max = cols * rows;

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
  setStatus(`배치 완료 (${placed}장)`);
}

async function printPhotos(){
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

  setTimeout(()=>{
    window.print();
  },400);
}

function waitImages(root){
  const imgs = Array.from(root.querySelectorAll("img"));

  return Promise.all(imgs.map(img=>{
    if(img.complete) return Promise.resolve();

    return new Promise(resolve=>{
      img.onload = resolve;
      img.onerror = resolve;
    });
  }));
}

function restore(){
  printArea.innerHTML = "";

  if(photos.length > 0 && paper.children.length === 0){
    arrangePhotos();
  }
}

window.addEventListener("afterprint",restore);
window.addEventListener("focus",restore);
document.addEventListener("visibilitychange",()=>{
  if(!document.hidden) restore();
});
