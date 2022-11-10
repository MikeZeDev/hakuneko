import WordPressMadara from './templates/WordPressMadara.mjs';

export default class KawaScans extends WordPressMadara {

    constructor() {
        super();
        super.id = 'mangarolls';
        super.label = 'MangaRolls';
        this.tags = [ 'webtoon', 'manga', 'english' ];
        this.url = 'https://mangarolls.com';
    }
}