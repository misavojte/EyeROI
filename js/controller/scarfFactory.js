import {
    ScarfFilling,
    ScarfParticipant,
    ScarfSegment,
    ScarfSegmentContent,
    ScarfStyling,
    ScarfStylingList
} from "./utils/scarfHelperClasses.js";
import {AxisBreaks} from "./utils/prettyBreaks.js";

export class ScarfFactory {

    IDENTIFIER_IS_AOI = 'a';
    IDENTIFIER_IS_OTHER_CATEGORY = 'ac';
    IDENTIFIER_NOT_DEFINED = 'N';

    HEIGHT_OF_X_AXIS = 20;

    //todo move to settings
    showTheseSegmentCategories = [0,1];
    heightOfBar = 20;
    heightOfBarWrap = 30
    heightOfNonFixation = 4;

    constructor(stimulusId, data, participGap = 10) {
        this.stimulusId = stimulusId;
        this.data = data;
        this.spaceAboveRect = participGap / 2;
        this.aoiOrderedArr = data.getAoiOrderArray(stimulusId);
        this.participants = [];
        this.#prepare()
        console.log()
    }

    getViewFilling() {
        return new ScarfFilling(
            this.stimulusId,
            this.heightOfBarWrap,
            this.chartHeight,
            this.stimuli,
            this.participants,
            this.timeline,
            this.stylingAndLegend)
    }

    #prepare() {
        const participantsCount = this.data.noOfParticipants;
        this.chartHeight = (participantsCount * this.heightOfBarWrap) + this.HEIGHT_OF_X_AXIS;
        this.stimuli = this.#prepareStimuliList();
        this.timeline = new AxisBreaks(this.data.getStimulHighestEndTime(this.stimulusId));
        this.stylingAndLegend = this.#prepareStylingAndLegend()
        for (let i = 0; i < participantsCount; i++) {
            this.participants.push(this.#prepareParticipant(i))
        }
    }

    //todo nová helper class?
    #prepareStimuliList() {
        const iterateTo = this.data.main.stimuli.data.length;
        let response = [];
        for (let i = 0; i < iterateTo; i++) {
            response.push({'index':i, 'name':this.data.getStimulName(i).displayedName})
        }
        return response
    }

    #prepareStylingAndLegend() {
        const iterateTo = this.aoiOrderedArr.length;
        let aoi = [];
        for (let i = 0; i < iterateTo; i++) {
            const currentAoiIndex = this.aoiOrderedArr[i];
            const aoiInfo = this.data.getAoiInfo(this.stimulusId, currentAoiIndex);
            aoi.push(new ScarfStyling(this.IDENTIFIER_IS_AOI + aoiInfo.aoiId, aoiInfo.displayedName, aoiInfo.color, this.heightOfBar))
        }
        aoi.push(new ScarfStyling(this.IDENTIFIER_IS_AOI + this.IDENTIFIER_NOT_DEFINED, 'No AOI hit', '#a6a6a6', this.heightOfBar))
        // TODO PŘEDĚLAT
        // for (let i = 1; i < this.showTheseSegmentCategories.length; i++) {
        //
        //
        // }
        let category = [];
        category.push(new ScarfStyling(this.IDENTIFIER_IS_OTHER_CATEGORY + 1, 'Saccade', '#555555', this.heightOfNonFixation))
        category.push(new ScarfStyling(this.IDENTIFIER_IS_OTHER_CATEGORY + this.IDENTIFIER_NOT_DEFINED, 'Saccade', '#a6a6a6', this.heightOfNonFixation))
        return new ScarfStylingList(aoi, category, [])
    }

    #prepareParticipant(participantId) {

        //todo připravit na řazení

        const iterateTo = this.data.getNoOfSegments(this.stimulusId, participantId);
        const sessionDuration = this.data.getParticEndTime(this.stimulusId, participantId);
        const name = this.data.getParticName(participantId).displayedName;
        const width = (sessionDuration/this.timeline.maxLabel)*100;

        let segments = [];
        for (let i = 0; i < iterateTo; i++) {
            segments.push(this.#prepareSegment(participantId, i, sessionDuration))
        }

        //TODO napravit height
        return new ScarfParticipant(participantId, name, width, segments, [])
    }

    /**
     *
     * @param {int} participantId
     * @param {int} segmentId
     * @param {int} sessionDuration total session duration [ms] for given participant
     * @return ScarfSegment
     */
    #prepareSegment(participantId, segmentId,sessionDuration) {
        const segment = this.data.getSegmentInfo(this.stimulusId, participantId, segmentId);
        const x = (segment.start / sessionDuration) * 100;
        const width = ((segment.end - segment.start) / sessionDuration) * 100;
        return new ScarfSegment(this.#prepareSegmentContents(segment,x,width))
    }

    #prepareSegmentContents(segment, x, width) {

        let aoiOrNotIdentifier = this.IDENTIFIER_IS_AOI;
        let typeDistinctionIdentifier = this.IDENTIFIER_NOT_DEFINED;

        const getIdentifier = () => {return aoiOrNotIdentifier + typeDistinctionIdentifier};

        if (segment.category !== 0) {
            const height = this.heightOfNonFixation;
            const y = this.spaceAboveRect + this.heightOfBar / 2 - height / 2

            aoiOrNotIdentifier = this.IDENTIFIER_IS_OTHER_CATEGORY;

            if (this.showTheseSegmentCategories.includes(segment.category)) typeDistinctionIdentifier = segment.category;

            return [new ScarfSegmentContent(x, y, width, height, getIdentifier())]
        }

        if (segment.aoi.length === 0) {
            return [new ScarfSegmentContent(x, this.spaceAboveRect, width, this.heightOfBar,getIdentifier())]
        }

        const heightOfOneContent = this.heightOfBar / segment.aoi.length;
        let yOfOneContent = this.spaceAboveRect;
        let result = [];
        //going through all possible AOI categories in the selected stimulus
        //to ensure AOIs are ordered as specified by order array
        for (let aoiIndex = 0; aoiIndex < this.aoiOrderedArr.length; aoiIndex++) {
            const aoiId = this.aoiOrderedArr[aoiIndex];
            //coercing to string - otherwise would be always false!
            if (segment.aoi.includes(aoiId)) {
                typeDistinctionIdentifier = aoiId;
                result.push(new ScarfSegmentContent(x, yOfOneContent, width, heightOfOneContent,getIdentifier()))
                yOfOneContent += heightOfOneContent;
            }
        }

        return result
    }
}