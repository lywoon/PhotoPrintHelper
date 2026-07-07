const photoInput = document.getElementById("photoInput");
const thumbnailArea = document.getElementById("thumbnailArea");
const paper = document.getElementById("paper");
const statusText = document.getElementById("statusText");

const photoWidth = document.getElementById("photoWidth");
const photoHeight = document.getElementById("photoHeight");

const arrangeBtn = document.getElementById("arrangeBtn");
const printBtn = document.getElementById("printBtn");

let photos = [];

photoInput.addEventListener("change", loadPhotos);
arrangeBtn.addEventListener("click", arrangePhotos);
printBtn.addEventListener("click", printPaper);

function setStatus(text){
    statusText.textContent = text;
}

function clearPreview(){
    paper.innerHTML = "";
}

function readFileAsDataURL(file){
    return new Promise((resolve, reject)=>{
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result);
        reader.onerror = reject;
        reader.readAsDataURL(file);
    });
}

function loadImage(src){
    return new Promise((resolve)=>{
        const img = new Image();
        img.onload = () => resolve(img);
        img.src = src;
    });
}

async function loadPhotos(e){
    photos = [];
    clearPreview();
    thumbnailArea.innerHTML = "";

    const files = [...e.target.files];

    if(files.length === 0){
        setStatus("사진을 선택하세요.");
        return;
    }

    setStatus("사진 불러오는 중...");

    for(const file of files){
        const src = await readFileAsDataURL(file);
        const img = await loadImage(src);

        photos.push({
            src,
            width: img.naturalWidth,
            height: img.naturalHeight
        });

        const thumb = document.createElement("img");
        thumb.className = "thumb";
        thumb.src = src;
        thumbnailArea.appendChild(thumb);
    }

    photoInput.value = "";
    setStatus(`${photos.length}장의 사진을 불러왔습니다.`);
}

function arrangePhotos(){
    clearPreview();

    if(photos.length === 0){
        setStatus("사진이 없습니다.");
        return;
    }

    const w = Number(photoWidth.value);
    const h = Number(photoHeight.value);

    const cols = Math.floor(21 / w);
    const rows = Math.floor(29.7 / h);
    const max = cols * rows;

    photos.slice(0, max).forEach((photo, index)=>{
        const x = index % cols;
        const y = Math.floor(index / cols);

        const cell = document.createElement("div");
        cell.className = "photoCell";

        cell.style.width = `${(w / 21) * 100}%`;
        cell.style.height = `${(h / 29.7) * 100}%`;
        cell.style.left = `${(x * w / 21) * 100}%`;
        cell.style.top = `${(y * h / 29.7) * 100}%`;

        const image = document.createElement("img");
        image.src = photo.src;
        image.draggable = false;

        cell.appendChild(image);
        paper.appendChild(cell);
    });

    setStatus(`배치 완료 (${Math.min(photos.length, max)}장)`);
}

async function printPaper(){
    if(paper.children.length === 0){
        arrangePhotos();
    }

    const printArea = document.getElementById("printArea");
    printArea.innerHTML = "";

    const printPaper = document.createElement("div");
    printPaper.className = "printPaper";

    printPaper.innerHTML = paper.innerHTML;
    printArea.appendChild(printPaper);

    await waitForImages(printArea);

    window.print();
}

function waitForImages(root){
    const images = [...root.querySelectorAll("img")];

    return Promise.all(images.map(img=>{
        if(img.complete) return Promise.resolve();

        return new Promise(resolve=>{
            img.onload = resolve;
            img.onerror = resolve;
        });
    }));
}

window.addEventListener("afterprint", ()=>{
    const printArea = document.getElementById("printArea");
    printArea.innerHTML = "";
});
