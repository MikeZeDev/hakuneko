import WordPressMadaraNovel from './templates/WordPressMadaraNovel.mjs';
import Manga from '../engine/Manga.mjs';

export default class TravisTranslation extends WordPressMadaraNovel {

    constructor() {
        super();
        super.id = 'travistranslation';
        super.label = 'TRAVIS Translation';
        this.tags = [ 'novel', 'english' ];
        this.url = 'https://travistranslations.com';
        this.queryChapters = 'div.tab_content ul.grid li a';
        this.queryTitleForURI = 'h1#heading';
        this.queryChaptersTitleBloat = 'span:last-of-type';
    }
    async _getMangas() {
        let mangaList = [];
        const uri = new URL('/all-series/', this.url);
        const request = new Request(uri, this.requestOptions);
        const data = await this.fetchDOM(request, 'ul li:nth-last-of-type(2) a.page-numbers');
        const pageCount = parseInt(data[0].text);
        for(let page = 1; page <= pageCount; page++) {
            const mangas = await this._getMangasFromPage(page);
            mangaList.push(...mangas);
        }
        return mangaList;
    }
    async _getMangasFromPage(page) {
        const uri = new URL('/all-series/page/' + page, this.url);
        const request = new Request(uri, this.requestOptions);
        const data = await this.fetchDOM(request, 'li.group > a');
        return data.map(element => {
            return {
                id: this.getRootRelativeOrAbsoluteLink(element, this.url),
                title: element.title.trim()
            };
        });
    }

    async _getPages(chapter) {
        const request = new Request(new URL(chapter.id, this.url), this.requestOptions);
        let darkmode = Engine.Settings.NovelColorProfile();
        let script = `
            new Promise((resolve, reject) => {
                document.body.style.width = '${this.novelWidth}';
                let container = document.querySelector('div#chapter');
                container.style.maxWidth = '${this.novelWidth}';
                container.style.padding = '0';
                container.style.margin = '0';
                let novel = document.querySelector('div.reader-content');
                novel.style.padding = '${this.novelPadding}';
                [...novel.querySelectorAll(":not(:empty)")].forEach(ele => {
                    ele.style.backgroundColor = '${darkmode.background}'
                    ele.style.color = '${darkmode.text}'
                    ele.style['line-height'] = '170%'
                    ele.style.margin = '1em';
                })
                novel.style.backgroundColor = '${darkmode.background}';
                novel.style.color = '${darkmode.text}';

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