function parseFile(file, callback) { console.time("A");
    var fileSize   = file.size;
    var chunkSize  = 100 * 1024; // bytes
    var offset     = 0;
    //var self       = this; // we need a reference to the current object
    var chunkReaderBlock = null;

    var readEventHandler = function(evt) {
        if (evt.target.error == null) {
            offset += chunkSize;
            callback(evt.target.result); // callback for handling read chunk
        } else {
            console.log("Read error: " + evt.target.error);
            return;
        }
        if (offset >= fileSize) {
            console.log("Done reading file");console.timeEnd("A");
            return;
        }

        // of to the next chunk
        chunkReaderBlock(offset, chunkSize, file);
    }

    chunkReaderBlock = function(_offset, length, _file) {
        var r = new FileReader();
        var blob = _file.slice(_offset, length + _offset);
        r.onload = readEventHandler;
        r.readAsText(blob);
    }

    // now let's start the read with the first block
    chunkReaderBlock(offset, chunkSize, file);
}


function parseFile(file) { console.time("A");
    var fileSize   = file.size;
    var chunkSize  = 10000 * 1024; // bytes
    var offset     = 0;
    //var self       = this; // we need a reference to the current object
    var chunkReaderBlock = null;

    let lastRow = "";
    let col;
    let currentRow;
    let lastStartTime;

    let isHeaderProcessed = false;
    let i = 1; //will change to 0 after first pump

    var readEventHandler = function(evt) {
        if (evt.target.error == null) {
            offset += chunkSize;
            let chunkResult = (lastRow + evt.target.result).split("\r\n");

            lastRow = chunkResult[chunkResult.length - 1];

            if (!isHeaderProcessed) {
              col = getColPositions(chunkResult[0]);
              isHeaderProcessed = true
            }
            testProcess(chunkResult);
            i = 0;

        } else {
            console.log("Read error: " + evt.target.error);
            return;
        }
        if (offset >= fileSize) {
            console.log("Done reading file");
            processFinalData();
            processParticipantsMaxDurations();
            printSequenceChart();
            console.timeEnd("A");
            return;
        }

        // of to the next chunk
        chunkReaderBlock(offset, chunkSize, file);
    }

    chunkReaderBlock = function(_offset, length, _file) {
        var r = new FileReader();
        var blob = _file.slice(_offset, length + _offset);
        r.onload = readEventHandler;
        r.readAsText(blob);
    }

    // now let's start the read with the first block
    chunkReaderBlock(offset, chunkSize, file);

    function getColPositions(header) {
      header = header.split("\t");
      const start = header.indexOf("Event Start Trial Time [ms]");
      const end = header.indexOf("Event End Trial Time [ms]");
      const stimulus = header.indexOf("Stimulus");
      const participant = header.indexOf("Participant");
      const aoi = header.indexOf("AOI Name");
      return {start, end, stimulus, participant, aoi}
    }

    function testProcess(dataArray) {

      for (i; i < dataArray.length-1; i++) {
        currentRow = dataArray[i].split("\t");

        if (currentRow[col.start] !== lastStartTime && currentRow[col.start] !== undefined) {
          //SMI Event statistics has usually redundant (doubled) data
          //write previous segment
          let previousSegment = {
          start: Number(currentRow[col.start]),
          end: Number(currentRow[col.end]),
          stimulus: currentRow[col.stimulus],
          participant: currentRow[col.participant],
          isAoiPrepared: false,
          aoi: currentRow[col.aoi]};
          //testArr.push(previousSegment);
          lastStartTime = currentRow[col.start];
          processRowObject(previousSegment);
        }

      }

    }
}
