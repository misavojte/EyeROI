import {data} from "./model/eyeTrackingData.js";
import {ScarfController} from "./controller/scarfController.js";
import {ScarfView} from "./view/scarfView.js";

let worker = new Worker('js/worker.js');

document.getElementById('file-upload').addEventListener('change', onFileUploadChange, false);
document.getElementById('start-demo').addEventListener('click', startDemo, false);


function startDemo() {
    fetch("demodata.json")
        .then(response => {
            printDataCanvas();
            return response.json()
        })
        .then(x => {
            data.setData(x);
            printSequenceChart(0);
        })
}

function onFileUploadChange(e) {
    const files = e.target.files;
    if (files) {

        const filesuffix = files[0].name.split('.').pop();
        if (filesuffix === "json" && files.length === 1) {
            files[0].text().then(x => {
                    data.setData(JSON.parse(x));
                    printDataCanvas();
                    printSequenceChart(0)
                }
            );
        }
        if (filesuffix === "txt" || filesuffix === "tsv") {
            //POUPRAVIT
            //send number of files being processed
            worker.postMessage(files.length);

            if (processDataAsStream(files)) {
                printDataCanvas();
            }
        }
    }
}

worker.onmessage = (event) => {
    console.timeEnd("File parsed in:");
    data.setData(event.data);
    printSequenceChart(0);
}

function processDataAsStream(files) {
    console.time("File parsed in:");
    //transfer ReadableStream to worker
    try {
        for (let index = 0; index < files.length; index++) {
            const stream = files[index].stream();
            worker.postMessage(stream, [stream]);
        }
        return true
    } catch {
        alert("Error! Your browser does not support a vital function for parsing the data (ReadableStream is not supported as a transferable object). Try Chrome, Edge, Opera or updating your current browser.")
        return false
    }
}

function printSequenceChart(stimulusIndex) {

    if (document.getElementById('chartsec')) {
        document.getElementById('chartsec').remove()
    } else {
        document.getElementById('loader-wrap').remove();
    }
    let a = new ScarfController(stimulusIndex);
    new ScarfView(a).initNew();

}

// print new html elements functions
function printDataCanvas() {
    let dcanvas = document.getElementById('workplace');
    const html = `
    <h2 class='main-section ana-title'>Your analysis and visualization</h2>
    <div class='btnholder left-align main-section'>
        <button class='btn4 js-modal-save-workplace'>Save workplace</button>
    </div>
    <div id='workplace'>
    <div id='loader-wrap'>
        <div class='bars-7'></div>
        <div>Processing your precious data</div>
    </div>
    </div>`
    if (dcanvas) {
        dcanvas.innerHTML = html
    } else {
        dcanvas = document.createElement("section");
        dcanvas.classList = "anim";
        dcanvas.id = "analysis";
        dcanvas.innerHTML = html;
        document.querySelector('main')
            .insertBefore(dcanvas, document.getElementById('about'))
    }
    document.querySelector('.js-modal-save-workplace').addEventListener('click',()=>{
        showWorkplaceExporter()
    })
}

//TODO NAAPLIKOVAT V CONTROLLERU - MODAL
// function applyAoiModifications(stimulusIndex) {
//     let orderArr = [];
//     const aoiInputs = document.getElementById("aoiPopAttributesTable").getElementsByTagName("input");
//     const INPUTS_PER_LINE = 3; //per one aoi category in pop-up modifier
//     for (let i = 0; i < aoiInputs.length; i += INPUTS_PER_LINE) {
//         const aoiCategoryIndex = Number(aoiInputs[i + 2].value);
//         const colorValue = aoiInputs[i + 1].value;
//         const nameValue = aoiInputs[i].value;
//         data.setAoiColor(stimulusIndex, aoiCategoryIndex, colorValue);
//         data.setAoiName(stimulusIndex, aoiCategoryIndex, nameValue);
//         orderArr.push(aoiCategoryIndex); //order array
//     }
//     data.setAoiOrder(stimulusIndex, orderArr); //save order array
//     document.getElementsByClassName('chartwrap')[0].innerHTML = new ScarfPrinter(stimulusIndex).innerPlot; //repaint chart
//     closePopUp();
// }