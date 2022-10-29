export class ScarfFilling {
    /** @property {int} stimulusId */
    /** @property {int} barHeight in px */
    /** @property {int} chartHeight in px */
    /** @property {array<{Object}>} stimuli todo replace */
    /** @property {array<ScarfParticipant>} participants */
    /** @property {ScarfStylingList} styles */
    /** @property {AxisBreaks} timeline */
    constructor(stimulusId, barHeight, chartHeight, stimuli, participants, timeline, styles) {
        this.stimulusId = stimulusId;
        this.timeline = timeline;
        this.styles = styles;
        this.barHeight = barHeight;
        this.chartHeight = chartHeight;
        this.participants = participants;
        this.stimuli = stimuli;
    }
}

export class ScarfStylingList {
    /** @property {array<ScarfStyling>} aoi */
    /** @property {array<ScarfStyling>} category */
    /** @property {array<ScarfStyling>} visibility */
    constructor(aoi, category, visibility) {
        this.aoi = aoi;
        this.category = category;
        this.visibility = visibility;
    }
}

export class ScarfStyling {
    /** @property {string} identifier */
    /** @property {string} name */
    /** @property {string} color */
    /** @property {int} height in px */
    constructor(identifier, name, color, height) {
        this.name = name;
        this.height = height;
        this.identifier = identifier;
        this.color = color;
    }
}

export class ScarfParticipant {
    /** @property {int} id */
    /** @property {string} label */
    /** @property {array<ScarfSegment>} segments */
    constructor(id, label, width, segments, aoiVisibility) {
        this.width = width + '%';
        this.id = id;
        this.label = label;
        this.segments = segments;
        this.aoiVisibility = aoiVisibility;
    }
}

export class ScarfSegment {
    /** @property {array<ScarfSegmentContent>} content */
    constructor(content) {
        this.content = content;
    }
}

export class ScarfSegmentContent {
    /** @property {string} x with % symbol */
    /** @property {string} width with % symbol */
    /** @property {int} y */
    /** @property {int} height */
    /** @property {string} identifier */
    constructor(x, y, width, height, identifier) {
        this.x = x + '%';
        this.width = width + '%';
        this.y = y;
        this.height = height;
        this.identifier = identifier;
    }
}