import Connector from '../engine/Connector.mjs';
import Manga from '../engine/Manga.mjs';
export default class ComiCastle extends Connector {
    constructor() {
        super();
        super.id = 'comicastle';
        super.label = 'ComiCastle';
        this.tags = [ 'comics', 'english' ];
        this.url = 'https://comicastle.org';
        this.pages = 'abcdefghijklmnopqrstuvwxyz';
        this.path = '/library/az/';
    }
    async _getMangaFromURI(uri) {
        const request = new Request(uri, this.requestOptions);
        const id = uri.pathname + uri.search;
        const title = (await this.fetchDOM(request, '.nomeserie span'))[0].textContent.trim();
        return new Manga(this, id, title);
    }
    async _getMangas() {
        let mangas = [];
        for (let i = 0; i < this.pages.length; i++ ){
            const request = new Request(new URL(this.path+this.pages[i], this.url), this.requestOptions);
            const data = await this.fetchDOM(request, 'div.table-responsive a:not([class])');
            mangas.push(...data.map(element => {
                return {
                    id: this.getRootRelativeOrAbsoluteLink(element, this.url),
                    title: element.text.trim()
                };
            }));
        }
        const request = new Request(new URL(this.path+'sy', this.url), this.requestOptions);
        const data = await this.fetchDOM(request, 'div.table-responsive a:not([class])');
        mangas.push(...data.map(element => {
            return {
                id: this.getRootRelativeOrAbsoluteLink(element, this.url),
                title: element.text.trim()
            };
        }));
        return mangas;
    }
    async _getChapters(manga) {
        const request = new Request(new URL(manga.id, this.url), this.requestOptions);
        const data = await this.fetchDOM(request, 'table.table.zero-configuration a');
        return data.map(element => {
            return {
                id: this.getRootRelativeOrAbsoluteLink(element, this.url),
                title: element.text.trim()
            };
        }).reverse();
    }
    async _getPages(chapter) {
        const request = new Request(new URL(chapter.id, this.url), this.requestOptions);
        const data = await this.fetchDOM(request, 'div#read-pbp select option');
        return data.map (element => element.getAttribute('alt').trim());
    }
}