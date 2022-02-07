import anime from "../anime.js";

class Bubble {

    static taskList = []

    static #render() {
        Bubble.container = document.createElement('div')
        document.body.appendChild(this.container)
        this.container.className = 'bubble'
        this.container.style.top = '20%'
        this.container.style.right = '20%'

        let containerDiv = document.createElement('div')
        containerDiv.className = 'bubble-container'
        containerDiv.style.height = this.contents.length * 48 + 'px'
        this.contents.forEach(item => {
            containerDiv.innerHTML += `<p>${item}</p>`
        })
        this.container.appendChild(containerDiv)

        anime({
            targets: this.container,
            opacity: 1,
            duration: 1000,
            delay: 500,
            easing: 'linear',
            complete: () => {
                Bubble.taskList[0]()
            }
        })
    }

    static show(contents) {
        Bubble.contents = contents
        Bubble.#render()
        Bubble.container.querySelectorAll('p').forEach(item => {
            Bubble.taskList.push(Bubble.#animation.bind(this, item))
        })
    }

    static remove() {
        if (Bubble.container) {
            Bubble.taskList.push(Bubble.#destroy.bind(this))
            if (Bubble.taskList.length === 1) {
                Bubble.taskList[0]()
            }
        }
    }

    static #destroy () {
        anime({
            targets: Bubble.container,
            top: '25%',
            opacity: 0,
            duration: 1000,
            delay: 500,
            easing: 'linear',
            complete: () => {
                this.container.remove()
            }
        })
    }

    static #animation(item) {
        if (Bubble.taskList.length === 0) {
            return
        }
        Bubble.taskList.shift()
        anime({
            top: '0',
            targets: item,
            opacity: 1,
            duration: 1000,
            delay: 500,
            easing: 'linear',
            complete: () => {
                if (Bubble.taskList.length > 0) {
                    Bubble.taskList[0]()
                }
            }
        })
    }


}

export default Bubble