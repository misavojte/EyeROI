import {data} from "./model/eyeTrackingData.js";
import {DownloadScarfModal, DownloadWorkspaceModal} from "./view/modals.js";
import {ModalFormHandler} from "./controller/modalHandler.js";

let popup;

class ScarfPrinter {

    constructor(stimulusId = 0, showAoiVisibility = false, aoiBarHeight = 20, participGap = 10) {

        this.AOI_VISIBILITY_LINE_HEIGHT_AND_GAP = 5;

        this.stimulusId = stimulusId;
        this.aoiBarHeight = aoiBarHeight;
        this.participGap = participGap;
        this.spaceAboveRect = participGap / 2;
        this.showAoiVisibility = showAoiVisibility;
        this.noOfAois = data.main.aois.data[stimulusId].length; //neučesané no

        this.aoiOrderedArr = data.getAoiOrderArray(stimulusId);
        this.participHeight = aoiBarHeight + participGap;
        if (this.showAoiVisibility) {
            this.participHeight += ((this.AOI_VISIBILITY_LINE_HEIGHT_AND_GAP + 1) * this.noOfAois) + this.AOI_VISIBILITY_LINE_HEIGHT_AND_GAP;
        }

        //Y position of X axis in pixels
        this.noOfParticipants = data.noOfParticipants;
        this.xaxispos = this.noOfParticipants * this.participHeight; //Y position of X axis

        //calculate steps for X axis (absolute)
        this.stimulInfo = data.getStimulInfo(stimulusId);
        this.breakX = getSteps(this.stimulInfo.highestEndTime);
    }

    get wholePlot() {
        return `
        <h3 class="cardtitle">Sequence chart (Scarf plot)</h3>
        <div class="btnholder">
          <select id="SPstimulus" onchange="handleStimulusChange(this)">
            ${this.selectContent}
          </select>
          <div id="SPtoRelative" class="btn3" onclick='handleRelative(${this.stimulusId})'>
            <div class="btn3-absolute">Absolute timeline</div>
            <div class="btn3-relative">Relative timeline</div>
          </div>
            ${printSVGIcon("", "id='zoomInScarf' onclick='zoomScarf(1)'", '<path fill-rule="evenodd" d="M6.5 12a5.5 5.5 0 1 0 0-11 5.5 5.5 0 0 0 0 11zM13 6.5a6.5 6.5 0 1 1-13 0 6.5 6.5 0 0 1 13 0z"/><path d="M10.344 11.742c.03.04.062.078.098.115l3.85 3.85a1 1 0 0 0 1.415-1.414l-3.85-3.85a1.007 1.007 0 0 0-.115-.1 6.538 6.538 0 0 1-1.398 1.4z"/><path fill-rule="evenodd" d="M6.5 3a.5.5 0 0 1 .5.5V6h2.5a.5.5 0 0 1 0 1H7v2.5a.5.5 0 0 1-1 0V7H3.5a.5.5 0 0 1 0-1H6V3.5a.5.5 0 0 1 .5-.5z"/>')}
            ${printSVGIcon("deactivated", "id='zoomOutScarf' onclick='zoomScarf(0)'", '<path fill-rule="evenodd" d="M6.5 12a5.5 5.5 0 1 0 0-11 5.5 5.5 0 0 0 0 11zM13 6.5a6.5 6.5 0 1 1-13 0 6.5 6.5 0 0 1 13 0z"/><path d="M10.344 11.742c.03.04.062.078.098.115l3.85 3.85a1 1 0 0 0 1.415-1.414l-3.85-3.85a1.007 1.007 0 0 0-.115-.1 6.538 6.538 0 0 1-1.398 1.4z"/><path fill-rule="evenodd" d="M3 6.5a.5.5 0 0 1 .5-.5h6a.5.5 0 0 1 0 1h-6a.5.5 0 0 1-.5-.5z"/>')}
            ${printSVGIcon("download-scarf", "", '<path d="M.5 9.9a.5.5 0 0 1 .5.5v2.5a1 1 0 0 0 1 1h12a1 1 0 0 0 1-1v-2.5a.5.5 0 0 1 1 0v2.5a2 2 0 0 1-2 2H2a2 2 0 0 1-2-2v-2.5a.5.5 0 0 1 .5-.5z"/><path d="M7.646 11.854a.5.5 0 0 0 .708 0l3-3a.5.5 0 0 0-.708-.708L8.5 10.293V1.5a.5.5 0 0 0-1 0v8.793L5.354 8.146a.5.5 0 1 0-.708.708l3 3z"/>')}
            ${printSVGIcon("", "onclick='showScarfSettings(" + this.stimulusId + ")'", '<path fill-rule="evenodd" d="M10.5 1a.5.5 0 0 1 .5.5v4a.5.5 0 0 1-1 0V4H1.5a.5.5 0 0 1 0-1H10V1.5a.5.5 0 0 1 .5-.5ZM12 3.5a.5.5 0 0 1 .5-.5h2a.5.5 0 0 1 0 1h-2a.5.5 0 0 1-.5-.5Zm-6.5 2A.5.5 0 0 1 6 6v1.5h8.5a.5.5 0 0 1 0 1H6V10a.5.5 0 0 1-1 0V6a.5.5 0 0 1 .5-.5ZM1 8a.5.5 0 0 1 .5-.5h2a.5.5 0 0 1 0 1h-2A.5.5 0 0 1 1 8Zm9.5 2a.5.5 0 0 1 .5.5v4a.5.5 0 0 1-1 0V13H1.5a.5.5 0 0 1 0-1H10v-1.5a.5.5 0 0 1 .5-.5Zm1.5 2.5a.5.5 0 0 1 .5-.5h2a.5.5 0 0 1 0 1h-2a.5.5 0 0 1-.5-.5Z"/>')}
          </div>
        <div class="chartwrap">
          ${this.innerPlot}
        </div>`;
    }

