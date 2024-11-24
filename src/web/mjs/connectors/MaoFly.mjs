import Connector from '../engine/Connector.mjs';
import Manga from '../engine/Manga.mjs';
export default class MaoFly extends Connector {
    constructor() {
        super();
        super.id = 'maofly';
        super.label = 'MaoFly';
        this.tags = [ 'manga', 'webtoon', 'chinese' ];
        this.url = 'https://www.maofly.com';
        this.path = '/list/a-0-c-31-t-0-y-0-i-0-m-0';
        this.queryMangas = 'div.media.comic-book-unit div.media-body h2 > a';
        this.queryMangasPageCount = 'div.bg-white.pagination a:nth-last-child(2)';
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
        const uri = new URL(this.path+'-page-1.html', this.url);
        const request = new Request(uri, this.requestOptions);
        const data = await this.fetchDOM(request, this.queryMangasPageCount);
        const pagesCount = parseInt(data[0].text);
        for(let i = 1; i < pagesCount; i++) {
            const mangas = await this._getMangasFromPage(i);
            mangaList.push(...mangas);
        }
        return mangaList;
    }
    async _getMangasFromPage(page) {
        const request = new Request(new URL(this.path+'-page-'+page+'.html', this.url), this.requestOptions);
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
        });
    }
    async _getPages(chapter) {
        const uri = new URL(chapter.id, this.url);
        const script = `
        new Promise(resolve => {
            setTimeout(() => {
                const arr = LZString.decompressFromBase64(img_data).split(',');
                resolve({
                    img_pre : window.img_pre, img_data_arr : arr , img_host : window.asset_domain
                });
            },
            2500);
        });
        `;
        const request = new Request(uri);
        const response = await Engine.Request.fetchUI(request, script);
        let pagelist = [];
        response.img_data_arr.forEach(image =>{
            pagelist.push(this.createConnectorURI(response.img_host+response.img_pre +image));
        });
        return pagelist;
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
