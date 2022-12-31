import Connector from '../engine/Connector.mjs';
import Manga from '../engine/Manga.mjs';
export default class Readlightnovel extends Connector {
    constructor() {
        super();
        super.id = 'readlightnovel';
        super.label = 'Readlightnovel.me';
        this.tags = [ 'novel', 'english' ];
        this.url = 'https://readlightnovel.me';
        this.pages = 'abcdefghijklmnopqrstuvwxyz';
        this.path = '/novel-list-rln/';
        this.novelFormat = 'image/png';
        this.novelWidth = '56em'; // parseInt(1200 / window.devicePixelRatio) + 'px';
        this.novelPadding = '1.5em';
    }
    async _getMangaFromURI(uri) {
        const request = new Request(uri, this.requestOptions);
        const id = uri.pathname + uri.search;
        const title = (await this.fetchDOM(request, '.nomeserie span'))[0].textContent.trim();
        return new Manga(this, id, title);
    }
    async _getMangas() {
        let mangas = [];
        for (let i = 0; i < this.pages.length; i++ ) {
            const request = new Request(new URL(this.path+this.pages[i], this.url), this.requestOptions);
            const data = await this.fetchDOM(request, 'div.list-by-word-body ul li a');
            mangas.push(...data.map(element => {
                return {
                    id: this.getRootRelativeOrAbsoluteLink(element, this.url),
                    title: element.text.trim()
                };
            }));
        }
        const request = new Request(new URL(this.path, this.url), this.requestOptions);
        const data = await this.fetchDOM(request, 'div.list-by-word-body ul li a');
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
        const data = await this.fetchDOM(request, 'div.panel-body li a');
        return data.map(element => {
            return {
                id: this.getRootRelativeOrAbsoluteLink(element, this.url),
                title: element.text.trim()
            };
        }).reverse();
    }
    async _getPages(chapter) {
        const request = new Request(new URL(chapter.id, this.url), this.requestOptions);
        let darkmode = Engine.Settings.NovelColorProfile();
        let script = `
            new Promise((resolve, reject) => {
                document.body.style.width = '${this.novelWidth}';
                let container = document.querySelector('div#ch-page-container');
                container.style.maxWidth = '${this.novelWidth}';
                container.style.padding = '0';
                container.style.margin = '0';
                let novel = document.querySelector('div#growfoodsmart.hidden');
                novel.className = '';
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