import Connector from '../engine/Connector.mjs';
import Manga from '../engine/Manga.mjs';
export default class ManhwaManga extends Connector {
    constructor() {
        super();
        super.id = 'manhwamanga';
        super.label = 'ManhwaManga';
        this.tags = [ 'manga', 'webtoon', 'english', 'hentai' ];
        this.url = 'https://manhwamanga.net';
        this.path = '/latest-updates';
        this.queryMangas = 'a.item-cover';
        this.queryMangasPagesCount = 'ul.pagination li:last-of-type a';
        this.queryChapters = 'div.episode-list div.main a';
        this.queryPages = 'div#viewer source[data-src]';
        this.queryMangaTitleURI = 'h1.item-title span';
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
        const pageCount = parseInt(data[0].getAttribute('data-page'));
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
                title: element.querySelector('b').textContent.trim()
            };
        });
    }
    async _getPages(chapter) {
        const uri = new URL(chapter.id, this.url);
        const request = new Request(uri, this.requestOptions);
        const data = await this.fetchDOM(request, this.queryPages);
        return data.map(image => this.getAbsolutePath(image.getAttribute('data-src'), request.url));
    }
}