    get selectContent() {
        const numberOfStimulu = data.main.stimuli.data.length;
        let response = "";
        for (let index = 0; index < numberOfStimulu; index++) {
            const name = data.getStimulName(index).displayedName;
            response += `<option value="${index}">${name}</option>`;
        }
        return response
    }

    get innerPlot() {
        const particiComponents = this.particiComponents;
        return `
        <div class='chylabs' style='grid-auto-rows:${this.participHeight}px' data-gap='${this.participHeight}'>
            ${particiComponents.labels}
        </div>
        <div class='charea-holder'>
          <svg xmlns='http://www.w3.org/2000/svg' id='charea' data-stimulus='${this.stimulusId}' width='100%' height='${this.xaxispos + 20}'>
            <animate id='chareaAni' attributeName='width' from='100%' to='100%' dur='0.3s' fill='freeze'/>
            <defs>
              <pattern id='grid' width="${(this.breakX.step / (this.breakX.numberOfSteps * this.breakX.step)) * 100}%" height="${this.participHeight}" patternUnits="userSpaceOnUse">
                <rect fill='none' width='100%' height='100%' stroke='#cbcbcb' stroke-width='1' />
              </pattern>
            </defs>
            <rect fill='url(#grid)' stroke='#cbcbcb' stroke-width='1' width='100%' height='${this.xaxispos}' />
            <svg y='${this.xaxispos + 6}' id='chxcomponent' class='chxlabs'>
              ${getXComponentOfScarf(this.xaxispos, this.breakX)}
            </svg>
            ${particiComponents.bars}
          </svg>
        </div>
        <div id='chxlab'>
          Elapsed time [ms]
        </div>
        <div class="chlegendwrap">
          ${this.legendContent}
        </div>`
    }

