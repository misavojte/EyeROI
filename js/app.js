var elmFileUpload = document.getElementById('file-upload');


var ar = [];
var ar_participants_dur = [];
var ar_participants_maxdur;


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

var spl;
var participants;
var AOIs;
var AOIs_u_defined;
var AOIs_cols = ["#a6cee3","#b2df8a","#fb9a99","#fdbf6f","#cab2d6","#b15928"];
var arr;

var popup;
var win;


  //console.log(spl.filter(function(value,index) {return value[2]=="P01";}));

function preprocess_TXT(fr) {
  let spl = fr.split('\r\n');
  for (var i = 0; i < spl.length; i++) {
    spl[i] = spl[i].split('\t');
  }
  console.log(spl[0]);
  if (spl[0].includes("RecordingTime [ms]")) {
    showDataType("Static Raw data (SMI)");
    if (spl[0].includes("AOI Name Right")) {
      //send file without header and useless last row
      spl.shift();
      spl.pop();
      process_SMI_Raw_Static(spl);
    }
  }else {

  }
}

function process_SMI_Raw_Static(spl) {
  //get unique values (array) from column 2: participants
  participants = Array.from(new Set(spl.map(x => x[2])));
  //get unique values (array) from column 2: AOI
  AOIs = Array.from(new Set(spl.map(x => x[5])));

  let segmentID = 0;
  for (var i = 0; i < participants.length; i++) {
    //filter all columns by current participant
    var currpar = spl.filter(function(value,index) {return value[2]==participants[i];});
    let currAOI;
    let currAOIstart;
    let currAOIend;
    let currAOIbase = currpar[0][0];

    for (var a = 0; a < currpar.length; a++) {
      if (a == 0) {
        currAOI = currpar[a][5];
        currAOIstart = currpar[a][0] - currAOIbase;
      }
      if (currAOI != currpar[a][5]) {
        currAOI = currpar[a][5];
        currAOIstart = currpar[a][0] - currAOIbase;
        //currAOIend = currpar[a-1][0] - currAOIbase;
        segmentID++;
        //obj[participants[i]][segmentID-1]["end"] = currAOIend;
      }
      if (a+1 != currpar.length) {
        //pokud je následující AOI odlišné - zaznamená end podle začátku dalšího segmentu
        if (currAOI != currpar[a+1][5]) {
          currAOIend = currpar[a+1][0] - currAOIbase;
          let crar = new Array(participants[i],AOIs.indexOf(currAOI),currAOIstart,currAOIend);
          ar.push(crar);
        }
      }else {
        //pokud na konci listu, přidá konec podle toho,
        //jaký čas je teď + průměrná doba platnosti zírání
        currAOIend = (currpar[a][0] - currAOIbase) + 0.4;
        let crar = new Array(participants[i],AOIs.indexOf(currAOI),currAOIstart,currAOIend);
        ar.push(crar);
        //pošle
        ar_participants_dur.push(currAOIend)
      }

      if (a+1 == currpar.length) {
        segmentID++;
      }
    }
  }
  ar_participants_maxdur = Math.max(...ar_participants_dur);
  printSequenceChart(ar);
}

function printSequenceChart(a) {
  let inner = '<h3 class="cardtitle">Sequence chart (Scarf plot)</h3>';
  inner += '<div class="btnholder"><div class="btn3 torelative"><div class="btn3-absolute">Absolute timeline</div><div class="btn3-relative">Relative timeline</div></div></div>';
  inner += '<div class="chartwrap">';
  inner += paintAbsoluteBars(a);
  inner += '</div>';
  document.getElementById('chartsec').innerHTML = inner;
  document.getElementById('charea').onmouseover = handler;
  document.getElementById('charea').onmouseout = handler2;
  document.getElementsByClassName('torelative')[0].onclick = handleRelative;
}

