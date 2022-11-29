import Connector from '../engine/Connector.mjs';
import Manga from '../engine/Manga.mjs';
export default class Yurineko extends Connector {
    constructor() {
        super();
        super.id = 'yurineko';
        super.label = 'Yurineko';
        this.tags = ['manga', 'hentai', 'vietnamese'];
        this.url = 'https://yurineko.net';
        this.api = 'https://api.yurineko.net';
    }
    async _getMangas() {
        let mangaList = [];
        let uri = new URL('/directory/general', this.api);
        const request = new Request(uri, this.requestOptions);
        let data = await this.fetchJSON(request);
        return data.map (element => {
            return {
                id: '/manga/'+element.id,
                title : element.originalName.trim()
            }
        });
    }
    async _getChapters(manga) {
        let uri = new URL(manga.id, this.api);
        const request = new Request(uri, this.requestOptions);
        let data = await this.fetchJSON(request);
        return data.chapters.map (element => {
            return {
                id: '/read/'+element.mangaID+'/'+element.id,
                title : element.name.trim()
            }
        });
    }
    async _getPages(chapter) {
        let uri = new URL(chapter.id, this.url);
        const request = new Request(uri, this.requestOptions);
        let data = await this.fetchDOM(request, '#__NEXT_DATA__');
        let j = JSON.parse(data[0].text);
        return j.props.pageProps.chapterData.url.map( el => {
            return this.createConnectorURI({
                url : el
            })
        });
    }
    async _handleConnectorURI(payload) {
        let request = new Request(payload.url, this.requestOptions);
        request.headers.set('x-referer', this.url);
        let response = await fetch(request);
        let data = await response.blob();
        data = await this._blobToBuffer(data);
        this._applyRealMime(data);
        return data;
    }
}