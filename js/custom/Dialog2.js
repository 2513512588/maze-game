import anime from "../anime.js";
import {uuid} from "./Utils.js";

class Dialog2 {

    /**
     * Dialog 基类
     * @param callback 点击关闭按钮触发的回调
     */
    constructor(callback) {
        this.status = 0
        this.#generateMask()
        this.#generateContainer()
        this.node.querySelectorAll('.close-btn').forEach(item => {
            item.onclick = () => {
                if (this.status === 1)
                    this.close().then(callback && callback)
            }
        })
        this.uuid = uuid();
    }

    #generateMask() {
        this.mask = document.createElement('div')
        this.mask.id = 'dialog-mask'
    }

    /**
     * 将 Dialog 的基础 HTML 添加到 body
     */
    #generateContainer() {
        let template = `<div class="dialog_title">
        <span>提示</span>
        <div class="close-btn">
            <img src="./image/close.svg" width="25" height="25" alt="">
        </div>
    </div>
    <h3 class="dialog_content tips_content">提示消息</h3>`
        this.node = document.createElement('div')
        this.node.className = 'dialog'
        this.node.innerHTML = template
    }

    /**
     * 显示 Dialog
     * @param msg Dialog 展示的文字
     */
    open(msg = '提示消息') {
        document.body.appendChild(this.mask)
        document.body.appendChild(this.node)
        this.node.querySelector('.dialog_content').innerHTML = msg
        this.status = 1
        anime({
            targets: this.node,
            duration: 1000,
            opacity: 1,
            translateX: '-50%',
            translateY: '-50%',
            scale: 1.1
        })
        return this
    }

    /**
     *
     * @returns {Promise<unknown>}
     */
    close() {
        this.status = 0
        return new Promise((resolve) => {
            anime({
                targets: this.node,
                duration: 1000,
                easing: 'easeInOutExpo',
                scale: 0,
                opacity: 0,
                complete: () => {
                    this.mask.remove()
                    this.node.remove()
                    resolve()
                }
            })
        })
    }

}

class TipsDialog extends Dialog2 {

    /**
     * 提示 Dialog
     * @param buttons 按钮组 按钮的详细结构参考 <i>TipsDialog.#generateBtn</i>方法
     * @param callback 手动关闭 Dialog 的回调
     */
    constructor(buttons = [], callback) {
        super(callback)
        this.#renderBtnWrap()
        buttons.forEach(button => {
            this.#generateBtn(button).onclick = () => {
                if (this.status === 1)
                    if (button.isClose)
                        this.close().then(callback && callback)
                    else
                        this.close().then(button.callback && button.callback)
            }
        })
    }

    /**
     * 将按钮组渲染到 Dialog 的 DOM 对象中
     */
    #renderBtnWrap() {
        this.btnWrap = document.createElement('div')
        this.btnWrap.className = 'dialog-btn-wrap'
        this.node.appendChild(this.btnWrap)
    }

    /**
     * 将按钮 DOM 对象添加到按钮组的 DOM对象 中,并返回
     * @param button 按钮对象
     * <ul>
     *     <li>text(必须):按钮显示的文字</li>
     *     <li>callback:按下按钮执行的回调</li>
     *     <li>isClose:按钮按下只调用手动关闭 Dialog 的回调</li>
     * </ul>
     * @returns {HTMLButtonElement} 按钮的 DOM 对象
     */
    #generateBtn(button) {
        let btn = document.createElement('button')
        this.btnWrap.appendChild(btn)
        btn.innerText = button.text
        return btn
    }

}

export {
    TipsDialog
}