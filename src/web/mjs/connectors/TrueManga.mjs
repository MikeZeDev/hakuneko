import MadTheme from './templates/MadTheme.mjs';

export default class TrueManga extends MadTheme {
    constructor() {
        super();
        super.id = 'truemanga';
        super.label = 'TrueManga';
        this.tags = ['manga', 'webtoon', 'english'];
        this.url = 'https://truemanga.com';
    }
}
