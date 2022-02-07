import {Game} from "./Game.js";
import {Sphere} from "./Sphere.js";
import {coverMapPos, coverRealPos, random} from "./Utils.js";
import config from "./Config.js";
import Toast from "./Toast.js";
import {TWEEN} from "../tween.module.min.js";
import Factory from "./Factory.js";
import Guide from "./Guide.js";
import Bubble from "./Bubble.js";

/**
 * 游戏剧情模式
 */
class GamePlot extends Game {

    static SPIRIT_TYPE = {
        NORMAL: 0,
        FOLLOW: 1,
        // 擦除
        ERASE: 2,
        // 着色
        COLORING: 3
    }

    static LEVEL_EVENT = [{
        level: 1,
        init: function () {
             Bubble.show(['遇到陌生人随意走动'])
             this.generateSpirit({
                x: 2,
                z: 2
            }, config.MODEL.SONIC.id, GamePlot.SPIRIT_TYPE.ERASE)

            this.timer = setInterval(() => {
                this.spirit.filter(item => item.type === GamePlot.SPIRIT_TYPE.ERASE || item.type === GamePlot.SPIRIT_TYPE.COLORING).forEach(item => {
                    item.dir = random(1, 5)
                    item.moveTween(this.MAPS_MATRIX, this.MAP_POS_NAME)
                })
            }, 1000)
        }
    }, {
        level: 2,
        init: function () {
            this.MAPS_MATRIX[8][4] = 2
        },
        action: function (){
            Bubble.show(['获得小猫'])
        }
    }, {
        level: 3,
        init: function () {

        }
    }]

    /**
     * 加载游戏
     */
    load() {

        this.starArr = document.querySelectorAll('.status-bar>img')

        // 精灵数组
        this.spirit = []

        this.MAPS = this.MAP_OBJ.getMap()
        // 重组关卡
        this.MAPS = [
            this.MAPS[0], //游戏引导
            this.MAPS[1], //玩家恶意清除涂色
            this.MAPS[2], //遇到猫
            this.MAPS[3], //玩家帮你
            this.MAPS[4], //解救国王
        ]


        let plotLevel = localStorage.getItem(config.PLOT_KEY)
        if (plotLevel !== null) {
            this.level = JSON.parse(plotLevel)
        } else {
            this.level = 0
        }

        this.sceneContainer.innerHTML = ''
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

        //初始化对应关卡的事件
        let event = GamePlot.LEVEL_EVENT.find(item => item.level === this.level)
        if (event) {
            event.init && event.init.call(this)
        }

    }

    initScene(preview) {
        //释放资源
        if (this.scene) {
            this.scene.traverse(child => {
                child.geometry && child.geometry.dispose()
                child.material && child.material.dispose()
                child.clear()
            })
            this.renderer.renderLists.dispose()
            this.renderer.dispose()
            this.renderer.forceContextLoss()
            this.renderer.domElement = null
            this.renderer.content = null
            this.renderer = null
            THREE.Cache.clear()
        }

        this.scene = new THREE.Scene();
        this.camera = new THREE.PerspectiveCamera(115, window.innerWidth / window.innerHeight, 0.1, 1000);
        this.camera.position.set(0, 7, 2)
        this.camera.rotateX(-1.4);
        this.renderer = new THREE.WebGLRenderer({
            antialias: true,
            alpha: true
        })

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
        // this.controls = new TrackballControls(this.camera, this.renderer.domElement);
        // this.controls.minDistance = 0
        // this.controls.maxDistance = 140

        this.animate()

    }


    initListener() {
        document.onkeydown = e => {
            if (!this.paused && !this.gameOver) {
                if (e.code === 'KeyA' || e.code === 'KeyD' || e.code === 'KeyW' || e.code === 'KeyS' || e.code === 'ArrowLeft' || e.code === 'ArrowRight' || e.code === 'ArrowUp' || e.code === 'ArrowDown') {
                    //等待所有目标移动完成
                    let sphere = this.spirit.find(item => item.type === GamePlot.SPIRIT_TYPE.NORMAL)
                    if (e.code === 'KeyA' || e.code === 'ArrowLeft') {
                        sphere.dir = config.SPIRIT.DIR.LEFT
                    } else if (e.code === 'KeyD' || e.code === 'ArrowRight') {
                        sphere.dir = config.SPIRIT.DIR.RIGHT
                    } else if (e.code === 'KeyS' || e.code === 'ArrowDown') {
                        sphere.dir = config.SPIRIT.DIR.DOWN
                    } else if (e.code === 'KeyW' || e.code === 'ArrowUp') {
                        sphere.dir = config.SPIRIT.DIR.UP
                    }
                    sphere.moveTween(this.MAPS_MATRIX, this.MAP_POS_NAME)
                    this.paused = true
                }
                //障碍物反转
                // if (e.code === 'Space') {
                //     this.updateScene()
                // }
            }
            //删除引导
            Guide.remove()
        }

        document.querySelectorAll('.options_container>div').forEach((item, index) => {
            item.onclick = () => {
                if (index === 3) {
                    location.href = 'index.html'
                }
            }
        })

    }

