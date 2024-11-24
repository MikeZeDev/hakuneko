import MangaWorld from './MangaWorld.mjs';

export default class MangaWorldAdult extends MangaWorld {

    constructor() {
        super();
        super.id = 'mangaworldadult';
        super.label = 'MangaWorldAdult';
        this.tags = ['manga', 'webtoon', 'italian', 'hentai'];
        this.url = 'https://mangaworldadult.com';
    }
    canHandleURI(uri) {
        return /https?:\/\/(?:www\.)?mangaworldadult.com/.test(uri.origin);
    }
    get icon() {
        return '/img/connectors/mangaworld';
    }
}
