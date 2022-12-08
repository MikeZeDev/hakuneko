import Connector from '../engine/Connector.mjs';
import Manga from '../engine/Manga.mjs';
export default class NovelMania extends Connector {
    constructor() {
        super();
        super.id = 'novelmania';
        super.label = 'NovelMania';
        this.tags = [ 'novel', 'portuguese' ];
        this.url = 'https://novelmania.com.br';
        this.novelFormat = 'image/png';
        this.novelWidth = '56em';
        // parseInt(1200 / window.devicePixelRatio) + 'px';
        this.novelPadding = '1.5em';
    }
    async _getMangaFromURI(uri) {
        const request = new Request(uri, this.requestOptions);
        const data = await this.fetchDOM(request, 'meta[property="og:title"]');
        return new Manga(this, uri.pathname, data[0].content.trim());
    }
    async _getMangas() {
        let mangaList = [];
        const uri = new URL('/novels', this.url);
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
        const uri = new URL('/novels/?page=' + page, this.url);
        const request = new Request(uri, this.requestOptions);
        const data = await this.fetchDOM(request, 'div.row.mb-2 a.novel.novel-title');
        return data.map(element => {
            return {
                id: this.getRootRelativeOrAbsoluteLink(element, this.url),
                title: element.querySelector('h5').textContent.trim()
            };
        });
    }
    async _getChapters(manga) {
        const uri = new URL(manga.id, this.url);
        const request = new Request(uri, this.requestOptions);
        const data = await this.fetchDOM(request, 'ol.list-inline li a');
        return data.map(element => {
            return {
                id: this.getRootRelativeOrAbsoluteLink(element, this.url),
                title: element.querySelector('span').textContent.trim()+ ':'+element.querySelector('strong').textContent.trim()
            };
        })
        .reverse();
    }
    async _getPages(chapter) {
        const uri = new URL(chapter.id, this.url);
        const request = new Request(uri, this.requestOptions);
        let darkmode = Engine.Settings.NovelColorProfile();
        let script = `
        new Promise((resolve, reject) => {
            document.body.style.width = '${this.novelWidth}';
            let container = document.querySelector('div.container');
            container.style.maxWidth = '${this.novelWidth}';
            container.style.padding = '0';
            container.style.margin = '0';
            let novel = document.querySelector('div#chapter-content');
            novel.style.padding = '${this.novelPadding}';
            [...novel.querySelectorAll(":not(:empty)")].forEach(ele => {
                ele.style.backgroundColor = '${darkmode.background}'
                ele.style.color = '${darkmode.text}'
            })
            novel.style.backgroundColor = '${darkmode.background}';
            novel.style.color = '${darkmode.text}';
            let script = document.createElement('script');
            script.onerror = error => reject(error);
            script.onload = async function() {
                try {
                    let canvas = await html2canvas(novel);
                    let textimg = canvas.toDataURL('${this.novelFormat}');
                    const picnodes = document.querySelectorAll('div#chapter-content img');
                    let final = [];
                    final.push(textimg);
                    picnodes.forEach(element => final.push(element.src));
                    resolve( final);
                } catch (error){
                    reject(error)
                }
            }
            script.src = 'https://html2canvas.hertzen.com/dist/html2canvas.min.js';
            document.body.appendChild(script);
        });
        `;
        const response = await Engine.Request.fetchUI(request, script, 30000, true);
        return response;
    }
}