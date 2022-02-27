"use strict";

var aoiSegments;
var aoiCategories;
var participants;
var stimulus;
var popup;

//var testArr = [];

let worker = new Worker('js/worker.js');

document.getElementById('file-upload').addEventListener('change',onFileUploadChange,false);
document.getElementById('start-demo').addEventListener('click',startDemo,false);


function pushNewArraysToMainData() {
  participants.sessionDuration.push([]);
  participants.highestAOISegmentId.push([]);
  participants.aoiSegmentIDStart.push([]);
  aoiSegments.startTime.push([]);
  aoiSegments.endTime.push([]);
  aoiSegments.AOIid.push([]);
}

function processParticipantsMaxDurations() {
  //get maximu length of session - used for SVG chart
  for (var i = 0; i < stimulus.names.length; i++) {
    //filter out undefineds, nulls
    const filteredDurs = participants.sessionDuration[i].filter(x=>(x));
    participants.maxDuration[i] = Math.max(...filteredDurs);
  }
}

function startDemo() {
  fetch("demodata.json")
  .then(response => {
    printDataCanvas();
    return response.json()
  })
  .then(data => {
    participants = data[0];
    aoiCategories = data[1];
    stimulus = data[2];
    aoiSegments = data[3];
    printSequenceChart();
  })
}

function onFileUploadChange(e) {
console.time("File loaded");
const file = e.target.files[0];
if (file) {

  const filesuffix = file.name.split('.').pop();

  //initDataObjects(); //for eventual re-uploading of different data file
  printDataCanvas();
  // printNewAniOutput('h3', 'anl', 1, 'Input eye-tracking data');
  // printNewAniOutput('div', 'metricfield', 1, ('<span>File:</span><span>' + file.name + " (" + file.size/1000 + " kB)</span>"));

    if (filesuffix === "txt" || filesuffix === "tsv") {
      processDataAsStream(file.stream());
      //file.text().then(x=>preprocess_TXT(x));
    }
}
}

  //console.log(spl.filter(function(value,index) {return value[2]=="P01";}));

worker.onmessage = (event) => {
  console.timeEnd("File processed and parsed");
  worker.postMessage("init"); //null vals
  participants = event.data[0];
  aoiCategories = event.data[2];
  stimulus = event.data[1];
  aoiSegments = event.data[3];
  processFinalData();
  processParticipantsMaxDurations();
  printSequenceChart();
}

function processDataAsStream(readableStream) {
  const reader = readableStream.getReader();
  const pump = reader => reader.read()
  .then(({ value, done }) => {
    //last chunk? end this
    if (done) {
      worker.postMessage("getEyeTrackingData");
      return
    }
    worker.postMessage(value,[value.buffer]);
    return pump(reader)
  })
  return pump(reader)
}

function processFinalData() {
  //get last index of segments for participants
  let endSegmentIds = [];
  let highestTime = [];

  for (var stimulusId = 0; stimulusId < stimulus.names.length; stimulusId++) {
    let stimulusStarts = participants.aoiSegmentIDStart[stimulusId];
    endSegmentIds.push([]);
    highestTime.push([]);
    for (var k = 0; k < stimulusStarts.length; k++) {
      //potenciální problém, pokud jen jedna sekce??
      let endSegment = stimulusStarts[k+1] - 1;
      if (stimulusStarts[k] === undefined) {
        //remove empty spaces from array
        participants.aoiSegmentIDStart[stimulusId][k] = null;
        endSegment = null
      } else if (!endSegment) {
          for (var e = 2; !endSegment && e - 2 < stimulusStarts.length; e++) {
            if (k < stimulusStarts.length - 1) {
              endSegment = stimulusStarts[k+e] - 1;
            } else {
              endSegment = aoiSegments.endTime[stimulusId].length - 1;
            }
          }
      }
      endSegmentIds[stimulusId].push(endSegment);
      highestTime[stimulusId].push(aoiSegments.endTime[stimulusId][endSegment]);
    }
  }
  participants.highestAOISegmentId = endSegmentIds;
  participants.sessionDuration = highestTime
}

