"use strict";

var aoiSegments;
var aoiCategories;
var participants;
var stimuli;

var lastRow = "";

//this is needed for every type
var col;
var currentRow;
var lastStartTime;
//for non-event types
var baseTime;
var lastStimulus;
var lastParticipant;
var lastAoi;
var currentTime;
var backupTime;
var previousSegment;
var isThereOpenSegment;

var isHeaderProcessed;
var i; //will change to 0 after first pump

function initMainVals() {
  aoiSegments = {
    startTime: [],
    endTime: [],
    AOIid: []
  };
  aoiCategories = {
    names: [],
    colors: [],
    orders: []
  };
  participants = {
    sessionDuration: [],
    maxDuration: [],
    names: [],
    highestAOISegmentId: [],
    aoiSegmentIDStart: [],
  };
  stimuli = {
    currentlySelected: 0,
    names: []
  };

  lastRow = "";
  col = null;
  currentRow = null;
  lastStartTime = null;
  baseTime = null;
  lastStimulus = null;
  lastParticipant = null;
  lastAoi = null;
  currentTime = null;
  backupTime = null;
  previousSegment = null;

  isThereOpenSegment = false;
  isHeaderProcessed = false;
  i = 1;
}

initMainVals();

const decoder = new TextDecoder();

self.onmessage = (event) => {
  if (event.data === "getEyeTrackingData") {
    self.postMessage([participants, stimuli, aoiCategories, aoiSegments]); return
  } else if (event.data === "init") {
    initMainVals();
  } else {
    processUint(event.data);
  }
}


function processUint(value) {
  //decode and prepare current pump of stream
  let dataArray = (lastRow + decoder.decode(value)).split("\r\n");
  lastRow = dataArray[dataArray.length - 1];

  if (!isHeaderProcessed) {
    //col = getColPositions(dataArray[0]);
    col = getColPositions2(dataArray[0].split("\t"));
    isHeaderProcessed = true
  }

  for (i; i < dataArray.length - 1; i++) {
    col.processFun(dataArray[i].split("\t"));
  }

  //testProcess(dataArray);
  i = 0;
  // console.log(aoiSegments); //- něco v pořádku - neukládá se
  //console.log(col); - získáno v pořádku
}

function getColPositions2(header) {
  if (header.includes("RecordingTime [ms]")) {
    // Static Raw data (SMI)
    const processFun = rawSMI;
    const time = header.indexOf("RecordingTime [ms]");
    const stimulus = header.indexOf("Stimulus");
    const participant = header.indexOf("Participant");
    let aoi = header.indexOf("AOI Name Right");
    if (!~aoi) {aoi = header.indexOf("AOI Name Left")}
    return {processFun, time, stimulus, participant, aoi}
  } else if (header.includes("Event Start Trial Time [ms]")	&& header.includes("Event End Trial Time [ms]")) {
    // Event Statistics SMI
    const processFun = eventSMI;
    const start = header.indexOf("Event Start Trial Time [ms]");
    const end = header.indexOf("Event End Trial Time [ms]");
    const stimulus = header.indexOf("Stimulus");
    const participant = header.indexOf("Participant");
    const aoi = header.indexOf("AOI Name");
    return {processFun, start, end, stimulus, participant, aoi}
  } else if (header.includes("Recording timestamp")) {
    // znovuzprovoznit!
    const columnPositions = {processFun: tobiiRaw,
                            time: header.indexOf("Recording timestamp"),
                            stimulus: header.indexOf("Presented Stimulus name"),
                            participant: header.indexOf("Participant name"),
                            category: header.indexOf("Eye movement type"),
                            aoi: []};

    //format of Tobii AOI columns is: "AOI hit [#NAME_OF_STIMULUS - #NAME_OF_AOI_CATEGORY]"
    const aoiColumns = header.filter((x)=>(x.startsWith("AOI hit [")));
    const uniqueStimulusNames = [...new Set(aoiColumns.map(x => x.replace(/AOI hit \[|\s-.*?\]/g, "")).sort())];
    stimuli.names = uniqueStimulusNames;

    for (var k = 0; k < uniqueStimulusNames.length; k++) {
      const currentStimulusAoiColumns = aoiColumns.filter((x)=>(x.startsWith("AOI hit ["+uniqueStimulusNames[k])));
      const positionOfFirstColumn = header.indexOf(currentStimulusAoiColumns[0]);
      let aoiNames = [];
      let aoiPositions = [];
      currentStimulusAoiColumns.forEach((item, ix) => {
        aoiNames.push(item.replace(/A.*?- |\]/g, ""));
        aoiPositions.push(ix + positionOfFirstColumn)
      });
      columnPositions.aoi.push(aoiPositions);

      aoiCategories.names.push(aoiNames);
      pushNewArraysToMainData();
    }
    return columnPositions
  }
}

function eventSMI(currentRow) {
  if (currentRow[col.start] !== lastStartTime && currentRow[col.start] !== undefined) {
    lastStartTime = currentRow[col.start];
    processRowObject(Number(currentRow[col.start]), //start
                     Number(currentRow[col.end]), //end
                     currentRow[col.stimulus], //stimulus
                     currentRow[col.participant], //participant
                     currentRow[col.aoi],
                     false);
  }
}

