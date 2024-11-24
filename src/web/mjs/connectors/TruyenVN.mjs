import Connector from '../engine/Connector.mjs';
import Manga from '../engine/Manga.mjs';
export default class TruyenVN extends Connector {
    constructor() {
        super();
        super.id = 'truyenvn';
        super.label = 'TruyenVN';
        this.tags = [ 'manga', 'webtoon', 'vietnamese', 'hentai' ];
        this.url = 'https://truyenvnpro.com';
        this.path = '/danh-sach-truyen';
        this.queryMangas = 'div.form-row div.entry > a';
        this.queryMangasPagesCount = 'div.z-pagination a:nth-last-child(2)';
        this.queryChapters = 'section#chapterList a';
        this.queryPages = 'div.content-text source[loading="lazy"]';
        this.queryMangaTitleURI = 'div.row h1.name';
    }
    async _getMangaFromURI(uri) {
        const request = new Request(uri, this.requestOptions);
        const data = await this.fetchDOM(request, this.queryMangaTitleURI);
        return new Manga(this, uri.pathname, data[0].textContent.trim());
    }
    async _getMangas() {
        let mangaList = [];
        const uri = new URL(this.path, this.url);
        const request = new Request(uri, this.requestOptions);
        const data = await this.fetchDOM(request, this.queryMangasPagesCount);
        const pageCount = parseInt(data[0].text);
        for(let page = 1; page <= pageCount; page++) {
            const mangas = await this._getMangasFromPage(page);
            mangaList.push(...mangas);
        }
        return mangaList;
    }
    async _getMangasFromPage(page) {
        const uri = new URL(this.path + '/page/'+ page, this.url);
        const request = new Request(uri, this.requestOptions);
        const data = await this.fetchDOM(request, this.queryMangas);
        return data.map(element => {
            return {
                id: this.getRootRelativeOrAbsoluteLink(element, this.url),
                title: element.title.trim()
            };
        });
    }
    async _getChapters(manga) {
        const uri = new URL(manga.id, this.url);
        const request = new Request(uri, this.requestOptions);
        const data = await this.fetchDOM(request, this.queryChapters);
        return data.map(element => {
            return {
                id: this.getRootRelativeOrAbsoluteLink(element, this.url),
                title: element.querySelector('span').textContent.trim()
            };
        });
    }
    async _getPages(chapter) {
        const uri = new URL(chapter.id, this.url);
        const request = new Request(uri, this.requestOptions);
        const data = await this.fetchDOM(request, this.queryPages);
        return data.map(image => this.createConnectorURI(this.getAbsolutePath(image.src, request.url)));
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