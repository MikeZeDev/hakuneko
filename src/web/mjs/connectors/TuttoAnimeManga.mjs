import PizzaReader from './templates/PizzaReader.mjs';

export default class TuttoAnimeManga extends PizzaReader {

    constructor() {
        super();
        super.id = 'tuttoanimemanga';
        super.label = 'TuttoAnimeManga';
        this.tags = [ 'manga', 'italian', 'scanlation' ];
        this.url = 'https://tuttoanimemanga.net';
    }
}