function printSequenceChart() {
  const downloadIcon = '<svg onclick="showDownloadScarfPlotScreen()" xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" class="btn4" viewBox="0 0 16 16"><path d="M.5 9.9a.5.5 0 0 1 .5.5v2.5a1 1 0 0 0 1 1h12a1 1 0 0 0 1-1v-2.5a.5.5 0 0 1 1 0v2.5a2 2 0 0 1-2 2H2a2 2 0 0 1-2-2v-2.5a.5.5 0 0 1 .5-.5z"/><path d="M7.646 11.854a.5.5 0 0 0 .708 0l3-3a.5.5 0 0 0-.708-.708L8.5 10.293V1.5a.5.5 0 0 0-1 0v8.793L5.354 8.146a.5.5 0 1 0-.708.708l3 3z"/></svg>';
  const zoomInIcon = '<svg id="zoomInScarf" xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" class="btn4" viewBox="0 0 16 16"><path fill-rule="evenodd" d="M6.5 12a5.5 5.5 0 1 0 0-11 5.5 5.5 0 0 0 0 11zM13 6.5a6.5 6.5 0 1 1-13 0 6.5 6.5 0 0 1 13 0z"/><path d="M10.344 11.742c.03.04.062.078.098.115l3.85 3.85a1 1 0 0 0 1.415-1.414l-3.85-3.85a1.007 1.007 0 0 0-.115-.1 6.538 6.538 0 0 1-1.398 1.4z"/><path fill-rule="evenodd" d="M6.5 3a.5.5 0 0 1 .5.5V6h2.5a.5.5 0 0 1 0 1H7v2.5a.5.5 0 0 1-1 0V7H3.5a.5.5 0 0 1 0-1H6V3.5a.5.5 0 0 1 .5-.5z"/></svg>';
  const zoomOutIcon = '<svg id="zoomOutScarf" xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" class="btn4 deactivated" viewBox="0 0 16 16"><path fill-rule="evenodd" d="M6.5 12a5.5 5.5 0 1 0 0-11 5.5 5.5 0 0 0 0 11zM13 6.5a6.5 6.5 0 1 1-13 0 6.5 6.5 0 0 1 13 0z"/><path d="M10.344 11.742c.03.04.062.078.098.115l3.85 3.85a1 1 0 0 0 1.415-1.414l-3.85-3.85a1.007 1.007 0 0 0-.115-.1 6.538 6.538 0 0 1-1.398 1.4z"/><path fill-rule="evenodd" d="M3 6.5a.5.5 0 0 1 .5-.5h6a.5.5 0 0 1 0 1h-6a.5.5 0 0 1-.5-.5z"/></svg>';
  const select = '<select onchange="handleStimulusChange(this)" id="SPstimulus">'+stimulus.names.map((item, index)=>{
    let selected = '';
    if (stimulus.currentlySelected === index) {
      selected = 'selected'
    }
    return '<option value="'+index+'" '+selected+'>'+item+'</option>';}).join('')+'</select>';
  let inner = '<h3 class="cardtitle">Sequence chart (Scarf plot)</h3>';
  inner += '<div class="btnholder">'+select+'<div id="SPtoRelative" class="btn3"><div class="btn3-absolute">Absolute timeline</div><div class="btn3-relative">Relative timeline</div></div>'+zoomInIcon+zoomOutIcon+downloadIcon+'</div>';
  inner += '<div class="chartwrap">';
  inner += paintAbsoluteBars();
  inner += '</div>';
  document.getElementById('loader-wrap').remove();
  document.getElementById('chartsec').innerHTML = inner;
  document.getElementById('chartsec').style.display = '';
  document.body.onmouseover = handler;
  //document.getElementById('charea').onmouseleave = handler2;
  document.getElementById('SPtoRelative').onclick = handleRelative;
  document.getElementById('zoomInScarf').onclick = zoomScarf;
  document.getElementById('zoomOutScarf').onclick = zoomScarf;
}

