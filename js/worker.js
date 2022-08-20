"use strict";

/*
DATA PROCESSOR
==============
Class for handling pre-parsed row of eye-tracking data and its specific subclasses.
It sends final data for charts to the main.js.
*/

class DataProcessor {
  constructor() {
    //template for processed ET data
    this.data = {
      "stimuli":{"data":[],"orderVector":[]},
      "participants":{"data":[],"orderVector":[]},
      "categories":{"data":[["Fixation"],["Saccade"]],"orderVector":[]},
      "aois":{"data":[],"orderVector":[]},
      "segments":[]
    }
  }

  setNewSegment(start,end,stimulus,participant,category,aoi) {
      //get stimulus' index and add stimulus info to data (if new)
      const stimulusIndex = this.processStimulus(stimulus);
      //get participant's index and add participant info to data (if new)
      const participantIndex = this.processParticipant(participant, stimulusIndex);
      //get array of AOI IDs and add AOIs info to data (if new)
      const aoiIDs = this.processAOIs(aoi, stimulusIndex, participantIndex);

      const categoryID = this.processCategory(category);

      //generation of Segment info array:
      //0: start time [ms], 1: end time [ms], 2: category ID, 3+: AOI ID(s)
      let segment = [start, end, categoryID];
      if (aoiIDs !== null) {
        segment = segment.concat(aoiIDs);
      }
      //check if the value is undefined
      //if yes, assign the value of an empty array to it
      this.data.segments[stimulusIndex][participantIndex] ??= [];
      this.data.segments[stimulusIndex][participantIndex].push(segment);

  }

  processStimulus(sName) {
    //check if Stimulus name (string) is already recorded in "data"
    //the original name is always saved to a new array object to index position 0
    let sData = this.data.stimuli.data; //this could be dangerous
    let sIndex = sData.findIndex(el => el[0] === sName);

    if (!~sIndex) {
      sIndex = sData.length;
      sData.push([sName]);
      this.data.aois.data.push([]);
      this.data.segments.push([]);
    }

    return sIndex
  }

  processParticipant(pName, sIndex) {
    //check if Stimulus name (string) is already recorded in "data"
    //the original name is always saved to a new array object to index position 0
    let pData = this.data.participants.data;
    let pIndex = pData.findIndex(el => el[0] === pName);

    if (!~pIndex) {
      pIndex = pData.length;
      pData.push([pName]);
      this.data.segments[sIndex].push([]);
    }

    return pIndex
  }

  processCategory(cName) {
    let cData = this.data.categories.data;
    let cIndex = cData.findIndex(el => el[0] === cName);
    if (!~cIndex) {
      cIndex = cData.length;
      cData.push([cName]);
    }
    return cIndex
  }

  processAOIs(aName, sIndex) {
    //if no AOI, skip
    if (aName === null) {return null}

    //check if AOI name (single string!) is already recorded in "data"
    //the original name is always saved to a new array object to index position 0
    let aData = this.data.aois.data[sIndex];
    let aIndex = aData.findIndex(el => el[0] === aName);

    if (!~aIndex) {
      aIndex = aData.length;
      aData.push([aName+""]);
    }
    
    return [aIndex] //is array for cross-compatibility
  }

