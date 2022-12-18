import MangaReaderCMS from './templates/MangaReaderCMS.mjs';

export default class MangaScanWS extends MangaReaderCMS {

    constructor() {
        super();
        super.id = 'mangascanws';
        super.label = 'MangaScanWS';
        this.tags = [ 'manga', 'webtoon', 'french' ];
        this.url = 'https://mangascan.ws';
    }
    async _getPages(chapter) {
        const data = await super._getPages(chapter);
        return data.map(element => this.createConnectorURI(element));
    }
    async _handleConnectorURI(payload) {
        let request = new Request(payload, this.requestOptions);
        request.headers.set('x-referer', this.url);
        let response = await fetch(request);
        let data = await response.blob();
        data = await this._blobToBuffer(data);
        this._applyRealMime(data);
        return data;
    }
}
