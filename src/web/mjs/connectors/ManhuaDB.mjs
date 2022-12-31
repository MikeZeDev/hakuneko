import Connector from '../engine/Connector.mjs';
import Manga from '../engine/Manga.mjs';
export default class ManhuaDB extends Connector {
    constructor() {
        super();
        super.id = 'manhuadb';
        super.label = 'ManhuaDB';
        this.tags = [ 'manga', 'webtoon', 'chinese' ];
        this.url = 'https://www.manhuadb.com';
        this.path = '/manhua/list.html';
        this.queryMangas = 'div.media.comic-book-unit div.media-body h2 > a';
        this.queryMangasPagesArray = 'select#page-selector option';
        this.queryChapters = 'ol.links-of-books li a';
        this.queryPages = 'div.content-text source[loading="lazy"]';
        this.queryMangaTitleURI = 'div.comic-main-section div.comic-info h1.comic-title';
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
        const pagesArray = await this.fetchDOM(request, this.queryMangasPagesArray);
        for(let i = 0; i < pagesArray.length; i++) {
            const page = new URL(pagesArray[i].value, this.url);
            const mangas = await this._getMangasFromPage(page);
            mangaList.push(...mangas);
        }
        return mangaList;
    }
    async _getMangasFromPage(uri) {
        const request = new Request(uri, this.requestOptions);
        const data = await this.fetchDOM(request, this.queryMangas);
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
        const data = await this.fetchDOM(request, this.queryChapters);
        return data.map(element => {
            return {
                id: this.getRootRelativeOrAbsoluteLink(element, this.url),
                title: element.title.trim()
            };
        }).reverse();
    }
    async _getPages(chapter) {
        const uri = new URL(chapter.id, this.url);
        const script = `
        new Promise(resolve => {
            resolve({
                img_pre : window.img_pre, img_data_arr : window.img_data_arr , img_host : window.img_host
            });
        });
        `;
        const request = new Request(uri);
        const response = await Engine.Request.fetchUI(request, script);
        let pagelist = [];
        response.img_data_arr.forEach(image =>{
            pagelist.push(response.img_host+response.img_pre +image.img);
        });
        return pagelist;
    }
}