    get legendContent() {
        const noOfAois = this.aoiOrderedArr.length;
        let content = "";
        for (let i = 0; i < noOfAois; i++) {
            const currentAoiIndex = this.aoiOrderedArr[i];
            const aoiInfo = data.getAoiInfo(this.stimulusId, currentAoiIndex);
            content += `
      <div class="legendItem a${currentAoiIndex}" data-aoi="${currentAoiIndex}">
        <svg width="12" height="12">
          <rect class="a${currentAoiIndex}" width="100%" height="100%" fill="${aoiInfo.color}"/>
        </svg>
        <div>
          ${aoiInfo.displayedName}
        </div>
      </div>
      `
        }
        //FOR NO AOI HIT
        content += `
    <div class="legendItem aN" data-aoi="N">
      <svg width="12" height="12">
          <rect class="aN" width="100%" height="100%" fill="#a6a6a6"/>
      </svg>
      <div>
        No AOI hit
      </div>
    </div>
    `
        let result = `
    <div ondblclick='showAOImod(${this.stimulusId})'>
      <div class='chlegendtitle'>Fixations</div>
      <div class='chlegend'>
        ${content}
      </div>
    </div>
    <div ondblclick=''>
      <div class='chlegendtitle'>Other segment categories</div>
      <div class='chlegend'>
        ${this.otherCategoriesLegend}
      </div>
    </div>
      `

        if (this.showAoiVisibility) {
            result += `
      <div ondblclick=''>
        <div class='chlegendtitle'>AOIs visible at the moment</div>
        <div class='chlegend'>
          ${this.aoisVisibilityLegend}
        </div>
      </div>
      `
        }

        return result
    }

    get otherCategoriesLegend() {
        const catArrLength = data.main.categories.data.length;
        let nameOfOtherCategoriesGroup = [];
        for (let i = 2; i < catArrLength; i++) {
            nameOfOtherCategoriesGroup.push(data.getCatName(i).displayedName);
        }
        nameOfOtherCategoriesGroup = nameOfOtherCategoriesGroup.join(" / ");
        let content = "";
        content += `
    <div class="legendItem ac1" data-aoi="c1">
      <svg width="12" height="4">
        <rect class="ac1" width="100%" height="100%" fill="#555555"/>
      </svg>
      <div>
        Saccade
      </div>
    </div>
    `
        if (catArrLength > 2) {
            content += `
      <div class="legendItem acN" data-aoi="cN">
        <svg width="12" height="4">
          <rect class="acN" width="100%" height="100%" fill="#bcbcbc"/>
        </svg>
        <div>
          ${nameOfOtherCategoriesGroup}
        </div>
      </div>
      `
        }
        return content
    }

    get aoisVisibilityLegend() {
        const noOfAois = this.aoiOrderedArr.length;
        let content = "";
        for (let i = 0; i < noOfAois; i++) {
            const currentAoiIndex = this.aoiOrderedArr[i];
            const aoiInfo = data.getAoiInfo(this.stimulusId, currentAoiIndex);
            content += `
      <div class="legendItem a${currentAoiIndex}" data-aoi="${currentAoiIndex}">
        <svg width="12" height="12">
          <line class="a${currentAoiIndex}" x1="0" y1="50%" x2="12" y2="50%" stroke="${aoiInfo.color}" stroke-width="6" stroke-dasharray="1"></line>
        </svg>
        <div>
          ${aoiInfo.displayedName}
        </div>
      </div>
      `
        }
        return content
    }

    get particiComponents() {
        let ypos = -1 * this.participHeight;
        let bars = "";
        let labels = "";
        const maximumXValue = this.breakX.numberOfSteps * this.breakX.step;

        for (let k = 0; k < this.noOfParticipants; k++) {

            const sessionDuration = data.getParticEndTime(this.stimulusId, k);
            const particName = data.getParticName(k).displayedName;

            ypos += this.participHeight;

            if (sessionDuration) {
                const barWidth = ((sessionDuration / maximumXValue) * 100);
                bars += `
        <svg class='barwrap' y='${ypos}' data-pid='${k}' height='${this.participHeight}' width='${barWidth}%'>
          <animate attributeName='width' from='0%' to='${barWidth}%' dur='0.4s' fill='freeze'/>
          ${this.getParticipantSegments(k, sessionDuration)}
        </svg>
        `;
            } else {
                console.log(`Participant ${particName} has no AOI segments in stimulus`);
            }
            //create inner HTML string for Y main labels component
            //it will be inserted to SVG on the next lines
            labels += `<div>${particName}</div>`;

        }
        return {bars, labels}
    }

    getParticipantSegments(particId, particSessionDuration) {
        const noOfSegments = data.getNoOfSegments(this.stimulusId, particId);
        let segments = "";
        if (this.showAoiVisibility) {
            segments += this.getAoiVisibility(particSessionDuration);
        }
        for (let i = 0; i < noOfSegments; i++) {
            segments += this.getSegment(particId, i, particSessionDuration)
        }
        return segments
    }

