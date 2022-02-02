document.getElementById('file-upload').addEventListener('change',onFileUploadChange,false);

var aoiSegments = {
  startTime: [],
  endTime: [],
  AOIid: []
};

var aoiCategories = {
  names: [],
  colors: ["#a6cee3","#b2df8a","#fb9a99","#fdbf6f","#cab2d6","#b15928", "#fccde5", "#d9d9d9", "#35978f"]
};

var participants = {
  sessionDuration: [],
  maxDuration: [],
  names: [],
  highestAOISegmentId: []
};

var stimulus = {
  currentlySelected: 0,
  names: []
}


function onFileUploadChange(e) {
let file = e.target.files[0];
let filesuffix = file.name.split('.').pop();

printDataCanvas();
printNewAniOutput('h3', 'anl', 1, 'Input eye-tracking data');
printNewAniOutput('div', 'metricfield', 1, ('<span>File:</span><span>' + file.name + " (" + file.size/1000 + " kB)</span>"));

  if (filesuffix == "txt") {
    let fr = new FileReader();
    fr.onload = function() {
      preprocess_TXT(fr.result);
    }
    fr.readAsText(file);
  } else {
    showDataType(0);
  }
}

function showDataType(a) {
  let css = "metricfield";
  if (a == 0) {
    a = "Not supported eye-tracking data";
    css =+ "wrong";
  }
  printNewAniOutput('div', css, 1, '<span>Data type:</span><span>'+a+'</span>')
}

var popup;

  //console.log(spl.filter(function(value,index) {return value[2]=="P01";}));

function preprocess_TXT(fr) {
  let colDelimiters = ['\t',',',';'];

  //find column delimiter
  //let colDelimiter = colDelimiters.find(item => firstRows[0].split(item).length === firstRows[2].split(item).length && firstRows[0].split(item).length > 1);

  let spl = fr.split('\r\n');

  //console.log(spl[0]);
  if (spl[0].includes("RecordingTime [ms]")) {
    showDataType("Static Raw data (SMI)");
    if (spl[0].includes("AOI Name Right")) {
      //send file without header and useless last row
      // spl.shift();
      spl.pop();
      process_SMI_Raw_Static(spl.map(x=>x.split('\t')));
    }
  }else {

  }
}

function process_SMI_Raw_Static(spl) {
  let isNewSegment = true;
  let baseTime = 0;
  let lastEndTime = 0;
  let lastStimulus = 0;
  let segmentAOIix = -1;
  let iterateTo = spl.length-1 //skip last one (different processing on last row)
  //from 1 to skip header
  for (var i = 1; i < iterateTo; i++) {
    if (isNewSegment === true) {
      firstRow(i);
    }
    if (spl[i][1] !== lastStimulus) {
      firstStimulusRow(i);
    }
    if (spl[i][2] !== spl[i+1][2] || spl[i][1] !== spl[i+1][1]) {
      lastParticipantRow(i);
    }
    else if (spl[i][5] !== spl[i+1][5]) {
      lastAOIRow(i);
    }
  }
  //last row of array
  if (isNewSegment) { firstRow(iterateTo) }
  lastParticipantRow(iterateTo);

  function firstRow(x) {
    baseTime = spl[x][0];
    lastEndTime = 0;
    isNewSegment = false;
  }

  function firstStimulusRow(x) {
    const indexOfCurrentStimulus = stimulus.names.indexOf(spl[i][1]);
    if (indexOfCurrentStimulus === -1) {
      //this stimulus doesn't exist (index is -1)
      participants.sessionDuration.push([]);
      participants.highestAOISegmentId.push([]);
      aoiCategories.names.push([]);
      aoiSegments.startTime.push([]);
      aoiSegments.endTime.push([]);
      aoiSegments.AOIid.push([]);

      stimulus.names.push(spl[i][1]);
      stimulus.currentlySelected = stimulus.names.length - 1;

      lastStimulus = spl[i][1];
      segmentAOIix = -1;
    } else {
      lastStimulus = spl[i][1];
      segmentAOIix = aoiSegments.AOIid[indexOfCurrentStimulus].length - 1;
      stimulus.currentlySelected = indexOfCurrentStimulus;
    }
  }

  function lastParticipantRow(x) {
    lastAOIRow(x);
    isNewSegment = true;
    participants.highestAOISegmentId[stimulus.currentlySelected].push(segmentAOIix);
    if (!participants.names.includes(spl[x][2])) {
      participants.names.push(spl[x][2]);
    }
    participants.sessionDuration[stimulus.currentlySelected].push(spl[x][0]-baseTime);
  }
  function lastAOIRow(x) {
    segmentAOIix++;
    const newEndTime = spl[x][0]-baseTime
    if (!aoiCategories.names[stimulus.currentlySelected].includes(spl[x][5])) {
      aoiCategories.names[stimulus.currentlySelected].push(spl[x][5]);
    }
    aoiSegments.AOIid[stimulus.currentlySelected].push(aoiCategories.names[stimulus.currentlySelected].indexOf(spl[x][5]));
    aoiSegments.endTime[stimulus.currentlySelected].push(newEndTime);
    aoiSegments.startTime[stimulus.currentlySelected].push(lastEndTime);
    lastEndTime = newEndTime;
  }
  //get maximu length of session - used for SVG chart
  for (var i = 0; i < stimulus.names.length; i++) {
    participants.maxDuration[i] = Math.max(...participants.sessionDuration[i]);
  }
  printSequenceChart();
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
  inner += '<div class="btnholder">'+select+'<div class="btn3 torelative"><div class="btn3-absolute">Absolute timeline</div><div class="btn3-relative">Relative timeline</div></div>'+zoomInIcon+zoomOutIcon+downloadIcon+'</div>';
  inner += '<div class="chartwrap">';
  inner += paintAbsoluteBars();
  inner += '</div>';
  document.getElementById('chartsec').innerHTML = inner;
  document.body.onmouseover = handler;
  //document.getElementById('charea').onmouseleave = handler2;
  document.getElementsByClassName('torelative')[0].onclick = handleRelative;
  document.getElementById('zoomInScarf').onclick = zoomScarf;
  document.getElementById('zoomOutScarf').onclick = zoomScarf;
}

