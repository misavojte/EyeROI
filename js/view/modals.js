class Modal {

    /**
     *
     * @param {string} title
     * @param {ModalFormHandler} controller
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

    /**
     *
     * @returns {FormData}
     */
    get formData() {
        return new FormData(this.element.querySelector('form'))
    }


    #createModalElement() {
        this.element = document.getElementById("modal");
        if (!this.element) {
            this.element = document.createElement('div');
            this.element.id = 'modal';
            this.element.classList = 'exterModal js-event-close';
        }
        this.element.innerHTML = this.#createBaseInnerHtml();
    }

    #createBaseInnerHtml() {
        return `
        <div class="interModal">
          <div class="modal-header">
            ${this.title}
            <div data-event="${this.controller.EVENT_CLOSE}" class="modalClose js-click">X</div>
          </div>
          <div class="modal-body">
          </div>
          <div class="modal-footer btnholder">
            <button data-event="${this.controller.EVENT_CONFIRM}" class="btn js-click">Confirm</button>
            <button data-event="${this.controller.EVENT_CLOSE}" class="btn js-click">Cancel</button>
          </div>
        </div>`
    }

    set modalBodyHtml(html) {
        this.element.querySelector('.modal-body').innerHTML = html;
    }

    #createBasicEventListeners() {
        let elementsToAddClose = this.element.getElementsByClassName('js-click');
        for (let i = 0; i < elementsToAddClose.length; i++) {
            elementsToAddClose[i].addEventListener('click', this.controller)
        }
    }

    initModal() {
        this.#createBasicEventListeners();
        document.body.append(this.element)
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
        <input type="hidden" name="${this.controller.INPUT_ACTION_IDENTIFIER}" value="${this.controller.ACTION_DOWNLOAD_SCARF}">
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
        <input type="hidden" name="${this.controller.INPUT_ACTION_IDENTIFIER}" value="${this.controller.ACTION_DOWNLOAD_WORKPLACE}">
        <div>
            <label for="file_name">File name</label>
            <input type="text" name="file_name" value="scarf-export">
        </div>
        </form>
        `
    }
}