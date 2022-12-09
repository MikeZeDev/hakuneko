import Connector from '../engine/Connector.mjs';
import Manga from '../engine/Manga.mjs';
export default class YaoiFlix extends Connector {
    constructor() {
        super();
        super.id = 'yaoiflix';
        super.label = 'YaoiFlix';
        this.tags = [ 'manga', 'turkish', 'webtoon' ];
        this.url = 'https://www.yaoiflix.be';
    }
    async _getMangaFromURI(uri) {
        const request = new Request(uri, this.requestOptions);
        const data = await this.fetchDOM(request, 'div.inf h1.film');
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
        const uri = new URL('/dizi-arsivi/page/'+page+'/?sort=views', this.url);
        const request = new Request(uri, this.requestOptions);
        const data = await this.fetchDOM(request, 'div.movie-details.existing-details div.name a');
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
        const data = await this.fetchDOM(request, 'div#seasons div.movie-details.existing-details div.name a');
        return data.map(element => {
            return {
                id: this.getRootRelativeOrAbsoluteLink(element, this.url),
                title: element.text.trim()
            };
        }).reverse();
    }
    async _getPages(chapter) {
        const uri = new URL(chapter.id, this.url);
        const request = new Request(uri, this.requestOptions);
        const data = await this.fetchDOM(request, 'div.video-content source');
        return data.map(image => this.getAbsolutePath(image, request.url));
    }
}