function rawSMI(currentRow) {

  if (currentRow[col.participant] !== lastParticipant || currentRow[col.stimulus] !== lastStimulus || currentRow[col.aoi] !== lastAoi) {
    currentTime = currentRow[col.time];
    if (currentRow[col.stimulus] !== lastStimulus || currentRow[col.participant] !== lastParticipant) {
      currentTime = backupTime;
    }

    if (isThereOpenSegment) {
      isThereOpenSegment = false;
      processRowObject(lastStartTime - baseTime, //start
                       currentTime - baseTime, //end
                       lastStimulus, //stimulus
                       lastParticipant, //participant
                       lastAoi, //aoi
                       false) //isAoiPrepared
    }

    //open new segment
    lastStartTime = currentRow[col.time];
    lastAoi = currentRow[col.aoi];
    isThereOpenSegment = true;
    if (currentRow[col.stimulus] !== lastStimulus) { lastStimulus = currentRow[col.stimulus]; baseTime = currentRow[col.time]}
    if (currentRow[col.participant] !== lastParticipant) {
      lastParticipant = currentRow[col.participant]; baseTime = currentRow[col.time] }
  }
  backupTime = currentRow[col.time]
}

function tobiiRaw(currentRow) {
  if (stimuli.names.includes(currentRow[col.stimulus]) || isThereOpenSegment) {

    let currentAoiColumnsIndexes = col.aoi[stimuli.names.indexOf(currentRow[col.stimulus])];
    let currentAoiColumns = undefined;
    if (currentAoiColumnsIndexes) {
      currentAoiColumns = currentAoiColumnsIndexes.map(x=>currentRow[x]).join("");
    }


    if (currentRow[col.stimulus] !== lastStimulus || currentRow[col.participant] !== lastParticipant || currentAoiColumns !== lastAoi) {

          currentTime = currentRow[col.time];
          if (currentRow[col.stimulus] !== lastStimulus || currentRow[col.participant] !== lastParticipant) {
            //!stimuli.names.includes(currentRow[col.stimulus])
            //pokud mimo, tak pro sichr vezme backup!!
            currentTime = backupTime;
          }
          //uložit předcházející start time segmentu - pokud tu je
          if (isThereOpenSegment) {

            processRowObject(lastStartTime - baseTime, //start
                            currentTime - baseTime, //end
                            lastStimulus, //stimulus
                            lastParticipant, //participant
                            getAoiIndexes(lastAoi), //aoi
                            true); //isAoiPrepared
            isThereOpenSegment = false;
          }


          if (stimuli.names.includes(currentRow[col.stimulus])) {
            //nyní lze mít nový lastStartTime
            lastStartTime = currentTime;
            lastAoi = currentAoiColumns;
            isThereOpenSegment = true;

            if (currentRow[col.stimulus] !== lastStimulus) { lastStimulus = currentRow[col.stimulus]; baseTime = currentTime }
            if (currentRow[col.participant] !== lastParticipant) { lastParticipant = currentRow[col.participant]; baseTime = currentTime }
          }
        }
  }
  //důležité!!!!
  backupTime = currentRow[col.time];
}

function processRowObject(start,end,stimulus,participant,aoi,isAoiPrepared) {
  let indexOfStimulus = stimuli.names.indexOf(stimulus);
  if (!~indexOfStimulus) {
    //stimulus not yet saved - let's fix it!
    indexOfStimulus = stimuli.names.length;
    stimuli.names.push(stimulus);
    aoiCategories.names.push([]);
    pushNewArraysToMainData()
  }
  let indexOfParticipant = participants.names.indexOf(participant);
  if (!~indexOfParticipant) {
    //participant not yet saved - let's fix it!
    indexOfParticipant = participants.names.length;
    participants.names.push(participant);
  }
  if (!isAoiPrepared) {
    //process AOI
    let aoiCatsNames = aoiCategories.names[indexOfStimulus];
    let aoiIndex = aoiCatsNames.indexOf(aoi);
    if (!~aoiIndex) {
      aoiCatsNames.push(aoi);
      aoiIndex = aoiCatsNames.indexOf(aoi);
    }
    aoi = aoiIndex+"";
  }

  const previousSegmentInStimulusStart = aoiSegments.startTime[indexOfStimulus][aoiSegments.startTime[indexOfStimulus].length-1];

  const isNewParticipant = !(start > previousSegmentInStimulusStart); // !(false) if undefined
  if (isNewParticipant) {
    let start = aoiSegments.startTime[indexOfStimulus].length;
    participants.aoiSegmentIDStart[indexOfStimulus][indexOfParticipant] = start;
  }

  aoiSegments.startTime[indexOfStimulus].push(start);
  aoiSegments.endTime[indexOfStimulus].push(end);
  aoiSegments.AOIid[indexOfStimulus].push(aoi);

}

function pushNewArraysToMainData() {
  participants.sessionDuration.push([]);
  participants.highestAOISegmentId.push([]);
  participants.aoiSegmentIDStart.push([]);
  aoiSegments.startTime.push([]);
  aoiSegments.endTime.push([]);
  aoiSegments.AOIid.push([]);
}

function getAoiIndexes(stringOfBinaries) {
  let indexesArray = [];
  let stringResult = "";
  for (var i = 0; i < stringOfBinaries.length; i++) {
    if (stringOfBinaries[i] === "1") {indexesArray.push(i)}
  }
  stringResult = indexesArray.join("_");
  if (stringResult === "") {
    //no AOI hitted - add AOI named "None"
    stringResult = stringOfBinaries.length + "";
    if (!aoiCategories.names[stimuli.names.indexOf(lastStimulus)].includes("None")) {
      aoiCategories.names[stimuli.names.indexOf(lastStimulus)].push("None")
    }
  }
  return (stringResult)
}
