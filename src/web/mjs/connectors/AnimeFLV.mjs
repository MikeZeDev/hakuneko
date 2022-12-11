import Connector from '../engine/Connector.mjs';
import Manga from '../engine/Manga.mjs';
import StreamTape from '../videostreams/StreamTape.mjs';
import YourUpload from '../videostreams/YourUpload.mjs';
import StreamSB from '../videostreams/StreamSB.mjs';
import Fembed from '../videostreams/Fembed.mjs';

export default class AnimeFLV extends Connector {
    constructor() {
        super();
        super.id = 'AnimeFLV';
        super.label = 'AnimeFLV';
        this.tags = [ 'anime', 'spanish' ];
        this.url = 'https://www3.animeflv.net';
    }
    async _getMangaFromURI(uri) {
        const request = new Request(uri, this.requestOptions);
        const data = await this.fetchDOM(request, 'div.Container h1.title');
        return new Manga(this, uri.pathname , data[0].textContent.trim());
    }
    async _getMangas() {
        let mangaList = [];
        const uri = new URL('/browse', this.url);
        const request = new Request(uri, this.requestOptions);
        const data = await this.fetchDOM(request, 'ul.pagination li:nth-last-of-type(2) a');
        const pageCount = parseInt(data[0].text);
        for(let page = 1; page <= pageCount; page++) {
            const mangas = await this._getMangasFromPage(page);
            mangaList.push(...mangas);
        }
        return mangaList;
    }
    async _getMangasFromPage(page) {
        const uri = new URL('/browse?page=' + page, this.url);
        const request = new Request(uri, this.requestOptions);
        const data = await this.fetchDOM(request, 'article.Anime');
        return data.map(element => {
            return {
                id: this.getRootRelativeOrAbsoluteLink(element.querySelector('a'), this.url),
                title: element.querySelector('div.Description div.Title strong').textContent.trim()
            };
        });
    }
    async _getChapters(manga) {
        const uri = new URL(manga.id, this.url);
        let script = `
        new Promise(resolve => {
            resolve({
            info : anime_info, episodes : episodes}
            );
        });
        `;
        let request = new Request(uri, this.requestOptions);
        const data = await Engine.Request.fetchUI(request, script, 3000);
        let chapterlist = [];
        for (let episode of data.episodes) {
            chapterlist.push(...await this.listVideos(episode, data.info));
        }
        return chapterlist;
    }
    async listVideos(episode, info)
    {
        let chapterlist = [];
        const url = new URL('/ver/'+info[2] +'-'+ episode[0], this.url);
        let script = `
        new Promise(resolve => {
            resolve(videos);
        });
        `;
        let request = new Request(url, this.requestOptions);
        const data = await Engine.Request.fetchUI(request, script, 3000);
        return data.SUB.map(video => {
            return {
                id : video.code,
                title : 'Episode '+ episode[0] + ' ['+video.title+']'
            }
        });
    }
    async _getPages(chapter) {
        const uri = chapter.id;
        const hoster = chapter.title.match(/(\[\w+\])/)[1];
        let vid = '';
        switch (hoster) {
            case '[Stape]':
               vid = await new StreamTape(uri).getStream();
               return {video : vid};
            break;
            case '[YourUpload]':
               vid = await new YourUpload(uri).getStream();
               return {video : vid, referer : 'https://www.yourupload.com'};
            break;
            case '[SB]':
               vid = await new StreamSB(uri).getStream();
               return {mirrors : [vid]};
            break;           
             case '[Fembed]':
               vid = await new Fembed(uri).getStream();
               return {mirrors :  [vid], referrer : chapter.id};
            break;   
        	default:
        		throw new Error('Hoster '+ hoster + ' not supported :/')
        }
    }
}
