import config from './Config.js'
import anime from '../anime.js'
import Factory from "./Factory.js";
import {coverMapPos, coverRealPos} from "./Utils.js";
import {TWEEN} from "../tween.module.min.js";


class Sphere {

    constructor(scene, skin, position, callback) {
        if (!scene) {
            throw '请传入场景对象'
        }
        this.dir = config.SPIRIT.DIR.NONE
        this.speed = .5
        //每个格子60ms
        this.speedBlock = 60
        this.clock = new THREE.Clock()

        /**
         * 人物面向方向
         * @type {number}
         */
        this.currentDir = config.SPIRIT.DIR.DOWN

        this.updateSkin(skin, scene).then(() =>{
            this.initModelParams(position)
            callback && callback()
        })

    }

    /**
     * 构建闪电小子
     */
    initSonic() {
        this.self = Factory.getModel(config.MODEL.SONIC.id)

        //0 行走 1 跑 2 滚动 3 喘气 4 戳鞋子 5 东看西看
        let action = {
            index: 4,
            count: 0,
            speed: [1, 2, 1, 1, 1]
        }

        this.self.animations.forEach((clip) => {
            let mixer = new THREE.AnimationMixer(this.self);
            mixer.clipAction(clip).play();
            this.animations.push(mixer)
        });

        this.animationTask = function () {
            let delta = this.clock.getDelta();
            // 重复播放动画
            if (this.dir === config.SPIRIT.DIR.NONE) {
                action.count++
                //从跑变成走
                if (action.count >= 100 && action.index === 1) {
                    action.index = 0
                    //从走变成停
                } else if (action.count >= 300 && action.index === 0) {
                    action.index = 4
                }
            } else {
                action.count = 0
                action.index = 1
            }
            this.animations[action.index].update(delta * action.speed[action.index])
        }.bind(this)

    }

    /**
     * 构建小伙子
     */
    initStewart() {
        this.self = Factory.getModel(config.MODEL.STEWART.id)

        // this.self.scale.set(.008, .008, .008)
        // this.self.position.y = -.5

        //隐藏底部
        // setChildHidden(this.self.children, 'pPlane1')
        //隐藏多出来的头
        // setChildHidden(this.self.children, 'stw_rig_all_grp')
        this.self.getObjectByName('pPlane1').visible = false
        this.self.getObjectByName('stw_rig_all_grp').visible = false

        // function setChildHidden(children, name) {
        //     for (let i = 0; i < children.length; i++) {
        //         if (children[i].name === name) {
        //             children[i].visible = false
        //             return
        //         } else {
        //             setChildHidden(children[i].children, name)
        //         }
        //     }
        // }

        //0 跑 1 行走
        let action = {
            index: 1,
            count: 0,
            speed: [2, 2]
        }

        this.self.animations.forEach((clip) => {
            let mixer = new THREE.AnimationMixer(this.self);
            mixer.clipAction(clip).play();
            this.animations.push(mixer)
        });

        this.animationTask = function () {
            let delta = this.clock.getDelta();
            // 重复播放动画
            if (this.dir === config.SPIRIT.DIR.NONE) {
                action.count++
                //从跑变成走
                if (action.count >= 100 && action.index === 0) {
                    action.index = 1
                    //从走变成停
                }
            } else {
                action.count = 0
                action.index = 0
            }
            this.animations[action.index].update(delta * action.speed[action.index])
        }.bind(this)

    }

    /**
     * 构建默认模型
     */
    initDefault() {
        let action = {
            multiple: 1,
            count: 0
        }
        let mixer = new THREE.AnimationMixer(this.self);
        mixer.clipAction(this.self.animations[0]).play();
        this.animations.push(mixer)
        this.animationTask = function () {
            let delta = this.clock.getDelta();
            if (this.dir === config.SPIRIT.DIR.NONE) {
                action.count++
                if (action.count >= 100) {
                    action.multiple = 1
                }
            } else {
                action.count = 0
                action.multiple = 3
            }
            this.animations[0].update(delta * action.multiple)
        }.bind(this)
    }


