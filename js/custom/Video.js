import Mask from "./Mask.js";
import {TipsDialog} from "./Dialog2.js";

class Video extends Mask {

    constructor(url) {
        super()
        this.url = url
        this.#renderBaseContainer()
    }

    #renderBaseContainer() {
        super.renderBaseContainer()
        let videoContainer = document.createElement('div')
        videoContainer.className = 'video-container'
        let tool = document.createElement('div');
        tool.className = 'tool'
        this.timeLeft = document.createElement('span')
        this.timeLeft.className = 'time-left'
        this.timeLeft.innerText = ''
        this.closeBtn = document.createElement('img')
        this.closeBtn.src = './image/close.svg'
        this.closeBtn.className = 'close-btn'
        this.closeBtn.onclick = this.close.bind(this)
        this.video = document.createElement('video')
        this.video.src = this.url
        this.video.controls = false
        videoContainer.appendChild(this.video)
        tool.appendChild(this.timeLeft)
        tool.appendChild(this.closeBtn)
        videoContainer.appendChild(tool)
        this.baseContainer.appendChild(videoContainer)
        document.body.appendChild(this.baseContainer)
    }

    /**
     * 倒计时
     */
    #countdown() {
        this.countdownTime = Math.ceil(this.video.duration)
        this.countdownTimer = setInterval(() => {
            this.timeLeft.innerText = --this.countdownTime
        }, 1000)
        this.timer = setTimeout(() => {
            console.log(111);
            clearInterval(this.countdownTimer)
            this.success = true
            this.status = 1
            this.close()
        }, (this.countdownTime * 1000) + 500)
    }

    /**
     *
     * @returns {Promise<unknown>}
     */
    show() {
        this.video.oncanplay = (() => {
            this.video.play()
            this.#countdown()
        })
        return super.show()
    }

    close() {
        super.close()
        clearInterval(this.timer)
    }


}

export default Video
