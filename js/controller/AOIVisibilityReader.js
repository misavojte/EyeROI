import {data} from "../model/eyeTrackingData.js";

export class AOIVisibilityReader {
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