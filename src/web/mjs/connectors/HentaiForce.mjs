import Connector from '../engine/Connector.mjs';
import Manga from '../engine/Manga.mjs';

export default class HentaiForce extends Connector {

    constructor() {
        super();
        super.id = 'hentaiforce';
        super.label = 'HentaiForce';
        this.tags = [ 'hentai', 'manga', 'english' ];
        this.url = 'https://hentaiforce.net';

    }

    async _getMangaFromURI(uri) {
        const request = new Request(uri, this.requestOptions);
        const data = await this.fetchDOM(request, 'div#gallery-main-info h1');
        const id = uri.pathname;
        const title = data[0].textContent.trim();
        return new Manga(this, id, title);
    }

    async _getMangas() {
        let mangaList = [];
        const uri = new URL('', this.url);
        const request = new Request(uri, this.requestOptions);
        const data = await this.fetchDOM(request, 'ul.pagination li:nth-last-of-type(2) a');
        const pageCount = parseInt(data[0].href.match(/(\d+)$/)[1]);
        for(let page = 1; page <= pageCount; page++) {
            const mangas = await this._getMangasFromPage(page);
            mangaList.push(...mangas);
        }
        return mangaList;
    }

    async _getMangasFromPage(page) {
        const uri = new URL('/page/' + page, this.url);
        const request = new Request(uri, this.requestOptions);
        const data = await this.fetchDOM(request, 'div.gallery div.gallery-name a');
        return data.map(element => {
            return {
                id: this.getRootRelativeOrAbsoluteLink(element, this.url),
                title: element.text.trim()
            };
        }).filter(element => element.id.includes('/view/'));
    }

    async _getChapters(manga) {
        return [ {id : manga.id+'/1', title : manga.title} ];
    }

    async _getPages(chapter) {
        const uri = new URL(chapter.id, this.url);
        const request = new Request(uri, this.requestOptions );
        const script = `
           new Promise(resolve => {
                resolve(new Array(readerPages.lastPage).fill().map((_, index) => readerPages.baseUriImg.replace('%s',readerPages.pages[index+1].f)));
            }); 
        `;
        return await Engine.Request.fetchUI(request, script);

    }

}