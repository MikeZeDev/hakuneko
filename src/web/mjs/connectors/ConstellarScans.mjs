import WordPressMangastream from './templates/WordPressMangastream.mjs';
export default class ConstellarScans extends WordPressMangastream {

//Source says "mangareader" but its mangastream

    constructor() {
        super();
        super.id = 'constellarscans';
        super.label = 'Constellar Scans';
        this.tags = [ 'webtoon', 'english', 'hentai', 'scanlation' ];
        this.url = 'https://constellarscans.com';
        this.path = '/manga/list-mode/';
    }
}