import WordPressMadara from './templates/WordPressMadara.mjs';

export default class MangasTk extends WordPressMadara {
    constructor() {
        super();
        super.id = 'mangastk';
        super.label = 'MangasTk';
        this.tags = [ 'webtoon', 'manga', 'spanish' ];
        this.url = 'https://mangastk.net';
        this.queryChaptersTitleBloat = 'span.chapterdate';
    }
}