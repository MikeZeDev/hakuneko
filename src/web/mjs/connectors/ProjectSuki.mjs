import Connector from '../engine/Connector.mjs';
import Manga from '../engine/Manga.mjs';

export default class ProjectSuki extends Connector {

    constructor() {
        super();
        super.id = 'projectsuki';
        super.label = 'ProjectSuki';
        this.tags = [ 'manga', 'webtoon', 'english' ];
        this.url = 'https://projectsuki.com';
    }

    async _getMangaFromURI(uri) {
        const request = new Request(uri, this.requestOptions);
        const id = uri.pathname + uri.search;
        const title = (await this.fetchDOM(request, 'h2[itemprop="title"'))[0].textContent.trim();
        return new Manga(this, id, title);
    }

    async _getMangas() {
        let mangaList = [];
        for (let page = 0, run = true; run; page++) {
            const mangas = await this._getMangasFromPage(page);
            mangas.length > 0 ? mangaList.push(...mangas) : run = false;
        }
        return mangaList;
    }

    async _getMangasFromPage(page) {
        const uri = new URL('/browse/' + page, this.url);
        const request = new Request(uri, this.requestOptions);
        const data = await this.fetchDOM(request, 'a.inherit-color.p-1[aria-label]');
        return data.map(element => {
            return {
                id: this.getRootRelativeOrAbsoluteLink(element, this.url),
                title: element.getAttribute('aria-label').trim()
            };
        });
    }

    async _getChapters(manga) {
        const uri = new URL(manga.id, this.url);
        const request = new Request(uri, this.requestOptions);
        const data = await this.fetchDOM(request, 'td.col-5.col-sm-4.col-md-4.text-truncate > a');
        return data.map(element => {
            return {
                id: this.getRootRelativeOrAbsoluteLink(element, this.url),
                title: element.textContent.trim(),
            };
        });
    }

    async _getPages(chapter)
    {
        const script = `
        new Promise((resolve, reject) => {
            const xrequesto = function (element, url, data, method)
            {
                let xhr = new XMLHttpRequest();
                xhr.onload = function () {
                    if (xhr.status >= 200 && xhr.status < 300)
                    {
                        datar = JSON.parse(xhr.response);
                        element.insertAdjacentHTML('beforeend', datar['src']);
                        let images = [...document.querySelectorAll( 'img.img-fluid.center-block' )];
                        resolve(images.map(image => image.src));
                    }
                    else
                    {
                        throw Error('Cant get images :/ !');
                    }
                }
                xhr.open(method, url);
                xhr.setRequestHeader('Content-Type', 'application/json;charset=UTF-8');
                xhr.send(data);
            }
            const xelement = document.querySelector('.strip-reader');
            const xbookid = window.location.href.split('/') [4];
            let xchapterid = window.location.href.split('/') [5];
            xrequesto(xelement, '/callpage', JSON.stringify({
                bookid: xbookid,
                chapterid: xchapterid,
                first: true
            })
            , 'POST');
        });
        `;
        const uri = new URL(chapter.id, this.url);
        let request = new Request(uri, this.requestOptions);
        return await Engine.Request.fetchUI(request, script);
    }
}