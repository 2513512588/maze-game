import {Obstacle} from './Obstacle.js'
import config from "./Config.js";
import {Sphere} from "./Sphere.js";

import {coverMapPos, coverRealPos, random} from './Utils.js'
import anime from "../anime.js";


import Dialog from './Dialog.js'
import {TipsDialog} from './Dialog2.js'
import Video from './Video.js'
import Question from './Question.js'
import Map from "./Map.js";
import {TrackballControls} from "../TrackballControls.js";
import Factory from "./Factory.js";
import {TWEEN} from "../tween.module.min.js";
import Toast from "./Toast.js";


/**
 * paused 游戏暂停让玩家操作
 * gameOver 游戏暂停
 */
class Game {

    static gameOverDialog

    constructor(callback) {

    }


    startup(options = {}) {
        this.stats = options.stats

        this.progressBar = document.querySelector('.progress-bar>div')
        this.sceneContainer = document.getElementById('scene')
        this.swithBtn = document.querySelectorAll('.switch_btn')
        /**
         * 1 计步 2 计时
         * @type {number}
         */
        this.mode = 1


        //修改皮肤提示框
        this.skinDialog = new Dialog('.skin-dialog', skin => {
            this.spirit.forEach(sphere => {
                sphere.skin = this.GAME_RECORD.skin = skin
                sphere.updateSkin(this.scene)
            })
            localStorage.setItem(config.LOC_KEY, JSON.stringify(this.GAME_RECORD))
        })

        // 游戏关卡提示框
        this.levelDialog = new Dialog('.level-dialog', level => {
            this.load(level)
        })

        //游戏失败提示框
        this.tipsDialog = new Dialog('.tips-dialog', '.replay_btn', () => {
            this.load(this.level)
        })

        const gameContinues = () => {
            this.load(this.level)
            new TipsDialog([{text: '确定'}]).open("复活成功")
        }

        const gameOver = (flag) => {
            this.load(this.GAME_RECORD.level)
            flag || new TipsDialog([{text: '确定'}]).open("复活失败")
        }

        Game.gameOverDialog = new TipsDialog([{
            text: '看广告',
            callback() {
                new Video(config.CDN_URL_PREFIX + 'video/ad.mp4').show().then(gameContinues).catch(gameOver)
            }
        }, {
            text: '答题',
            callback() {
                new Question().show().then(gameContinues).catch(gameOver)
            }
        }, {
            text: '重新开始', isClose: true
        }], () => {
            gameOver(true)
        })


        //游戏模式提示框
        this.settingsDialog = new Dialog('.settings-dialog', '.save_btn', () => {
            if (this.progress[0] !== this.progress[1]) {
                this.messageDialog.open('游戏已经开始无法修改模式')
            } else {
                if (this.swithBtn[0].getAttribute('mode') === 'on') {
                    if (this.timer) {
                        clearInterval(this.timer)
                        this.mode = 1
                    }
                } else {
                    this.timer = window.setInterval(() => {
                        if (!this.gameOver && !this.paused) {
                            this.updateProgress()
                        }
                        if (this.gameOver) {
                            clearInterval(this.timer)
                            this.timer = null
                        }
                    }, 200)
                    this.mode = 2
                }
                if (this.swithBtn[1].getAttribute('mode') === 'on') {
                    import('./Game.js').then(modules => {
                        new modules.Game().startup(options)
                    })
                } else {
                    import('./GamePerspective.js').then(modules => {
                        new modules.GamePerspective().startup(options)
                    })
                }
            }
        })
        this.settingsDialog.initSettingsDialog()

        //消息提示框
        this.messageDialog = new Dialog('.message-dialog')

        this.MAP_OBJ = new Map()


        this.initListener()
        this.load()

        window.addEventListener('resize', this.onWindowResize.bind(this));
    }


    /**
     * 加载游戏
     * @param level
     */
    load(level) {

        this.starArr = document.querySelectorAll('.status-bar>img')

        // 精灵数组
        this.spirit = []

        this.MAPS = this.MAP_OBJ.getMap()

        for (let i = 0; i < 3 - this.starArr.length; i++) {
            let star = new Image()
            star.src = './image/star.png'
            document.querySelector('.status-bar').appendChild(star)
        }

        this.levelDialog.initLevelDialog(this.MAPS)
        this.GAME_RECORD = JSON.parse(localStorage.getItem(config.LOC_KEY))
        this.skinDialog.initSkinDialog(this.GAME_RECORD.level, this.GAME_RECORD.skin)

        this.sceneContainer.innerHTML = ''
        this.level = level !== undefined ? level : this.GAME_RECORD.level
        this.animates = []
        this.addTask(() => {
            TWEEN.update()
        })

        this.CURRENT_MAP = this.MAPS[this.level]
        this.MAPS_MATRIX = this.CURRENT_MAP.matrix
        this.MAPS_POSITION = this.CURRENT_MAP.position
        this.progress = [this.CURRENT_MAP.value, this.CURRENT_MAP.value]

        //完全不知道放在这里干嘛
        this.updateProgress(this.progress[1])

        this.gameOver = false
        this.paused = true
        this.MAP_POS_NAME = []
        this.obstacles = []
        this.floorList = []


        this.initScene()

    }

