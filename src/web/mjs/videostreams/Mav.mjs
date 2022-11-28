export default class Mav {
    constructor(originwebsite, url) {
        this._uri = new URL(url);
        this.hostname = this._uri.hostname;
        this.videoid = url.match(/\/v\/([\S]+)/)[1];
        this.website = originwebsite;
    }
    async getStream() {
        let uri = new URL('/api/source/'+this.videoid ,this._uri.origin);
        let body = {
            'r': this.website,
            'd': this.hostname,
        };
        const request = new Request(uri, {
            method: 'POST',
            body: JSON.stringify(body),
            headers: {
                'x-origin': this._uri.origin,
                'x-referer': this._uri,
                'Content-Type': 'application/x-www-form-urlencoded; charset=UTF-8',
                'X-Requested-With': 'XMLHttpRequest',
                'Alt-Used': this.hostname,
            }
        });
        const response = await fetch(request);
        let data = await response.json();
        return {
            file : data.data[0].file,
            type : data.data[0].type
        };
    }
}