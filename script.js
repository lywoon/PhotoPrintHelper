const photoInput = document.getElementById("photoInput");
const thumbnailArea = document.getElementById("thumbnailArea");
const preview = document.getElementById("a4Preview");

const photoWidth = document.getElementById("photoWidth");
const photoHeight = document.getElementById("photoHeight");

const photoCount = document.getElementById("photoCount");
const maxCount = document.getElementById("maxCount");

const statusText = document.getElementById("statusText");

const autoArrangeButton =
document.getElementById("autoArrangeButton");

const printButton =
document.getElementById("printButton");

let imageList = [];

photoInput.addEventListener("change", loadImages);

autoArrangeButton.addEventListener("click", arrangeImages);

printButton.addEventListener("click", () => {

    window.print();

});

function loadImages(e){

    imageList = [];

    thumbnailArea.innerHTML = "";

    preview.innerHTML = "";

    const files = [...e.target.files];

    if(files.length===0){

        updateStatus("사진을 선택하세요.");

        return;

    }

    photoCount.textContent = files.length;

    updateStatus("사진 불러오는 중...");

    let loaded = 0;

    files.forEach(file=>{

        const reader = new FileReader();

        reader.onload = function(event){

            const img = new Image();

            img.onload=function(){

                imageList.push(img);

                const thumb=document.createElement("img");

                thumb.src=event.target.result;

                thumb.className="thumb";

                thumbnailArea.appendChild(thumb);

                loaded++;

                if(loaded===files.length){

                    updateStatus("사진 불러오기 완료");

                }

            }

            img.src=event.target.result;

        }

        reader.readAsDataURL(file);

    });

}

function arrangeImages(){

    preview.innerHTML="";

    if(imageList.length===0){

        updateStatus("사진이 없습니다.");

        return;

    }

    const cellWidth=parseFloat(photoWidth.value);

    const cellHeight=parseFloat(photoHeight.value);

    const cols=Math.floor(21/cellWidth);

    const rows=Math.floor(29.7/cellHeight);

    const capacity=cols*rows;

    maxCount.textContent=capacity;

    imageList.forEach((img,index)=>{

        if(index>=capacity) return;

        const frame=document.createElement("div");

        frame.className="photoCell";

        frame.style.width=(cellWidth/21*100)+"%";

        frame.style.height=(cellHeight/29.7*100)+"%";

        frame.style.left=((index%cols)*cellWidth/21*100)+"%";

        frame.style.top=(Math.floor(index/cols)*cellHeight/29.7*100)+"%";

        const image=document.createElement("img");

        image.src=img.src;

        image.draggable=false;

        frame.appendChild(image);

        preview.appendChild(frame);

    });

    updateStatus("A4 배치 완료");

}

function updateStatus(text){

    statusText.textContent=text;

}
