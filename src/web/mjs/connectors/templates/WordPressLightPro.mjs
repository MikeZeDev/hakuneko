import Connector from '../../engine/Connector.mjs';

export default class WordPressLightPro extends Connector {

    constructor() {
        super();
        super.id = undefined;
        super.label = undefined;
        this.tags = [];
        this.url = undefined;
        this.path = '/manga-list/all/any/name-az/';

        this.queryMangasPageCount = 'div.wpm_nav ul.pgg li:last-of-type a';
        this.queryMangas = 'div.mng_lst div.nde div.det a.mng_det_pop';
        this.queryChaptersPageCount = 'div.mng_det ul.pgg li:last-of-type a';
        this.queryChapters = 'div.mng_det ul.lst li a.lst b.val';
        this.queryPageLinks = 'div.wpm_pag div.wpm_nav:first-of-type ul.nav_pag li select.cbo_wpm_pag option';
        this.queryPages = 'div.wpm_pag div.prw a source';
        this.language = '';
    }

    async _getMangas() {
        const request = new Request (new URL(this.url + this.path), this.requestOptions);
        const dom = await this.fetchDOM(request, 'body' );
        let pageCount = parseInt( dom[0].querySelector(this.queryMangasPageCount).href.match( /(\d+)\/$/ )[1] );
        let pagesList = [];
        for (let i = 1; i <= pageCount; i++){
            pagesList.push(...await this._getMangasFromPage(i));
        }
        return pagesList;
    }

    async _getMangasFromPage(page) {
        const request = new Request (new URL(this.url + this.path + page), this.requestOptions);
        const data = await this.fetchDOM(request, this.queryMangas);
        return data.map(element => {
            return {
                id: this.getRelativeLink(element, this.url),
                title: element.title.trim() || element.text.trim()
            };
        });
    }

    async _getChapters(manga) {
        const uri = new URL(manga.id, this.url);
        const request = new Request(uri, this.requestOptions);
        let data = await this.fetchDOM(request, this.queryChaptersPageCount);
        const pageCount = data.length === 0 ? 1 : parseInt( data[0].href.match( /(\d+)\/$/ )[1] );
        let pagesList = [];
        for (let i = 1; i <= pageCount; i++){
            pagesList.push(...await this._getChaptersFromPage(manga, i));
        }
        return pagesList;
    }    

    async _getChaptersFromPage(manga, page){
        const request = new Request (new URL(this.url + manga.id+ 'chapter-list/' + page), this.requestOptions);
        const data = await this.fetchDOM(request, this.queryChapters);
        return data.map(element => {
            return {
                  id: this.getRelativeLink( element ),
                  title: element.innerText.replace( manga.title, '' ).trim(),
                  language: this.language
            };
        });    	
    }

    async _getPages(chapter) {
        const uri = new URL(chapter.id, this.url);
        const request = new Request(uri, this.requestOptions);
        const data = await this.fetchDOM(request, this.queryPageLinks );
        return data.map(element => this.createConnectorURI(this.url + chapter.id + element.value + '/'));
    }

    async _handleConnectorURI( payload ) {
        let request = new Request( payload, this.requestOptions );
        return this.fetchDOM( request, this.queryPages )
            .then( data => {
                let span = document.createElement( 'span' );
                span.innerHTML = data[0].getAttribute( 'src' );
                return fetch( new URL( span.textContent.trim(), request.url ).href, this.requestOptions );
            } )
            .then( response => response.blob() )
            .then( data => this._blobToBuffer( data ) );
    }
}
