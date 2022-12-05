import Connector from '../engine/Connector.mjs';
import Manga from '../engine/Manga.mjs';

export default class MangaTigre extends Connector {
    constructor() {
        super();
        super.id = 'mangatigre';
        super.label = 'MangaTigre';
        this.tags = [ 'manga', 'webtoon', 'spanish' ];
        this.url = 'https://www.mangatigre.net';
        this.token = undefined;
        this.requestOptions.headers.set('x-origin', this.url);
        this.booktype = {
            1: "manga",
            2: "manhwa",
            3: "manhua",
        };
    }

    async _getMangas() {
        const uri = new URL('/mangas', this.url);
        await this.getToken(uri);
        let mangaList = [];
        for (let page = 1, run = true; run; page++) {
            const mangas = await this._getMangasFromPage(page);
            mangas.length > 0 ? mangaList.push(...mangas) : run = false;
        }
        return mangaList;
    }

    async _getMangasFromPage(page) {
        const uri = new URL('/mangas', this.url);
        const request = new Request(uri, {
            method: 'POST',
            body: JSON.stringify({_token : this.token, page : page}),
            headers: {
                'content-type': 'application/json',
                'x-referer': uri.href
            }
        });
        const response = await fetch(request);
        const data = await response.json();
        return data.data.map(element => {
            let btype = this.booktype[element.type];
            return {
                id: '/'+btype+'/'+element.slug,
                title: element.name.trim()
            };
        });
    }

    async _getChapters(manga) {
        const slug = manga.id.split('/')[2];
        const uri = new URL(manga.id, this.url);
        await this.getToken(uri);
        const request = new Request(uri, {
            method: 'POST',
            body: JSON.stringify({_token : this.token}),
            headers: {
                'content-type': 'application/json',
                'x-referer': uri.href
            }
        });
        const data = await this.fetchDOM(request, 'a');
        return data.map(element => {
            return {
                id: element.pathname,
                title: element.text.trim()
            };
        });
    }

    async _getPages(chapter) {
        const uri = new URL(chapter.id, this.url);
        const script = `
        new Promise(resolve => {
            resolve({
                chap : window.chapter, cdn : window.cdn
            });
        });
        `;
        const request = new Request(uri);
        const response = await Engine.Request.fetchUI(request, script);
        const chap = JSON.parse(response.chap);
        const CDN = response.cdn;
        let keyz = Object.keys(chap.images).sort();
        let pagelist = [];
        for (let i = 0; i < keyz.length; i++ ){
            let key = keyz[i];
            let image = chap.images[key];
            let link = '//'.concat(CDN, '/chapters/').concat(chap.manga.slug, '/').concat(chap.number, '/').concat(image.name, '.').concat(image.format);
            pagelist.push(this.getAbsolutePath(link, request.url));
        }
        return pagelist;
    }
    async getToken(url){
        try{
            let request = new Request(url, this.requestOptions);
            let data = await this.fetchDOM(request, 'button[data-token]',3);
            this.token = data[0].getAttribute('data-token');
        }
        catch(e)
        {
        }
    }
}