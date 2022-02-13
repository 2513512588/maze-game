class Progress {

    constructor(container) {
        this.container = container
    }

    render() {
        this.progressContainer = document.createElement("div")
        this.progressCss = document.createElement("link")
        this.progressCss.setAttribute('rel', 'stylesheet')
        this.progressCss.setAttribute('href', './css/progress.css')
        this.progressCss.setAttribute('type', 'text/css')
        document.body.appendChild(this.progressCss)
        this.container.appendChild(this.progressContainer)
    }

    /**
     *
     * @param percentage 百分比 0-1
     */
    onProgress(percentage) {
        let width = parseInt(this.progressContainer.querySelector('.full-progress-bar').style.width)
        if (percentage * 100 < width) {
            return
        }
        percentage = Math.min(1, percentage)
        this.progressContainer.querySelector('.full-progress-bar').style.width = percentage * 100 + "%"
    }

    /**
     * 隐藏进度条
     * @param timeout 延迟 ms 默认500ms
     */
    onLoad(timeout) {
        setTimeout(() => {
            this.progressContainer.remove()
            this.progressCss.remove()
        }, timeout || 500)
    }

}

class MiniProgress extends Progress {

    constructor(container) {
        super(container)
    }

    #render() {
        super.render()
        this.progressContainer.className = 'mini-progress-container'
        this.progressContainer.innerHTML = ''
    }

}

class FullProgress extends Progress {

    constructor(container = document.body) {
        super(container)
        this.#render()
    }

    #render() {
        super.render()
        this.progressContainer.className = 'full-progress-container'
        this.progressContainer.innerHTML = `<div>
        <div class="full-loading">
            <span>Loading</span><dot>...</dot>
        </div>
        <div class="full-progress full-progress-striped">
            <div class="full-progress-bar""></div>
        </div>
    </div>`
    }

}

export {
    MiniProgress, FullProgress
}