    initModelParams(position) {
        this.self.position.x = position.x
        this.self.position.z = position.z
        this.box = new THREE.Box3();
        this.centerPoint = new THREE.Vector3(this.self.position.x, this.self.position.y, this.self.position.z)
        this.boxSize = new THREE.Vector3(config.BLOCK_SIZE, config.BLOCK_SIZE, config.BLOCK_SIZE)
        this.box.setFromCenterAndSize(this.centerPoint, this.boxSize);
        // var helper1 = new THREE.Box3Helper( this.box, 0xffff00 );
        // scene.add( helper1 );
    }

    updateSkin(skin, scene) {
        return new Promise(resolve => {
            this.skin = skin
            if (Factory.container[skin]){
                this.#renderSkin(scene)
                resolve()
            }else {
                let skinKey = Object.keys(config.MODEL).find(key => config.MODEL[key].id === this.skin)
                Factory.preload(() =>{
                    this.#renderSkin(scene)
                    resolve()
                }, [Factory.buildModel(config.MODEL[skinKey])])
            }
        })
    }

   #renderSkin(scene){
        this.animations = []
        let position = null

        if (this.self) {
            position = this.self.position
            scene.remove(this.self)
        }
        //闪电小子
        if (this.skin === config.MODEL.SONIC.id) {
            this.initSonic()
            //骷髅人
        } else if (this.skin === config.MODEL.DEFAULT.id) {
            this.self = Factory.getModel(this.skin)
            // this.self.scale.set(.2, .2, .2)
            this.self.position.y = -.5
            this.initDefault()
            //怪兽
        } else if (this.skin === config.MODEL.MONSTER.id) {
            this.self = Factory.getModel(this.skin)
            // this.self.scale.set(.5, .5, .5)
            // this.self.position.y = -.5
            this.initDefault()
            // 僵尸
        } else if (this.skin === config.MODEL.ZOMBIE.id) {
            this.self = Factory.getModel(this.skin)
            // this.self.scale.set(.4, .4, .4)
            this.self.position.y = -.5
            this.initDefault()
            //小浣熊
        } else if (this.skin === config.MODEL.RACOON.id) {
            this.self = Factory.getModel(this.skin)
            // this.self.scale.set(.6, .6, .6)
            this.self.position.y = -.5
            this.initDefault()
            //小伙子
        } else if (this.skin === config.MODEL.STEWART.id) {
            this.initStewart()
        } else {
            this.self = Factory.getModel(this.skin)
            this.initDefault()
        }
        if (position) {
            this.self.position.set(position.x, position.y, position.z)
        }

        this.rotateDir(this.currentDir)

        // 示例化 Tween对象，并传入一个需要处理的 对象（position）
        this.tween = new TWEEN.Tween(this.self.position);
        // 在1000ms 内position.x 的值增加100
        // this.tween.easing(TWEEN.Easing.Quartic.In);

        this.tween.onStart(pos => {
            this.moveOnStart && this.moveOnStart(pos)
        })

        this.tween.onUpdate(pos => {
            for (let i = this.tempMove.length - 1; i >= 0; i--) {
                let item = this.tempMove[i]
                if (this.dir === config.SPIRIT.DIR.LEFT) {
                    if (pos.x <= item.x) {
                        this.moveOnUpdate && this.moveOnUpdate(item)
                        this.tempMove.splice(i, 1)
                    }
                } else if (this.dir === config.SPIRIT.DIR.RIGHT) {
                    if (pos.x >= item.x) {
                        this.moveOnUpdate && this.moveOnUpdate(item)
                        this.tempMove.splice(i, 1)
                    }
                } else if (this.dir === config.SPIRIT.DIR.UP) {
                    if (pos.z <= item.z) {
                        this.moveOnUpdate && this.moveOnUpdate(item)
                        this.tempMove.splice(i, 1)
                    }
                } else if (this.dir === config.SPIRIT.DIR.DOWN) {
                    if (pos.z >= item.z) {
                        this.moveOnUpdate && this.moveOnUpdate(item)
                        this.tempMove.splice(i, 1)
                    }
                }
            }
        });

        this.tween.onComplete(() => {
            this.currentDir = this.dir
            this.dir = config.SPIRIT.DIR.NONE
            this.moveOnComplete && this.moveOnComplete()
        })

