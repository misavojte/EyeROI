var elmFileUpload = document.getElementById('file-upload');


var aoiSegments = {
  endTime: [],
  AOIid: []
};

var aoiCategories = {
  names: [],
  colors: ["#a6cee3","#b2df8a","#fb9a99","#fdbf6f","#cab2d6","#b15928"] //predefined
};

var participants = {
  sessionDuration: [],
  maxDuration: null,
  names: [],
  highestAOISegmentId: []
};


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
var win;


  //console.log(spl.filter(function(value,index) {return value[2]=="P01";}));

function preprocess_TXT(fr) {
  let colDelimiters = ['\t',',',';'];
  let firstRows = fr.split('\r\n', 3);
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
  let segmentAOIix = -1;
  let iterateTo = spl.length-1 //skip last one (different processing on last row)
  //from 1 to skip header
  for (var i = 1; i < iterateTo; i++) {
    if (isNewSegment === true) {
      firstRow(i);
    }
    if (spl[i][2] !== spl[i+1][2]) {
      lastParticipantRow(i);
    }
    else if (spl[i][5] !== spl[i+1][5]) {
      lastAOIRow(i);
    }
  }
  //last row of array
  if (isNewSegment) { firstRow(spl.length-1) }
  lastParticipantRow(spl.length-1);

  function firstRow(x) {
    baseTime = spl[x][0];
    isNewSegment = false;
  }
  function lastParticipantRow(x) {
    lastAOIRow(x);
    isNewSegment = true;
    participants.highestAOISegmentId.push(segmentAOIix);
    if (!participants.names.includes(spl[x][2])) {
      participants.names.push(spl[x][2]);
    }
    participants.sessionDuration.push(spl[x][0]-baseTime);
  }
  function lastAOIRow(x) {
    segmentAOIix++;
    if (!aoiCategories.names.includes(spl[x][5])) {
      aoiCategories.names.push(spl[x][5]);
    }
    aoiSegments.AOIid.push(aoiCategories.names.indexOf(spl[x][5]));
    aoiSegments.endTime.push(spl[x][0]-baseTime);
  }
  //get maximu length of session - used for SVG chart
  participants.maxDuration = Math.max(...participants.sessionDuration);
  printSequenceChart();
}