    initScene(preview) {
        //释放资源
        if (this.scene) {
            this.scene.traverse(child => {
                child.geometry && child.geometry.dispose();
                child.material && child.material.dispose();
                child.clear();
            })
            this.renderer.renderLists.dispose();
            this.renderer.dispose();
            this.renderer.forceContextLoss();
            this.renderer.domElement = null;
            this.renderer.content = null;
            this.renderer = null;
            THREE.Cache.clear();
        }

        this.scene = new THREE.Scene();
        this.camera = new THREE.PerspectiveCamera(115, window.innerWidth / window.innerHeight, 0.1, 1000);
        this.camera.position.set(0, 7, 2)
        this.camera.rotateX(-1.4);
        this.renderer = new THREE.WebGLRenderer({
            antialias: true,
            alpha: true
        });

        let spotLight = new THREE.SpotLight(0xffffff);
        // spotLight.position.set(0, 3000, 100);
        spotLight.position.z = 10
        spotLight.position.y = 113000

        spotLight.castShadow = true;

        // spotLight.shadow.mapSize.width = 11024;
        // spotLight.shadow.mapSize.height = 1024;

        spotLight.shadow.camera.near = 500;
        spotLight.shadow.camera.far = 4000;
        spotLight.shadow.camera.fov = 30;

        this.scene.add(spotLight);


        let pointLight = new THREE.PointLight("#eee");
        pointLight.position.set(15, 30, 10);

        //告诉平行光需要开启阴影投射
        pointLight.castShadow = true;

        this.scene.add(pointLight)


        // const axesHelper = new AxesHelper(500)
        // const gridHelper = new GridHelper(400, 400, 'rgb(200, 200, 200)', 'rgb(100, 100, 100)')
        // gridHelper.position.x = -config.BLOCK_SIZE / 2
        // gridHelper.position.z = -config.BLOCK_SIZE / 2
        // this.scene.add(axesHelper)
        // this.scene.add(gridHelper)
        //
        // const cameraHelper = new THREE.CameraHelper(this.camera)
        // this.scene.add(cameraHelper)

        //渲染地图
        this.renderMap(true)

        if (!preview) {
            //加载外景

            let environment = Factory.container[config.MODEL.ENVIRONMENT.id]
            environment.scale.set(1.8 + (this.MAPS_MATRIX[0].length - 9) * .15, 1.8, 1.8)
            environment.position.x = 5.9 + (this.MAPS_MATRIX[0].length - 9) * .4
            // environment.position.x = 6
            environment.position.z = -14
            environment.position.y = 4.2
            this.clock = new THREE.Clock()
            let mixer = new THREE.AnimationMixer(environment);
            mixer.clipAction(environment.animations[0]).play();

            this.addTask(() => {
                let delta = this.clock.getDelta();
                mixer.update(delta)
            })
            this.scene.add(environment)
            if (!localStorage.getItem(config.INIT_KEY)) {
                this.animeSceneStart()
                localStorage.setItem(config.INIT_KEY, 'true')
            } else {
                this.animeGameStart()
            }
        } else {
            // 开场动画
            this.animeGameStart()
        }


        this.renderer.setClearColor('rgb(245,158,158)', 1.0);


        this.MAPS_POSITION && this.generateSpirit({
            z: this.MAPS_POSITION[0],
            x: this.MAPS_POSITION[1],
        })


        this.renderer.setSize(window.innerWidth, window.innerHeight);
        this.sceneContainer.appendChild(this.renderer.domElement);

        // 视角控制器
        this.controls = new TrackballControls(this.camera, this.renderer.domElement);
        this.controls.minDistance = 0
        this.controls.maxDistance = 140

        this.animate()


    }

    animeGameStart() {
        this.camera.position.y = 2
        anime({
            targets: this.camera.position,
            y: 7,
            duration: 800,
            easing: 'linear',
            update: () => {
                this.paused = true
            },
            complete: () => {
                this.paused = false
            }
        })
    }