  get processedData() {
    return this.data
  }

  }

  class Tobii_DProcessor extends DataProcessor {

    //Tobii sets stimuli and AOIs ahead from header!

    setStimuli(sNames) {
      //setting stimuli in advance from header - important for setting AOIs
      let sData = this.data.stimuli.data;
      for (let i = 0; i < sNames.length; i++) {
        //push new Stimulus array object
        //0: Stimulus name
        sData.push([sNames[i]]);
        this.data.segments.push([]);
      }
    }
  
    setAOIs(aNames, sIndex) {
      //accepts array of names and index of stimulus (int)
      let aData = this.data.aois.data;
      aData.push([]);
      for (let i = 0; i < aNames.length; i++) {
        //push new Stimulus array object
        //0: Stimulus name
        aData[sIndex].push([aNames[i]]);
      }
    }

    processStimulus(sName) {
      //check if Stimulus name (string) is registered in header
      let sData = this.data.stimuli.data;
      let sIndex = sData.findIndex(el => el[0] === sName);
      
      //maybe some error checking?

      return sIndex
    }

    processAOIs(indexes) {
      return indexes
    }

  }

  class BeGaze_DProcessor extends DataProcessor {
    get processedData() {
      //sort by time
      this.sortSegments();
      //merge fixation events to one with multiple aois
      const mergingInfo = this.mergeDuplicatedSegments();
      this.reportOnFinalProcessing(mergingInfo);
      return this.data
    }

    reportOnFinalProcessing(mergingInfo) {
      //merging info
      console.group("BeGaze Overlapping AOIs");
      if (mergingInfo[1] > 0) {
        console.info("Multiple AOIs per fixation registered");
        console.table(mergingInfo[0]);
      } else {
        console.warn("No multiple AOIs per fixation registered. If you have overlapping AOIs in your dataset, make sure you uploaded correct data")
      }
      console.groupEnd()

    }

    sortSegments() {
      const noOfStimuli = this.data.segments.length;
      const noOfParticipants = this.data.participants.data.length;
      for (let stimulusId = 0; stimulusId < noOfStimuli; stimulusId++) {
        for (let participantId = 0; participantId < noOfParticipants; participantId++) {
          let segmentPart = this.data.segments[stimulusId][participantId];
          segmentPart.sort(sortFn)
        }
      }
      //sort by start time in segment array (index 0)
      function sortFn(a, b) {
        return a[0] - b[0]
      }
    }

    mergeDuplicatedSegments() {
      //FAULTY!
      //must be sorted beforehand
      const noOfStimuli = this.data.segments.length;
      const noOfParticipants = this.data.participants.data.length;
      const fixationCategoryId = 0; //0 in category slot stands for "Fixation" - merging only fixations

      //for logging how many merges were done
      let info = {}; //for creating table
      let mergeCount = 0; //total count

      for (let stimulusId = 0; stimulusId < noOfStimuli; stimulusId++) {

        //logging info
        const stimulName = this.data.stimuli.data[stimulusId][0];
        info[stimulName] = {};

        for (let particId = 0; particId < noOfParticipants; particId++) {

          let segmentPart = this.data.segments[stimulusId][particId];

          //logging
          const mergeCountBase = mergeCount;

          //if defined, not null...
          if (segmentPart) {
            let prevStart;
            let prevEnd;
            let segIdToJoin;
            //go through every segment for given participant and stimulus
            for (let segmentId = 0; segmentId < segmentPart.length; segmentId++) {
              const currSegment = segmentPart[segmentId];
              //if fixation with identical start and end (than assuming, there are two AOIs to join))
              if (currSegment[0] === prevStart && currSegment[1] === prevEnd && currSegment[2] === fixationCategoryId) {
                  
                // //add AOI id to the previous one
                // //WARNING! No control wheter the AOI is already in dataset - just assumption!
                segmentPart[segIdToJoin].push(currSegment[3]);

                mergeCount++;
                //delete segment from array
                segmentPart.splice(segmentId, 1);
                segmentId--;
              } else {
                segIdToJoin = segmentId;
              }
              prevStart = currSegment[0];
              prevEnd = currSegment[1];
            }
          }

          const partiName = this.data.participants.data[particId][0];
          info[stimulName][partiName] = mergeCount-mergeCountBase;

        }
      }
      return [info,mergeCount]
    }
  }

/*
ROW PARSER
==============
Class for parsing text row of eye-tracking data and its specific subclasses.
It sends parsed data row by row to DATA PROCESSOR.
*/

class RowParser {
  constructor() {
    this.rowsParsed = 0;
  }

