import anime from "../anime.js";
import config from './Config.js'

/**
 * 弹窗类
 */
class Dialog {

    constructor(classname, var1, var2) {
        this.classname = classname
        this.node = document.querySelector(classname)
        this.status = 0
        this.node.querySelectorAll('.close-btn').forEach(item => {
            item.onclick = () => {
                this.close()
            }
        })

        if (arguments.length === 2) {
            this.fn = var1
        } else if (arguments.length === 3) {
            this.fn = var2
            this.initDefaultDialog(var1)
        }
        if (!Dialog.dialogs) {
            Dialog.dialogs = []
        }
        Dialog.dialogs.push(this)
    }

    /**
     * 初始化关卡选择框
     * object {
     *     levelId 关卡id,
     *     star 星星数量
     * }
     */
    initLevelDialog(MAPS) {
        let GAME_RECORD = localStorage.getItem(config.LOC_KEY)
        if (GAME_RECORD) {
            try {
                GAME_RECORD = JSON.parse(GAME_RECORD)
            } catch (e) {
                localStorage.removeItem(config.LOC_KEY)
                this.initLevelDialog(MAPS)
            }
        } else {
            GAME_RECORD = {
                level: 0,
                point: [],
                skin: config.MODEL.DEFAULT.id
            }
        }

        let selfStarred = 0
        let selfAllStar = 0
        let customStarred = 0
        let customAllStar = 0


        // 通过关卡渲染星星


        let selfLevelContainer = document.querySelectorAll('.level-dialog .main .self .levelList-container')
        selfLevelContainer.forEach(item => {
            item.innerHTML = ''
            item.classList.remove('active')
        })

        let subsectionWrap = document.querySelectorAll('.level-dialog .main .level-subsection')

        let customLevelContainer = document.querySelector('.level-dialog .main .custom .levelList-container')
        customLevelContainer.innerHTML = ''

        subsectionWrap.forEach(function (item, index) {
            item.classList.remove('active')
            item.onclick = function () {
                subsectionWrap.forEach(item => {
                    item.classList.remove('active')
                })
                item.classList.add('active')
                selfLevelContainer.forEach(item => {
                    item.classList.remove('active')
                })
                selfLevelContainer[index].classList.add('active')
            }
        })

        subsectionWrap[Math.floor(GAME_RECORD.level / 4)].classList.add('active')
        selfLevelContainer[Math.floor(GAME_RECORD.level / 4)].classList.add('active')

        Object.keys(config.MAP_TYPE).forEach(key => {
            MAPS.filter(item => item.type === config.MAP_TYPE[key]).forEach((item, index) => {
                let find = GAME_RECORD.point.find(el => el.levelId === item.id)
                let star = 0
                if (find) {
                    star = find.star
                }
                if (config.MAP_TYPE[key] === 1) {
                    let container = selfLevelContainer[Math.floor(index / 4)]
                    if (item.level <= GAME_RECORD.level || config.MAP_TYPE[key] === config.MAP_TYPE.CUSTOM) {
                        generateClearedLevel(index + 1, star, container)
                        selfStarred += star
                    } else {
                        generateClearedFail(container)
                    }
                    selfAllStar += 3
                } else if (config.MAP_TYPE[key] === 2) {
                    generateClearedLevel(index + 1, star, customLevelContainer)
                    customStarred += star
                    customAllStar += 3
                }
            })
        })

        document.querySelector('.self .star_total').innerHTML = selfAllStar
        document.querySelector('.self .star_obtained').innerHTML = selfStarred
        document.querySelector('.custom .star_total').innerHTML = customAllStar
        document.querySelector('.custom .star_obtained').innerHTML = customStarred

        document.querySelectorAll('.levelList-container .level').forEach((item, index) => {
            if (item.classList.contains('level_cleared')) {
                item.onclick = e => {
                    this.close().then(() => {
                        this.fn && this.fn(index)
                    })
                }
            }
        })

        /**
         * @param levelNum 关卡数
         * @param starNum 获得的星星
         * @param container 容器
         */
        function generateClearedLevel(levelNum, starNum, container) {
            let div = document.createElement('div')
            div.classList.add('level', 'level_cleared')
            div.innerHTML += `<span class="levelNum">${levelNum}</span>`
            let starWrap = document.createElement('div')
            starWrap.classList.add('star-wrap')
            for (let i = 0; i < 3; i++) {
                if (i < starNum) {
                    starWrap.innerHTML += `<img width="20" height="20" src="./image/star-fill.svg" alt="">`
                } else {
                    starWrap.innerHTML += `<img width="20" height="20" src="./image/star.svg" alt="">`
                }
            }
            div.appendChild(starWrap)
            container.appendChild(div)
        }

        function generateClearedGift(container) {
            let div = document.createElement('div')
            div.classList.add('level', 'level_gift')
            div.innerHTML = `<img width="50" height="50" src="./image/gift.svg" alt="">`
            container.appendChild(div)
        }

        function generateClearedFail(container) {
            let div = document.createElement('div')
            div.classList.add('level', 'level_fail')
            div.innerHTML = `<img width="50" height="50" src="./image/lock.svg" alt="">`
            container.appendChild(div)
        }

        localStorage.setItem(config.LOC_KEY, JSON.stringify(GAME_RECORD))
    }