    getSegment(particId, segmentId, particSessionDuration) {

        const segment = data.getSegmentInfo(this.stimulusId, particId, segmentId);

        //important values for positioning SVG element
        const xOfSegment = (segment.start / particSessionDuration) * 100;
        const widthOfSegment = ((segment.end - segment.start) / particSessionDuration) * 100;

        let htmlOfSegment;
        if (segment.category === 0) {
            //FIXATION
            htmlOfSegment = this.getFixationSegment(segment.aoi, xOfSegment, widthOfSegment);
        } else if (segment.category === 1) {
            //SACCADE
            htmlOfSegment = this.getSaccadeSegment(xOfSegment, widthOfSegment);
        } else {
            htmlOfSegment = this.getOtherSegment(xOfSegment, widthOfSegment);
        }

        return `<g class='sg' data-sid='${segmentId}'>${htmlOfSegment}</g>`
    }

    getFixationSegment(aois, xOfSegment, widthOfSegment) {
        //NO AOI HIT IN FIXATION
        if (aois.length === 0) {
            return `
      <rect class='aN' height='${this.aoiBarHeight}' fill='#bcbcbc' x='${xOfSegment}%' width='${widthOfSegment}%' y='${this.spaceAboveRect}'>
      </rect>
      `
        }
        //this is the segment allowing showing different AOIs
        const heightOfAoiRect = this.aoiBarHeight / aois.length;
        let yOfAoiRect = this.spaceAboveRect;
        let result = "";
        //going through all possible AOI categories in the selected stimulus
        //to ensure AOIs are ordered as specified by order array
        for (let aoiIndex = 0; aoiIndex < this.aoiOrderedArr.length; aoiIndex++) {
            const aoiId = this.aoiOrderedArr[aoiIndex];
            //coercing to string - otherwise would be always false!
            if (aois.includes(aoiId)) {
                const currentAoiFill = data.getAoiInfo(this.stimulusId, aoiId).color;
                result += `
        <rect class='a${aoiId}' height='${heightOfAoiRect}' fill='${currentAoiFill}' x='${xOfSegment}%' width='${widthOfSegment}%' y='${yOfAoiRect}'>
        </rect>`;
                yOfAoiRect += heightOfAoiRect;
            }
        }
        return result
    }

    getSaccadeSegment(xOfSegment, widthOfSegment) {
        const height = this.aoiBarHeight / 10;
        return `
    <rect class='ac1' height='${height}' fill='#555555' x='${xOfSegment}%' width='${widthOfSegment}%' y='${this.spaceAboveRect + this.aoiBarHeight / 2 - height / 2}'>
    </rect>
    `
    }

    getOtherSegment(xOfSegment, widthOfSegment) {
        const height = this.aoiBarHeight / 10;
        return `
    <rect class='acN' height='${height}' fill='#bcbcbc' x='${xOfSegment}%' width='${widthOfSegment}%' y='${this.spaceAboveRect + this.aoiBarHeight / 2 - height / 2}'>
    </rect>
    `
    }

    getAoiVisibility(particSessionDuration) {
        let yPositionOfLine = this.aoiBarHeight + this.AOI_VISIBILITY_LINE_HEIGHT_AND_GAP * 2;
        let component = "";

        for (let aoiIndex = 0; aoiIndex < this.noOfAois; aoiIndex++) {
            const aoiId = this.aoiOrderedArr[aoiIndex];
            const currentAoiFill = data.getAoiInfo(this.stimulusId, aoiId).color;
            const visibilityArr = data.main.aois.data[this.stimulusId][aoiId][3];
            for (let k = 0; k < visibilityArr.length; k += 2) {
                const start = (visibilityArr[k] / particSessionDuration) * 100;
                const end = (visibilityArr[k + 1] / particSessionDuration) * 100;
                component += `<line class="a${aoiId}" x1="${start}%" y1="${yPositionOfLine}" x2="${end}%" y2="${yPositionOfLine}" stroke="${currentAoiFill}" stroke-width="${this.AOI_VISIBILITY_LINE_HEIGHT_AND_GAP}" stroke-dasharray="1"/>`;
            }
            yPositionOfLine += this.AOI_VISIBILITY_LINE_HEIGHT_AND_GAP + 1;
        }
        return `
    <g>
     ${component}
    </g>
    `
    }

}

