import Connector from '../engine/Connector.mjs';
import Manga from '../engine/Manga.mjs';
export default class Delitoon extends Connector {
    constructor() {
        super();
        super.id = 'delitoon';
        super.label = 'Delitoon';
        this.tags = [ 'webtoon', 'french' ];
        this.url = 'https://www.delitoon.com';
        this.links = {
            login: 'https://www.delitoon.com/user/login'
        };
        this.requestOptions.headers.set('x-balcony-id', 'DELITOON_COM');
        this.requestOptions.headers.set('x-balcony-timeZone', 'Europe/Paris');
        this.requestOptions.headers.set('x-platform', 'WEB');
        this.requestOptions.headers.set('x-referer', this.url);
    }
    async _getMangaFromURI(uri) {
        const mangaid = uri.href.match(/\/detail\/(\S+)/)[1];
        const req = new URL('/api/balcony-api/contents/'+mangaid, this.url);
        req.searchParams.set('isNotLoginAdult', 'true');
        const request = new Request(req, this.requestOptions);
        const data = await this.fetchJSON(request);
        return new Manga(this, mangaid, data.data.title.trim());
    }
    async _getMangas() {
        const uri = new URL('/api/balcony-api-v2/contents/search', this.url);
        uri.searchParams.set('searchText', '');
        uri.searchParams.set('isCheckDevice', 'true');
        uri.searchParams.set('isIncludeAdult', 'true');
        uri.searchParams.set('contentsThumbnailType', 'MAIN');
        const request = new Request(uri, this.requestOptions);
        const data = await this.fetchJSON(request);
        return data.data.map(element => {
            return {
                id : element.alias,
                title : element.title.trim()
            };
        });
    }
    async _getChapters(manga) {
        const uri = new URL('/api/balcony-api/contents/'+manga.id, this.url);
        uri.searchParams.set('isNotLoginAdult', 'true');
        const request = new Request(uri, this.requestOptions);
        const data = await this.fetchJSON(request);
        return data.data.episodes.map(element => {
            let title = '';
            try{
                let chapnum = parseInt(element.title);
                title = 'Chapter '+ chapnum;
            } catch (error) {
                title = element.title.trim();
            }
            title += element.subtitle ? element.subTitle.trim() : '';
            return {
                id : element.alias,
                title : title,
            };
        }).reverse();
    }
    async _getPages(chapter) {
        const uri = new URL('/api/balcony-api/contents/'+chapter.manga.id+'/'+chapter.id, this.url);
        uri.searchParams.set('isNotLoginAdult', 'true');
        const request = new Request(uri, this.requestOptions);
        const data = await this.fetchJSON(request);
        if (data.result == 'ERROR') {
            switch (data.error.code) {
                case 'NOT_LOGIN_USER':
                    throw new Error('You must be logged/have paid to view this chapter !');
                default:
                    throw new Error('Unknown error : '+ data.error.code);
            }
        }
        return data.data.images.map(element => element.imagePath);
    }
}
