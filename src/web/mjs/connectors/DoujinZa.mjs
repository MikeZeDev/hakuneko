import WordPressMadara from './templates/WordPressMadara.mjs';

export default class DoujinZa extends WordPressMadara {
    constructor() {
        super();
        super.id = 'doujinza';
        super.label = 'DoujinZa';
        this.tags = [ 'webtoon', 'thai', 'hentai' ];
        this.url = 'https://doujinza.com';
    }

    async _getMangas() {
        let mangaList = [];
        const uri = new URL(this.url);
        const request = new Request(uri, this.requestOptions);
        const data = await this.fetchDOM(request, 'div.wp-pagenavi a:last-of-type');
        const pageCount = parseInt(data[0].href.match(/([\d]+)/)[1]);
        for(let page = 1; page <= pageCount; page++) {
            const mangas = await this._getMangasFromPage(page);
            mangaList.push(...mangas);
        }
        return mangaList;
    }

    async _getMangasFromPage(page) {
        const uri = new URL('/page/' + page, this.url);
        const request = new Request(uri, this.requestOptions);
        const data = await this.fetchDOM(request, 'div#loop-content div.page-item-detail.manga div.item-thumb a');
        return data.map(element => {
            return {
                id: this.getRootRelativeOrAbsoluteLink(element, this.url),
                title: element.title.trim()
            };
        });
    }
}