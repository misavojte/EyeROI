import {EyeTrackingData} from "../model/eyeTrackingData.js";
import {ScarfView} from "../view/scarfView.js";
import {ScarfController} from "./scarfController.js";

export class WorkplaceController {

    /** @type {WorkplaceView} */
    #view

    //TODO FETCHING DATA & WORKER TO MODEL!

    constructor() {
        this.data = new EyeTrackingData();
        this.hasPrintedData = false;
        this.#initWorker()
    }

    /** @param {WorkplaceView} view */
    set view(view) {
        this.#view = view
    }

    /** @param {Event} e */
    handleEvent(e) {
        if (e.target.id === 'start-demo') { this.#fireDemo(); return }
        if (e.target.id === 'file-upload') { this.#fireParsing(e.target.files); return }

    }

    #initWorker() {
        this.worker = new Worker('js/worker.js');
        this.worker.onmessage = (event) => {
            console.timeEnd("File parsed in:");
            this.data.setData(event.data)
            const scarfController = new ScarfController(0, this.data);
            const scarfView = new ScarfView(scarfController);
            this.#view.clearWorkplaceArea();
            scarfView.initNew();
            this.hasPrintedData = true
        }
    }

    #fireParsing(files) {
        if (!files) return;
        const fileType = files[0].name.split('.').pop();
            if (fileType === "json" && files.length === 1) {
                this.hasPrintedData ? this.#view.addLoader() : this.#view.prepareWorkplaceForData()
                files[0].text().then((x) => {
                        this.data.setData(JSON.parse(x));
                        this.#printNewScarf();
                    }
                );
            }
            if (fileType === "txt" || fileType === "tsv") {
                //POUPRAVIT
                //send number of files being processed
                this.worker.postMessage(files.length);

                if (this.#processDataAsStream(files)) {
                    this.hasPrintedData ? this.#view.addLoader() : this.#view.prepareWorkplaceForData()
                }
            }
    }

    #fireDemo() {
        this.hasPrintedData ? this.#view.addLoader() : this.#view.prepareWorkplaceForData();
        fetch("demodata.json")
            .then(response => {
                return response.json()
            })
            .then(x => {
                this.data.setData(x);
                this.#printNewScarf();
            })
    }

    #processDataAsStream(files) {
        console.time("File parsed in:");
        //transfer ReadableStream to worker
        try {
            for (let index = 0; index < files.length; index++) {
                const stream = files[index].stream();
                this.worker.postMessage(stream, [stream]);
            }
            return true
        } catch {
            alert("Error! Your browser does not support a vital function for parsing the data (ReadableStream is not supported as a transferable object). Try Chrome, Edge, Opera or updating your current browser.")
            return false
        }
    }

    #printNewScarf() {
        const scarfController = new ScarfController(0, this.data);
        const scarfView = new ScarfView(scarfController);
        this.#view.clearWorkplaceArea();
        scarfView.initNew();
        this.hasPrintedData = true;
    }
}