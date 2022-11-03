const DEFAULT_COLORS = ["#66c5cc", "#f6cf71", "#f89c74", "#dcb0f2", "#87c55f", "#9eb9f3", "#fe88b1", "#c9db74", "#8be0a4", "#b497e7", "#d3b484", "#b3b3b3"];

export class EyeTrackingData {

    setData(data) {
        this.main = data;
    }

    //stimulus getters

    getStimulInfo(stimulusIndex) {
        //get saved data in main
        let response = this.getStimulName(stimulusIndex);
        response.highestEndTime = this.getStimulHighestEndTime(stimulusIndex);
        return response
    }

    getStimulName(stimulusIndex) {
        const stimulArr = this.main.stimuli.data[stimulusIndex];
        const originalName = stimulArr[0];
        const displayedName = stimulArr[1] || stimulArr[0];
        return {originalName, displayedName}
    }

    getStimulHighestEndTime(stimulusIndex) {
        //determine which end time from the last segments of each participant has the highest value
        //important for determing length of X axis in plots
        const segmentsInfo = this.main.segments[stimulusIndex];
        let max = 0;
        for (let participantIndex = 0; participantIndex < segmentsInfo.length; participantIndex++) {
            if (segmentsInfo[participantIndex]) {
                const lastSegmentIndex = segmentsInfo[participantIndex].length - 1;
                if (lastSegmentIndex >= 0) {
                    const lastSegmentEndTime = segmentsInfo[participantIndex][lastSegmentIndex][1];
                    if (lastSegmentEndTime > max) {
                        max = lastSegmentEndTime
                    }
                }
            }
        }
        return max
    }

    // particip getter

    getParticName(particIndex) {
        const particArr = this.main.participants.data[particIndex];
        const originalName = particArr[0];
        const displayedName = particArr[1] || particArr[0];
        return {originalName, displayedName}
    }

    getParticEndTime(stimulusIndex, particIndex) {
        const segmentsInfo = this.main.segments[stimulusIndex][particIndex];
        if (!segmentsInfo) {
            return 0
        }
        if (segmentsInfo.length < 1) {
            return 0
        }
        return segmentsInfo[segmentsInfo.length - 1][1]
    }

    getParticInfo(stimulusIndex, particIndex) {
        let result = this.getParticName(particIndex);
        result.endTime = this.getParticEndTime(stimulusIndex, particIndex);
        return result
    }

    // aois getters
    getAoiInfo(stimulusId, aoiId) {
        const aoiArr = this.main.aois.data[stimulusId][aoiId];
        const originalName = aoiArr[0];
        const displayedName = aoiArr[1] || originalName;
        const color = aoiArr[2] || DEFAULT_COLORS[aoiId];
        return {aoiId, originalName, displayedName, color}
    }

    getCatName(categoryId) {
        const catArr = this.main.categories.data[categoryId];
        const originalName = catArr[0];
        const displayedName = catArr[1] || catArr[0];
        return {originalName, displayedName}
    }

    //seg getter
    getSegmentInfo(stimulusId, participantId, segmentId) {
        const segmentArr = this.main.segments[stimulusId][participantId][segmentId];
        const start = segmentArr[0];
        const end = segmentArr[1];
        const category = segmentArr[2];
        const aoi = segmentArr.slice(3);
        return {start, end, category, aoi}
    }

    getNoOfSegments(stimulusId, participantId) {
        return this.main.segments[stimulusId][participantId].length
    }

    getAoiOrderArray(stimulusIndex) {
        let order = this.main.aois.orderVector[stimulusIndex];
        //if it does not exist in data, return array of sequence from 0 to N
        //N ... number of aoi categories for given stimulus
        if (!order) {
            const noOfAois = this.main.aois.data[stimulusIndex].length;
            return [...Array(noOfAois).keys()]
        }
        return order
    }

    get noOfParticipants() {
        return this.main.participants.data.length
    }

    setAoiColor(stimulusId, aoiId, color) {
        if (this.getAoiInfo(stimulusId, aoiId).color !== color) {
            this.main.aois.data[stimulusId][aoiId][2] = color;
        }
    }

    setAoiName(stimulusId, aoiId, name) {
        if (this.getAoiInfo(stimulusId, aoiId).displayedName !== name) {
            this.main.aois.data[stimulusId][aoiId][1] = name;
        }
    }

    setAoiOrder(stimulusId, order) {
        if (this.getAoiOrderArray(stimulusId) !== order) {
            this.main.aois.orderVector[stimulusId] = order;
        }
    }

    addAoiVis(stimulusId, aoiName, visibilityArr) {
        let aoiData = this.main.aois.data[stimulusId];
        const aoiId = aoiData.findIndex(el => el[0] === aoiName);
        if (aoiId > -1) {
            aoiData[aoiId][3] = visibilityArr;
            return true
        }
        return false
    }
}

export let data = new EyeTrackingData();