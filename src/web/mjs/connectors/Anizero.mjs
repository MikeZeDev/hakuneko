import Connector from '../engine/Connector.mjs';
import BloggerVideo from '../videostreams/BloggerVideo.mjs';

export default class AniZero extends Connector {
    constructor() {
        super();
        super.id = 'anizero';
        super.label = 'AniZero';
        this.tags = [ 'anime', 'spanish' ];
        this.url = 'https://anizero.site';
    }
    async getnoonce() {
        let url = new URL(this.url);
        const request = new Request(url, this.requestOptions);
        const scriptPages = `
        new Promise(resolve => {
            resolve(js_global.search_nonce);
        });
        `;
        return await Engine.Request.fetchUI(request, scriptPages);
    }
    async _getMangas() {
        const noonce = await this.getnoonce();
        let mangaList = [];
        for (let page = 1, run = true; run; page++) {
            let mangas = await this._getMangasFromPage(page, noonce);
            mangas.length > 0 ? mangaList.push(...mangas) : run = false;
        }
        return mangaList;
    }
    async _getMangasFromPage(page, noonce) {
        let form = new URLSearchParams();
        form.append('search_nonce', noonce);
        form.append('action', 'show_animes_ajax');
        form.append('letra', '');
        form.append('paged', page);
        const body = form.toString();
        const url = new URL('/wp-admin/admin-ajax.php', this.url);
        const request = new Request(url, {
            method: 'POST',
            body: body,
            headers: {
                'x-origin': this.url,
                'x-referer': this.url,
                'Content-Type': 'application/x-www-form-urlencoded; charset=UTF-8',
                'X-Requested-With': 'XMLHttpRequest',
            }
        });
        const data = await this.fetchJSON(request);
        if (!data.animes) {
            return [];
        }
        return data.animes.map(element => {
            return {
                id: this.getRootRelativeOrAbsoluteLink(element.anime_permalink, request.url),
                title: element.anime_title.trim()
            };
        });
    }
    async _getChapters(manga) {
        let chapterslist = [];
        //get mangaid from page
        let request = new Request( new URL(manga.id, this.url), this.requestOptions );
        let data = await this.fetchDOM( request, 'link[rel="shortlink"]' );
        const mangaid = data[0].getAttribute('href').match(/\?p=(\d+)/)[1];
        let form = new URLSearchParams();
        form.append('action', 'show_videos');
        form.append('anime_id', mangaid);
        const body = form.toString();
        const url = new URL('/api', this.url);
        request = new Request(url, {
            method: 'POST',
            body: body,
            headers: {
                'x-origin': this.url,
                'x-referer': this.url,
                'Content-Type': 'application/x-www-form-urlencoded; charset=UTF-8',
                'X-Requested-With': 'XMLHttpRequest',
            }
        });
        //EPISODES
        let chapters = [];
        data = await this.fetchJSON(request);
        for (let i in data.episodios) {
            let element = data.episodios[i];
            chapters.push({
                id: this.getRootRelativeOrAbsoluteLink(element.epi_url, this.url),
                title : element.epi_num + ': '+element.epi_title.trim()
            });
        }
        chapterslist.push(...chapters);
        //OVAS
        chapters = [];
        for (let i in data.ovas) {
            let element = data.ovas[i];
            chapters.push({
                id: this.getRootRelativeOrAbsoluteLink(element.epi_url, this.url),
                title : '[OVA] '+ element.epi_num + ': '+element.epi_title.trim()
            });
        }
        chapterslist.push(...chapters);
        //FILMES
        chapters = [];
        for (let i in data.filmes) {
            let element = data.filmes[i];
            chapters.push({
                id: this.getRootRelativeOrAbsoluteLink(element.epi_url, this.url),
                title : '[FILM] '+ element.epi_num + ': '+element.epi_title.trim()
            });
        }
        chapterslist.push(...chapters);
        return chapterslist.reverse();
    }
    async _getPages(chapter) {
        let request = new Request(new URL(chapter.id, this.url), this.requestOptions);
        const script = `
        new Promise((resolve, reject) => {
            setTimeout(() => {
                try {
                    resolve(players_links);
                }
                catch(error) {
                    reject(error);
                }
            },
            3000);
        });
        `;
        let data = await Engine.Request.fetchUI(request, script);
        let videolink = Object.values(data)[0];
        //remove redirector
        if(videolink.match(/assistirFHD/)) {
            let tmp = new URL(videolink);
            videolink = decodeURI(tmp.searchParams.get("video"));
        }
        //if link is not already blogger
        if (!videolink.match(/blogger/)) {
            //fetch the dom returned by the link -its html=
            request = new Request(videolink, this.requestOptions);
            data = await this.fetchDOM( request, 'body');
            let ele = data[0].querySelectorAll('script');
            ele.forEach(node =>{
                if (node.text.match(/blogger/)) {
                    videolink = node.text.split("'").filter(el => el.match(/blogger/))[0];
                }
            });
        }
        if (!videolink.match(/blogger/)) {
            throw Error('Unsupported Video host : '+ videolink);
        }
        const vid = await new BloggerVideo(videolink).getStream();
        return {video: vid, subtitles: [] };
    }
}