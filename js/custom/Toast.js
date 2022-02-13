import anime from "../anime.js";

class Toast {

    constructor(msg) {
        this.el = document.createElement('div')
        this.el.classList.add('toast')
        this.el.innerText = msg
    }

    show() {
        document.body.appendChild(this.el)
        anime({
            targets: this.el,
            opacity: 1,
            duration: 2000,
            top: '10%',
            complete: () => {
                this.el.remove()
                // console.log(this.el.parentNode);
                // document.body.removeChild(this.el)
                // this.el.parentNode && this.el.parentNode.removeChild()
            }
        })
    }

}

export default Toast
