export default class BloggerVideo {

    constructor(url) {
        this._uri = new URL(url);
    }

    async getStream() {
        const script = `
            new Promise(resolve => {
                resolve(VIDEO_CONFIG);
            });
        `;
        const request = new Request(this._uri);
        let data = await Engine.Request.fetchUI(request, script);
        return data.streams[0].play_url;
    }
}