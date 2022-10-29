import {Identifier} from "../controller/identifier.js";

export class ScarfView {

    chartId = 0;
    gap = 5;

    /** @param {ScarfController} controller */
    constructor(controller) {
        this.controller = controller;
        this.controller.view = this;
        this.#createElement()
    }

    //todo redrawing and stuff!
    initNew() {
        this.#addListeners()
        document.getElementById('workplace').append(this.element)
    }

    redrawOnStimulusChange(filling) {
        let relAbsButton = this.element.querySelector('.btn3');
        relAbsButton.classList.remove("activebtn3"); //default is absolute
        this.element.querySelector('.chartwrap').innerHTML = this.#createInnerPlotInnerHtml(filling);
    }

    redrawOnTimelineChange(timeline, timelineLabel, participants) {
        this.element.querySelector('.chxlabs').innerHTML = this.#createXAxisLabelsInnerHtml(timeline);
        this.element.querySelector('.chxlab').innerHTML = timelineLabel;
        let barwrap = this.element.getElementsByClassName('barwrap');
        for (let i = 0; i < barwrap.length; i++) {
            let animateTag = barwrap[i].querySelector('animate');
            barwrap[i].setAttribute('width', participants[i].to); //because of the export function
            animateTag.setAttribute('from', participants[i].from);
            animateTag.setAttribute('to', participants[i].to);
            animateTag.beginElement();
        }
        this.element.querySelector('.btn3').classList.toggle('activebtn3')
    }

    redrawHighlight(identifier) {
        let styleElement = this.element.querySelector('.chart-highlights')
        if (!styleElement) {
            styleElement = document.createElement('style');
            styleElement.className = 'chart-highlights'
        }
        styleElement.innerHTML = `rect[class^='a']{opacity:0.2}rect.${identifier}{opacity:1;stroke:#0000007d}line[class^='a']{opacity:0.2}line.${identifier}{opacity:1;stroke-width:100%}`;
        this.element.append(styleElement);
    }

    deleteHighlight() {
        this.element.querySelector('.chart-highlights')?.remove()
    }

    redrawTooltip(filling) {
        let tooltip = this.element.querySelector('.chart-tooltip')
        if (!tooltip) {
            tooltip = document.createElement('div');
            tooltip.className = 'chart-tooltip'
        }
        tooltip.style.top = filling.y + 'px';
        tooltip.style.left = filling.x + 'px';
        tooltip.innerHTML = this.#createTooltipInnerHtml(filling);
        this.element.querySelector('.chartwrap').prepend(tooltip);
    }

    deleteTooltip() {
        this.element.querySelector('.chart-tooltip')?.remove()
    }

