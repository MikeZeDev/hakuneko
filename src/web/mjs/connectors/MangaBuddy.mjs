import MadTheme from './templates/MadTheme.mjs';
export default class MangaBuddy extends MadTheme {
    constructor() {
        super();
        super.id = 'mangabuddy';
        super.label = 'MangaBuddy';
        this.tags = ['manga', 'webtoon', 'english'];
        this.url = 'https://mangabuddy.com';
    }
    async _getPages(chapter) {
        let scriptPages = `
        new Promise(resolve => {
            resolve(final_images);
        });
        `;
        let request = new Request(this.url + chapter.id, this.requestOptions);
        let data = await Engine.Request.fetchUI(request, scriptPages);
        return data.map(element => this.createConnectorURI(this.getAbsolutePath(element, request.url)));
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