function paintAbsoluteBars(a) {

  let current_participant = a[0][0];
  let ypos = -30;
  let xaxispos = participants.length*30;
  let str_vedlej_gridX = "";
  let str_labels_gridX = "";
  let yLabInnerStr = "";
  let gapForYLabs = 30;
  let finalSVGwidth = 800;

  //start constructing SVG string
  let str = '<svg xmlns="http://www.w3.org/2000/svg" class="chart" width="' + finalSVGwidth + '" height="' + (xaxispos + 30) +'" aria-labelledby="title desc" role="img">';
  //add style to SVG string
  str += '<style>rect{height:100%}rect:hover{fill-opacity: 0.75}';
  for (var i = 0; i < AOIs_cols.length; i++) {
    str += '.a' + i + '{fill:' + AOIs_cols[i] + '}';
  }
  str += '</style>';
  //add main X,Y axes and start constructing main chart area
  str += "<svg id='charea' x='" + gapForYLabs + "' width='" + (finalSVGwidth-gapForYLabs) + "'>";
  str += "<g><line class='gr y-gr' id='yGr' x1='0' x2='100%' y1='" + xaxispos + "' y2='" + xaxispos + "'></line>";
  str += "<line class='gr x-gr' id='xGr' x1='0' x2='0' y1='" + xaxispos + "' y2='0'></line></g>";

  //add X axes labels and support Y axes
  //Y axes will be rendered under the sequence bars
  let tanchor = "text-anchor='start'";
  let brk = getPrettyBreak10(ar_participants_maxdur);
  for (var j = 0; j < ar_participants_maxdur; j = j+brk) {
    if (j+brk > ar_participants_maxdur) {
      tanchor = "text-anchor='end'";
    }
    str_vedlej_gridX = str_vedlej_gridX + "<line x1='" + j/ar_participants_maxdur*100 +"%' x2='" + j/ar_participants_maxdur*100 +"%' y1='0' y2='" + xaxispos + "'></line>";
    str_labels_gridX = str_labels_gridX + "<text x='" + j/ar_participants_maxdur*100 + "%' " + tanchor + " y='" + (Number(xaxispos) + 14) + "'>" + j + "</text>"
    tanchor = "text-anchor='middle'";
  }

  str = str + "<g class='x-gr gr2'>" + str_vedlej_gridX + "</g><g class='labs' id='xLabs'>" + str_labels_gridX + "</g>";

  for (var k = 0; k < participants.length; k++) {
    ypos += 30;
    str = str + "<svg class='barwrap' y='" + ypos + "' id='bw" + participants[k] + "'height='20' width='" + ((ar_participants_dur[k]/ar_participants_maxdur)*100) +"%'>";
    //neefektivní - jede přes celý array namísto jen místa, kde je aktuální uživatel
    for (var i = 0; i < a.length; i++) {
      if (a[i][0] == participants[k]) {
        let str2 = "<rect class='a" +  a[i][1] + "' x='" + (a[i][2] / ar_participants_dur[k]) * 100 + "%' width='" + ((a[i][3] - a[i][2]) / ar_participants_dur[k]) * 100 + "%'></rect>";
        str = str + str2;
      }
    }
    str += "</svg>";
    //create inner HTML string for Y main labels component
    //it will be inserted to SVG on the next lines
    yLabInnerStr += "<text y='" + (Number(ypos) + 15) + "'>" + participants[k] + "</text>";
  }

  str += "</svg>";
  //add y main labels component
  str += "<g class='labs' x='0'>" + yLabInnerStr + "</g>";
  //end tag
  str += "</svg>";

  return str;

  // document.getElementById('charea').addEventListener('onMouseOut', function(event) {
  //   // find the closest parent of the event target that
  //   // matches the selector
  //   var closest = event.target.closest('.bar');
  //   if (closest && document.getElementById('charea').contains(closest)) {
  //     // handle class event
  //
  //     console.log("end");
  //   }
  // });
}

function handler2() {
  popup.style.display = "none";
}

function handler(event) {
  // find the closest parent of the event target that
  // matches the selector
  let closest = event.target.closest('rect');
  if (closest && document.getElementById('charea').contains(closest)) {
    // handle class event
    if (typeof popup !== 'undefined') {
      adjustPOPUP(closest);
      popup.style.display = "";
    } else {
      win = document.getElementsByClassName('chartwrap')[0];
      popup = document.createElement('div');
      popup.classList = 'popup';
      adjustPOPUP(closest);
      win.appendChild(popup);
    }

    // console.log(getElementIndex(closest));
    // console.log(getElementIndex(closest));
    // console.log(closest.id);
    // console.log(closest.id.slice(2));

    // function getElementIndex(node) {
    //     var index = 0;
    //     while ( (node = node.previousElementSibling) ) {
    //         index++;
    //     }
    //     return index;
    // }
  }

  function adjustPOPUP() {
    let id = closest.className.baseVal.slice(1);
    popup.innerHTML = "<span>Participant: "+ar[id][0]+"</span><span>AOI: "+AOIs[ar[id][1]]+"</span><span>Start: "+ar[id][2]+" ms</span><span>End: "+ar[id][3]+" ms</span><span>Duration: "+(ar[id][3]-ar[id][2])+" ms</span>";
    popup.style.top = closest.getBoundingClientRect().bottom - win.getBoundingClientRect().top + 4 + "px";
    popup.style.left = closest.getBoundingClientRect().left - win.getBoundingClientRect().left + "px";
  }
};

function getPrettyBreak10(n) {
  let res = n/10;
  let num_of_digits = Math.log(res) * Math.LOG10E + 1 | 0;
  res = (res/(10**(num_of_digits))).toFixed(1);
  return res*(10**(num_of_digits))
}

function getElementIndex(node) {
    var index = 0;
    while ( (node = node.previousElementSibling) ) {
        index++;
    }
    return index;
}

//other event handlers
function handleRelative() {
  let elem = document.getElementsByClassName('torelative')[0];
  let barwrap = document.getElementsByClassName('barwrap');
  if (!elem.classList.contains('activebtn3')) {
    for (var i = 0; i < barwrap.length; i++) {
      barwrap[i].setAttribute('width', '100%');
    }
    elem.classList.add('activebtn3');
  } else {
    for (var i = 0; i < barwrap.length; i++) {
      let bwwidth = (ar_participants_dur[i]/ar_participants_maxdur)*100 + '%';
      barwrap[i].setAttribute('width', bwwidth);
    }
    elem.classList.remove('activebtn3');
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



elmFileUpload.addEventListener('change',onFileUploadChange,false);

// třídění na později
// indices.sort(function (a, b) { return array1[a] < array1[b] ? -1 : array1[a] > array1[b] ? 1 : 0; });
