import MadTheme from './templates/MadTheme.mjs';

export default class Manga1001 extends MadTheme {

    constructor() {
        super();
        super.id = 'manga1001';
        super.label = 'Manga 1001';
        this.tags = [ 'manga', 'japanese' ];
        this.url = 'https://manga1001.club';
        this.path = '/popular';
    }
    async _getChapters(manga) {
        const uri = new URL(manga.id, this.url);
        const request = new Request(uri, this.requestOptions);
        const data = await this.fetchDOM(request, 'ul#chapter-list li a');
        return data.map(element => {
            return {
                id: this.getRootRelativeOrAbsoluteLink(element, this.url),
                title: element.querySelector('strong.chapter-title').textContent.trim()
            };
        });
    }
    async _getPages(chapter) {
        //first : fetch page to read slices (with script execution)
        let scriptPages = `
        new Promise(resolve => {
            setTimeout( () => {
                resolve(slices);
            },
            1000);
        });
        `;
        let request = new Request(this.url + chapter.id, this.requestOptions);
        const slices = await Engine.Request.fetchUI(request, scriptPages, 5000);
        //now fetch raw page to get picture elements (which may be full of holes if we let scripts running)
        request = new Request(this.url + chapter.id, this.requestOptions);
        const data = await this.fetchDOM(request, 'div#chapter-images source' );
        return data.map(element => {
            if (element.dataset['src'].includes('scramble')) {
                return this.createConnectorURI({
                    url : element.dataset['src'],
                    slices : slices});
            } else return element.dataset['src'];
        });
    }
    async _handleConnectorURI(payload) {
        const request = new Request(payload.url, this.requestOptions);
        const response = await fetch(request);
        let data = await response.blob();
        data = await this.deobfuscate(data, payload.slices);
        return this._blobToBuffer(data);
    }
    async deobfuscate(imgdata, slicedata) {
        let bitmap = await createImageBitmap(imgdata);
        return new Promise(resolve => {
            const canvas = document.createElement("canvas");
            const ctx = canvas.getContext('2d');
            canvas.width = bitmap.width;
            canvas.height = bitmap.height;
            const sl1 = slicedata.shift();
            const sl2 = slicedata.shift();
            const colnum = canvas.width / sl1;
            const rownum = canvas.height/ sl2;
            for (var i = 0; i< slicedata.length; i++) {
                var f = slicedata[i];
                var b = parseInt(f / sl1);
                var c = f - b * sl1;
                var d = c * colnum;
                var e = b * rownum;
                var a = parseInt(i / sl1);
                var g = i - a * sl1;
                var k = g * colnum;
                var h = a * rownum;
                ctx.drawImage(bitmap, k, h, colnum, rownum, d, e, colnum, rownum);
            }
            canvas.toBlob(data => {
                resolve(data);
            },
            Engine.Settings.recompressionFormat.value, parseFloat(Engine.Settings.recompressionQuality.value)/100);
        });
    }
}