    animeSceneStart() {
        this.camera.position.z = 110
        this.camera.position.y = 0
        this.camera.rotation.x = 0
        new TWEEN.Tween(this.camera.position).to({
            z: 3,
            y: 20
        }, 6000).start().onComplete(() => {
            new TWEEN.Tween(this.camera.position).to({
                y: 8
            }, 3000).start().onComplete(() => {
                this.paused = false
            })
        })
        new TWEEN.Tween(this.camera.rotation).to({
            x: -1.4
        }, 6000).onUpdate(() => {
            this.paused = true
        }).start()
    }


    preview(map, node) {
        this.GAME_RECORD = {
            skin: config.MODEL.DEFAULT.id
        }
        this.animates = []
        this.spirit = []
        this.MAP_POS_NAME = []
        this.floorList = []
        this.sceneContainer = node
        this.CURRENT_MAP = map
        this.MAPS_MATRIX = this.CURRENT_MAP.matrix
        this.MAPS_POSITION = this.CURRENT_MAP.position
        this.initScene(true)

        // 视角控制器
        this.controls = new TrackballControls(this.camera, this.renderer.domElement);
        this.controls.minDistance = 1
        this.controls.maxDistance = 140
    }

    onWindowResize() {
        // 重新设置相机宽高比例
        this.camera.aspect = window.innerWidth / window.innerHeight;
        // 更新相机投影矩阵
        this.camera.updateProjectionMatrix();
        // 重新设置渲染器渲染范围
        this.renderer.setSize(window.innerWidth, window.innerHeight);
    }


    generateSpirit(position) {
        let sphere = new Sphere(this.scene, this.GAME_RECORD.skin, coverRealPos(this.MAP_POS_NAME, position))

        this.moveThisFloor(sphere)
        this.spirit.push(sphere)
        sphere.animationTask && this.addTask(() => {
            sphere.animationTask()
        })

        //移除移动过的位置
        sphere.moveOnUpdate = (pos) => {

            let hitObj = this.obstacles.filter(item => item.self.target.position.x === pos.x && item.self.target.position.z === pos.z)

            hitObj.forEach((item, index) => {
                //获得礼物
                if (item.self.type === config.GIFT) {
                    item.destroy(this.scene)
                    this.obstacles.splice(this.obstacles.indexOf(item), 1)
                    let rd = random(0, 2)
                    if (rd === 0) {
                        this.generateSpirit(coverMapPos(this.MAP_POS_NAME, {
                            z: item.self.target.position.z - 1,
                            x: item.self.target.position.x,
                        }))
                        new Toast('获得游戏精灵 x1').show()
                    } else if (rd === 1) {
                        let value = 15
                        this.progress[0] += value
                        if (this.progress[1] < this.progress[0]) {
                            this.progress[1] = this.progress[0]
                        }
                        this.updateProgress(this.progress[0])
                        new Toast('获得能量 +' + value).show()
                    }
                }
            })

            this.moveThisFloor(sphere, this.spirit.indexOf(sphere) === 0 && this.mode === 1, pos)
        }
        sphere.moveOnComplete = () => {
            this.paused = false
        }

        // 提示换皮肤
        // if (this.level !== 0 && this.GAME_RECORD.point[this.level].star === 0){
        //     this.skinDialog.open()
        // }
    }

