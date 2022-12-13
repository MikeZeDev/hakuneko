import Connector from '../engine/Connector.mjs';
import Manga from '../engine/Manga.mjs';
export default class Manga347 extends Connector {
    constructor() {
        super();
        super.id = 'manga347';
        super.label = 'Manga 347';
        this.tags = ['webtoon', 'english'];
        this.url = 'https://manga347.com';
    }
    async _getMangaFromURI(uri) {
        const request = new Request(uri, this.requestOptions);
        const data = await this.fetchDOM(request, 'div.anisc-detail h1.manga-name');
        return new Manga(this, uri.pathname, data[0].textContent.trim());
    }
    async _getMangas() {
        let mangaList = [];
        const uri = new URL('/filter', this.url);
        const request = new Request(uri, this.requestOptions);
        const data = await this.fetchDOM(request, 'ul.pagination li:nth-last-of-type(2) a');
        const pageCount = parseInt(data[0].text);
        for(let page = 1; page <= pageCount; page++) {
            const mangas = await this._getMangasFromPage(page);
            mangaList.push(...mangas);
        }
        return mangaList;
    }
    async _getMangasFromPage(page) {
        const uri = new URL('/filter/' + page, this.url);
        const request = new Request(uri, this.requestOptions);
        const data = await this.fetchDOM(request, 'div.manga-detail h3.manga-name a');
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
        const data = await this.fetchDOM(request, 'div.chapters-list-ul li.item.reading-item.chapter-item  > a');
        return data.map(element => {
            return {
                id: this.getRootRelativeOrAbsoluteLink(element, this.url),
                title: element.title.trim()
            };
        });
    }
    async _getPages(chapter) {
        const chapid = chapter.id.match(/\/([0-9]+)$/)[1];
        const uri = new URL('/ajax/image/chapter/'+chapid, this.url);
        const request = new Request(uri, this.requestOptions);
        const response = await this.fetchJSON(request);
        const data = this.createDOM(response.html).querySelectorAll('source');
        let pagelist = [];
        for (const image of data) {
            pagelist.push(this.getAbsolutePath(image.getAttribute('data-src'), request.url));
        }
        return pagelist;
    }
}
