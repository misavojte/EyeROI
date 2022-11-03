import {Identifier} from "../controller/identifier.js";

class Modal {

    /**
     *
     * @param {string} title
     * @param {ModalController} controller
     */
    constructor(title, controller) {
        this.controller = controller;
        this.controller.view = this;
        this.title = title;
        this.#createModalElement();
    }

    delete() {
        this.element.remove();
    }

    /** @returns {FormData} */
    get formData() {
        return new FormData(this.element.querySelector('form'))
    }


    #createModalElement() {
        this.element = document.getElementById("modal");
        this.didModalAlreadyExist = Boolean(this.element);
        if (!this.didModalAlreadyExist) {
            this.element = document.createElement('div');
            this.element.id = 'modal';
            this.element.className = 'exterModal';
        }
        this.element.innerHTML = this.#createBaseInnerHtml();
    }

    #createBaseInnerHtml() {
        return `
        <div class="interModal">
          <div class="modal-header">
            ${this.title}
            <div data-event="${Identifier.EVENT_CLOSE}" class="modalClose js-click">X</div>
          </div>
          <div class="modal-body">
          </div>
          <div class="modal-footer btnholder">
            <button data-event="${Identifier.EVENT_CONFIRM}" class="btn js-click">Confirm</button>
            <button data-event="${Identifier.EVENT_CLOSE}" class="btn js-click">Cancel</button>
          </div>
        </div>`
    }

    set modalBodyHtml(html) {
        this.element.querySelector('.modal-body').innerHTML = html;
    }

    #createBasicEventListeners() {
        let elementsToAddClose = this.element.getElementsByClassName('js-click');
        for (let i = 0; i < elementsToAddClose.length; i++) {
            elementsToAddClose[i].addEventListener('click', (e) => this.controller.handleEvent(e))
        }
    }

    initModal() {
        this.#createBasicEventListeners();
        if (!this.didModalAlreadyExist) document.body.append(this.element)
    }

}

export class DownloadScarfModal extends Modal{

    constructor(scarfId, controller) {
        super('Download Scarf Plot',controller);
        this.modalBodyHtml = this.#createContentHtml(scarfId);
    }

    #createContentHtml(scarfId) {
        return `
        <form>
        <input type="hidden" name="${Identifier.INPUT_ACTION_IDENTIFIER}" value="${Identifier.ACTION_DOWNLOAD_SCARF}">
        <input type="hidden" name="scarf_id" value="${scarfId}">
        <div>
            <label for="number">Width of the plot in px</label>
            <input type="number" name="width" value="800">
        </div>
         <div>
            <label for="file_name">File name</label>
            <input type="text" name="file_name" value="scarf-export">
        </div>
        <div>
            <label for="file_type">File extension</label>
            <select name="file_type">
              <option selected value="svg">.svg</option>
              <option value="png">.png</option>
              <option value="jpg">.jpg</option>
              <option value="webp">.webp</option>
            </select>
        </div>
        </form>
        `
    }
}

export class DownloadWorkspaceModal extends Modal {
    constructor(controller) {
        super('Save & export workplace',controller);
        this.modalBodyHtml = this.#createContentHtml();
    }

    #createContentHtml() {
        return `
        <form>
        <input type="hidden" name="${Identifier.INPUT_ACTION_IDENTIFIER}" value="${Identifier.ACTION_DOWNLOAD_WORKPLACE}">
        <div>
            <label for="file_name">File name</label>
            <input type="text" name="file_name" value="scarf-export">
        </div>
        </form>
        `
    }
}

export class ShowScarfSettingsModal extends Modal {
    constructor(stimulusId, controller) {
        super('Scarf Plot Settings', controller);
        this.modalBodyHtml = this.#createContentHtml(stimulusId);
    }

    #createContentHtml(stimulusId) {
        return `
        <div style="margin-bottom:15px">
        <button data-event="${Identifier.EVENT_OPEN_MODAL}" data-modal="${Identifier.MODAL_EDIT_AOI}" data-stimulus="${stimulusId}" class="btn4 js-click">
           Modify AOIs attributes
        </button>
        <button data-event="${Identifier.EVENT_OPEN_MODAL}" data-modal="${Identifier.MODAL_AOI_VISIBILITY}" data-stimulus="${stimulusId}" class="btn4 js-click">
          Add AOIs visibility info
        </button>
        </div>
          `
    }
}

export class AoiVisibilityModal extends Modal {
    constructor(stimulusId, controller) {
        super('Add AOI Visibility Information', controller);
        this.modalBodyHtml = this.#createContentHtml(stimulusId);
    }

    #createContentHtml(stimulusId) {
        return `
        <div class="warning">
            Upload XML file containing AOIs visibility information. Only for SMI!
        </div>
        <form>
        <input type="hidden" name="${Identifier.INPUT_ACTION_IDENTIFIER}" value="${Identifier.ACTION_ADD_AOI_VISIBILITY}">
        <input type="hidden" name="stimulus_id" value="${stimulusId}">
        <div>
            <label for="file">File containing information</label>
            <input type="file" name="file">
        </div>
        `
    }
}

export class AoiEditModal extends Modal {
    constructor(stimulusId, aoisInfo, controller) {
        super('Add AOI Visibility Information', controller);
        this.modalBodyHtml = this.#createContentHtml(stimulusId, aoisInfo);
    }

    #createContentHtml(stimulusId, aoisInfo) {
        return `
          <div class='gr-line'>
            <div>Original name</div>
            <div>Displayed name</div>
            <div>Color</div>
            <div>Order</div>
          </div>
          <form id='aoiPopAttributesTable'>
            <input type="hidden" name="${Identifier.INPUT_ACTION_IDENTIFIER}" value="${Identifier.ACTION_EDIT_AOI}">
            <input type="hidden" name="stimulus_id" value="${stimulusId}">
            <div>
            ${aoisInfo.map((x)=>{
                return `
                <div class='gr-line'>
                  <div>${x.originalName}</div>
                  <input name='displayed_name' type='text' value='${x.displayedName}'>
                  <input name='color' type='color' value='${x.color}'>
                  <input name='aoi_id' type='hidden' value='${x.aoiId}'>
                  <i data-event='${Identifier.EVENT_MOVE_UP}' class='js-click svg-icon bi bi-arrow-up-short'></i>
                  <i data-event='${Identifier.EVENT_MOVE_DOWN}' class='js-click svg-icon bi-arrow-down-short'></i>
                </div>
                `
             }).join('')}
            </div>
          </form>
        `
    }
}