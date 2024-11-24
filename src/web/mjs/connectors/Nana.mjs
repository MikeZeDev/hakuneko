import Connector from '../engine/Connector.mjs';
import Manga from '../engine/Manga.mjs';
export default class Nana extends Connector {
    constructor() {
        super();
        super.id = 'nana';
        super.label = 'Nana ナナ';
        this.tags = [ 'manga', 'hentai', 'english' ];
        this.url = 'https://nana.my.id';
    }
    async _getMangaFromURI(uri) {
        const request = new Request(uri, this.requestOptions);
        const data = await this.fetchDOM(request, 'h1[style="display:none"');
        return new Manga(this, uri.pathname, data[0].textContent.trim());
    }

    async _getMangas() {
        let mangaList = [];
        const uri = new URL(this.url);
        const request = new Request(uri, this.requestOptions);
        const data = await this.fetchDOM(request, 'div.top a.paginate_button:last-of-type');
        const pageCount = parseInt(data[0].text);
        for(let page = 1; page <= pageCount; page++) {
            const mangas = await this._getMangasFromPage(page);
            mangaList.push(...mangas);
        }
        return mangaList;
    }

    async _getMangasFromPage(page) {
        const uri = new URL('?q=&p='+page, this.url);
        const request = new Request(uri, this.requestOptions);
        const data = await this.fetchDOM(request, 'div#thumbs_container div.id1 div.id3 a');
        return data.map(element => {
            return {
                id: this.getRootRelativeOrAbsoluteLink(element, this.url),
                title: element.title.trim()
            };
        });
    }

    async _getChapters(manga) {
        return [{id: manga.id, title :manga.title}];
    }

    async _getPages(chapter) {
        const uri = new URL(chapter.id, this.url);
        const request = new Request(uri, this.requestOptions);
        const script = `
        new Promise((resolve, reject) => {
            setTimeout(() => {
                try {
                    resolve(Reader.pages);
                }
                catch(error) {
                    reject(error);
                }
            },
            2500);
        });
        `;
        const data = await Engine.Request.fetchUI(request, script, 10000, true);
        return data.map(image => this.getAbsolutePath(image, request.url));
    }
}