    #addListeners() {
        //todo optimize (maybe abstract view?)
        let elements = this.element.getElementsByClassName('js-click');
        for (let i = 0; i < elements.length; i++) {
            elements[i].addEventListener('click', (e) => this.controller.handleEvent(e))
        }
        elements = this.element.getElementsByClassName('js-dblclick');
        for (let i = 0; i < elements.length; i++) {
            elements[i].addEventListener('dblclick', (e) => this.controller.handleEvent(e))
        }
        elements = this.element.getElementsByClassName('js-change');
        for (let i = 0; i < elements.length; i++) {
            elements[i].addEventListener('change', (e) => this.controller.handleEvent(e))
        }
        elements = this.element.getElementsByClassName('js-mouseover');
        for (let i = 0; i < elements.length; i++) {
            elements[i].addEventListener('mouseover', (e) => this.controller.handleEvent(e))
            elements[i].addEventListener('mouseleave', (e) => this.controller.handleEvent(e))
        }
    }

    #createElement() {
        this.element = document.createElement('div');
        this.element.className = 'anh anim scarf';
        this.element.dataset.stimulus = this.controller.stimulusId;
        this.element.innerHTML = this.#createWholePlotInnerHtml(this.controller.getFilling(this.controller.stimulusId));
    }

    /**
     * @param {ScarfFilling} filling
     * @return {string}
     */
    #createWholePlotInnerHtml(filling) {
        return `
        <h3 class="cardtitle">Sequence chart (Scarf plot)</h3>
        <div class="btnholder">
          <select class="js-change">
          ${filling.stimuli.map(x => {
            return `
            <option value="${x.index}">${x.name}</option>`
        }).join('')}
          </select>
          <div class="js-click btn3">
            <div class="btn3-absolute">Absolute timeline</div>
            <div class="btn3-relative">Relative timeline</div>
          </div>
            <i class="js-click svg-icon bi bi-zoom-in" data-event="${Identifier.EVENT_ZOOM_IN}"></i>
            <i class="js-click svg-icon bi bi-zoom-out" data-event="${Identifier.EVENT_ZOOM_OUT}"></i>
            <i class="js-click svg-icon bi bi-download" data-event="${Identifier.EVENT_OPEN_MODAL}" data-modal="${Identifier.MODAL_DOWNLOAD_SCARF}" data-parameter="0"></i>
            <i class="js-click svg-icon bi bi-wrench" data-event="${Identifier.EVENT_OPEN_MODAL}" data-modal="${Identifier.MODAL_SCARF_SETTINGS}"></i>
          </div>
        <div class="js-mouseover chartwrap">
          ${this.#createInnerPlotInnerHtml(filling)}
        </div>`
    }

    /**
     * @param {ScarfFilling} filling
     * @return {string}
     */
    #createInnerPlotInnerHtml(filling) {
    const x = filling;
        return `
    <style>
        ${x.styles.aoi.map(aoi => `rect.${aoi.identifier}{fill:${aoi.color}}`).join('')}
        ${x.styles.category.map(aoi => `rect.${aoi.identifier}{fill:${aoi.color}}`).join('')}
    </style>
    <div class='chylabs' style='grid-auto-rows:${x.barHeight}px' data-gap='${x.barHeight}'>
        ${x.participants.map((participant) => `<div>${participant.label}</div>`).join('')}
    </div>
    <div class='charea-holder'>
        <svg xmlns='http://www.w3.org/2000/svg' id='charea' width='100%' height='${x.chartHeight}'>
            <animate attributeName='width' from='100%' to='100%' dur='0.3s' fill='freeze'/>
            <defs>
                <pattern id='grid' width="${(x.timeline[1] / x.timeline.maxLabel) * 100}%"
                         height="${x.barHeight}" patternUnits="userSpaceOnUse">
                    <rect fill='none' width='100%' height='100%' stroke='#cbcbcb' stroke-width='1'/>
                </pattern>
            </defs>
            <rect fill='url(#grid)' stroke='#cbcbcb' stroke-width='1' width='100%'
                  height='${x.chartHeight - 20}'/>
            <svg y='${x.chartHeight - 14}' class='chxlabs'>
                ${this.#createXAxisLabelsInnerHtml(x.timeline)}
            </svg>
            ${x.participants.map((participant, i) => this.#createChartLineOuterHtml(participant, i, x.barHeight)).join('')}
        </svg>
    </div>
    <div class='chxlab'>
        Elapsed time [ms]
    </div>
    <div class="chlegendwrap">
        <div class="js-dblclick" data-event="${Identifier.EVENT_OPEN_MODAL}" data-modal="${Identifier.MODAL_EDIT_AOI}">
            <div class='chlegendtitle'>
                Fixations
            </div>
            <div class='chlegend'>
                ${x.styles.aoi.map(aoi => this.#createLegendBasicItemOuterHtml(aoi)).join('')}
            </div>
        </div>
        <div class="js-dblclick">
            <div class='chlegendtitle'>
                Other segment categories
            </div>
            <div class='chlegend'>
                ${x.styles.category.map(category => this.#createLegendBasicItemOuterHtml(category)).join('')}
            </div>
        </div>
    </div>`
    }

    /**
     *
     * @param {AxisBreaks} timeline
     * @return {string}
     */
    #createXAxisLabelsInnerHtml(timeline) {
        let labels = `<text x='0' text-anchor='start'>0</text>`
        for (let i = 1; i < timeline.length - 1; i++) {
            labels += `<text x='${(timeline[i] / timeline.maxLabel) * 100}%' text-anchor='middle'>${timeline[i]}</text>`
        }
        labels += `<text x='100%' text-anchor='end'>${timeline.maxLabel}</text>`
        return labels
    }

    /**
     *
     * @param {ScarfParticipant} participant
     * @param {int} i index of participant
     * @param {int} barHeight
     * @return {string}
     */
    #createChartLineOuterHtml(participant, i, barHeight) {
        return `
        <svg class='barwrap' y='${i * barHeight}' data-id='${participant.id}' height='${barHeight}' width='${participant.width}'>
          <animate attributeName='width' from='0%' to='${participant.width}' dur='0.4s' fill='freeze'/>
          ${participant.segments.map((segment, id) => this.#createSegmentOuterHtml(segment, id)).join('')}
        </svg>`
    }

    /**
     *
     * @param {ScarfSegment} segment
     * @param {int} id
     * @return {string}
     */
    #createSegmentOuterHtml(segment, id) {
        return `
        <g data-id='${id}'>
        ${segment.content.map((content) => `<rect class='${content.identifier}' height='${content.height}' x='${content.x}' width='${content.width}' y='${content.y}'></rect>`).join('')}
        </g>`
    }

    /**
     *
     * @param {ScarfStyling} entity
     * @return {string}
     */
    #createLegendBasicItemOuterHtml(entity) {
        return `
        <div class="${entity.identifier} legendItem">
            <svg width="12" height="${entity.height}">
                <rect class="${entity.identifier}" width="100%" height="100%" fill="${entity.color}"/>
            </svg>
            <div>
                ${entity.name}
            </div>
        </div>`
    }

    #createTooltipInnerHtml(filling) {
        return `
  <div>
    <div>Participant</div>
    <div>${filling.participantName}</div>
  </div>
  <div>
    <div>Category</div>
    <div>${filling.categoryName}</div>
  </div>
  <div>
    <div>AOI</div>
    <div>${filling.aoiNames}</div>
  </div>
  <div>
    <div>Event start</div>
    <div>${filling.start} ms</div>
  </div>
  <div>
    <div>Event end</div>
    <div>${filling.end} ms</div>
  </div>
  <div>
    <div>Event duration</div>
    <div>${(filling.end - filling.start).toFixed(1)} ms</div>
  </div>
  `
    }
}