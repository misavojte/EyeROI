import {ScarfFactory} from "./scarfFactory.js";
import {ModalController} from "./modalController.js";
import {Identifier} from "./identifier.js";
import {AxisBreaks} from "./utils/prettyBreaks.js";

export class ScarfController {

    /** @type {ScarfView} */
    #view

    /**
     *
     * @param {int} stimulusId
     * @param {EyeTrackingData} data
     */
    constructor(stimulusId, data) {
        this.stimulusId = stimulusId;
        this.data = data;
        this.isAbsolute = true;
    }

    /** @param {ScarfView} view */
    set view(view) {
        this.#view = view
    }

    handleEvent(e) {
        if (e.type === 'mouseover') {this.fireMouseover(e); return}
        if (e.type === 'mouseleave') {this.fireCancellationOfMouseoverActions(); return}
        if (e.type === 'click') {
            const eventType = e.target.dataset.event;
            if (eventType === Identifier.EVENT_OPEN_MODAL) {
                const parameter = e.target.dataset.parameter? e.target.dataset.parameter : this.stimulusId;
                new ModalController(this.data).fireEventOpenModal(e.target.dataset.modal,parameter);
                return
            }
            if (eventType === Identifier.EVENT_ZOOM_IN) { this.fireZoom(true); return }
            if (eventType === Identifier.EVENT_ZOOM_OUT) { this.fireZoom(false); return }
            this.fireTimelineChange()
        }
        if (e.type === 'change') { this.fireStimulusChange(e.target.value); return}
        if (e.type === 'dblclick') {
            const modal = e.target.closest('.js-dblclick').dataset.modal;
            new ModalController(this.data).fireEventOpenModal(modal, this.stimulusId)
        }
    }

    /** @param {Event} e */
    fireMouseover(e) {
        if (e.target.closest('.chart-tooltip')) {return}
        const legendItem = e.target.closest('.legendItem');
        if (legendItem) {
            const identifier = legendItem.classList[0];
            this.#view.redrawHighlight(identifier);
            return
        }
        const segment = e.target.closest('g')
        if (segment) {
            const id = segment.dataset.id;
            if (id) {
                const WIDTH_OF_TOOLTIP = 155
                const participantId = segment.closest('.barwrap').dataset.id;
                const y = segment.getBoundingClientRect().bottom + window.scrollY - 1;
                const widthOfView = window.scrollX + document.body.clientWidth
                const x = e.pageX + WIDTH_OF_TOOLTIP > widthOfView ? widthOfView - WIDTH_OF_TOOLTIP : e.pageX
                const participantName = this.data.getParticName(participantId).displayedName;
                const segInfo = this.data.getSegmentInfo(this.stimulusId, participantId, id);
                const categoryName = this.data.getCatName(segInfo.category).displayedName;
                let aoiNames = "No AOI hit"
                if (segInfo.aoi.length > 0) {
                    aoiNames = segInfo.aoi.map(x => this.data.getAoiInfo(this.stimulusId, x).displayedName).join(", ");
                }
                this.#view.redrawTooltip({x,y,"start": segInfo.start,"end": segInfo.end,participantName,categoryName,aoiNames});
                return
            }
        }
        this.fireCancellationOfMouseoverActions()
    }

    fireCancellationOfMouseoverActions() {
        this.#view.deleteHighlight();
        this.#view.deleteTooltip();
    }

    /** @param {boolean} isZoomIn */
    fireZoom(isZoomIn) {
        //todo add deactivate
        // todo maybe to view?
        let animateTag = this.#view.element.getElementsByTagName('animate')[0];
        const fromChartWidth = animateTag.getAttribute('to').slice(0, -1);
        if (fromChartWidth <= 100 && !isZoomIn) return
        const toChartWidth = isZoomIn ? fromChartWidth*2 : fromChartWidth/2;
        animateTag.setAttribute('from', fromChartWidth + '%');
        animateTag.setAttribute('to', toChartWidth + '%');
        animateTag.beginElement();
    }

    /** @param {int} stimulusId */
    fireStimulusChange(stimulusId) {
        this.stimulusId = stimulusId;
        this.isAbsolute = true;
        this.#view.redrawOnStimulusChange(this.getFilling(this.stimulusId));
    }

    fireTimelineChange() {
        const absoluteTimeline = new AxisBreaks(this.data.getStimulHighestEndTime(this.stimulusId))
        const timelineReplacer = this.isAbsolute ? new AxisBreaks(100) : absoluteTimeline;
        const iterateTo = this.data.noOfParticipants;

        //todo pokud řazení napravit!
        let participantsReplacer = [];
        const relative = 100 + '%';
        for (let id = 0; id < iterateTo; id++) {
            const absolute = (this.data.getParticEndTime(this.stimulusId, id)/absoluteTimeline.maxLabel)*100 + '%';
            const from = this.isAbsolute ? absolute : relative;
            const to = this.isAbsolute ? relative : absolute;
            participantsReplacer.push({id, from, to})
        }

        const timelineLabelReplace = this.isAbsolute ? 'Elapsed time [%]' : 'Elapsed time [ms]';
        this.#view.redrawOnTimelineChange(timelineReplacer, timelineLabelReplace, participantsReplacer);
        this.isAbsolute = !this.isAbsolute;
    }

    getFilling(stimulusId = 0) {
        return new ScarfFactory(stimulusId, this.data).getViewFilling()
    }
}