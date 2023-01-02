import Connector from '../engine/Connector.mjs';
import Manga from '../engine/Manga.mjs';
export default class PeanuToon extends Connector {
    constructor() {
        super();
        super.id = 'peanutoon';
        super.label = 'PeanuToon';
        this.tags = [ 'webtoon', 'korean' ];
        this.url = 'https://www.peanutoon.com';
    }
    async _getMangas() {
        const msg = 'This website does not provide a manga list, please copy and paste the URL containing the chapters directly from your browser into HakuNeko.';
        throw new Error(msg);
    }
    async _getMangaFromURI(uri) {
        const request = new Request(uri, this.requestOptions);
        const data = await this.fetchDOM(request, 'div.detail_info div.info_title h2');
        const id = uri.pathname;
        const title = data[0].textContent.trim();
        return new Manga(this, id, title);
    }
    async _getChapters(manga) {
        const uri = new URL(manga.id, this.url);
        const request = new Request(uri, this.requestOptions);
        const data = await this.fetchDOM(request, 'div.container div.detail_area > a');
        return data.map(element => {
            return {
                id: this.getRootRelativeOrAbsoluteLink(element, this.url),
                title: element.querySelector('div.detail_work_list div:nth-last-of-type(2) > div').textContent.trim()
            };
        }).reverse();
    }
    async _getPages(chapter) {
        const uri = new URL(chapter.id, this.url);
        const request = new Request(uri, this.requestOptions);
        const data = await this.fetchDOM(request, 'section#viewer-list source.lazyload');
        return data.map(element => this.getAbsolutePath(element.dataset['src'], request.url));
    }
}