class AOIVisibilityReader {
    constructor(xml, stimulusId) {
        this.aoiNodes = xml.getElementsByTagName("DynamicAOI");
        this.stimulusId = stimulusId;
    }

    addVisInfo() {
        for (let i = 0; i < this.aoiNodes.length; i++) {
            const aoiName = this.aoiNodes[i].querySelector("Name").innerHTML;
            const aoiKeyFrames = this.aoiNodes[i].getElementsByTagName("KeyFrame");
            const aoiVisibilityArr = this.processKeyFrames(aoiKeyFrames);
            console.log(aoiName, aoiVisibilityArr);
            data.addAoiVis(this.stimulusId, aoiName, aoiVisibilityArr);
        }
    }

    processKeyFrames(keyFrames) {
        let visibilityArr = [];
        let isAoiCurrentlyVisible = false;
        for (let i = 0; i < keyFrames.length; i++) {
            const frame = keyFrames[i];
            const visibility = frame.querySelector("Visible").innerHTML;
            if (visibility === "true" && isAoiCurrentlyVisible === false) {
                const timestamp = frame.querySelector("Timestamp").innerHTML / 1000; //ms
                visibilityArr.push(timestamp);
                isAoiCurrentlyVisible = true;
            }
            if ((visibility === "false" && isAoiCurrentlyVisible === true)) {
                const timestamp = frame.querySelector("Timestamp").innerHTML / 1000; //ms
                visibilityArr.push(timestamp);
                isAoiCurrentlyVisible = false;
            }
            if ((visibility === "true" && i === keyFrames.length - 1)) {
                const timestamp = data.getStimulHighestEndTime(this.stimulusId);
                visibilityArr.push(timestamp);
                isAoiCurrentlyVisible = false;
            }
        }
        return visibilityArr
    }
}

//SVG icons from bootstrap
function printSVGIcon(className, attributeString, svgcontent) {
    return `
  <div class="svg-icon ${className}" ${attributeString}>
    <svg width="16" height="16" fill="currentColor" viewBox="0 0 16 16" xmlns="http://www.w3.org/2000/svg">
      ${svgcontent}
    </svg>
  </div>
  `
}


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

function newAoiVisInfo(event) {
    const file = event.target.files[0];
    const stimulusId = event.target.dataset.stimulus;
    if (file) {
        const filesuffix = file.name.split('.').pop();
        if (filesuffix === "xml") {
            file.text().then(x => {
                    const parser = new DOMParser();
                    const xml = parser.parseFromString(x, "application/xml");
                    new AOIVisibilityReader(xml, stimulusId).addVisInfo();
                    document.getElementById('chartsec').innerHTML = new ScarfPrinter(stimulusId, true).wholePlot;
                }
            );
        }
    }
    closePopUp();
}

function printSequenceChart(stimulusIndex) {

    let printer = new ScarfPrinter(stimulusIndex);
    //!!!!!



    let scarfPlotElement = document.createElement('div');
    scarfPlotElement.className = 'anh anim';
    scarfPlotElement.id = 'chartsec';
    scarfPlotElement.innerHTML = printer.wholePlot;
    scarfPlotElement.querySelector('.download-scarf').addEventListener('click',function () {
        showDownloadScarfPlotScreen(stimulusIndex)
    });

    if (document.getElementById('chartsec')) {
        document.getElementById('chartsec').remove()
    } else {
        document.getElementById('loader-wrap').remove();
    }

    document.getElementById('workplace').append(scarfPlotElement)
    //document.getElementById('chartsec').innerHTML = printer.wholePlot;
    //document.getElementById('chartsec').style.display = '';
    document.body.onmouseover = handler;
    //document.getElementById('charea').onmouseleave = handler2;

}