    initListener() {
        document.onkeydown = e => {
            if (!this.paused && !this.gameOver) {
                if (e.code === 'KeyA' || e.code === 'KeyD' || e.code === 'KeyW' || e.code === 'KeyS' || e.code === 'ArrowLeft' || e.code === 'ArrowRight' || e.code === 'ArrowUp' || e.code === 'ArrowDown') {
                    //等待所有目标移动完成
                    if (this.spirit.filter(item => item.dir !== 0).length === 0) {
                        this.spirit.forEach(sphere => {
                            if (e.code === 'KeyA' || e.code === 'ArrowLeft') {
                                sphere.dir = 1
                            } else if (e.code === 'KeyD' || e.code === 'ArrowRight') {
                                sphere.dir = 2
                            } else if (e.code === 'KeyS' || e.code === 'ArrowDown') {
                                sphere.dir = 4
                            } else if (e.code === 'KeyW' || e.code === 'ArrowUp') {
                                sphere.dir = 3
                            }
                            let currentMap = JSON.parse(JSON.stringify(this.MAPS_MATRIX))
                            this.spirit.filter(item => item !== sphere).forEach(item => {
                                let mapPos = coverMapPos(this.MAP_POS_NAME, {
                                    x: item.self.position.x,
                                    z: item.self.position.z,
                                })
                                //将其他精灵标记成障碍物
                                currentMap[mapPos.z][mapPos.x] = config.COLUMN
                            })
                            sphere.moveTween(currentMap, this.MAP_POS_NAME)
                        })
                        this.paused = true
                    }
                }
                //障碍物反转
                // if (e.code === 'Space') {
                //     this.updateScene()
                // }
            }
        }

        document.querySelectorAll('.options_container>div').forEach((item, index) => {
            item.onclick = () => {
                if (index === 0) {
                    Dialog.dialogs.forEach(item => {
                        if (item !== this.levelDialog) {
                            if (item.status) {
                                item.close()
                            }
                        }
                    })
                    this.levelDialog.status ? this.levelDialog.close() : this.levelDialog.open()
                } else if (index === 1) {
                    Dialog.dialogs.forEach(item => {
                        if (item !== this.skinDialog) {
                            if (item.status) {
                                item.close()
                            }
                        }
                    })
                    this.skinDialog.status ? this.skinDialog.close() : this.skinDialog.open()
                } else if (index === 2) {
                    Dialog.dialogs.forEach(item => {
                        if (item !== this.settingsDialog) {
                            if (item.status) {
                                item.close()
                            }
                        }
                    })
                    this.settingsDialog.status ? this.settingsDialog.close() : this.settingsDialog.open()
                } else if (index === 3) {
                    location.href = 'index.html'
                }
            }
        })

    }


    updateScene() {
        this.obstacles.forEach(item => {
            item.destroy(this.scene)
        })
        for (let i = 0; i < this.MAPS_MATRIX.length; i++) {
            for (let j = 0; j < this.MAPS_MATRIX[i].length; j++) {
                if (i !== 0 && i !== this.MAPS_MATRIX.length - 1 && j !== 0 && j !== this.MAPS_MATRIX[i].length - 1) {
                    if (i !== this.MAPS_POSITION[0] || j !== this.MAPS_POSITION[1]) {
                        if (this.MAPS_MATRIX[i][j] === 0) {
                            this.MAPS_MATRIX[i][j] = 1
                        } else if (this.MAPS_MATRIX[i][j] === 1) {
                            this.MAPS_MATRIX[i][j] = 0
                        }
                    }
                }
            }
        }
        this.renderMap(false)
    }

    /**
     *
     * @param value noneAble
     */
    updateProgress(value) {
        this.progress[0] = value || this.progress[0] - 1
        let pro = this.progress[0] / this.progress[1]
        this.progressBar.style.width = this.progressBar.parentNode.getBoundingClientRect().width * pro + 'px'
        this.starArr = document.querySelectorAll('.status-bar>img')
        if (pro * 100 <= 0 && this.starArr.length === 1) {
            let node = this.starArr[this.starArr.length - 1]
            starAnim(node)
        } else if (pro * 100 < 25 && this.starArr.length === 2) {
            let node = this.starArr[this.starArr.length - 1]
            starAnim(node)
        } else if (pro * 100 < 50 && this.starArr.length === 3) {
            let node = this.starArr[this.starArr.length - 1]
            starAnim(node)
        }
        if (this.progress[0] <= 0) {
            console.log('游戏失败')
            this.gameOver = true
            // this.tipsDialog.open()
            this.GAME_RECORD.level = 0
            localStorage.setItem(config.LOC_KEY, JSON.stringify(this.GAME_RECORD))
            Game.gameOverDialog.open('游戏失败,选择复活方式')
        }

        function starAnim(node) {
            anime.timeline({
                duration: 400
            }).add({
                targets: node,
                top: '300px',
                easing: 'linear'
            }).add({
                targets: node,
                opacity: 0,
                complete: () => {
                    if (node && node.parentNode) {
                        node.parentNode.removeChild(node)
                    }
                }
            })
        }
    }