    /**
     * @param position
     * @param skin
     * @param type 类型 0 正常 1 跟随 2 自动擦除 3 自动涂色
     */
    generateSpirit(position, skin = config.MODEL.DEFAULT.id, type = GamePlot.SPIRIT_TYPE.NORMAL) {
        let sphere = new Sphere(this.scene, skin, coverRealPos(this.MAP_POS_NAME, position), () => {
            sphere.type = type
            this.moveThisFloor(sphere, false)
            this.spirit.push(sphere)
            sphere.animationTask && this.addTask(() => {
                sphere.animationTask()
            })

            sphere.moveOnStart = (pos) => {
                //小猫跟随
                if (sphere.type === GamePlot.SPIRIT_TYPE.NORMAL) {
                    let thisFollow = this.spirit.find(item => item.type === GamePlot.SPIRIT_TYPE.FOLLOW)
                    if (thisFollow) {
                        if (thisFollow.self.position.x > sphere.self.position.x) {
                            thisFollow.dir = config.SPIRIT.DIR.LEFT
                        } else if (thisFollow.self.position.x < sphere.self.position.x) {
                            thisFollow.dir = config.SPIRIT.DIR.RIGHT
                        } else if (thisFollow.self.position.z > sphere.self.position.z) {
                            thisFollow.dir = config.SPIRIT.DIR.UP
                        } else if (thisFollow.self.position.z < sphere.self.position.z) {
                            thisFollow.dir = config.SPIRIT.DIR.DOWN
                        }
                        thisFollow.moveToPos({
                            x: pos.x,
                            z: pos.z
                        })
                    }
                }
            }

            //移除移动过的位置
            sphere.moveOnUpdate = (pos) => {
                if (sphere.type === GamePlot.SPIRIT_TYPE.NORMAL || sphere.type === GamePlot.SPIRIT_TYPE.ERASE || sphere.type === GamePlot.SPIRIT_TYPE.COLORING) {
                    if (sphere.type === GamePlot.SPIRIT_TYPE.NORMAL) {
                        let hitObj = this.obstacles.filter(item => item.self.target.position.x === pos.x && item.self.target.position.z === pos.z)
                        hitObj.forEach((item, index) => {
                            //获得礼物
                            if (item.self.type === config.GIFT) {
                                item.destroy(this.scene)
                                this.obstacles.splice(this.obstacles.indexOf(item), 1)
                                alert('获得猫咪一只')
                            }
                        })
                    }
                    this.moveThisFloor(sphere, true, pos)
                }
            }

            sphere.moveOnComplete = () => {
                this.paused = false
            }

        })
    }


    /**
     * 给底部上色
     * @param sphere 精灵
     * @param pos
     * @param consume 是否消耗能量
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

                let target = this.floorList.find(item => item.x === x && item.z === z).target

                if (sphere.type === GamePlot.SPIRIT_TYPE.NORMAL || sphere.type === GamePlot.SPIRIT_TYPE.COLORING) {
                    if (this.MAPS_MATRIX[mapPos.z][mapPos.x] !== -1) {
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
                    if (sphere.type === GamePlot.SPIRIT_TYPE.NORMAL && consume) {
                        this.updateProgress()
                    }
                } else if (sphere.type === GamePlot.SPIRIT_TYPE.ERASE) {
                    if (this.MAPS_MATRIX[mapPos.z][mapPos.x] === -1) {
                        target.material.color.set(config.FLOOR_COLOR)
                        this.MAPS_MATRIX[mapPos.z][mapPos.x] = 0
                    }
                }

            } catch (e) {
                console.log(e)
                sphere.dir = config.SPIRIT.DIR.NONE
            }
        }
    }

    gameWin(sphere) {
        if (!this.gameOver) {
            this.gameOver = true
            if (this.level < this.MAPS.length) {
                this.level++
                localStorage.setItem(config.PLOT_KEY, this.level)
                this.load()
            }
        }
    }

}

export default GamePlot