function paintAbsoluteBars() {

  // let current_participant = a[0][0];
  let ypos = -30;
  let xaxispos = participants.names.length*30;
  let str_vedlej_gridX = "";
  let str_labels_gridX = "";
  let yLabInnerStr = "";
  let gapForYLabs = 30;

  const maxDuration = participants.maxDuration[stimulus.currentlySelected];

  //start constructing SVG string
  // let str = '<svg xmlns="http://www.w3.org/2000/svg" class="chart" width="' + finalSVGwidth + '" height="' + (xaxispos + 30) +'" role="img">';

  let str = "<div class='charea-holder'><svg xmlns='http://www.w3.org/2000/svg' id='charea' width='100%' height='" + (xaxispos + 40) + "'>";
  str += "<animate id='chareaAni' attributeName='width' from='100%' to='100%' dur='0.3s' fill='freeze'/>"
  //add style to SVG string
  // str += '<style>rect{height:100%}.gr{stroke:rgb(0 0 0 / 35%);stroke-width:1}.gr2{stroke:rgb(0 0 0 / 15%);stroke-width:1}.labs{font-size:0.8rem}';
  // for (var i = 0; i < aoiCategories.colors.length; i++) {
  //   str += '.a' + i + '{fill:' + aoiCategories.colors[i] + '}';
  // }
  // str += '</style>';
  //add main X,Y axes and start constructing main chart area
  // str += "<svg id='charea' x='" + gapForYLabs + "' width='" + (finalSVGwidth-gapForYLabs) + "'>";

  str += "<g><line class='gr y-gr' stroke='#cbcbcb' stroke-width='1'  x1='0' x2='100%' y1='" + xaxispos + "' y2='" + xaxispos + "'></line>";
  str += "<line class='gr x-gr' stroke='#cbcbcb' stroke-width='1' x1='1' x2='1' y1='" + xaxispos + "' y2='0'></line></g>";

  //add X axes labels and support Y axes
  //Y axes will be rendered under the sequence bars
  let tanchor = "text-anchor='start'";
  const breakStep = getPrettyBreakStep(maxDuration);
  for (var j = 0; j < maxDuration; j = j+breakStep) {
    if (j+breakStep > maxDuration) {
      tanchor = "text-anchor='end'";
    }
    str_vedlej_gridX = str_vedlej_gridX + "<line x1='" + j/maxDuration*100 +"%' x2='" + j/maxDuration*100 +"%' y1='0' y2='" + xaxispos + "'></line>";
    str_labels_gridX = str_labels_gridX + "<text x='" + j/maxDuration*100 + "%' " + tanchor + " y='" + (Number(xaxispos) + 14) + "'>" + j + "</text>"
    tanchor = "text-anchor='middle'";
  }

  str = str + "<g class='x-gr gr2' stroke='#cbcbcb' stroke-width='1'>" + str_vedlej_gridX + "</g><g font-size='0.85rem' fill='#4a4a4a' class='labs' id='xLabs'>" + str_labels_gridX + "<text x='50%' text-anchor='middle' y='" + (Number(xaxispos) + 30) + "'>Elapsed time [ms]</text></g>";

  for (var k = 0; k < participants.names.length; k++) {
    if (k === 0) {
      segStart = 0;
    } else {
      segStart = participants.highestAOISegmentId[stimulus.currentlySelected][k-1] + 1;
    }
    segEnd = participants.highestAOISegmentId[stimulus.currentlySelected][k];
    ypos += 30;
    str += "<svg class='barwrap' y='" + ypos + "' data-pid='" + k + "' width='" + ((participants.sessionDuration[stimulus.currentlySelected][k]/maxDuration)*100) +"%'>";
    str += "<animate attributeName='width' from='0%' to='" + ((participants.sessionDuration[stimulus.currentlySelected][k]/maxDuration)*100) +"%' dur='0.3s' fill='freeze'/>"

    for (var i = segStart; i < segEnd+1; i++) {
        let recStart = aoiSegments.startTime[stimulus.currentlySelected][i]; //start pos of svg rectangle
        str += "<rect height='20' data-sid='" + i + "' fill='" +  aoiCategories.colors[aoiSegments.AOIid[stimulus.currentlySelected][i]] + "' class='a" +  aoiSegments.AOIid[stimulus.currentlySelected][i] + "' x='" + (recStart / participants.sessionDuration[stimulus.currentlySelected][k]) * 100 + "%' width='" + ((aoiSegments.endTime[stimulus.currentlySelected][i] - recStart) / participants.sessionDuration[stimulus.currentlySelected][k]) * 100 + "%'></rect>";
    }
    str += "</svg>";
    //create inner HTML string for Y main labels component
    //it will be inserted to SVG on the next lines
    yLabInnerStr += "<text y='" + (Number(ypos) + 15) + "'>" + participants.names[k] + "</text>";
  }

  str += "</svg></div>";
  let labsstr = "<svg xmlns='http://www.w3.org/2000/svg' id='chylabs' width='100%' height='" + (xaxispos + 30) + "'>";
  //add y main labels component
  labsstr += "<g class='labs' font-size='0.85rem' fill='#4a4a4a'>" + yLabInnerStr + "</g>";
  //end tag
  labsstr += "</svg>";
  str = labsstr + str;

  //add responsive HTML legend
  str += "<div id='chlegend'>"
  for (var i = 0; i < aoiCategories.names[stimulus.currentlySelected].length; i++) {
    str += "<div class='legendItem a" + i + "'><div class='legendRect' style='background:" + aoiCategories.colors[i] + "'></div><div>" + aoiCategories.names[stimulus.currentlySelected][i] + "</div></div>";
  }
  str += "</div>";

  return str;
}


