import Connector from '../engine/Connector.mjs';
import Manga from '../engine/Manga.mjs';

export default class Azuki extends Connector {

    constructor() {
        super();
        super.id = 'azuki';
        super.label = 'Azuki';
        this.tags = [ 'manga', 'english' ];
        this.url = 'https://www.azuki.co';
        this.api = 'https://production.api.azuki.co';
        this.expirein =
        this.config = {
            format:  {
                label: 'Preferred format',
                description: 'format of images\nwebp (low)\njpg (medium)\npng (high))',
                input: 'select',
                options: [
                    { value: 'webp', name: 'webp' },
                    { value: 'jpg', name: 'jpg' },
                ],
                value: 'jpg'
            },
            quality: {
                label: 'Quality Settings',
                description: 'Choose the quality of pictures',
                input: 'select',
                options: [
                    { value: '3', name: 'best' },
                    { value: '2', name: 'hd' },
                    { value: '1', name: 'sd' },
                    { value: '0', name: 'low' },
                ],
                value: '0'
            }
        };

    }
    async _getMangaFromURI(uri) {
        const request = new Request(uri, this.requestOptions);
        const data = await this.fetchDOM(request, 'header.o-series-summary__header h1');
        return new Manga(this, uri.pathname, data[0].textContent.trim());
    }
    async _getMangas() {
        let mangaList = [];
        const uri = new URL('/series', this.url);
        const request = new Request(uri, this.requestOptions);
        const data = await this.fetchDOM(request, 'div.m-pagination a:nth-last-of-type(2)');
        const pageCount = parseInt(data[0].href.match(/([0-9]+)$/)[1]);
        for(let page = 1; page <= pageCount; page++) {
            const mangas = await this._getMangasFromPage(page);
            mangaList.push(...mangas);
        }
        return mangaList;
    }
    async _getMangasFromPage(page) {
        const uri = new URL('/series/' + page, this.url);
        const request = new Request(uri, this.requestOptions);
        const data = await this.fetchDOM(request, 'div.m-title-card__text a');
        return data.map(element => {
            return {
                id: this.getRootRelativeOrAbsoluteLink(element, this.url),
                title: element.text.trim()
            };
        });
    }
    async _getChapters(manga) {
        const uri = new URL(manga.id, this.url);
        const request = new Request(uri, this.requestOptions);
        const data = await this.fetchDOM(request, 'li.m-card a.a-card-link');
        return data.map(element => {
            return {
                id: this.getRootRelativeOrAbsoluteLink(element, this.url),
                title: element.text.trim()
            };
        });
    }
    async _getPages(chapter) {
        const token = await this.getToken();
        const chapterid = chapter.id.split('/').pop();
        const uri = new URL('/chapter/'+chapterid+'/pages/v0', this.api);
        const request = new Request(uri, this.requestOptions);
        request.headers.set('x-referer', this.url);
        request.headers.set('x-origin', this.url);
        if(token) request.headers.set('X-USER-TOKEN', token);
        let data = '';
        try {
            data = await this.fetchJSON(request);
        } catch (error) {
            throw new Error('This chapter is locked !');
        }
        return data.pages.map(image => this.createConnectorURI(JSON.stringify(image)));
    }
    async _handleConnectorURI(payload) {
        const jObject = JSON.parse(payload);
        //format
        const imagearray = jObject.image[this.config.format.value];

        //quality
        const image = imagearray[this.config.quality.value];

        const request = new Request(image.url, this.requestOptions);
        const response = await fetch(request);
        let data = await response.blob();
        data = await this._blobToBuffer(data);

        let key = '';
        //find one byte XOR key
        if (this.config.format.value == 'jpg') {
            key = data.data[0] ^ 255; //$FF (first byte of a JPEG)
        } else key = data.data[0] ^ 82;//$52 = "R" (webp starts with "RIFF")

        data = {
            mimeType: response.headers.get('content-type'),
            data: this._decryptXOR(data.data, key)
        };
        this._applyRealMime(data);
        return data;
    }
    _decryptXOR(encrypted, key) {
        if (key) {
            let s = new Uint8Array(encrypted);
            for (let n = 0; n < s.length; n++) {
                s[n] ^= key;
            }
            return s;
        } else {
            return encrypted;
        }
    }

    async getToken() {
        //force page refresh to refresh token (sent by Set-Cookie header in request answer)
        let request = new Request(this.url, this.requesOptions);
        await Engine.Request.fetchUI( request, `window.location.reload()` );

        let data = '';
        request = new Request(this.url, this.requestOptions);
        try {
            data = await Engine.Request.fetchUI( request, `new Promise( resolve => resolve( decodeURIComponent( document.cookie ).match( /idToken=([^;]+);/ )[1] ) )` );

        } catch(error) {
            return null;
        }
        return data;

    }

}
