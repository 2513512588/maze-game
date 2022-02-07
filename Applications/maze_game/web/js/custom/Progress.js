class Progress {

    constructor(container = document.body) {
        this.container = container
        this.#render()
    }

    #render() {
        this.progressContainer = document.createElement("div")
        this.progressContainer.className = 'full-progress-container'
        this.progressContainer.innerHTML = ` <div>
        <div class="full-loading">
            <span>Loading</span><dot>...</dot>
        </div>
        <div class="full-progress full-progress-striped">
            <div class="full-progress-bar""></div>
        </div>
    </div>`
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

export default Progress