function printSequenceChart() {
  let inner = '<h3 class="cardtitle">Sequence chart (Scarf plot)</h3>';
  inner += '<div class="btnholder"><div class="btn3 torelative"><div class="btn3-absolute">Absolute timeline</div><div class="btn3-relative">Relative timeline</div></div><div id="zoomInScarf" class="btn4">+</div><div id="zoomOutScarf" class="btn4 deactivated">-</div></div>';
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
  let finalSVGwidth = 800;

  //start constructing SVG string
  // let str = '<svg xmlns="http://www.w3.org/2000/svg" class="chart" width="' + finalSVGwidth + '" height="' + (xaxispos + 30) +'" role="img">';

  let str = "<div class='charea-holder'><svg xmlns='http://www.w3.org/2000/svg' id='charea' width='100%' height='" + (xaxispos + 30) + "'>";
  str += "<animate id='chareaAni' attributeName='width' from='100%' to='100%' dur='0.3s' fill='freeze'/>"
  //add style to SVG string
  str += '<style>rect{height:100%}';
  for (var i = 0; i < aoiCategories.colors.length; i++) {
    str += '.a' + i + '{fill:' + aoiCategories.colors[i] + '}';
  }
  str += '</style>';
  //add main X,Y axes and start constructing main chart area
  // str += "<svg id='charea' x='" + gapForYLabs + "' width='" + (finalSVGwidth-gapForYLabs) + "'>";

  str += "<g><line class='gr y-gr' id='yGr' x1='0' x2='100%' y1='" + xaxispos + "' y2='" + xaxispos + "'></line>";
  str += "<line class='gr x-gr' id='xGr' x1='0' x2='0' y1='" + xaxispos + "' y2='0'></line></g>";

  //add X axes labels and support Y axes
  //Y axes will be rendered under the sequence bars
  let tanchor = "text-anchor='start'";
  const breakStep = getPrettyBreakStep(participants.maxDuration);
  for (var j = 0; j < participants.maxDuration; j = j+breakStep) {
    if (j+breakStep > participants.maxDuration) {
      tanchor = "text-anchor='end'";
    }
    str_vedlej_gridX = str_vedlej_gridX + "<line x1='" + j/participants.maxDuration*100 +"%' x2='" + j/participants.maxDuration*100 +"%' y1='0' y2='" + xaxispos + "'></line>";
    str_labels_gridX = str_labels_gridX + "<text x='" + j/participants.maxDuration*100 + "%' " + tanchor + " y='" + (Number(xaxispos) + 14) + "'>" + j + "</text>"
    tanchor = "text-anchor='middle'";
  }

  str = str + "<g class='x-gr gr2'>" + str_vedlej_gridX + "</g><g class='labs' id='xLabs'>" + str_labels_gridX + "</g>";

  for (var k = 0; k < participants.names.length; k++) {
    if (k === 0) {
      segStart = 0;
    } else {
      segStart = participants.highestAOISegmentId[k-1] + 1;
    }
    segEnd = participants.highestAOISegmentId[k];
    ypos += 30;
    str += "<svg class='barwrap' y='" + ypos + "' data-pid='" + k + "'height='20' width='" + ((participants.sessionDuration[k]/participants.maxDuration)*100) +"%'>";
    str += "<animate attributeName='width' from='0%' to='" + ((participants.sessionDuration[k]/participants.maxDuration)*100) +"%' dur='0.3s' fill='freeze'/>"

    for (var i = segStart; i < segEnd+1; i++) {
        let recStart = getStartTime(i); //start pos of svg rectangle
        str += "<rect data-sid='" + i + "' class='a" +  aoiSegments.AOIid[i] + "' x='" + (recStart / participants.sessionDuration[k]) * 100 + "%' width='" + ((aoiSegments.endTime[i] - recStart) / participants.sessionDuration[k]) * 100 + "%'></rect>";
    }
    str += "</svg>";
    //create inner HTML string for Y main labels component
    //it will be inserted to SVG on the next lines
    yLabInnerStr += "<text y='" + (Number(ypos) + 15) + "'>" + participants.names[k] + "</text>";
  }

  str += "</svg></div>";
  let labsstr = "<svg xmlns='http://www.w3.org/2000/svg' id='chylabs' width='100%' height='" + (xaxispos + 30) + "'>";
  //add y main labels component
  labsstr += "<g class='labs' x='0'>" + yLabInnerStr + "</g>";
  //end tag
  labsstr += "</svg>";
  str = labsstr + str;

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
    const startTime = getStartTime(id);
    popup.innerHTML = "<span>Participant: "+ participants.names[participants.highestAOISegmentId.findIndex(x=>x>=id)] +"</span><span>AOI: "+aoiCategories.names[aoiSegments.AOIid[id]]+"</span><span>Start: "+startTime.toFixed(1) +" ms</span><span>End: "+aoiSegments.endTime[id].toFixed(1) +" ms</span><span>Duration: "+(aoiSegments.endTime[id] - startTime).toFixed(1) +" ms</span>";
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
      const from = ((participants.sessionDuration[i]/participants.maxDuration)*100)+"%";
      const to = 100+"%";
      let animateTag = barwrap[i].getElementsByTagName('animate')[0];

        animateTag.setAttribute('from', from);
        animateTag.setAttribute('to', to);
        animateTag.beginElement();

    }

    timelineSwitch.classList.add('activebtn3');
  } else {
    for (var i = 0; i < barwrap.length; i++) {
      const to = ((participants.sessionDuration[i]/participants.maxDuration)*100)+"%";
      const from = 100+"%";
      let animateTag = barwrap[i].getElementsByTagName('animate')[0];

        animateTag.setAttribute('from', from);
        animateTag.setAttribute('to', to);
        animateTag.beginElement();
    }
    timelineSwitch.classList.remove('activebtn3');
  }
  // function addAnimateTag(from, to) {
  //   animateTag = document.createElement("animate");
  //   animateTag.setAttribute('attributeName', 'width');
  //   animateTag.setAttribute('dur', '0.3s');
  //   animateTag.setAttribute('fill', 'freeze');
  //   animateTag.setAttribute('from', from);
  //   animateTag.setAttribute('to', to);
  //   barwrap[i].appendChild(animateTag);
  //   animateTag.beginElement();
  // }
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



elmFileUpload.addEventListener('change',onFileUploadChange,false);

function getStartTime(index) {
  if (participants.highestAOISegmentId.includes(index-1) || index-1 < 0) { return 0 }
  return aoiSegments.endTime[index-1]
}


function zoomScarf() {
  const currentButton = event.target.id;
  const zoomOutButton = document.getElementById('zoomOutScarf');
  const chartAnimation = document.getElementById('chareaAni');
  const fromChartWidth = chartAnimation.getAttribute('to').slice(0, -1);
  let toChartWidth = fromChartWidth;
  if (currentButton === "zoomInScarf") {
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

// třídění na později
// indices.sort(function (a, b) { return array1[a] < array1[b] ? -1 : array1[a] > array1[b] ? 1 : 0; });

// //možná odkaz i do paintabsolutebars - příprava na sorting
// for (var i = 0; i < sortedParticipId.length; i++) {
//   sortedParticipId[i]
//   //poskládat HTML kód barů
// }

//paint labels - to samé

//paint tabulka asi také
