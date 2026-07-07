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
printBtn.addEventListener("click",printPaper);

function printPaper(){

    const printArea=document.getElementById("printArea");

    printArea.innerHTML="";

    const clone=paper.cloneNode(true);

    printArea.appendChild(clone);

    window.print();

    setTimeout(()=>{

        printArea.innerHTML="";

    },300);

}

function setStatus(text){
    statusText.textContent = text;
}

function clearPreview(){
    paper.innerHTML = "";
}

async function loadPhotos(e){

    photos = [];

    clearPreview();

    thumbnailArea.innerHTML = "";

    const files = [...e.target.files];

    if(files.length===0){
        setStatus("사진을 선택하세요.");
        return;
    }

    setStatus("사진 불러오는 중...");

    for(const file of files){

        const url = URL.createObjectURL(file);

        const img = new Image();

        await new Promise(resolve=>{

            img.onload = resolve;

            img.src = url;

        });

        photos.push(img);

        const thumb = document.createElement("img");

        thumb.className="thumb";

        thumb.src=url;

        thumbnailArea.appendChild(thumb);

    }

    setStatus(`${photos.length}장의 사진을 불러왔습니다.`);
}

function arrangePhotos(){

    clearPreview();

    if(photos.length===0){

        setStatus("사진이 없습니다.");

        return;

    }

    const w = Number(photoWidth.value);

    const h = Number(photoHeight.value);

    const cols = Math.floor(21 / w);

    const rows = Math.floor(29.7 / h);

    const max = cols * rows;

    let x=0;
    let y=0;

    photos.slice(0,max).forEach(photo=>{

        const cell=document.createElement("div");

        cell.className="photoCell";

        cell.style.width=`${(w/21)*100}%`;

        cell.style.height=`${(h/29.7)*100}%`;

        cell.style.left=`${(x*w/21)*100}%`;

        cell.style.top=`${(y*h/29.7)*100}%`;

        const image=document.createElement("img");

        image.src=photo.src;

        image.loading="lazy";

        image.draggable=false;

        cell.appendChild(image);

        paper.appendChild(cell);

        x++;

        if(x>=cols){

            x=0;

            y++;

        }

    });

    setStatus(`배치 완료 (${Math.min(photos.length,max)}장)`);

}

window.addEventListener("afterprint", () => {

    const printArea = document.getElementById("printArea");

    printArea.innerHTML = "";

    requestAnimationFrame(() => {

        arrangePhotos();

    });

});
