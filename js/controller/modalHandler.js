//todo move to model
import {data} from "../model/eyeTrackingData.js";

export class ModalFormHandler {

    EVENT_CLOSE = 'close';
    EVENT_CONFIRM = 'confirm';

    INPUT_ACTION_IDENTIFIER = 'action_id';
    ACTION_DOWNLOAD_SCARF = 'download_sp';
    ACTION_DOWNLOAD_WORKPLACE = 'download_wp';

    /**
    * @type {Modal}
    */
    #view


    /**
     *
     * @param {PointerEvent} e
     */
    handleEvent(e) {
        const eventType = e.target.dataset.event;
        if (eventType === this.EVENT_CLOSE) {this.fireEventClose(); return}
        if (eventType === this.EVENT_CONFIRM) {this.fireEventConfirmChanges()}
    }

    fireEventClose() {
        this.#view.delete();
    }

    fireEventConfirmChanges() {
        const formData = this.#view.formData;
        this.action = formData.get(this.INPUT_ACTION_IDENTIFIER);
        if (this.action === this.ACTION_DOWNLOAD_SCARF) this.#handleScarfDownload(formData)
        if (this.action === this.ACTION_DOWNLOAD_WORKPLACE) this.#handleWorkplaceDownload(formData)
    }

    /**
     *
     * @param {Modal} view
     */
    set view(view) {
        this.#view = view
    }

    #handleWorkplaceDownload(formData) {
        const fileName = formData.get('file_name');
        import('./download.js')
            .then(({JsonDownloader}) => {
                new JsonDownloader(JSON.stringify(data.main),fileName).triggerDownload()
            })
    }

    #handleScarfDownload(formData) {
        const chartId = formData.get('scarf_id');
        const width = formData.get('width');
        const fileName = formData.get('file_name');
        const type = formData.get('file_type');
        import('./download.js')
            .then(({ScarfToPureSvg,SvgDownloader}) => {
                const downloader = new SvgDownloader(new ScarfToPureSvg(width,chartId).svg,fileName,type);
                downloader.buildContent().then(() => downloader.triggerDownload());
            })
    }
}