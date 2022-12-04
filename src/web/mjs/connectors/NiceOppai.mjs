import WordPressLightPro from './templates/WordPressLightPro.mjs';

export default class NiceOppai extends WordPressLightPro {

    constructor() {
        super();
        super.id = 'niceoppai';
        super.label ='NiceOppai';
        this.tags = ['manga', 'thai'];
        this.url = 'https://www.niceoppai.net';
        this.path = '/manga_list/all/any/name-az/';
        this.queryMangas = 'div.mng_lst div.nde div.det a';
        this.queryChapters = 'div.mng_det ul.lst li a.lst';
        this.queryPages = 'div#image-container source';
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
        const data = await this.fetchDOM(request,  this.queryPages);
        return data.map(image => this.getAbsolutePath(image, request.url));
    }
}