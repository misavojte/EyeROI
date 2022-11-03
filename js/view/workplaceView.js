export class WorkplaceView {

    /** @param {WorkplaceController} controller */
    constructor(controller) {
        this.controller = controller;
        this.controller.view = this;
    }

    init() {
        this.#addStartListeners();
    }

    prepareWorkplaceForData() {
        this.element = document.createElement("section");
        this.element.className = "anim";
        this.element.id = "analysis";
        this.element.innerHTML = this.#createStartingInnerHtml();
        document.querySelector('main')
            .insertBefore(this.element, document.getElementById('about'));
        this.#addOtherListeners();
    }

    addLoader() {
        document.getElementById('workplace').innerHTML = this.#createLoaderWrapOuterHtml()
    }

    clearWorkplaceArea() {
        document.getElementById('workplace').innerHTML = '';
    }

    /** @return {string} */
    #createStartingInnerHtml() {
        return `
    <h2 class='main-section ana-title'>Your analysis and visualization</h2>
    <div class='btnholder left-align main-section'>
        <button id='save-workplace' class='btn4'>Save workplace</button>
    </div>
    <div id='workplace'>
    ${this.#createLoaderWrapOuterHtml()}
    </div>`
    }

    /** @return {string} */
    #createLoaderWrapOuterHtml() {
        return `
        <div id='loader-wrap'>
            <div class='bars-7'></div>
            <div>Processing your precious data</div>
        </div>
        `
    }

    #addStartListeners() {
        //these already must exist in HTML
        document.getElementById('file-upload').addEventListener('change', (e) => this.controller.handleEvent(e));
        document.getElementById('start-demo').addEventListener('click', (e) => this.controller.handleEvent(e));
    }

    #addOtherListeners() {
        document.getElementById('save-workplace').addEventListener('click', this.controller);
    }
}