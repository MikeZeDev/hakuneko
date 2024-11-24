import WordPressMangastream from './templates/WordPressMangastream.mjs';
export default class MangaYaro extends WordPressMangastream {

    constructor() {
        super();
        super.id = 'mangayaro';
        super.label = 'MangaYaro';
        this.tags = [ 'webtoon', 'indonesian', 'manga' ];
        this.url = 'https://mangayaro.net';
        this.path = '/manga/list-mode/';
    }
}