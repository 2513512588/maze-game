class Music {

    constructor(url) {
        this.music = new Audio(url)
        this.music.loop = true
    }

}

export default Audio