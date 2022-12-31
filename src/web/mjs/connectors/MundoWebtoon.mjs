import Connector from '../engine/Connector.mjs';
import Manga from '../engine/Manga.mjs';

export default class MundoWebtoon extends Connector {

    constructor() {
        super();
        super.id = 'mundowebtoon';
        super.label = 'MundoWebtoon';
        this.tags = [ 'webtoon', 'portuguese', 'manga' ];
        this.url = 'https://mundowebtoon.com';
    }

    async _getMangaFromURI(uri) {
        const request = new Request(uri, this.requestOptions);
        const data = await this.fetchDOM(request, 'div.mangaTitulo h3');
        return new Manga(this, uri.pathname, data[0].textContent.trim());
    }

    async _getMangas() {
        const uri = new URL('/mangas', this.url);
        const request = new Request(uri, this.requestOptions);
        const data = await this.fetchDOM(request, 'div.andro_product-body a');
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
        const data = await this.fetchDOM(request, 'div.CapitulosListaItem > a:not([target])');
        return data.map(element => {
            return {
                id: this.getRootRelativeOrAbsoluteLink(element, this.url),
                title: element.querySelector('h5').textContent.replace(/(\(\S+\))/, '').trim()
            };
        });
    }

    async _getPages(chapter) {
        const uri = new URL('leitor_image.php', this.url);
        const referer = new URL(chapter.id, this.url);
        const slug = chapter.id.split('/')[2];
        const chap = chapter.id.split('/')[3];
        const request = new Request(uri, {
            method: 'POST',
            body: new URLSearchParams({
                data: slug,
                num: chap,
                modo: '1',
                busca: 'img',
            })
                .toString(),
            headers: {
                'x-origin': this.url,
                'x-referer': referer,
                'Content-Type': 'application/x-www-form-urlencoded; charset=UTF-8',
                'X-Requested-With': 'XMLHttpRequest',
            }
        });
        const data = await this.fetchDOM(request, 'source');
        return data.map(element => this.getRootRelativeOrAbsoluteLink(element.getAttribute('src'), this.url));
    }
}
