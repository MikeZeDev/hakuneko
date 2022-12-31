import Connector from '../engine/Connector.mjs';
import Manga from '../engine/Manga.mjs';

export default class NovelBin extends Connector {

    constructor() {
        super();
        super.id = 'novelbin';
        super.label = 'NovelBin';
        this.tags = [ 'novel', 'english' ];
        this.url = 'https://novelbin.com';
        this.novelFormat = 'image/png';
        this.novelWidth = '56em'; // parseInt(1200 / window.devicePixelRatio) + 'px';
        this.novelPadding = '1.5em';

    }
    async _getMangaFromURI(uri) {
        const request = new Request(uri, this.requestOptions);
        const data = await this.fetchDOM(request, 'h3.title');
        return new Manga(this, uri.pathname, data[0].textContent.trim());
    }
    async _getMangas() {
        let mangaList = [];
        const uri = new URL('/sort/latest-free/', this.url);
        const request = new Request(uri, this.requestOptions);
        const data = await this.fetchDOM(request, 'ul.pagination li:last-of-type a');
        const pageCount = parseInt(data[0].href.match(/(\d)+$/)[1]);
        for(let page = 1; page <= pageCount; page++) {
            const mangas = await this._getMangasFromPage(page);
            mangaList.push(...mangas);
        }
        return mangaList;
    }

    async _getMangasFromPage(page) {
        const uri = new URL('/sort/latest-free?page=' + page, this.url);
        const request = new Request(uri, this.requestOptions);
        const data = await this.fetchDOM(request, 'h3.novel-title > a');
        return data.map(element => {
            return {
                id: this.getRootRelativeOrAbsoluteLink(element, this.url),
                title: element.text.trim()
            };
        });
    }

    async _getChapters(manga) {
        let slug = manga.id.split('/');
        slug = slug[slug.length-1];
        const request = new Request(new URL('/ajax/chapter-archive?novelId='+slug, this.url), this.requestOptions);
        request.headers.set('X-Requested-With', 'XMLHttpRequest');

        const data = await this.fetchDOM(request, 'ul.list-chapter li a');
        return data.map(element => {
            return {
                id: this.getRootRelativeOrAbsoluteLink(element, this.url),
                title: element.querySelector('span').textContent.trim()
            };
        }).reverse();
    }
    async _getPages(chapter) {
        const request = new Request(new URL(chapter.id, this.url), this.requestOptions);
        let darkmode = Engine.Settings.NovelColorProfile();
        let script = `
            new Promise((resolve, reject) => {
                document.body.style.width = '${this.novelWidth}';
                let container = document.querySelector('div.row');
                container.style.maxWidth = '${this.novelWidth}';
                container.style.padding = '0';
                container.style.margin = '0';
                let novel = document.querySelector('div#chr-content');
                novel.style.padding = '${this.novelPadding}';
                [...novel.querySelectorAll(":not(:empty)")].forEach(ele => {
                    ele.style.backgroundColor = '${darkmode.background}'
                    ele.style.color = '${darkmode.text}'
                })
                novel.style.backgroundColor = '${darkmode.background}'
                novel.style.color = '${darkmode.text}'
                let script = document.createElement('script');
                script.onerror = error => reject(error);
                script.onload = async function() {
                    try{
                        let canvas = await html2canvas(novel);
                        resolve(canvas.toDataURL('${this.novelFormat}'));
                    }catch (error){
                        reject(error)
                    }
                }
                script.src = 'https://html2canvas.hertzen.com/dist/html2canvas.min.js';
                document.body.appendChild(script);
            });
        `;
        return [ await Engine.Request.fetchUI(request, script, 30000, true) ];
    }
}