import anime from "../anime.js";

class Guide {

    static container = []

    static taskList = []

    static #render() {
        let guide1 = document.createElement('div')
        guide1.className = 'guide'
        guide1.style.top = '20%'
        guide1.style.right = '20%'
        guide1.innerHTML = `<div class="guide_container">
        <p>按下键盘</p>
        <p><span>A,W,D,S(方向键)</span></p>
        <p>操纵小人</p>
    </div>`
        Guide.container.push(guide1)

        let guide2 = document.createElement('div')
        guide2.className = 'guide'
        guide2.style.left = '20%'
        guide2.style.top = '50%'
        guide2.innerHTML = `<div class="guide_container">
        <p>小人会朝指定的</p>
        <p>方向<span>一直行走</span></p>
        <p>直到撞到障碍物</p>
    </div>`
        Guide.container.push(guide2)
        document.body.appendChild(guide1)
        document.body.appendChild(guide2)
    }

    static show() {
        Guide.#render()
        Guide.taskList.push(Guide.#animation.bind(this, Guide.container[0]))
        Guide.taskList.push(Guide.#animation.bind(this, Guide.container[1]))
        Guide.taskList[0]()
    }

    static remove() {
        if (this.container.length > 0){
            Guide.taskList.push(Guide.#animation.bind(this, Guide.container[0], true))
            Guide.taskList.push(Guide.#animation.bind(this, Guide.container[1], true))
            if (Guide.taskList.length === 2) {
                Guide.taskList[0]()
            }
        }
    }

    static #animation(item, remove) {
        console.log(Guide.taskList);
        if (Guide.taskList.length === 0) {
            return
        }
        Guide.taskList.shift()
        let top = item.style.top
        item.style.top = remove ? (parseInt(top) + 5) : (parseInt(top) - 5) + '%'
        anime({
            top,
            targets: item,
            opacity: remove ? 0 : 1,
            duration: 1000,
            delay: 500,
            easing: 'linear',
            complete: () => {
                remove && item.remove()
                if (Guide.taskList.length > 0) {
                    Guide.taskList[0]()
                }
            }
        })
    }

}

export default Guide