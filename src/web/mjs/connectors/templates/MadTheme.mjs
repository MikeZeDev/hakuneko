import Connector from '../../engine/Connector.mjs';
import Manga from '../../engine/Manga.mjs';
export default class MadTheme extends Connector {
    constructor() {
        super();
        super.id = undefined;
        super.label = undefined;    
        this.tags = [];
        this.url = undefined;
        this.path = '/az-list?page=';
        this.queryMangaTitleFromURI = 'div.name.box h1';
        this.queryMangas = 'div.thumb a';
        this.queryPages = 'div.chapter-image';
        this.queryChapterTitle = 'strong.chapter-title';
    }
    async _getMangaFromURI(uri) {
        const request = new Request(new URL(uri), this.requestOptions);
        const data = await this.fetchDOM(request, this.queryMangaTitleFromURI);
        const id = uri.pathname;
        const title = data[0].textContent.trim();
        return new Manga(this, id, title);
    }
    async _getMangas() {
        const mangaList = [];
        for(let page = 1, run = true; run; page++) {
            const mangas = await this._getMangasFromPage(page);
            mangas.length ? mangaList.push(...mangas) : run = false;
        }
        return mangaList;
    }
    async _getMangasFromPage(page) {
        const uri = new URL(this.path + page, this.url);
        const request = new Request(uri, this.requestOptions);
        const data = await this.fetchDOM(request, this.queryMangas);
        return data.map(element => {
            return {
                id: element.pathname,
                title: element.title.trim()
            };
        });
    }
    async _getChapters(manga) {
    	let mangaid = manga.id.split('/');
    	mangaid = '/'+mangaid[mangaid.length - 1];//make sure to take last part of url for the api
        let uri = new URL('/api/manga'+mangaid+'/chapters?source=detail', this.url);
        let request = new Request(uri, this.requestOptions);
        let data = await this.fetchDOM(request, 'a');
        return data.map(element => {
            const link = element.pathname;
            const title = element.querySelector(this.queryChapterTitle).textContent.trim();
            return {
                id: link,
                title: title,
            };
        });
    }
    async _getPages(chapter) {
        let scriptPages = `
        new Promise(resolve => {
            resolve(final_images);
        });
        `;
        let request = new Request(this.url + chapter.id, this.requestOptions);
        let data = await Engine.Request.fetchUI(request, scriptPages);
        return data.map(element => this.createConnectorURI(this.getAbsolutePath(element, request.url)));
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
