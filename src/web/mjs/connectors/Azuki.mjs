import Connector from '../engine/Connector.mjs';
import Manga from '../engine/Manga.mjs';
export default class Azuki extends Connector {
    constructor() {
        super();
        super.id = 'azuki';
        super.label = 'Azuki';
        this.tags = [ 'manga', 'english' ];
        this.url = 'https://www.azuki.co';
        this.api = 'https://production.api.azuki.co';
    }
    async _getMangaFromURI(uri) {
        const request = new Request(uri, this.requestOptions);
        const data = await this.fetchDOM(request, 'header.o-series-summary__header h1');
        return new Manga(this, uri.pathname, data[0].textContent.trim());
    }
    async _getMangas() {
        let mangaList = [];
        const uri = new URL('/series', this.url);
        const request = new Request(uri, this.requestOptions);
        const data = await this.fetchDOM(request, 'div.m-pagination a:nth-last-of-type(2)');
        const pageCount = parseInt(data[0].href.match(/([0-9]+)$/)[1]);
        for(let page = 1; page <= pageCount; page++) {
            const mangas = await this._getMangasFromPage(page);
            mangaList.push(...mangas);
        }
        return mangaList;
    }
    async _getMangasFromPage(page) {
        const uri = new URL('/series/' + page, this.url);
        const request = new Request(uri, this.requestOptions);
        const data = await this.fetchDOM(request, 'div.m-title-card__text a');
        return data.map(element => {
            return {
                id: this.getRootRelativeOrAbsoluteLink(element, this.url),
                title: element.text.trim()
            };
        });
    }
    async _getChapters(manga) {
        const uri = new URL(manga.id, this.url);
        const request = new Request(uri, this.requestOptions);
        const data = await this.fetchDOM(request, 'a.a-card-link');
        return data.map(element => {
            return {
                id: this.getRootRelativeOrAbsoluteLink(element, this.url),
                title: element.text.trim()
            };
        });
    }
    async _getPages(chapter) {
        const chapterid = chapter.id.split('/').pop();
        const uri = new URL('/chapter/'+chapterid+'/pages/v0', this.api);
        const request = new Request(uri, this.requestOptions);
        request.headers.set('x-referer', this.url);
        request.headers.set('x-origin', this.url);
        let data = '';
        try {
            data = await this.fetchJSON(request);
        } catch (error) {
            throw new Error('This chapter is locked !');
        }
        return data.pages.map(image => this.createConnectorURI(JSON.stringify(image)));
    }
    async _handleConnectorURI(payload) {
        const j = JSON.parse(payload);
        const image = j.image.jpg.pop();//last image best quality
        const request = new Request(image.url, this.requestOptions);
        const response = await fetch(request);
        let data = await response.blob();
        data = await this._blobToBuffer(data);
        const key = data.data[0] ^ 255; //$FF is first byte of jpeg header, for webp use ascii code for 'R' (webp header is RIFF)
        data = {
            mimeType: response.headers.get('content-type'),
            data: this._decryptXOR(data.data, key)
        };
        this._applyRealMime(data);
        return data;
    }
    _decryptXOR(encrypted, key) {
        if (key) {
            let s = new Uint8Array(encrypted);
            for (let n = 0; n < s.length; n++) {
                s[n] ^= key;
            }
            return s;
        } else {
            return encrypted;
        }
    }
}