  endParsing() {
    console.log("Rows parsed:", this.rowsParsed);
  }
}
  class BeGaze_RParser extends RowParser {
    constructor(header) {
      super();
      //process header
      this.readHeader(header);
    }

    readHeader(header) {
      this.colPos = {
        start: header.indexOf("Event Start Trial Time [ms]"),
        end: header.indexOf("Event End Trial Time [ms]"),
        stimulus: header.indexOf("Stimulus"),
        participant: header.indexOf("Participant"),
        category: header.indexOf("Category"),
        aoi: header.indexOf("AOI Name")
      }
    }
    readRow(row) {
      let start = Number(row[this.colPos.start]);
      if (isNaN(start)) { return }
      let category = row[this.colPos.category];
      if (category === "Separator") {return}
      let end = Number(row[this.colPos.end]); 
      if (isNaN(end)) {end = start}
      let aoi = row[this.colPos.aoi];
      if (aoi === "-" || aoi === "White Space") {aoi = null}
      dProcessor.setNewSegment(
        start,
        end,
        row[this.colPos.stimulus],
        row[this.colPos.participant],
        category,
        aoi
      );
      
    }
  }

  class Tobii_RParser extends RowParser {
    constructor(header) {
      super();
      //define cachinf variables
      this.lastStimulus;
      this.lastParticipant;
      this.lastCategory;
      this.lastAoi;
      this.isThereOpenSegment = false;
      this.currentTime;
      //process header
      this.readHeader(header);
  }
  readHeader(header) {
    //find column indexes
    this.colPos = {time: header.indexOf("Recording timestamp"),
                  stimulus: header.indexOf("Presented Stimulus name"),
                  participant: header.indexOf("Participant name"),
                  recording: header.indexOf("Recording name"),
                  category: header.indexOf("Eye movement type"),
                  aoi: []};
    //format of Tobii AOI columns is: "AOI hit [#NAME_OF_STIMULUS - #NAME_OF_AOI_CATEGORY]"
    //get array of columns containing info about AOI hits
    const aoiColumns = header.filter((x)=>(x.startsWith("AOI hit [")));
    //get stimuli names from those columns
    const uniqueStimulusNames = [...new Set(aoiColumns.map(x => x.replace(/AOI hit \[|\s-.*?\]/g, "")).sort())];
    //set stimuli for DataProcessor
    //and save to cache
    dProcessor.setStimuli(uniqueStimulusNames);
    this.stimuliNames = uniqueStimulusNames;
    //for every stimulus
    for (var k = 0; k < uniqueStimulusNames.length; k++) {
      //keep only columns with given stimulus name
      const currentStimulusAoiColumns = aoiColumns.filter((x)=>(x.startsWith("AOI hit ["+uniqueStimulusNames[k])));
      //get index of first column of those columns
      const positionOfFirstColumn = header.indexOf(currentStimulusAoiColumns[0]);
      let aoiNames = [];
      let aoiPositions = [];
      currentStimulusAoiColumns.forEach((item, ix) => {
        aoiNames.push(item.replace(/A.*?- |\]/g, ""));
        aoiPositions.push(ix + positionOfFirstColumn)
      });
      this.colPos.aoi.push(aoiPositions);
      dProcessor.setAOIs(aoiNames, k);
    }
  }

  readRow(row) {

    let currentAoiColumns;
    const TIME_MODIFIER = 0.001; //he?
    const stimulusIndex = this.stimuliNames.indexOf(row[this.colPos.stimulus]);

    const openAoiSegment = (participant) => {
      this.lastParticipant = participant;
      this.lastStimulus = row[this.colPos.stimulus];
      this.lastStartTime = row[this.colPos.time]*TIME_MODIFIER;
      this.lastCategory = row[this.colPos.category];
      this.lastAoi = currentAoiColumns;
      this.isThereOpenSegment = true;
    }

    //if there's a Stimulus from header in "Presented Stimulus" column, then process
    if (stimulusIndex !== -1) {

      //participant
      const participant = row[this.colPos.participant] + "_" + row[this.colPos.recording];

      //get column positions of aois
      const currentAoiColumnsIndexes = this.colPos.aoi[stimulusIndex];

      //get joined binary values of those aoi columns
      //if AOI_1: TRUE and AOI_2: FALSE, then "01"
      currentAoiColumns = currentAoiColumnsIndexes.map(x=>row[x]).join("");

      //if stimulus or participant changed
      if (row[this.colPos.stimulus] !== this.lastStimulus || participant !== this.lastParticipant) {
        if (this.isThereOpenSegment) {this.closeAoiSegment()}
        this.baseTime = row[this.colPos.time]*TIME_MODIFIER;
        openAoiSegment(participant)
      } 
      // or if just aoi/category changed
      else if (currentAoiColumns !== this.lastAoi || row[this.colPos.category] !== this.lastCategory) {
        if (this.isThereOpenSegment) {this.closeAoiSegment()}
      openAoiSegment(participant)
      }

      //save time
      this.currentTime = row[this.colPos.time]*TIME_MODIFIER
  }
  }

  closeAoiSegment() {

    const start = this.lastStartTime - this.baseTime;
    const end = this.currentTime - this.baseTime;
    const aoi = this.getAoiIndexes(this.lastAoi); //THIS IS FUCKING NOT TOBII AOIS UP
    this.isThereOpenSegment = false;

    dProcessor.setNewSegment(start, end, this.lastStimulus, this.lastParticipant, this.lastCategory, aoi);

  }

  getAoiIndexes(stringOfBinaries) {
    let indexesArray = [];
    for (var i = 0; i < stringOfBinaries.length; i++) {
      if (stringOfBinaries[i] === "1") {indexesArray.push(i)}
    }
    return indexesArray
  }

  }

/*
STREAM RECEIVER
==============
Class for parsing text row of eye-tracking data and its specific subclasses.
It sends parsed data row by row to DATA PROCESSOR.
*/

class StreamReceiver {
  constructor() {
    this.rowIndex = 1;
    this.lastRow = "";
    this.decoder = new TextDecoder("utf-8"); //utf-8
    this.isHeaderProcessed = false;

    // this.rowDelimiter = "";
    // this.colDelimiter = "";
  }

  processUint(value) {
    //console.log(value);
    //decode and prepare current pump of stream
 
    const dataArray = (this.lastRow + value).split("\r\n");
    this.lastRow = dataArray[dataArray.length - 1];

    if (!this.isHeaderProcessed) {
      this.setUpParser(dataArray[0].split("\t"));
      this.isHeaderProcessed = true
    }

    for (let i = this.rowIndex; i < dataArray.length - 1; i++) {
      rParser.readRow(dataArray[i].split("\t"));
    }
  

  this.rowIndex = 0;
  }

