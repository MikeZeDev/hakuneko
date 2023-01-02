import Connector from '../engine/Connector.mjs';
import Manga from '../engine/Manga.mjs';
export default class ApoloManga extends Connector {
    constructor() {
        super();
        super.id = 'apolomanga';
        super.label = 'ApoloManga';
        this.tags = [ 'manga', 'spanish', 'webtoon', 'scanlation' ];
        this.url = 'https://apolomanga.com';
    }
    async _getMangaFromURI(uri) {
        const request = new Request(uri, this.requestOptions);
        const id = uri.href.split('/').pop();
        const data = await this.fetchDOM(request, 'div.titulo h1');
        return new Manga(this, id, data[0].textContent.trim());
    }
    async _getMangas() {
        const uri = new URL('/directorio/loads/loadMore.php', this.url);
        const request = new Request(uri, this.requestOptions);
        const data = await this.fetchDOM(request, 'div.proyect');
        return data.map(element => {
            let id = element.getAttribute('onclick');
            id = id.match(/\/ver\/([0-9]+)/)[1];
            return {
                id: id,
                title: element.querySelector('div.proyect-tit').text.trim()
            };
        });
    }
    async _getChapters(manga) {
        const uri = new URL('/ver/'+manga.id, this.url);
        const request = new Request(uri, this.requestOptions);
        const data = await this.fetchDOM(request, 'div.capitulos div.row > a:not([target])');
        return data.map(element => {
            return {
                id: this.getRootRelativeOrAbsoluteLink(element, this.url),
                title: element.text.trim()
            };
        });
    }
    async _getPages(chapter) {
        const uri = new URL(chapter.id, this.url);
        const request = new Request(uri, this.requestOptions);
        const data = await this.fetchDOM(request, 'div.imagenes source.pagina');
        return data.map(image => this.getAbsolutePath(image, request.url));
    }
}