function paintAbsoluteBars() {

  let ypos = -30;
  let xaxispos = participants.names.length*30;
  let str_vedlej_gridX = "";
  let str_labels_gridX = "";
  let yLabInnerStr = "";
  let gapForYLabs = 30;
  let segStart;
  let segEnd;
  let maxDuration = participants.maxDuration[stimulus.currentlySelected];
  let writtenGradients = [];
  let gradientComponent = "";

  let str = "<div class='charea-holder'><svg xmlns='http://www.w3.org/2000/svg' id='charea' style='overflow:visible' width='100%' height='" + (xaxispos + 20) + "'>";
  str += "<animate id='chareaAni' attributeName='width' from='100%' to='100%' dur='0.3s' fill='freeze'/>"
  str += "<g><line class='gr y-gr' stroke='#cbcbcb' stroke-width='1'  x1='0' x2='100%' y1='" + xaxispos + "' y2='" + xaxispos + "'></line>></g>";

  //add X axes labels and support Y axes
  //Y axes will be rendered under the sequence bars
  // let tanchor = "text-anchor='start'";
  const breakX = getSteps(maxDuration);
  maxDuration = breakX.step * breakX.numberOfSteps; //x axis length

  str += "<g id='chxcomponent'>" + getXComponentOfScarf(xaxispos, breakX) + "</g>";

  for (var k = 0; k < participants.names.length; k++) {
    segStart = participants.aoiSegmentIDStart[stimulus.currentlySelected][k];
    segEnd = participants.highestAOISegmentId[stimulus.currentlySelected][k];
    ypos += 30;
    if (segEnd) {

      str += "<svg class='barwrap' y='" + ypos + "' data-pid='" + k + "' width='" + ((participants.sessionDuration[stimulus.currentlySelected][k]/maxDuration)*100) +"%'>";
      str += "<animate attributeName='width' from='0%' to='" + ((participants.sessionDuration[stimulus.currentlySelected][k]/maxDuration)*100) +"%' dur='0.3s' fill='freeze'/>"

      for (var i = segStart; i < segEnd+1; i++) {
          //aois_gradients if more in one segment
          let currentAoi = aoiSegments.AOIid[stimulus.currentlySelected][i];
          let currentAoiArr = currentAoi.split("_");
          let currentAoiFill;
          let currentAoiClass;

          if (currentAoiArr.length > 1) {
            if (!writtenGradients.includes(currentAoi)) {
              gradientComponent += "<linearGradient id='SPgradient" + currentAoi + "' gradientTransform='rotate(90)'>";
              const step = 100/currentAoiArr.length;
              for (var e = 0; e < currentAoiArr.length; e++) {
                gradientComponent += "<stop offset='" + e*step + "%' stop-color='" + aoiCategories.colors[currentAoiArr[e]] + "'></stop>";
                gradientComponent += "<stop offset='" + (e+1)*step + "%' stop-color='" + aoiCategories.colors[currentAoiArr[e]] + "'></stop>";
              }
              gradientComponent += "</linearGradient>";
              writtenGradients.push(currentAoi)
            }

            currentAoiFill = "url(#SPgradient" + currentAoi + ")";
            currentAoiClass = currentAoiArr.map(i=>"a"+i).join(" ");
          } else {
            currentAoiFill = aoiCategories.colors[currentAoi];
            currentAoiClass = "a" + currentAoi;
          }

          let recStart = aoiSegments.startTime[stimulus.currentlySelected][i]; //start pos of svg rectangle
          str += "<rect height='20' data-sid='" + i + "' fill='" +  currentAoiFill + "' class='" +  currentAoiClass + "' x='" + (recStart / participants.sessionDuration[stimulus.currentlySelected][k]) * 100 + "%' width='" + ((aoiSegments.endTime[stimulus.currentlySelected][i] - recStart) / participants.sessionDuration[stimulus.currentlySelected][k]) * 100 + "%'></rect>";
      }
      str += "</svg>";
    } else {
      console.log("Participant " + participants.names[k] + " has no AOI segments in stimulus " + stimulus.names[stimulus.currentlySelected]);
    }
    //create inner HTML string for Y main labels component
    //it will be inserted to SVG on the next lines
    yLabInnerStr += "<div>" + participants.names[k] + "</div>";
  }

  let defs = "<defs>" + gradientComponent + "</defs>";

  str += defs + "</svg></div>";
  let labsstr = "<div id='chylabs'>";
  //add y main labels component
  labsstr += yLabInnerStr;
  //end tag
  labsstr += "</div>";
  str = labsstr + str;

  str += "<div id='chxlab'>Elapsed time [ms]</div>";

  //add responsive HTML legend
  str += "<div id='chlegend'>"
  for (var i = 0; i < aoiCategories.names[stimulus.currentlySelected].length; i++) {
    str += "<div data-aoi='" + i + "' class='legendItem a" + i + "'><div class='legendRect' style='background:" + aoiCategories.colors[i] + "'></div><div>" + aoiCategories.names[stimulus.currentlySelected][i] + "</div></div>";
  }
  str += "</div>";

  return str;
}