        scene.add(this.self)
    }


    move(callback, distance) {
        if (this.dir !== config.SPIRIT.DIR.NONE) {
            if (this.dir === config.SPIRIT.DIR.LEFT) {
                this.self.position.x -= distance || this.speed
            } else if (this.dir === config.SPIRIT.DIR.RIGHT) {
                this.self.position.x += distance || this.speed
            } else if (this.dir === config.SPIRIT.DIR.UP) {
                this.self.position.z -= distance || this.speed
            } else if (this.dir === config.SPIRIT.DIR.DOWN) {
                this.self.position.z += distance || this.speed
            }
            callback && callback()
        }
    }

    /**
     * 传入要移动的位置 真实坐标
     * @param realPos
     */
    moveToPos(realPos){

        this.rotateDir(this.dir)

        // 获取精灵的 position 属性
        let position = this.self.position;

        this.tempMove = []

        if (this.dir === config.SPIRIT.DIR.LEFT || this.dir === config.SPIRIT.DIR.RIGHT) {
            if (this.dir === config.SPIRIT.DIR.LEFT) {
                for (let i = position.x; i >= realPos.x; i--) {
                    this.tempMove.push({
                        x: i,
                        z: realPos.z
                    })
                }
            } else if (this.dir === config.SPIRIT.DIR.RIGHT) {
                for (let i = position.x; i <= realPos.x; i++) {
                    this.tempMove.push({
                        x: i,
                        z: realPos.z
                    })
                }
            }
        } else if (this.dir === config.SPIRIT.DIR.UP || this.dir === config.SPIRIT.DIR.DOWN) {
            if (this.dir === config.SPIRIT.DIR.UP) {
                for (let i = position.z; i >= realPos.z; i--) {
                    this.tempMove.push({
                        x: realPos.x,
                        z: i
                    })
                }
            } else if (this.dir === config.SPIRIT.DIR.DOWN) {
                for (let i = position.z; i <= realPos.z; i++) {
                    this.tempMove.push({
                        x: realPos.x,
                        z: i
                    })
                }
            }
        }

        this.tween.to(realPos, this.tempMove.length * this.speedBlock)

        this.tween.start()
    }

    /**
     * 1 left 2 right 3 up 4 down
     * @param map
     * @param nameSpace
     */
    moveTween(map, nameSpace) {

        let nextPos = this.nextPos(map, nameSpace)

        this.moveToPos(nextPos.realPos)

    }

    rotateDir(dir){
        if (dir === config.SPIRIT.DIR.LEFT) {
            this.self.rotation.y = -Math.PI / 2
        } else if (dir === config.SPIRIT.DIR.RIGHT) {
            this.self.rotation.y = Math.PI / 2
        } else if (dir === config.SPIRIT.DIR.DOWN) {
            this.self.rotation.y = 0
        } else if (dir === config.SPIRIT.DIR.UP) {
            this.self.rotation.y = Math.PI
        }
    }

    /**
     * 1 left 2 right 3 up 4 down
     * @param map
     * @param namespace 真实坐标的映射关系
     * return 移动的结果真实坐标
     *
     */
    nextPos(map, namespace) {
        // 初始地图坐标
        let mapPos = coverMapPos(namespace, {
            x: this.self.position.x,
            z: this.self.position.z
        })
        if (this.dir === config.SPIRIT.DIR.LEFT) {
            //移动到礼物穿透
            for (let i = mapPos.x; i >= 0; i--) {
                if (!canMove(i, mapPos.z)) {
                    let result = {
                        x: map[mapPos.z][i] === config.GIFT ? i : i + 1,
                        z: mapPos.z
                    }
                    return {
                        mapPos: result,
                        realPos: coverRealPos(namespace, result)
                    }
                }
            }
        } else if (this.dir === config.SPIRIT.DIR.RIGHT) {
            for (let i = mapPos.x; i < map[mapPos.z].length; i++) {
                if (!canMove(i, mapPos.z)) {
                    let result = {
                        x: map[mapPos.z][i] === config.GIFT ? i : i - 1,
                        z: mapPos.z
                    }
                    return {
                        mapPos: result,
                        realPos: coverRealPos(namespace, result)
                    }
                }
            }
        } else if (this.dir === config.SPIRIT.DIR.UP) {
            for (let i = mapPos.z; i >= 0; i--) {
                if (!canMove(mapPos.x, i)) {
                    let result = {
                        x: mapPos.x,
                        z: map[mapPos.z][i] === config.GIFT ? i : i + 1,
                    }
                    return {
                        mapPos: result,
                        realPos: coverRealPos(namespace, result)
                    }
                }
            }
        } else if (this.dir === config.SPIRIT.DIR.DOWN) {
            for (let i = mapPos.z; i < map.length; i++) {
                if (!canMove(mapPos.x, i)) {
                    let result = {
                        x: mapPos.x,
                        z: map[mapPos.z][i] === config.GIFT ? i : i - 1,
                    }
                    return {
                        mapPos: result,
                        realPos: coverRealPos(namespace, result)
                    }
                }
            }
        }

        function canMove(x, z) {
            try {
                // 支持移动到 -1 0 'self' [] 2礼物
                return map[z][x] < config.COLUMN || map[z][x] === config.GIFT || map[z][x] === 'self' || typeof map[z][x] === 'object'
            } catch (e) {
                return false
            }
        }

    }


    /**
     * 碰撞检测
     * @param obstacles
     * @param spirit
     * @returns {{obj}|{obj: *, index: number}}
     */
    hitTest(obstacles, spirit) {
        if (this.dir !== config.SPIRIT.DIR.NONE) {
            for (let i = 0; i < obstacles.length; i++) {
                let x = this.self.position.x
                let z = this.self.position.z
                if (Number.isInteger(x) && Number.isInteger(z)) {
                    if (this.dir === config.SPIRIT.DIR.LEFT) {
                        x = this.self.position.x - 1
                    } else if (this.dir === config.SPIRIT.DIR.RIGHT) {
                        x = this.self.position.x + 1
                    } else if (this.dir === config.SPIRIT.DIR.UP) {
                        z = this.self.position.z - 1
                    } else if (this.dir === config.SPIRIT.DIR.DOWN) {
                        z = this.self.position.z + 1
                    }

                    this.centerPoint.set(x, 0, z)
                    this.box.setFromCenterAndSize(this.centerPoint, this.boxSize);

                    if (obstacles[i].self.box.containsBox(this.box)) {
                        return {
                            index: i,
                            obj: obstacles[i].self
                        }
                    }
                }
                for (let i = 0; i < spirit.length; i++) {
                    let item = spirit[i]
                    if (this !== item) {
                        item.centerPoint.set(item.self.position.x, 0, item.self.position.z)
                        item.box.setFromCenterAndSize(item.centerPoint, item.boxSize);
                        if (this.box.containsBox(item.box)) {
                            return {
                                obj: item
                            }
                        }
                    }
                }
            }
        }
    }


    animeHit(dir) {
        // let params = {
        //     targets: this.self.scale,
        //     easing: 'easeInOutSine',
        //     direction: 'alternate',
        //     loop: 4,
        //     duration: 75,
        //     complete: () => {
        //         this.self.scale.set(1, 1, 1)
        //     }
        // }
        // if (dir) {
        //     params[dir] = .7
        // } else {
        //     if (this.dir === 1 || this.dir === 2) {
        //         params.x = .7
        //         params.z = .9
        //     } else if (this.dir === 3 || this.dir === 4) {
        //         params.z = .7
        //         params.x = .9
        //     }
        // }
        // anime(params)
    }

    /*
     * 游戏胜利的动画
     */
    animeWin() {
        return new Promise((resolve, reject) => {
            // this.self.material.color.set('#f18123')
            // this.self.material.emissive.set('#f18123')
            let originY = this.self.position.y
            anime({
                targets: this.self.position,
                easing: 'easeInOutSine',
                direction: 'alternate',
                loop: 4,
                duration: 120,
                y: .4,
                complete: () => {
                    this.self.position.y = originY
                    resolve && resolve()
                }
            })
            // this.animeHit('y')
        })
    }


}

export {
    Sphere
}