function handler(event) {
  // find the closest parent of the event target that
  // matches the selector
  const closest = event.target.closest('rect');
  if (!closest) {
    if (!event.target.closest('#datatooltip')) {
      if (popup) {
        popup.style.display = 'none';
      }
    }
    return
  }
    // handle class event
    if (typeof popup !== 'undefined') {
      popup.style.display = 'none';
      adjustPOPUP(closest.dataset.sid);
      popup.style.display = "";
    } else {
      // win = document.getElementsByClassName('chartwrap')[0];
      popup = document.createElement('div');
      popup.classList = 'popup';
      popup.id = 'datatooltip';
      adjustPOPUP(closest.dataset.sid);
      document.body.appendChild(popup);
    }


  function adjustPOPUP(id) {
    const rectBoundingBox = closest.getBoundingClientRect();
    const startTime = aoiSegments.startTime[stimulus.currentlySelected][id];
    popup.innerHTML = "<span>Participant: "+ participants.names[participants.highestAOISegmentId[stimulus.currentlySelected].findIndex(x=>x>=id)] +"</span><span>AOI: "+aoiCategories.names[stimulus.currentlySelected][aoiSegments.AOIid[stimulus.currentlySelected][id]]+"</span><span>Start: "+startTime.toFixed(1) +" ms</span><span>End: "+aoiSegments.endTime[stimulus.currentlySelected][id].toFixed(1) +" ms</span><span>Duration: "+(aoiSegments.endTime[stimulus.currentlySelected][id] - startTime).toFixed(1) +" ms</span>";
    popup.style.top = window.scrollY + rectBoundingBox.bottom + "px";
    let xPosition = event.pageX;
    if (event.pageX + 155 > window.scrollX + document.body.clientWidth) {
      xPosition = window.scrollX + document.body.clientWidth - 155;
    }
    popup.style.left = xPosition + "px";
  }
};

