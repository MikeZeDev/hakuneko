import Connector from '../engine/Connector.mjs';
import Manga from '../engine/Manga.mjs';
export default class MangaMovil extends Connector {
    constructor() {
        super();
        super.id = 'mangamovil';
        super.label = 'MangaMovil';
        this.tags = [ 'manga', 'webtoon', 'spanish' ];
        this.url = 'https://mangamovil.net';
    }
    async _getMangaFromURI(uri) {
        const request = new Request(uri, this.requestOptions);
        const data = await this.fetchDOM(request, 'div.video-card-body div.video-title h1');
        return new Manga(this, uri.pathname, data[0].textContent.trim());
    }
    async _getMangas() {
        let mangaList = [];
        for (let page = 1, run = true; run; page++) {
            const mangas = await this._getMangasFromPage(page);
            mangas.length > 0 ? mangaList.push(...mangas) : run = false;
        }
        return mangaList;
    }
    async _getMangasFromPage(page) {
        const uri = new URL('/biblioteca?page=' + page, this.url);
        const request = new Request(uri, this.requestOptions);
        const data = await this.fetchDOM(request, 'div.container-biblioteca div.card-body a.new-link.text-white');
        return data.map(element => {
            return {
                id: this.getRootRelativeOrAbsoluteLink(element, this.url),
                title: element.querySelector('h5').textContent.trim()
            };
        });
    }
    async _getChapters(manga) {
        const uri = new URL(manga.id, this.url);
        const request = new Request(uri, this.requestOptions);
        const data = await this.fetchDOM(request, 'ul.list-group a.new-link');
        return data.map(element => {
            return {
                id: this.getRootRelativeOrAbsoluteLink(element, this.url),
                title: element.querySelector('li span.sa-series-link__number').textContent.trim()
            };
        });
    }
    async _getPages(chapter) {
        const uri = new URL(chapter.id, this.url);
        const request = new Request(uri, this.requestOptions);
        const data = await this.fetchDOM(request, 'source.img-fluid');
        return data.map(image => this.getAbsolutePath(image.getAttribute('data-src'), request.url));
    }
}