function handler(event) {
    const rect = event.target.closest('.sg');
    const legendItem = event.target.closest('.legendItem');
    const styleElement = document.querySelector('#charea style');
    // find the closest parent of the event target that
    // matches the selector
    if (event.target.closest('#datatooltip')) {
        return
    }
    if (rect) {
        const stimulusId = rect.parentElement.parentElement.dataset.stimulus;
        const participantId = rect.parentElement.dataset.pid;
        const segmentId = rect.dataset.sid;
        const innerHTML = getTooltipInnerHtml(stimulusId, participantId, segmentId);
        // handle class event
        if (typeof popup !== 'undefined') {
            popup.style.display = 'none';
            adjustPOPUP(innerHTML);
            popup.style.display = "";
        } else {
            // win = document.getElementsByClassName('chartwrap')[0];
            popup = document.createElement('div');
            popup.classList = 'popup';
            popup.id = 'datatooltip';
            adjustPOPUP(innerHTML);
            document.body.appendChild(popup);
        }
        return
    }

    if (styleElement) {
        styleElement.remove();
    }

    if (legendItem) {
        highlightAOIcategory();
    }

    if (popup) {
        popup.style.display = 'none';
    }

    function highlightAOIcategory() {
        const aoiId = legendItem.dataset.aoi;
        let styleElement = document.createElement('style');
        styleElement.innerHTML = `rect[class^='a']{opacity:0.2}rect.a${aoiId}{opacity:1;stroke:#0000007d}line[class^='a']{opacity:0.2}line.a${aoiId}{opacity:1;stroke-width:100%}`;
        document.getElementById('charea').append(styleElement);
    }

    function adjustPOPUP(innerHTML) {
        const rectBoundingBox = rect.getBoundingClientRect();
        popup.innerHTML = innerHTML;
        popup.style.top = window.scrollY + rectBoundingBox.bottom + "px";
        let xPosition = event.pageX;
        if (event.pageX + 155 > window.scrollX + document.body.clientWidth) {
            xPosition = window.scrollX + document.body.clientWidth - 155;
        }
        popup.style.left = xPosition + "px";
    }
}

function getTooltipInnerHtml(stimulusId, participantId, segmentId) {
    const participantName = data.getParticName(participantId).displayedName;
    const segInfo = data.getSegmentInfo(stimulusId, participantId, segmentId);
    const catName = data.getCatName(segInfo.category).displayedName;
    let aoiNames = "No AOI hit"
    if (segInfo.aoi.length > 0) {
        aoiNames = segInfo.aoi.map(x => data.getAoiInfo(stimulusId, x).displayedName).join(", ");
    }
    return `
  <div>
    <div>Participant</div>
    <div>${participantName}</div>
  </div>
  <div>
    <div>Category</div>
    <div>${catName}</div>
  </div>
  <div>
    <div>AOI</div>
    <div>${aoiNames}</div>
  </div>
  <div>
    <div>Event start</div>
    <div>${segInfo.start} ms</div>
  </div>
  <div>
    <div>Event end</div>
    <div>${segInfo.end} ms</div>
  </div>
  <div>
    <div>Event duration</div>
    <div>${(segInfo.end - segInfo.start).toFixed(1)} ms</div>
  </div>
  `
}

function getPrettyBreakStep(numberToBreak, numberOfSteps = 10) {
    let res = numberToBreak / numberOfSteps;
    let num_of_digits = (Math.log(res) * Math.LOG10E + 1 | 0) - 1;
    res = Math.ceil(res / (10 ** (num_of_digits)));
    if ((res % 2 === 1 && res % 5 > 0) && res !== 1) {
        res++
    }
    if (res % 6 === 0 || res % 8 === 0) {
        res = 10
    }
    return res * (10 ** (num_of_digits))
}

function getSteps(numberToBreak) {
    let numberOfSteps = 10;
    let recentStep = getPrettyBreakStep(numberToBreak, numberOfSteps);
    while (recentStep === getPrettyBreakStep(numberToBreak, numberOfSteps - 1)) {
        numberOfSteps--
    }
    return {numberOfSteps, step: recentStep}
}

