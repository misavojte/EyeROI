//TODO OPRAVIT PRIORITY!

class ContentDownloader {
    /**
     *
     * @param {string|null} content
     * @param {string} fileName
     * @param {string} fileType
     */
    constructor(content, fileName, fileType) {
        this.content = content;
        this.fileName = fileName;
        this.fileType = fileType;
    }
    triggerDownload() {
        if (this.content === null) throw 'Content for download not provided!';
        let link = document.createElement('a');
        link.download = this.fileName+'.'+this.fileType;
        link.style.opacity = "0";
        document.body.append(link);
        link.href = this.content;
        link.click();
        link.remove();
    }
}

export class JsonDownloader extends ContentDownloader {
    constructor(jsonString, fileName) {
        const jsonObjectUrl = URL.createObjectURL(new Blob([jsonString], {type: 'application/json'}));
        super(jsonObjectUrl,fileName,'json');
    }
}

export class SvgDownloader extends ContentDownloader {
    /**
     *
     * @param {SVGSVGElement} svg
     * @param {string} fileName
     * @param {string} fileType
     */
    constructor(svg, fileName, fileType) {
        super(null,fileName,fileType);
        this.svgHtml = svg.outerHTML;
        this.width = Number(svg.getAttribute('width'));
        this.height = Number(svg.getAttribute('height'));
    }

    buildContent() {
        return new Promise(resolve => {
            this.content = this.#setBlobSvgAsContent();
            if (this.fileType !== 'svg') {
                this.#setBlobRasterAsContent()
                    .then(r => resolve(this.content = r))
            } else {
                resolve()
            }
        })
    }

    /**
     *
     * @returns {string}
     */
    #setBlobSvgAsContent() {
        const blob = new Blob([this.svgHtml], {type: 'image/svg+xml;charset=utf-8'});
        const pageURL = window.URL || window.webkitURL || window;
        return pageURL.createObjectURL(blob)
    }

    /**
     *
     * @returns {Promise<string>}
     */
    #setBlobRasterAsContent() {
        const width = this.width;
        const height = this.height;

        //prepare canvas
        let canvas = document.createElement('canvas');

        //set display size
        canvas.style.width = width + "px";
        canvas.style.height = height + "px";

        //set resolution size
        let scale = 2;
        canvas.width = width * scale;
        canvas.height = height * scale;
        const ctx = canvas.getContext("2d");

        //adjust coordinates to resolution size
        ctx.scale(scale, scale);
        ctx.fillStyle = "white";
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        let chartAreaImg = new Image();
        chartAreaImg.src = this.content;

        return new Promise((resolve) => {
            chartAreaImg.onload = () => {
                ctx.imageSmoothingEnabled = false;
                ctx.drawImage(chartAreaImg, 0, 0, width, height);
                resolve(canvas.toDataURL());
            }
        })
    }
}


export class ScarfToPureSvg {

    #MINIMAL_ALLOWED_WIDTH = 300;

    constructor(width = 400, chartId) {
        if (width < this.#MINIMAL_ALLOWED_WIDTH) {
            throw `
            ScarfToPureSvg: Requested width is lower than minimal allowed width (${this.#MINIMAL_ALLOWED_WIDTH})
            `
        }
        //TODO maybe just clone the chart
        this.chart = document.getElementsByClassName("chartwrap")[chartId];
        if (this.chart) {
            this.chart.style.width = width + "px";
            this.svg = this.#createSvg();
            this.chart.style.width = "";
            delete this.chart;
        }
    }

    #createSvg() {
        let svg = document.createElementNS("http://www.w3.org/2000/svg", 'svg');
        svg.setAttribute('width',this.chart.offsetWidth)
        svg.setAttribute('height',this.chart.offsetHeight);
        svg.setAttribute("xmlns", "http://www.w3.org/2000/svg");
        svg.innerHTML = this.#createInnerHtml();
        return svg
    }

    #createInnerHtml() {
        return `
        <style><![CDATA[text{alignment-baseline:hanging;font-size:14px}.chxlabs text{font-size:11px}.chylabs text{alignment-baseline:middle}.chltitles text{text-anchor:middle;text-transform:uppercase;font-size:11px}.chlitems text{alignment-baseline:middle}]]></style>
        ${this.#createParticipantLabelsHtml()}
        ${this.#createSvgChartArea()}
        ${this.#createXAxisLabels()}
        ${this.#createLegendTitles()}
        ${this.#createLegendItems()}`
    }

    #createParticipantLabelsHtml() {
        const htmlCollection = this.chart.children[0].children;
        const gap = Number(document.querySelector(".chylabs").dataset.gap);
        let yPos = gap / 2;
        let result = "";
        for (let i = 0; i < htmlCollection.length; i++) {
            const content = htmlCollection[i].innerHTML;
            result += `<text y="${yPos}">${content}</text>`
            yPos += gap;
        }
        return `<g class="chylabs">${result}</g>`
    }

    #createSvgChartArea() {
        const svgArea = this.chart.children[1];
        const leftOffset = svgArea.offsetLeft;
        //TODO review cloning
        let svgAreaClone = svgArea.cloneNode(true);
        let animateTags = svgAreaClone.getElementsByTagName('animate');
        while (animateTags.length > 0) {
            animateTags[0].remove()
        }
        return `<svg x="${leftOffset}" width="${this.chart.offsetWidth - leftOffset}">${svgAreaClone.innerHTML}</svg>`
    }

    #createXAxisLabels() {
        const htmlLab = this.chart.children[2];
        return `<text x="50%" y="${htmlLab.offsetTop}" text-anchor="middle">${htmlLab.innerHTML}</text>`
    }

    #createLegendTitles() {
        const htmlTitles = this.chart.getElementsByClassName("chlegendtitle");
        let result = "";
        for (let i = 0; i < htmlTitles.length; i++) {
            const el = htmlTitles[i];
            result += `<text x="50%" y="${el.offsetTop}">${el.innerHTML}</text>`
        }
        return `<g class="chltitles">${result}</g>`
    }

    #createLegendItems() {
        const htmlItems = this.chart.getElementsByClassName("legendItem");
        let result = "";
        for (let i = 0; i < htmlItems.length; i++) {
            const el = htmlItems[i];
            const symbol = el.children[0];
            const text = el.children[1];
            const rectX = symbol.getBoundingClientRect().left - el.getBoundingClientRect().left;
            const rectY = symbol.getBoundingClientRect().top - el.getBoundingClientRect().top;
            const textX = text.getBoundingClientRect().left - el.getBoundingClientRect().left;
            result += `
            <svg x="${el.offsetLeft}" y="${el.offsetTop}" width="${el.offsetWidth}" height="${el.offsetHeight}">
            <svg x="${rectX}" y="${rectY - 2}" width="${symbol.width.baseVal.valueInSpecifiedUnits}" height="${symbol.height.baseVal.valueInSpecifiedUnits}">${symbol.innerHTML}</svg>
            <text x="${textX}" y="50%" alignment-baseline="middle">${text.innerHTML}</text>
            </svg>`
        }
        return `<g class="chlitems">${result}</g>`
    }
}