function handler(event) {
  const rect = event.target.closest('#charea rect');
  const legendItem = event.target.closest('.legendItem');
  const styleElement = document.querySelector('#charea style');
  // find the closest parent of the event target that
  // matches the selector
  if (event.target.closest('#datatooltip')) {return};
  if (rect) {
    // handle class event
    if (typeof popup !== 'undefined') {
      popup.style.display = 'none';
      adjustPOPUP(rect.dataset.sid);
      popup.style.display = "";
    } else {
      // win = document.getElementsByClassName('chartwrap')[0];
      popup = document.createElement('div');
      popup.classList = 'popup';
      popup.id = 'datatooltip';
      adjustPOPUP(rect.dataset.sid);
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
    styleElement.innerHTML = "rect{opacity:0.2}rect.a"+aoiId+"{opacity:1;stroke:#0000007d}";
    document.getElementById('charea').append(styleElement);
  }

  function adjustPOPUP(id) {
    const rectBoundingBox = rect.getBoundingClientRect();
    const startTime = aoiSegments.startTime[stimulus.currentlySelected][id];
    const aoi = getAoiName(aoiSegments.AOIid[stimulus.currentlySelected][id]);
    popup.innerHTML = "<span>Participant: "+ participants.names[participants.highestAOISegmentId[stimulus.currentlySelected].findIndex(x=>x>=id)] +"</span><span>AOI: "+ aoi +"</span><span>Start: "+startTime.toFixed(1) +" ms</span><span>End: "+aoiSegments.endTime[stimulus.currentlySelected][id].toFixed(1) +" ms</span><span>Duration: "+(aoiSegments.endTime[stimulus.currentlySelected][id] - startTime).toFixed(1) +" ms</span>";
    popup.style.top = window.scrollY + rectBoundingBox.bottom + "px";
    let xPosition = event.pageX;
    if (event.pageX + 155 > window.scrollX + document.body.clientWidth) {
      xPosition = window.scrollX + document.body.clientWidth - 155;
    }
    popup.style.left = xPosition + "px";
  }
}

function getAoiName(aoiId) {
  let aoiArray = aoiId.split("_").map(x=>aoiCategories.names[stimulus.currentlySelected][x]);
  return aoiArray.join(", ")
}

function getPrettyBreakStep(numberToBreak, numberOfSteps = 10) {
  let res = numberToBreak/numberOfSteps;
  let num_of_digits = (Math.log(res) * Math.LOG10E + 1 | 0)-1;
  res = Math.ceil(res/(10**(num_of_digits)));
  if ((res%2 === 1 && res%5 > 0) && res !== 1) {res++}
  if (res%6 === 0 || res%8 === 0) {res = 10}
  return res*(10**(num_of_digits))
}

function getSteps(numberToBreak) {
  let numberOfSteps = 10;
  let recentStep = getPrettyBreakStep(numberToBreak, numberOfSteps);
  while (recentStep === getPrettyBreakStep(numberToBreak, numberOfSteps-1)) {
    numberOfSteps--
  }
  return {numberOfSteps, step: recentStep}
}

// function getElementIndex(node) {
//     var index = 0;
//     while ( (node = node.previousElementSibling) ) {
//         index++;
//     }
//     return index;
// }

//other event handlers
function handleRelative() {
  const timelineSwitch = document.getElementById('SPtoRelative');
  const yPos = participants.names.length*30;
  let barwrap = document.getElementsByClassName('barwrap'), xAxes = document.querySelectorAll('.x-gr line');
  let isToRelative = false, maxDur = participants.maxDuration[stimulus.currentlySelected], from, to, xComponentHtml;
  const absoluteSteps = getSteps(maxDur);

  if (!timelineSwitch.classList.contains('activebtn3')) {
    isToRelative = true;
    xComponentHtml = getXComponentOfScarf(yPos, {numberOfSteps:10,step:10});
    document.getElementById('chxlab').innerHTML = 'Elapsed time [%]';
    timelineSwitch.classList.add('activebtn3')
  } else {
    xComponentHtml = getXComponentOfScarf(yPos, absoluteSteps);
    document.getElementById('chxlab').innerHTML = 'Elapsed time [ms]';
    timelineSwitch.classList.remove('activebtn3')
  }

  maxDur = absoluteSteps.numberOfSteps*absoluteSteps.step;

  let k = 0;
  for (var i = 0; i < barwrap.length; i++) {
    const participantId = barwrap[i].dataset.pid;
    const absoluteLength = (participants.sessionDuration[stimulus.currentlySelected][participantId]/maxDur)*100;

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
  let lines = "", labels = "", anchor = "text-anchor='start'";
  const maxDuration = breakX.numberOfSteps * breakX.step;
  for (var j = 0; j < breakX.numberOfSteps + 1; j++) {
    const currentStepX = (breakX.step*j);
    if (j === breakX.numberOfSteps) {
      anchor = "text-anchor='end'";
    }
    lines += "<line x1='" + currentStepX/maxDuration*100 +"%' x2='" + currentStepX/maxDuration*100 +"%' y1='0' y2='" + yPosition + "'></line>";
    labels += "<text x='" + currentStepX/maxDuration*100 + "%' " + anchor + " y='" + (yPosition + 14) + "'>" + currentStepX + "</text>"
    anchor = "text-anchor='middle'";
  }
  return "<g stroke='#cbcbcb' stroke-width='1'>" + lines + "</g><g class='labs'>" + labels + "</g>"
}


// print new html elements functions
function printDataCanvas() {
  let dcanvas = document.getElementById('analysis');
  const html = "<h2 class='anl'>Your analysis and visualization</h2><div id='loader-wrap'><div class='bars-7'></div><div>Processing your precious data</div></div><section id='chartsec' style='display:none;' class='anh anim'></section>"
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
  chartAnimation.setAttribute('from',fromChartWidth+'%');
  chartAnimation.setAttribute('to',toChartWidth+'%');
  chartAnimation.beginElement();
}

function showDownloadScarfPlotScreen() {
  let downloadScreen = document.getElementById('SPdownloadScreen');
  if (!downloadScreen) {
    let downloadScreen = document.createElement('div');
    downloadScreen.id = 'SPdownloadScreen';
    downloadScreen.classList = 'exterModal';
    downloadScreen.innerHTML = '<div class="interModal"><div class="modalHeader">Download Scarf plot<div onclick="closeDownloadScarfPlotScreen()" class="modalClose">X</div></div><div>Width of the plot: <input id="SPwidthInput" type="number" value="800"> px.</div><p style="font-size:.85rem;max-width:300px">It is advised to download the plot as a svg image to ensure its best sharpness.</p><div class="btnholder"><button onclick="getDownloadedScarfPlot()" class="btn">SVG</button><button onclick="getDownloadedScarfPlot()" class="btn2">PNG</button><button class="btn2" onclick="getDownloadedScarfPlot()">JPEG</button><button class="btn2" onclick="getDownloadedScarfPlot()">WEBP</button></div></div>';
    document.body.appendChild(downloadScreen);
  } else {
    downloadScreen.style.display="";
  }
}

function closeDownloadScarfPlotScreen() {
  document.getElementById('SPdownloadScreen').style.display="none";
}

function getDownloadedScarfPlot() {
  let gapForYLabs; //will be defined in getYLabs()
  const originalChartArea = document.getElementById('charea')
  const originalChartHeight = originalChartArea.getBoundingClientRect().height;
  let height = originalChartHeight;
  const width = document.getElementById('SPwidthInput').value;
  const type = event.target.innerText.toLowerCase();

  let clonedChartArea = originalChartArea.cloneNode(true);
  //remove animate tags
  let animateTags = clonedChartArea.getElementsByTagName('animate');
  while (animateTags.length > 0) {
    animateTags[0].remove();
  }

  const yLabels = getYLabs();
  const xLabel = getXlabel();
  const svgLegend = getSVGLegend(); //function adjusting var height as well

  let wholeChartSvg = document.createElement('svg');
  wholeChartSvg.setAttribute('width', width);
  wholeChartSvg.setAttribute('height', height);
  wholeChartSvg.setAttribute('viewBox', '0 0 ' + width + ' ' + height); //for correct scaling
  wholeChartSvg.setAttribute('xmlns', 'http://www.w3.org/2000/svg');
  clonedChartArea.setAttribute('width', width-gapForYLabs);
  clonedChartArea.setAttribute('x', gapForYLabs);
  clonedChartArea.removeAttribute('xmlns');

  wholeChartSvg.appendChild(clonedChartArea);
  wholeChartSvg.appendChild(yLabels);
  wholeChartSvg.appendChild(xLabel);
  wholeChartSvg.appendChild(svgLegend);
  wholeChartSvg.setAttribute("style", "font-size:0.85rem");

  //create SVG legend

  //prepare canvas
  let canvas = document.createElement('canvas');
  //set display size
  canvas.style.width = width+"px";
  canvas.style.height = height+"px";
  //set resolution size
  let scale = 2;
  canvas.width = width * scale;
  canvas.height = height * scale;
  const ctx = canvas.getContext("2d");
  //adjust coordinates to resolution size
  ctx.scale(scale, scale);
  ctx.fillStyle = "white";
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  let chartAreaImg = new Image();
  chartAreaImg.src = getBlobURL(wholeChartSvg);

  chartAreaImg.onload = function() {
    if (type === 'svg') {
      triggerDownload(chartAreaImg.src, 'scarfPlot.' + type);
      return
    }
    ctx.imageSmoothingEnabled = false;
    ctx.drawImage(chartAreaImg, 0, 0, width, height);
    // document.body.appendChild(canvas);
    let finalImage = canvas.toDataURL('image/' + type);
    triggerDownload(finalImage, 'test.' + type);
  };

  function getYLabs() {
    const yLabsOrigin = document.getElementById('chylabs');
    const yLabsItems = yLabsOrigin.childNodes;
    const yLabsBounding = yLabsOrigin.getBoundingClientRect();
    gapForYLabs = yLabsBounding.width;
    let yLabsGroup = document.createElement('g');
    let htmlString = "";
    for (var i = 0; i < yLabsItems.length; i++) {
        const bounding = yLabsItems[i].getBoundingClientRect();
        const yPosition = (bounding.y+bounding.height/2) - yLabsBounding.y;
        htmlString += "<text dominant-baseline='middle' y='" + yPosition + "'>" + yLabsItems[i].innerText + "</text>"
    }
    yLabsGroup.innerHTML = htmlString;
    return yLabsGroup
  }

  function getXlabel() {
    const label = document.getElementById('chxlab');
    const bounding = label.getBoundingClientRect();
    let xLabelGroup = document.createElement('g');
    xLabelGroup.innerHTML = "<text text-anchor='middle' dominant-baseline='middle' x='50%' y='" + (height+bounding.height/2) + "'>" + label.innerHTML + "</text>";
    height += bounding.height; //changing variable outside function!
    return xLabelGroup
  }

  function getSVGLegend() {
    let htmlLegend = document.getElementById('chlegend');

    htmlLegend.style.width = width+"px";

    const htmlLegendItems = htmlLegend.childNodes;
    const htmlLegendBounding = htmlLegend.getBoundingClientRect();
    let svgInnerString = "";
    for (var i = 0; i < htmlLegendItems.length; i++) {
      const bounding = htmlLegendItems[i].getBoundingClientRect();

      svgInnerString += "<rect x='" + (bounding.x-htmlLegendBounding.x+10) + "' y='" + (height+(bounding.y-htmlLegendBounding.y)+2) + "' fill='" + aoiCategories.colors[i] + "' width='12' height='12'></rect>";
      svgInnerString += "<text x='" + ((bounding.x+19)-htmlLegendBounding.x+10) + "' y='" + (height+(bounding.y-htmlLegendBounding.y)+12) + "'>" + aoiCategories.names[stimulus.currentlySelected][i] + "</text>";
    }
    let svgGroup = document.createElement('g');
    svgGroup.innerHTML = svgInnerString;
    height += htmlLegendBounding.height; //changing variable outside function!
    htmlLegend.style.width = "";
    return svgGroup
  }

  function getBlobURL(clonedSvg) {
    let blob = new Blob([clonedSvg.outerHTML],{type:'image/svg+xml;charset=utf-8'});
    const pageURL = window.URL || window.webkitURL || window;
    return pageURL.createObjectURL(blob)
  }

  function triggerDownload(imageHref,imageName) {
    let link = document.createElement('a');
    link.download = imageName;
    link.style.opacity = "0";
    document.body.append(link);
    link.href = imageHref;
    link.click();
    link.remove();
  }
}

function handleStimulusChange(selectElement) {
  stimulus.currentlySelected = selectElement.value;
  document.getElementById('SPtoRelative').classList.remove("activebtn3");
  document.getElementsByClassName('chartwrap')[0].innerHTML = paintAbsoluteBars();
}

// třídění na později
// indices.sort(function (a, b) { return array1[a] < array1[b] ? -1 : array1[a] > array1[b] ? 1 : 0; });

// //možná odkaz i do paintabsolutebars - příprava na sorting
// for (var i = 0; i < sortedParticipId.length; i++) {
//   sortedParticipId[i]
//   //poskládat HTML kód barů
// }

//paint labels - to samé

//paint tabulka asi také