//other event handlers
function handleRelative(stimulusId) {
    const timelineSwitch = document.getElementById('SPtoRelative');
    const yPos = data.noOfParticipants * 30; //PŘEDĚLAT DO BUDOUCNA, CELOU XCOMP DÁT DO CLASSU A TOTO ZDE NEZJIŠŤOVAT
    let barwrap = document.getElementsByClassName('barwrap');
    let isToRelative = false, maxDur = data.getStimulHighestEndTime(stimulusId), from, to, xComponentHtml;
    const absoluteSteps = getSteps(maxDur);

    if (!timelineSwitch.classList.contains('activebtn3')) {
        isToRelative = true;
        xComponentHtml = getXComponentOfScarf(yPos, {numberOfSteps: 10, step: 10});
        document.querySelector('pattern').setAttribute("width", "10%");
        document.getElementById('chxlab').innerHTML = 'Elapsed time [%]';
        timelineSwitch.classList.add('activebtn3')
    } else {
        xComponentHtml = getXComponentOfScarf(yPos, absoluteSteps);
        document.querySelector('pattern').setAttribute("width", (absoluteSteps.step / (absoluteSteps.numberOfSteps * absoluteSteps.step)) * 100 + "%");
        document.getElementById('chxlab').innerHTML = 'Elapsed time [ms]';
        timelineSwitch.classList.remove('activebtn3')
    }

    maxDur = absoluteSteps.numberOfSteps * absoluteSteps.step;

    for (let i = 0; i < barwrap.length; i++) {
        const participantId = barwrap[i].dataset.pid;
        const absoluteLength = (data.getParticEndTime(stimulusId, participantId) / maxDur) * 100;

        let animateTag = barwrap[i].getElementsByTagName('animate')[0];
        if (isToRelative) {
            to = 100;
            from = absoluteLength
        } else {
            from = 100;
            to = absoluteLength
        }
        from += "%";
        to += "%";

        barwrap[i].setAttribute('width', to); //because of the export function
        animateTag.setAttribute('from', from);
        animateTag.setAttribute('to', to);
        animateTag.beginElement();

    }

    document.getElementById('chxcomponent').innerHTML = xComponentHtml;
}

function getXComponentOfScarf(yPosition, breakX) {
    let labels = "", anchor = "text-anchor='start'";
    const maxDuration = breakX.numberOfSteps * breakX.step;
    for (let j = 0; j < breakX.numberOfSteps + 1; j++) {
        const currentStepX = (breakX.step * j);
        if (j === breakX.numberOfSteps) {
            anchor = "text-anchor='end'";
        }
        labels += "<text x='" + currentStepX / maxDuration * 100 + "%' " + anchor + ">" + currentStepX + "</text>"
        anchor = "text-anchor='middle'";
    }
    return labels
}