    renderMap(reload) {
        //等待所有模型加载完
        let total = 0
        this.paused = true
        this.obstacles = []
        for (let i = 0; i < this.MAPS_MATRIX.length; i++) {
            for (let j = 0; j < this.MAPS_MATRIX[i].length; j++) {

                let position = {
                    x: -Math.floor(this.MAPS_MATRIX[i].length / 2) + j,
                    z: -Math.floor(this.MAPS_MATRIX.length / 2) + i
                }

                this.MAP_POS_NAME.push({
                    realPos: {
                        x: j,
                        z: i
                    },
                    mapIndex: position
                })

                // 渲染障碍物

                if (this.MAPS_MATRIX[i][j] !== 0 || i === 0 || i === this.MAPS_MATRIX.length - 1 || j === 0 || j === this.MAPS_MATRIX[i].length - 1) {
                    if (!this.MAPS_POSITION || (i !== this.MAPS_POSITION[0] || j !== this.MAPS_POSITION[1])) {
                        if (this.MAPS_MATRIX[i][j] >= 1) {
                            total++
                            new Obstacle({
                                scene: this.scene,
                                position: position,
                                type: this.MAPS_MATRIX[i][j],
                            }, (obj) => {
                                this.obstacles.push(obj)
                                obj.animationTask && this.addTask(obj.animationTask)
                                //所有目标渲染完成
                                if (total === this.obstacles.length) {
                                    this.paused = false
                                }
                            })
                        }
                    }
                }


                if (reload) {
                    //渲染底部
                    this.drawFloor(position.x, position.z)
                }

            }
        }
    }

    /**
     * 添加动画任务
     * @param callback
     */
    addTask(callback) {
        this.animates.push(callback)
    }

    animate() {
        requestAnimationFrame(this.animate.bind(this));
        this.animates && this.animates.forEach(item => {
            item && item()
        })
        this.stats && this.stats.update()
        this.controls && this.controls.update()
        this.renderer.render(this.scene, this.camera);

    }

    /**
     * 给底部上色
     * @param sphere 精灵
     * @param consume 是否消耗
     * @param pos
     */
    moveThisFloor(sphere, consume, pos) {
        //防止出界
        let x = sphere.self.position.x
        let z = sphere.self.position.z
        if (pos) {
            x = pos.x
            z = pos.z
        }
        if (Number.isInteger(x) && Number.isInteger(z)) {
            try {
                let mapPos = coverMapPos(this.MAP_POS_NAME, {x, z})
                if (this.MAPS_MATRIX[mapPos.z][mapPos.x] !== -1) {
                    let target = this.floorList.find(item => item.x === x && item.z === z).target

                    // target.material.color = sphere.self.material.color
                    target.material.color.set(config.MAIN_COLOR)
                    // this.scene.remove(target)

                    this.MAPS_MATRIX[mapPos.z][mapPos.x] = -1

                    //0未处理
                    let arr = this.MAPS_MATRIX.filter(item => item.filter(el => el === 0).length)
                    if (arr.length === 0) {
                        this.gameWin(sphere)
                    }
                }

                if (consume) {
                    this.updateProgress()
                }

            } catch (e) {
                console.log(e)
                sphere.dir = 0
            }
        }
    }

    gameWin(sphere) {
        if (!this.gameOver) {
            this.gameOver = true

            //设置关卡信息
            let find = this.GAME_RECORD.point.find(item => item.levelId === this.CURRENT_MAP.id)
            if (find) {
                if (this.starArr.length > find.star) {
                    find.star = this.starArr.length
                }
            } else {
                this.GAME_RECORD.point.push({
                    star: this.starArr.length,
                    // 设置为关卡id
                    levelId: this.CURRENT_MAP.id
                })
            }

            if (this.level + 1 > this.GAME_RECORD.level) {
                if (typeof this.CURRENT_MAP.id === 'number')
                    this.GAME_RECORD.level = Math.min(this.level + 1, this.MAPS.filter(item => item.type === config.MAP_TYPE.NORMAL).length - 1)
            }
            localStorage.setItem(config.LOC_KEY, JSON.stringify(this.GAME_RECORD))

            this.levelDialog.initLevelDialog(this.MAPS)

            anime({
                targets: this.camera.rotation,
                duration: 600,
                easing: 'linear',
                x: 0
            })
            anime({
                targets: this.camera.position,
                duration: 600,
                easing: 'linear',
                x: sphere.self.position.x,
                y: sphere.self.position.y + 2,
                z: sphere.self.position.z + 2,
                complete: () => {
                    sphere.animeWin().then(() => {
                        // this.levelDialog.open()
                        new TipsDialog([{
                            text: '确定', callback: () => {
                                this.load(this.GAME_RECORD.level)
                            }
                        }]).open("进入下一关")
                    })
                }
            })
        }
    }


    /**
     * 绘制底部
     * @param x
     * @param z
     */
    drawFloor(x, z) {
        let floor = Factory.buildFloor()
        floor.position.set(x, -config.BLOCK_SIZE / 2, z)
        floor.rotation.x = Math.PI / 2
        this.floorList.push({
            x: x,
            z: z,
            target: floor
        })

        this.scene.add(floor)
    }


}


export {
    Game
}
