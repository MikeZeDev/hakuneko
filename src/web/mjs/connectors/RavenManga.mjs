import Connector from '../engine/Connector.mjs';
import Manga from '../engine/Manga.mjs';
export default class RavenManga extends Connector {
    constructor() {
        super();
        super.id = 'ravenmanga';
        super.label = 'RavenManga';
        this.tags = [ 'manga', 'spanish', 'webtoon' ];
        this.url = 'https://ravenmanga.xyz';
        this.requestOptions.headers.set('x-referer', this.url);
    }
    async _getMangaFromURI(uri) {
        const request = new Request(uri, this.requestOptions);
        const data = await this.fetchDOM(request, 'div.infoanime h1.entry-title');
        return new Manga(this, uri.pathname, data[0].textContent.trim());
    }
    async _getMangas() {
        const uri = new URL('/biblioteca-de-series/?list', this.url);
        const request = new Request(uri, this.requestOptions);
        const data = await this.fetchDOM(request, 'div.listttl ul li a');
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
        const data = await this.fetchDOM(request, 'div#chapter_list span.lchx a');
        return data.map(element => {
            return {
                id: this.getRootRelativeOrAbsoluteLink(element, this.url),
                title: (element.text.indexOf('–') != -1) ? element.text.split('–')[1].trim() : element.text.trim()
            };
        });
    }
    async _getPages(chapter) {
        const uri = new URL(chapter.id, this.url);
        const request = new Request(uri, this.requestOptions);
        const data = await this.fetchDOM(request, 'div.reader-area source#imagech');
        return data.map(image => this.getAbsolutePath(image, request.url));
    }
}
