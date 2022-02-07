import {TipsDialog} from "./Dialog2.js";
import {Game} from "./Game.js";


class Mask {

    constructor() {
        this.success = false
        this.status = 0
    }

    /**
     * 将基础容器渲染到 body
     */
    renderBaseContainer() {
        this.baseCss = document.createElement('link')
        this.baseCss.href = './css/mask.css'
        this.baseCss.rel = `stylesheet`
        this.baseCss.type = `text/css`
        this.baseContainer = document.createElement('div')
        this.baseContainer.id = 'mask-base-container'
        let tool = document.createElement('div')
        tool.className = 'tool'
        this.closeBtn = document.createElement('img')
        this.closeBtn.src = './image/close.svg'
        this.closeBtn.className = 'close-btn'
        this.closeBtn.onclick = this.close.bind(this)
        tool.appendChild(this.closeBtn)
        this.baseContainer.appendChild(tool)
        document.body.appendChild(this.baseCss)
        document.body.appendChild(this.baseContainer)
    }

    /**
     *
     * @returns {Promise<unknown>}
     */
    show() {
        return new Promise((resolve, reject) => {
            this.resolve = resolve
            this.reject = reject
        })
    }

    /**
     *  关闭遮罩
     */
    close() {

        const removeDom = (call = true) => {
            this.baseCss.remove()
            this.baseContainer.remove()
            call && (this.success ? this.resolve && this.resolve() : this.reject && this.reject())
        }

        if (this.status === 0) {
            this.dialog = new TipsDialog([{
                text: '确定退出', isClose: true
            }, {
                text: '重新选择',
                callback: ()=>{
                    this.dialog.close().then(() =>{
                        removeDom(false)
                        Game.gameOverDialog.open('游戏失败,选择复活方式')
                    })
                }
            }], removeDom).open('中途退出无法成功复活哦')
        } else {
            if (this.dialog) {
                this.dialog.close().then(removeDom)
            } else {
                removeDom()
            }
        }

    }
}

export default Mask
