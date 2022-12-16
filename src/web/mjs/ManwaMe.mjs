import Connector from '../engine/Connector.mjs';
import Manga from '../engine/Manga.mjs';

export default class ManwaMe extends Connector {

    constructor() {
        super();
        super.id = 'manwame';
        super.label = 'ManwaMe';
        this.tags = [ 'manga', 'chinese', 'webtoon', 'hentai', 'porn' ];
        this.url = 'https://manwa.me';
        this.queryChapters = 'ul#detail-list-select a.chapteritem';
        this.queryPages = '.content-img';
    }
    async _getMangas() {
        let mangaList = [];
        for (let page = 0, run = true; run; page++) {
            const mangas = await this._getMangasFromPages(page);
            mangas.length > 0 ? mangaList.push(...mangas) : run = false;
        }
        return mangaList;
    }
    async _getMangasFromPages(page) {
        const uri = new URL('/getBooks?page='+page+'&area=', this.url);
        const request = new Request(uri, this.requestOptions);
        const data = await this.fetchJSON(request);
        return data.books.map(element => {
            return {
                id: element.id,
                title: element.book_name,
            };
        });
    }
    async _getChapters(manga) {
        const uri = new URL('/book/'+manga.id, this.url);
        const request = new Request(uri, this.requestOptions);
        const data = await this.fetchDOM(request, this.queryChapters);
        return data.map(element => {
            return {
                id: element.pathname,
                title: element.text.trim(),
            };
        }).reverse();
    }
    async _getPages(chapter) {
        const uri = new URL(chapter.id, this.url);
        const request = new Request(uri, this.requestOptions);
        const data = await this.fetchDOM(request, this.queryPages);
        return data.map(page => this.createConnectorURI(page.dataset['rSrc']));
    }
    async _handleConnectorURI(payload) {
        const request = new Request(payload, this.requestOptions);
        request.headers.set('x-referer', this.url);
        request.headers.set('x-origin', this.url);

        const response = await fetch(request);
        let data = await response.arrayBuffer();

        const i =  CryptoJS.enc.Utf8.parse('my2ecret782ecret');
        let o = CryptoJS.lib.WordArray.create(data);
        let decrypted = CryptoJS.AES.decrypt({
		        ciphertext: o
		      }, i, {
		        iv: i,
		        padding: CryptoJS.pad.Pkcs7
		      });
        decrypted = decrypted.toString(CryptoJS.enc.Base64);
        decrypted = Uint8Array.from(atob(decrypted), char => char.charCodeAt(0));
        decrypted = {
            mimeType: response.headers.get('content-type'),
            data: decrypted
        };
        this._applyRealMime(decrypted);
        return decrypted;
    }
    async _getMangaFromURI(uri) {
        const request = new Request(uri, this.requestOptions);
        let id = uri.pathname.match(/\/book\/([0-9]+)/)[1];
        let data = await this.fetchDOM(request, 'p.detail-main-info-title');
        return new Manga(this, id, data[0].textContent);
    }
}