// print new html elements functions
function printDataCanvas() {
    let dcanvas = document.getElementById('analysis');
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

//export plot

function zoomScarf() {

    const zoomOutButton = document.getElementById('zoomOutScarf');
    const chartAnimation = document.getElementById('chareaAni');
    const fromChartWidth = chartAnimation.getAttribute('to').slice(0, -1);
    let toChartWidth = fromChartWidth;
    if (event.currentTarget.id === "zoomInScarf") {
        toChartWidth *= 2;
    } else {
        toChartWidth /= 2;
    }
    if (toChartWidth < 100) {
        zoomOutButton.classList.add('deactivated');
        return
    } else {
        zoomOutButton.classList.remove('deactivated');
    }
    chartAnimation.setAttribute('from', fromChartWidth + '%');
    chartAnimation.setAttribute('to', toChartWidth + '%');
    chartAnimation.beginElement();
}

function showPopUp(title, content) {
    let popUp = document.getElementById("modal");
    if (!popUp) {
        popUp = document.createElement('div');
        popUp.id = 'modal';
        popUp.classList = 'exterModal';
        document.body.appendChild(popUp);
    }
    popUp.innerHTML = `
    <div class="interModal">
      <div class="modalHeader">
        ${title}
        <div onclick="closePopUp()" class="modalClose">X</div>
      </div>
      ${content}
    </div>`;
    popUp.style.display = "";
}

function showScarfSettings(stimulusId) {
    const content = `
  <div style="margin-bottom:15px">
  <button onclick="showAOImod(${stimulusId})" class="btn4">
    Modify AOIs attributes
  </button>
  <button onclick="showAddAoiVis(${stimulusId})" class="btn4">
    Add AOIs visibility info
  </button>
  </div>
  `;
    showPopUp("Scarf Plot Settings", content)
}

function showAddAoiVis(stimulusId) {
    const content = `
  <div>
    Upload XML file containing AOIs visibility information. Only for SMI!
  </div>
  <label tabindex="0" for="aoivis-upload" class="btn">
    Upload file
  </label>
  <input onchange="newAoiVisInfo(event)" id="aoivis-upload" data-stimulus="${stimulusId}" type="file"/>
  `;
    showPopUp("Add AOI visibility info", content)
}

//todo ODPRASIT!
function showDownloadScarfPlotScreen(scarfId) {
    new DownloadScarfModal(scarfId,new ModalFormHandler()).initModal();
}

function showWorkplaceExporter() {
    new DownloadWorkspaceModal(new ModalFormHandler()).initModal();
}

function showAOImod(selectedStimulus) {
    //!!
    const aoiOrderedArr = data.getAoiOrderArray(selectedStimulus);

    const content = `
  <div class='gr-line'>
    <div>Original name</div>
    <div>Displayed name</div>
    <div>Color</div>
    <div>Order</div>
  </div>
  <div id='aoiPopAttributesTable'>
   ${getRows()}
  </div>
  <div class='btnholder'>
    <button onclick='applyAoiModifications(${selectedStimulus})' class='btn'>
      Apply changes
    </button>
  </div>`

    showPopUp("Modify AOIs' atributes", content);

    function getRows() {
        let content = "";
        for (let i = 0; i < aoiOrderedArr.length; i++) {

            const currentAoiIndex = aoiOrderedArr[i];
            const aoiInfo = data.getAoiInfo(selectedStimulus, currentAoiIndex);

            content += `
      <div class='gr-line'>
        <div>${aoiInfo.originalName}</div>
        <input type='text' value='${aoiInfo.displayedName}'>
        <input type='color' value='${aoiInfo.color}'>
        <input type='hidden' value='${currentAoiIndex}'>
        ${printSVGIcon("", "onclick='moveRowDown(event)'", '<polyline points="0,4 8,16 16,4" fill="none" stroke="currentColor" stroke-width="1"></polyline>')}
        ${printSVGIcon("", "onclick='moveRowUp(event)'", '<polyline points="0,14 8,2 16,14" fill="none" stroke="currentColor" stroke-width="1"></polyline>')}
      </div>`;
        }
        return content
    }
}

function handleStimulusChange(selectElement) {
    const stimulusId = selectElement.value;
    const printer = new ScarfPrinter(stimulusId);
    let relAbsButton = document.getElementById('SPtoRelative');
    relAbsButton.classList.remove("activebtn3");
    relAbsButton.setAttribute("onclick", `handleRelative(${stimulusId})`);
    document.getElementsByClassName('chartwrap')[0].innerHTML = printer.innerPlot;
}

function applyAoiModifications(stimulusIndex) {
    let orderArr = [];
    const aoiInputs = document.getElementById("aoiPopAttributesTable").getElementsByTagName("input");
    const INPUTS_PER_LINE = 3; //per one aoi category in pop-up modifier
    for (let i = 0; i < aoiInputs.length; i += INPUTS_PER_LINE) {
        const aoiCategoryIndex = Number(aoiInputs[i + 2].value);
        const colorValue = aoiInputs[i + 1].value;
        const nameValue = aoiInputs[i].value;
        data.setAoiColor(stimulusIndex, aoiCategoryIndex, colorValue);
        data.setAoiName(stimulusIndex, aoiCategoryIndex, nameValue);
        orderArr.push(aoiCategoryIndex); //order array
    }
    data.setAoiOrder(stimulusIndex, orderArr); //save order array
    document.getElementsByClassName('chartwrap')[0].innerHTML = new ScarfPrinter(stimulusIndex).innerPlot; //repaint chart
    closePopUp();
}

function moveRowDown(event) {
    let rowToMove = event.target.closest('.gr-line');
    if (rowToMove.nextElementSibling) {
        //move next row before the current one
        rowToMove.before(rowToMove.nextElementSibling)
    } else {
        rowToMove.parentElement.prepend(rowToMove)
    }
}

function moveRowUp(event) {
    let rowToMove = event.target.closest('.gr-line');
    if (rowToMove.previousElementSibling) {
        //move next row after the current one
        rowToMove.after(rowToMove.previousElementSibling)
    } else {
        rowToMove.parentElement.append(rowToMove)
    }
}