import {data} from "../model/eyeTrackingData.js";
import {
    AoiEditModal,
    AoiVisibilityModal,
    DownloadScarfModal,
    DownloadWorkspaceModal,
    ShowScarfSettingsModal
} from "../view/modals.js";

export class ModalFormHandler {

    EVENT_CLOSE = 'close';
    EVENT_CONFIRM = 'confirm';
    EVENT_OPEN_MODAL = 'open';
    EVENT_MOVE_UP = 'up';
    EVENT_MOVE_DOWN = 'down';

    MODAL_DOWNLOAD_SCARF = 'm_download_scarf';
    MODAL_DOWNLOAD_WORKPLACE = 'm_download_workplace';
    MODAL_SCARF_SETTINGS = 'm_settings';
    MODAL_AOI_VISIBILITY = 'm_aoi_visibility';
    MODAL_EDIT_AOI = 'm_edit_aoi';

    INPUT_ACTION_IDENTIFIER = 'action_id';
    ACTION_DOWNLOAD_SCARF = 'download_sp';
    ACTION_DOWNLOAD_WORKPLACE = 'download_wp';
    ACTION_ADD_AOI_VISIBILITY = 'add_a_vis';
    ACTION_EDIT_AOI = 'edit_aoi';

    /**
     * @type {Modal}
     */
    #view


    /** @param {Event} e */
    handleEvent(e) {
        const eventType = e.target.dataset.event;
        if (eventType === this.EVENT_CLOSE) {
            this.fireEventClose();
            return
        }
        if (eventType === this.EVENT_CONFIRM) {
            this.fireEventConfirmChanges();
            return
        }
        if (eventType === this.EVENT_OPEN_MODAL) {
            this.fireEventOpenModal(e.target.dataset.modal, e.target.dataset.stimulus)
        }
        if (eventType === this.EVENT_MOVE_UP) {
            let rowToMove = e.target.closest('.gr-line');
            if (rowToMove.previousElementSibling) {
                rowToMove.after(rowToMove.previousElementSibling)
                return
            } else {
                rowToMove.parentElement.append(rowToMove)
            }
        }
        if (eventType === this.EVENT_MOVE_DOWN) {
            let rowToMove = e.target.closest('.gr-line');
            if (rowToMove.nextElementSibling) {
                rowToMove.before(rowToMove.nextElementSibling)
            } else {
                rowToMove.parentElement.prepend(rowToMove)
            }
        }
    }

    fireEventClose() {
        this.#view.delete();
    }

    fireEventConfirmChanges() {
        const formData = this.#view.formData;
        this.action = formData.get(this.INPUT_ACTION_IDENTIFIER);
        if (this.action === this.ACTION_DOWNLOAD_SCARF) this.#handleScarfDownload(formData)
        if (this.action === this.ACTION_DOWNLOAD_WORKPLACE) this.#handleWorkplaceDownload(formData)
        if (this.action === this.ACTION_ADD_AOI_VISIBILITY) this.#handleAoiVisibility(formData)
    }

    /**
     *
     * @param {string} type
     * @param {?string} parameter
     */
    fireEventOpenModal(type, parameter = null) {
        if (type === this.MODAL_DOWNLOAD_SCARF) new DownloadScarfModal(parameter, this).initModal();
        if (type === this.MODAL_DOWNLOAD_WORKPLACE) new DownloadWorkspaceModal(this).initModal();
        if (type === this.MODAL_SCARF_SETTINGS) new ShowScarfSettingsModal(parameter, this).initModal();
        if (type === this.MODAL_AOI_VISIBILITY) new AoiVisibilityModal(parameter, this).initModal();
        if (type === this.MODAL_EDIT_AOI) this.#initEditAoiModal(parameter);
    }

    /**
     *
     * @param {Modal} view
     */
    set view(view) {
        this.#view = view
    }

    #initEditAoiModal(stimulusId) {
        const aoiOrderedArr = data.getAoiOrderArray(stimulusId);
        let aoisInfo = [];
        for (let i = 0; i < aoiOrderedArr.length; i++) {
            const currentAoiIndex = aoiOrderedArr[i];
            aoisInfo.push(data.getAoiInfo(stimulusId, currentAoiIndex))
        }
        new AoiEditModal(stimulusId, aoisInfo, this).initModal()
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

    #handleAoiVisibility(formData) {
        const file = formData.get('file');
        const stimulusId = formData.get('stimulus_id');
        if (!file) return
        const fileType = file.name.split('.').pop();
        if (fileType !== 'xml') return
        file.text().then(x => {
            const parser = new DOMParser();
            const xml = parser.parseFromString(x, "application/xml");
            import('./AOIVisibilityReader.js').then(({AOIVisibilityReader}) => {
                new AOIVisibilityReader(xml, stimulusId).addVisInfo();
                document.getElementById('chartsec').innerHTML = new ScarfPrinter(stimulusId, true).wholePlot;
            })
        })
        this.fireEventClose();
    }
}