function getPrettyBreakStep(numberToBreak, numberOfSteps = 10) {
  let res = numberToBreak/numberOfSteps;
  let num_of_digits = Math.log(res) * Math.LOG10E + 1 | 0;
  res = (res/(10**(num_of_digits))).toFixed(1);
  return res*(10**(num_of_digits))
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
  const timelineSwitch = document.getElementsByClassName('torelative')[0];
  const barwrap = document.getElementsByClassName('barwrap');

  if (!timelineSwitch.classList.contains('activebtn3')) {
    for (var i = 0; i < barwrap.length; i++) {
      const from = ((participants.sessionDuration[stimulus.currentlySelected][i]/participants.maxDuration[stimulus.currentlySelected])*100)+"%";
      const to = 100+"%";
      barwrap[i].setAttribute('width', to); //because of the export function
      let animateTag = barwrap[i].getElementsByTagName('animate')[0];

        animateTag.setAttribute('from', from);
        animateTag.setAttribute('to', to);
        animateTag.beginElement();

    }

    timelineSwitch.classList.add('activebtn3');
  } else {
    for (var i = 0; i < barwrap.length; i++) {
      const to = ((participants.sessionDuration[stimulus.currentlySelected][i]/participants.maxDuration[stimulus.currentlySelected])*100)+"%";
      const from = 100+"%";
      barwrap[i].setAttribute('width', to); //because of the export function
      let animateTag = barwrap[i].getElementsByTagName('animate')[0];

        animateTag.setAttribute('from', from);
        animateTag.setAttribute('to', to);
        animateTag.beginElement();
    }
    timelineSwitch.classList.remove('activebtn3');
  }
}


// print new html elements functions
function printDataCanvas() {
  let dcanvas = document.createElement("section");
  let inner = "<h2 class='anl anim'>Your analysis and visualization</h2><section class='anh'></section><section id='chartsec' class='anh'></section>"
  dcanvas.innerHTML = inner;
  document.getElementsByTagName('main')[0].insertBefore(dcanvas, document.getElementsByTagName('section')[1]);
}

function printNewAniOutput(htmltag, csstag, sectionindex, html) {
  let newelement = document.createElement(htmltag);
  newelement.classList = csstag;
  newelement.classList.add('anim');
  newelement.innerHTML = html;
  document.getElementsByClassName('anh')[sectionindex].appendChild(newelement);
}

//export plot


// function getStartTime(index) {
//   if (participants.highestAOISegmentId.includes(index-1) || index-1 < 0) { return 0 }
//   return aoiSegments.endTime[index-1]
// }


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
  const gapForYLabs = 30;
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
  let clonedChartYLabels = document.getElementById('chylabs').cloneNode(true);

  const svgLegend = getSVGLegend(); //function adjusting var height as well

  let wholeChartSvg = document.createElement('svg');
  wholeChartSvg.setAttribute('width', width);
  wholeChartSvg.setAttribute('height', height);
  wholeChartSvg.setAttribute('viewBox', '0 0 ' + width + ' ' + height); //for correct scaling
  wholeChartSvg.setAttribute('xmlns', 'http://www.w3.org/2000/svg');
  clonedChartArea.setAttribute('width', width-gapForYLabs);
  clonedChartArea.setAttribute('x', gapForYLabs);
  clonedChartArea.removeAttribute('xmlns');
  clonedChartYLabels.removeAttribute('xmlns');
  wholeChartSvg.appendChild(clonedChartArea);
  wholeChartSvg.appendChild(clonedChartYLabels);
  wholeChartSvg.appendChild(svgLegend);

  //create SVG legend

  //prepare canvas
  let canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext("2d");
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
    finalImage = canvas.toDataURL('image/' + type);
    triggerDownload(finalImage, 'test.' + type);
  };

  function getSVGLegend() {
    let htmlLegend = document.getElementById('chlegend');

    htmlLegend.style.width = width+"px";

    const htmlLegendItems = htmlLegend.childNodes;
    const htmlLegendBounding = htmlLegend.getBoundingClientRect();
    let svgInnerString = "";
    for (var i = 0; i < htmlLegendItems.length; i++) {
      const bounding = htmlLegendItems[i].getBoundingClientRect();

      svgInnerString += "<rect x='" + (bounding.x-htmlLegendBounding.x) + "' y='" + (height+(bounding.y-htmlLegendBounding.y)) + "' fill='" + aoiCategories.colors[i] + "' width='12' height='12'></rect>";
      svgInnerString += "<text x='" + ((bounding.x+19)-htmlLegendBounding.x) + "' y='" + (height+(bounding.y-htmlLegendBounding.y)+12) + "'>" + aoiCategories.names[i] + "</text>";
    }
    let svgGroup = document.createElement('g');
    svgGroup.innerHTML = svgInnerString;
    svgGroup.setAttribute('font-size', '0.85rem');
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