  setUpParser(header) {
    if (header.includes("RecordingTime [ms]")) {
      // // Static Raw data (SMI)
      // const processFun = rawSMI;
      // const time = header.indexOf("RecordingTime [ms]");
      // const stimulus = header.indexOf("Stimulus");
      // const participant = header.indexOf("Participant");
      // let aoi = header.indexOf("AOI Name Right");
      // if (!~aoi) {aoi = header.indexOf("AOI Name Left")}
      // return {processFun, time, stimulus, participant, aoi}
    } else if (header.includes("Event Start Trial Time [ms]")	&& header.includes("Event End Trial Time [ms]")) {
      // // Event Statistics SMI
      dProcessor = new BeGaze_DProcessor();
      rParser = new BeGaze_RParser(header);
    } else if (header.includes("Recording timestamp")) {
      //Tobii raw
      dProcessor = new Tobii_DProcessor();
      rParser = new Tobii_RParser(header);
    }
  }
}

/*
RUNTIME
==============
*/

var receiver = new StreamReceiver();
var dProcessor;
var rParser;

self.onmessage = (event) => {
  if (event.data === "getEyeTrackingData") {
    self.postMessage(dProcessor.processedData);
    dProcessor = null;
    rParser = null;
    receiver = new StreamReceiver();
  } else if (event.data.constructor.name === "ReadableStream") {
    //process text file (ReadableStream)
    //receiver.processUint(event.data);
    processReadableStream(event.data);
  }
}

function processReadableStream(rs) {
  const reader = rs.pipeThrough(new TextDecoderStream()).getReader();
  //const reader = rs.pipeThrough(new JSTextDecoderStream()).getReader();
  const pump = reader => reader.read()
  .then(({ value, done }) => {
    //last chunk? end this
    if (done) {
      self.postMessage(dProcessor.processedData);
      dProcessor = null;
      rParser = null;
      receiver = new StreamReceiver();
      //worker.postMessage("getEyeTrackingData");
      return
    }
    receiver.processUint(value);
    //worker.postMessage(value,[value.buffer]);
    return pump(reader)
  })
return pump(reader)
  
}


// function rawSMI(currentRow) {

//   if (currentRow[col.participant] !== lastParticipant || currentRow[col.stimulus] !== lastStimulus || currentRow[col.aoi] !== lastAoi) {
//     currentTime = currentRow[col.time];
//     if (currentRow[col.stimulus] !== lastStimulus || currentRow[col.participant] !== lastParticipant) {
//       currentTime = backupTime;
//     }

//     if (isThereOpenSegment) {
//       isThereOpenSegment = false;
//       dp.setNewSegment(lastStartTime - baseTime, //start
//                        currentTime - baseTime, //end
//                        lastStimulus, //stimulus
//                        lastParticipant,
//                        0, 
//                        lastAoi) //isAoiPrepared
//       // processRowObject(lastStartTime - baseTime, //start
//       //                  currentTime - baseTime, //end
//       //                  lastStimulus, //stimulus
//       //                  lastParticipant, //participant
//       //                  lastAoi, //aoi
//       //                  false) //isAoiPrepared
//     }

//     //open new segment
//     lastStartTime = currentRow[col.time];
//     lastAoi = currentRow[col.aoi];
//     isThereOpenSegment = true;
//     if (currentRow[col.stimulus] !== lastStimulus) { lastStimulus = currentRow[col.stimulus]; baseTime = currentRow[col.time]}
//     if (currentRow[col.participant] !== lastParticipant) {
//       lastParticipant = currentRow[col.participant]; baseTime = currentRow[col.time] }
//   }
//   backupTime = currentRow[col.time]
// }


//polyfill z
//https://contest-server.cs.uchicago.edu/ref/JavaScript/developer.mozilla.org/en-US/docs/Web/API/TransformStream.html
// class JSTextDecoderStream extends TransformStream {
//   constructor(encoding = 'utf-8', {...options} = {}) {
//     const tds = {
//       start(){
//         this.decoder = new TextDecoder(encoding, options)
//       },
//       transform(chunk, controller) {
//         controller.enqueue(this.decoder.decode(chunk))
//       }
//     }

//     let t = {...tds, encoding, options}

//     super(t)
//     this._jstds_wm = new WeakMap(); /* info holder */
//     this._jstds_wm.set(this, t)
//   }
//   get encoding() {return this._jstds_wm.get(this).decoder.encoding}
//   get fatal() {return this._jstds_wm.get(this).decoder.fatal}
//   get ignoreBOM() {return this._jstds_wm.get(this).decoder.ignoreBOM}
// }