    initSkinDialog(level, skin) {
        let skinImageWrap = document.querySelector('.skin_image_wrap')
        let skinImage = skinImageWrap.querySelectorAll('.skin')
        let distance = parseInt(getComputedStyle(skinImageWrap).width)

        let skinImageConfig = Array.from(skinImage).map(item => {
            return {
                name: item.dataset.name,
                level: parseInt(item.dataset.level),
                id: item.id
            }
        })

        let current = 0
        if (skin) {
            current = skinImageConfig.map(item => item.id).indexOf(skin)
        }

        let useBtn = document.querySelector('.skin-dialog .use_btn')
        let skinTitle = document.querySelector('.skin-dialog .skin_title')


        let changeBtnGroup = document.querySelectorAll('.skin_wrap>img')
        changeBtnGroup.forEach((item, index) => {
            item.onclick = e => {
                if (index === 0 && current > 0) {
                    current--
                } else if (index === 1 && current < skinImage.length - 1) {
                    current++
                }
                animeMove(-(current * distance))
            }
        })

        useBtn.onclick = e => {
            this.close()
            skin = skinImageConfig[current].id
            changeSkin()
            this.fn && this.fn(skinImageConfig[current].id)
        }

        function animeMove(translateX) {
            anime({
                targets: '.skin_image_wrap',
                translateX,
                duration: 600,
            })
            changeSkin()

            current === 0 ? changeBtnGroup[0].classList.add('disabled') : changeBtnGroup[0].classList.remove('disabled')
            current === skinImage.length - 1 ? changeBtnGroup[1].classList.add('disabled') : changeBtnGroup[1].classList.remove('disabled')
        }

        animeMove(-(current * distance))

        function changeSkin() {
            if (skinImageConfig[current].id === skin) {
                useBtn.disabled = true
                useBtn.innerText = '正在使用'
            } else {
                if (level >= skinImageConfig[current].level) {
                    useBtn.disabled = false
                    useBtn.innerText = '使用'
                } else {
                    useBtn.disabled = true
                    useBtn.innerText = skinImageConfig[current].level + '关解锁'
                }
            }
            skinTitle.innerText = skinImageConfig[current].name
        }
    }

    initDefaultDialog(classname) {
        this.node.querySelector(classname).onclick = e => {
            this.close()
            this.fn && this.fn()
        }
    }

    initSettingsDialog() {
        document.querySelectorAll('.switch_btn').forEach(item => {
            item.onclick = function () {
                this.setAttribute('mode', this.getAttribute('mode') === 'on' ? 'off' : 'on')
            }
        })
    }

    open(msg) {
        if (msg) {
            this.node.querySelector('.dialog_content').innerHTML = msg
        }
        this.status = 1
        anime({
            targets: this.classname,
            duration: 1000,
            opacity: 1,
            translateX: '-50%',
            translateY: '-50%',
            scale: 1.1
        })
    }

    close() {
        this.status = 0
        return new Promise((resolve) => {
            anime({
                targets: this.classname,
                duration: 1000,
                easing: 'easeInOutExpo',
                scale: 0,
                opacity: 0,
                complete: () => {
                    resolve()
                }
            })
        })
    }


}

export default Dialog
