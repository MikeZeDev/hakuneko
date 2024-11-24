import Connector from '../engine/Connector.mjs';
import Manga from '../engine/Manga.mjs';

export default class HentaiVnVip extends Connector {

    constructor() {
        super();
        super.id = 'hentaivnvip';
        super.label = 'HentaiVnVip';
        this.tags = [ 'manga', 'vietnamese, hentai' ];
        this.url = 'https://hentaivnhot.net';
    }

    async _getMangaFromURI(uri) {
        const request = new Request(uri, this.requestOptions);
        const data = await this.fetchDOM(request, 'div.info h1.name');
        return new Manga(this, uri.pathname, data[0].textContent.trim());
    }
    async _getMangas() {
        let mangaList = [];
        const uri = new URL('/truyen-hentai-moi/', this.url);
        const request = new Request(uri, this.requestOptions);
        const data = await this.fetchDOM(request, 'a:nth-last-of-type(2).page-numbers');
        const pageCount = parseInt(data[0].text);
        for(let page = 1; page <= pageCount; page++) {
            const mangas = await this._getMangasFromPage(page);
            mangaList.push(...mangas);
        }
        return mangaList;
    }
    async _getMangasFromPage(page) {
        const uri = new URL('/truyen-hentai-moi/page/' + page, this.url);
        const request = new Request(uri, this.requestOptions);
        const data = await this.fetchDOM(request, 'div.entry > a.name');
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
        const data = await this.fetchDOM(request, 'div.chap-list a');
        return data.map(element => {
            return {
                id: this.getRootRelativeOrAbsoluteLink(element, this.url),
                title: element.querySelector('span.name').textContent.trim()
            };
        });
    }
    async _getPages(chapter) {
        const uri = new URL(chapter.id, this.url);
        const request = new Request(uri, this.requestOptions);
        const data = await this.fetchDOM(request, 'div.content-text source[loading="lazy"]');
        return data.map(image => this.getAbsolutePath(image, request.url));
    }
}