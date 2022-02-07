import {Game} from "./Game.js";
import config from "./Config.js";
import {coverMapPos, coverRealPos, getQueryVariable, random, uuid} from "./Utils.js";
import anime from "../anime.js";
import {Sphere} from "./Sphere.js";
import Dialog from "./Dialog.js";
import {TWEEN} from "../tween.module.min.js";
import Factory from "./Factory.js";
import {TrackballControls} from "../TrackballControls.js";
import Toast from "./Toast.js";

/**
 * paused 用于控制玩家是否可以操作
 */
class GameOnline extends Game {

    startup(options = {}) {
        this.stats = options.stats
        this.progressBar = document.querySelector('.progress-bar>div')
        this.sceneContainer = document.getElementById('scene')
        this.chartNode = document.getElementById('chart')
        this.$chart = echarts.init(this.chartNode)
        this.swithBtn = document.querySelectorAll('.switch_btn')

        this.mode = 1

        //修改皮肤提示框
        this.skinDialog = new Dialog('.skin-dialog', skin => {
            this.spirit.forEach(sphere => {
                this.sendMsg({
                    type: config.GAME_ONLINE.MESSAGE.UPDATE_SKIN,
                    data: {
                        skin: skin
                    }
                })
            })

        })


        //游戏失败提示框
        this.tipsDialog = new Dialog('.tips-dialog', '.replay_btn', () => {
            this.sendMsg({
                type: config.GAME_ONLINE.MESSAGE.NOTICE,
                data: {
                    noticeType: config.GAME_ONLINE.MESSAGE.NOTICE_TYPE.OPERATION,
                    clear: true
                }
            })
        })

        //游戏模式提示框
        this.settingsDialog = new Dialog('.settings-dialog', '.save_btn', () => {
            if (this.swithBtn[0].getAttribute('mode') === 'on') {
                this.mode = 1
            } else {
                this.mode = 2
            }
            this.MAPS_MATRIX.forEach((item, index) => {
                item.forEach((el, idx) => {
                    if (el === 0 || typeof el === 'object') {
                        this.updateFloorColor({
                            mapPos: {
                                z: index,
                                x: idx
                            }
                        })
                    }
                })
            })
        })
        this.settingsDialog.initSettingsDialog()

        //消息提示框
        this.messageDialog = new Dialog('.message-dialog')


        this.initListener()
        this.load()

        window.addEventListener('resize', this.onWindowResize.bind(this));
    }

    /**
     * 加载游戏
     */
    load() {

        // this.levelDialog.initLevelDialog(this.MAPS)
        this.GAME_RECORD = JSON.parse(localStorage.getItem(config.LOC_KEY))

        //开放所有皮肤
        this.skinDialog.initSkinDialog(9999, config.MODEL.DEFAULT.id)

        this.sceneContainer.innerHTML = ''
        // 精灵数组
        this.spirit = []
        this.animates = []
        this.addTask(() => {
            TWEEN.update()
        })

        this.gameOver = false
        this.paused = true
        this.MAP_POS_NAME = []
        this.obstacles = []
        this.floorList = []


        this.initRoom()

    }


    /**
     * 初始化房间
     */
    initRoom() {

        this.selfId = localStorage.getItem(config.GAME_ONLINE.SELF_KEY) || uuid()

        localStorage.setItem(config.GAME_ONLINE.SELF_KEY, this.selfId)

        let queryId = getQueryVariable('roomId')
        if (queryId) {
            this.roomId = queryId
            fetch('http://' + config.GAME_ONLINE.BASE_URL  + ':' + config.GAME_ONLINE.HTTP_PORT + '/room/enter?uuid=' + this.roomId).then(res => res.json()).then(res => {
                console.log(res)
                if (res.data.room) {

                    this.CURRENT_MAP = JSON.parse(res.data.room.map)
                    this.MAPS_MATRIX = this.CURRENT_MAP.matrix
                    this.MAPS_POSITION = ['', '']
                    this.progress = [this.CURRENT_MAP.value, this.CURRENT_MAP.value]

                    this.totalBlock = this.MAPS_MATRIX.map(item => item.filter(el => el === 0).length).reduce((a, b) => a + b)

                    //完全不知道这个放在这里干嘛
                    this.updateProgress(this.progress[1])

                    this.initScene()
                    this.initSocket()
                } else {
                    this.messageDialog.open('房间不存在')
                }
            })
        } else {
            this.messageDialog.open('请选择房间进入')
        }

    }


    initScene() {
        //释放资源
        if (this.scene){
            this.scene.traverse(child=> {
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
        this.scene.position.z = 2

        this.camera = new THREE.PerspectiveCamera(115, window.innerWidth / window.innerHeight, 0.1, 1000);
        this.camera.position.set(0, 8, 5)
        this.camera.rotateX(-1.3);
        this.renderer = new THREE.WebGLRenderer({
            antialias: true,
            alpha: true,
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

        // const helper = new THREE.DirectionalLightHelper(light, 5);
        // this.scene.add(helper);


        //加载外景
        let environment = Factory.container[config.MODEL.ENVIRONMENT.id]
        environment.scale.set(1.8 + (this.MAPS_MATRIX[0].length - 9)*.15, 1.8, 1.8)
        environment.position.x = 5.9 + (this.MAPS_MATRIX[0].length - 9)*.4
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
        if (!localStorage.getItem(config.INIT_KEY)){
            this.animeSceneStart()
            localStorage.setItem(config.INIT_KEY, 'true')
        }else {
            this.animeGameStart()
        }


        //渲染地图
        this.renderMap(true)

        this.renderer.setClearColor('rgb(245,158,158)', 1.0);





        // const axesHelper = new AxesHelper(500)
        // const gridHelper = new GridHelper(400, 400, 'rgb(200, 200, 200)', 'rgb(100, 100, 100)')
        // gridHelper.position.x = -config.BLOCK_SIZE / 2
        // gridHelper.position.z = -config.BLOCK_SIZE / 2
        // this.scene.add(axesHelper)
        // this.scene.add(gridHelper)
        //
        // const cameraHelper = new THREE.CameraHelper(this.camera)
        // this.scene.add(cameraHelper)


        this.renderer.setSize(window.innerWidth, window.innerHeight);
        // 直接变清楚
        this.renderer.setPixelRatio(window.devicePixelRatio);

        this.sceneContainer.appendChild(this.renderer.domElement);

        // 视角控制器
        // this.controls = new TrackballControls(this.camera, this.renderer.domElement);
        // this.controls.minDistance = 1
        // this.controls.maxDistance = 140


        this.animate()

    }

    randomPos() {
        let initPosArr = []
        this.MAPS_MATRIX.forEach((item, index) => {
            item.forEach((el, idx) => {
                if (this.MAPS_MATRIX[index][idx] === 0) {
                    initPosArr.push(coverRealPos(this.MAP_POS_NAME, {
                        z: index,
                        x: idx
                    }))
                }
            })
        })
        return initPosArr[Math.floor(Math.random() * initPosArr.length)]
    }


    initSocket() {

        this.websocket = null
        //判断当前浏览器是否支持WebSocket, 主要此处要更换为自己的地址
        if ('WebSocket' in window) {

            this.websocket = new WebSocket('ws://' + config.GAME_ONLINE.BASE_URL + ':' + config.GAME_ONLINE.SOCKET_PORT + "/game/" + this.roomId);
            //连接发生错误的回调方法
            this.websocket.onerror = function (err) {
                console.log(err)
            };

            //连接成功建立的回调方法
            this.websocket.onopen = (event) => {
                let names = Factory.container[config.NAMES]
                this.sendMsg({
                    type: config.GAME_ONLINE.MESSAGE.OPEN,
                    data: {
                        //使用默认皮肤
                        skin: config.MODEL.DEFAULT.id,
                        position: this.randomPos(),
                        color: randomColor(),
                        nickName: names[Math.floor(Math.random() * names.length)],
                        roomId: this.roomId
                    }
                })
            }

            //接收到消息的回调方法
            this.websocket.onmessage = (event) => {
                let msg = JSON.parse(event.data)
                //玩家加入游戏
                if (msg.type === config.GAME_ONLINE.MESSAGE.OPEN) {
                    //判断场景上的人物是否还存在 不存在移除且移除他的画底部
                    this.spirit.forEach(sphere => {
                        if (sphere.uuid !== this.selfId) {
                            this.MAPS_MATRIX.forEach((item, index) => {
                                item.forEach((el, idx) => {
                                    if (typeof el === 'object') {
                                        let findIndex = el.findIndex(sp => sp.uuid === sphere.uuid)
                                        if (findIndex !== -1) {
                                            this.updateFloorColor({
                                                mapPos: {
                                                    z: index,
                                                    x: idx
                                                }
                                            }, theFloor => {
                                                theFloor.splice(findIndex, 1)
                                            })
                                        }
                                    }
                                })
                            })
                        }
                    })

                    //删除精灵
                    for (let i = this.spirit.length - 1; i >= 0; i--) {
                        //清除不存在的底部
                        let find = msg.data.players.find(el => el.uuid === this.spirit[i].uuid)
                        if (!find) {
                            this.scene.remove(this.spirit[i].self)
                            this.spirit.splice(i, 1)
                        }
                    }

                    msg.data.players.forEach(item => {
                        let sphere = this.generateSpirit(item.position, item.skin, item.uuid, item.color, item.nickName)
                        if (item.floors && item.uuid !== this.selfId) {
                            item.floors.forEach(item => {
                                this.moveThisFloor(sphere, false, item)
                            })
                        }
                    })

                    // this.obstacles.filter(item => item.self.type === config.GIFT).forEach(item =>{
                    //     let mapPos = coverMapPos(this.MAP_POS_NAME, {
                    //         x: item.self.target.position.x,
                    //         z: item.self.target.position.z,
                    //     })
                    //     if (this.MAPS_MATRIX[mapPos.z][mapPos.x] !== config.GIFT){
                    //         item.destroy(this.scene)
                    //     }
                    // })

                    //玩家修改皮肤
                } else if (msg.type === config.GAME_ONLINE.MESSAGE.UPDATE_SKIN) {
                    let find = this.spirit.find(item => item.uuid === msg.sender)
                    let nickNameObj = find.self.getObjectByName('nickname')
                    find.updateSkin(msg.data.skin, this.scene)
                    find.self.add(nickNameObj)
                    this.spiritRotateName(find.currentDir, nickNameObj)
                    // 玩家移动
                } else if (msg.type === config.GAME_ONLINE.MESSAGE.MOVE) {
                    let find = this.spirit.find(item => item.uuid === msg.sender)
                    this.spiritMove(find, {
                        code: msg.data.keyCode
                    })
                    // 消息通知
                } else if (msg.type === config.GAME_ONLINE.MESSAGE.NOTICE) {
                    if (msg.data.noticeType === config.GAME_ONLINE.MESSAGE.NOTICE_TYPE.GAME_RESULT) {
                        let find = this.spirit.find(item => item.uuid === msg.sender)
                        if (msg.data.success) {
                            if (find.uuid === this.selfId) {
                                this.tipsDialog.open('游戏胜利')
                            } else {
                                this.tipsDialog.open('游戏失败')
                            }
                        } else {
                            find.gameSuccess = msg.data.success
                            //判断所有人是否完成
                            if (this.spirit.filter(item => item.gameSuccess === undefined).length === 0) {
                                this.tipsDialog.open('这局游戏似乎没有赢家呀')
                            }
                        }
                    } else if (msg.data.noticeType === config.GAME_ONLINE.MESSAGE.NOTICE_TYPE.OPERATION) {
                        if (msg.data.clear && !this.paused) {
                            this.load()
                        }
                    }
                    //数据同步
                } else if (msg.type === config.GAME_ONLINE.MESSAGE.UPDATE_FLOOR) {
                    let spirit = this.spirit.find(item => item.uuid === msg.sender)
                    if (spirit) {
                        spirit.task.syncPos = () => {
                            let player = msg.data.player
                            //数据不一致的情况在同步
                            if (spirit.self.position.z !== player.position.z || spirit.self.position.x !== player.position.x) {
                                this.MAPS_MATRIX.forEach((item, index) => {
                                    item.forEach((el, idx) => {
                                        let findIndex = el.findIndex(sp => sp.uuid === msg.sender)
                                        if (typeof el === 'object') {
                                            if (findIndex !== -1) {
                                                this.updateFloorColor({
                                                    mapPos: {
                                                        z: index,
                                                        x: idx
                                                    }
                                                }, theFloor => {
                                                    theFloor.splice(findIndex, 1)
                                                })
                                            }
                                        }
                                    })
                                })
                                let sphere = this.generateSpirit(player.position, player.skin, player.uuid, player.color, player.nickName)
                                if (player.floors) {
                                    player.floors.forEach(item => {
                                        this.moveThisFloor(sphere, false, item)
                                    })
                                }
                            }
                            spirit.task.syncPos = undefined
                        }
                    }
                }
            }

            //连接关闭的回调方法
            this.websocket.onclose = () => {
                // setMessageInnerHTML("close");
                console.log('close')
                this.messageDialog.open('房间不存在或者Socket断开')
            }

            //监听窗口关闭事件，当窗口关闭时，主动去关闭websocket连接，防止连接还没断开就关闭窗口，server端会抛异常。
            window.onbeforeunload = function () {
                this.websocket.close();
            }

        } else {
            alert('Not support websocket')
        }

        function randomColor() {
            return `[${random(0, 256)},${random(0, 256)},${random(0, 256)}]`
        }
    }


    sendMsg(msg) {
        this.websocket.send(JSON.stringify(Object.assign(msg, {
            sender: this.selfId
        })));
    }


    /**
     *
     * @param position 真实坐标
     * @param skin
     * @param uuid
     * @param color
     * @param nickName
     * @returns {*}
     */
    generateSpirit(position, skin, uuid, color, nickName) {
        let sphere = this.spirit.find(item => item.uuid === uuid)
        if (!sphere) {
            sphere = new Sphere(this.scene, skin, position, ()=>{
                sphere.uuid = uuid
                this.spirit.push(sphere)
                sphere.animationTask && this.addTask(() => {
                    sphere.animationTask()
                })

                let font2dMaterial = new THREE.MeshLambertMaterial({
                    color: this.selfId === uuid ? '#3c8ada' : '#333333',
                    side: THREE.DoubleSide
                });


                //生成名字
                let shapes = Factory.container[config.FONT].generateShapes(nickName, .2);
                let font2dGeometry = new THREE.ShapeGeometry(shapes);
                font2dGeometry.computeBoundingBox()
                let font2d = new THREE.Mesh(font2dGeometry, font2dMaterial);
                font2d.name = 'nickname'
                font2d.rotation.x = -Math.PI / 4
                font2d.position.y = 1.7
                font2d.position.x = 0

                sphere.self.add(font2d);
            })

        } else {
            sphere.self.position.x = position.x
            sphere.self.position.z = position.z
        }
        sphere.color = color
        sphere.nickName = nickName

        this.moveThisFloor(sphere)
        sphere.task = {}

        sphere.moveOnStart = () => {
            sphere.task.syncPos && sphere.task.syncPos()
        }
        //移除移动过的位置
        sphere.moveOnUpdate = (pos) => {
            let mapPos = coverMapPos(this.MAP_POS_NAME, pos)
            //获得礼物
            if (this.MAPS_MATRIX[mapPos.z][mapPos.x] === 2){
                let hitObj = this.obstacles.find(item => item.self.target.position.x === pos.x && item.self.target.position.z)
                hitObj.destroy(this.scene)
                if (this.selfId === sphere.uuid){
                    let value = 15
                    this.progress[0] += value
                    if (this.progress[1] < this.progress[0]) {
                        this.progress[1] = this.progress[0]
                    }
                    this.updateProgress(this.progress[0])
                    new Toast('获得能量 +' + value).show()
                }
            }
            this.moveThisFloor(sphere, true, pos)
        }
        sphere.moveOnComplete = () => {
            this.paused = false

            if (sphere.uuid === this.selfId) {
                let floorList = []
                this.MAPS_MATRIX.forEach((item, index) => {
                    item.forEach((el, idx) => {
                        if (typeof el === 'object') {
                            if (el.find(po => po.uuid === this.selfId)) {
                                floorList.push(coverRealPos(this.MAP_POS_NAME, {
                                    z: index,
                                    x: idx
                                }))
                            }
                        }
                    })
                })
                //移动完成后同步位置
                this.sendMsg({
                    type: config.GAME_ONLINE.MESSAGE.UPDATE_FLOOR,
                    data: {
                        floorList: floorList,
                        position: {
                            x: sphere.self.position.x,
                            z: sphere.self.position.z
                        }
                    }
                })
            }
        }

        return sphere
    }

    initListener() {

        super.initListener()

        document.onkeydown = e => {
            let selfSpirit = this.spirit.find(item => item.uuid === this.selfId)
            if (!this.paused && !this.gameOver && selfSpirit.gameSuccess === undefined) {
                if (e.code === 'KeyA' || e.code === 'KeyD' || e.code === 'KeyW' || e.code === 'KeyS' || e.code === 'ArrowLeft' || e.code === 'ArrowRight' || e.code === 'ArrowUp' || e.code === 'ArrowDown') {
                    this.sendMsg({
                        type: config.GAME_ONLINE.MESSAGE.MOVE,
                        data: {
                            keyCode: e.code
                        },
                    })
                    this.paused = true
                }
            }
        }

        document.body.ontouchstart = e => {
            document.body.touchstartX = e.changedTouches[0].pageX
            document.body.touchstartY = e.changedTouches[0].pageY
        }

        document.body.ontouchend = e => {
            let selfSpirit = this.spirit.find(item => item.uuid === this.selfId)
            if (!this.paused && !this.gameOver && selfSpirit.gameSuccess === undefined) {
                let startX = document.body.touchstartX
                let startY = document.body.touchstartY
                let endX = e.changedTouches[0].pageX
                let endY = e.changedTouches[0].pageY
                let keyCode = ''
                let offsetX = startX - endX
                let offsetY = startY - endY
                if (Math.abs(offsetX) > Math.abs(offsetY)) {
                    if (offsetX > 50) {
                        keyCode = 'ArrowLeft'
                    } else if (offsetX < -50) {
                        keyCode = 'ArrowRight'
                    }
                } else {
                    if (offsetY > 50) {
                        keyCode = 'ArrowUp'
                    } else if (offsetY < -50) {
                        keyCode = 'ArrowDown'
                    }
                }
                this.sendMsg({
                    type: config.GAME_ONLINE.MESSAGE.MOVE,
                    data: {
                        keyCode: keyCode
                    },
                })
            }
        }

    }

    spiritMove(sphere, e) {
        if (sphere.dir === config.SPIRIT.DIR.NONE) {
            if (e.code === 'KeyA' || e.code === 'ArrowLeft') {
                sphere.dir = config.SPIRIT.DIR.LEFT
            } else if (e.code === 'KeyD' || e.code === 'ArrowRight') {
                sphere.dir = config.SPIRIT.DIR.RIGHT
            } else if (e.code === 'KeyS' || e.code === 'ArrowDown') {
                sphere.dir = config.SPIRIT.DIR.DOWN
            } else if (e.code === 'KeyW' || e.code === 'ArrowUp') {
                sphere.dir = config.SPIRIT.DIR.UP
            }
            let nickName = sphere.self.getObjectByName('nickname')
            this.spiritRotateName(sphere.dir, nickName)
            sphere.moveTween(this.MAPS_MATRIX, this.MAP_POS_NAME)
        }
    }

    spiritRotateName(dir, nickName){
        if (dir === config.SPIRIT.DIR.LEFT){
            nickName.rotation.set(-Math.PI / 2, Math.PI / 4, Math.PI / 2)
        }else if (dir === config.SPIRIT.DIR.RIGHT){
            nickName.rotation.set(-Math.PI / 2, -Math.PI / 4, -Math.PI / 2)
        }else if (dir === config.SPIRIT.DIR.UP){
            nickName.rotation.set(Math.PI / 4, Math.PI, 0)
        }else if (dir === config.SPIRIT.DIR.DOWN){
            nickName.rotation.set(-Math.PI / 4, 0, 0)
        }
    }

    /**
     * 给底部上色
     * @param sphere 精灵
     * @param position 粉刷的位置 真实坐标
     * @param consume
     */
    moveThisFloor(sphere, consume, position) {
        //防止出界
        let x = sphere.self.position.x
        let z = sphere.self.position.z
        if (position) {
            x = position.x
            z = position.z
        }
        if (Number.isInteger(x) && Number.isInteger(z)) {
            try {
                this.updateFloorColor({
                    realPos: {
                        x, z
                    }
                }, theFloor => {
                    let thisColorIndex = theFloor.findIndex(item => item.uuid === sphere.uuid)
                    if (thisColorIndex === -1) {
                        theFloor.push({
                            uuid: sphere.uuid,
                            color: sphere.color
                        })
                        this.renderChart(sphere)
                    } else {
                        // splice 内是对象的话 返回数组
                        theFloor.unshift(theFloor.splice(thisColorIndex, 1)[0])
                    }
                })

                if (sphere.uuid === this.selfId && consume) {
                    this.updateProgress()
                    // 找出没有图色的情况
                    if (sphere.gameSuccess === undefined){
                        let arr = this.MAPS_MATRIX.filter(item => item.filter(el => el === 0 || (typeof el === 'object' && el.findIndex(sp => sp.uuid === this.selfId) === -1)).length)
                        if (arr.length === 0) {
                            this.gameWin(sphere)
                        }
                    }
                }

            } catch (e) {
                console.log(e)
                sphere.dir = config.SPIRIT.DIR.NONE
            }
        }

    }

    async renderChart(sphere) {
        //统计精灵移动过的块数 如果性能有问题的话此处统计放到数据同步里面 精灵位置错误的时候再从新统计
        let moveBlocks = this.MAPS_MATRIX.map(item => item.filter(el => typeof el === 'object' && el.find(sp => sp.uuid === sphere.uuid)).length)
        sphere.countBlock = moveBlocks.reduce((a, b) => a + b)
        let data = this.spirit.map(item => {
            let color = JSON.parse(item.color)
            return {
                name: item.nickName,
                value: item.countBlock || 1,
                color: `rgb(${color[0]}, ${color[1]}, ${color[2]})`
            }
        }).sort((a, b) => a.value - b.value)
        this.chartNode.style.height = data.length * 45 + 'px'
        this.$chart.setOption({
            yAxis: {
                type: 'category',
                data: data.map(item => item.name),
                axisLabel: {
                    color: '#fff'
                },
                axisTick: {
                    show: false
                },
                splitLine: {
                    show: false
                },
                axisLine: {
                    show: false,
                    interval: 0,
                },
            },
            xAxis: {
                type: 'value',
                axisLabel: {
                    show: false
                },
                axisTick: {
                    show: false
                },
                axisLine: {
                    show: false
                },
                splitLine: {
                    show: false
                },
                max: this.totalBlock,
                animationDuration: 300,
                animationDurationUpdate: 300
            },
            grid: {
                containLabel: true,
                top: 0,
                bottom: 0
            },
            series: [
                {
                    type: 'bar',
                    data: data.map(() => this.totalBlock),
                    barWidth: 6,
                    itemStyle: {
                        color: "rgba(255,255,255,.2)",
                        barBorderRadius: [50, 50, 50, 50],
                    },
                    zlevel: 1
                },
                {
                    data: data.map(item => item.value),
                    type: 'bar',
                    barWidth: 6,
                    itemStyle: {
                        color: function (params) {
                            return data[params.dataIndex].color
                        },
                        barBorderRadius: [50, 50, 50, 50]
                    },
                    barGap: "-100%",
                    zlevel: 2,
                },
            ]
        })
        this.$chart.resize()
        // this.chartNode.resize({height: data.length * 70});
    }

    /**
     * 修改游戏颜料
     * @param value noneAble
     */
    updateProgress(value) {
        this.progress[0] = value || this.progress[0] - 1
        let pro = this.progress[0] / this.progress[1]
        this.progressBar.style.width = this.progressBar.parentNode.getBoundingClientRect().width * pro + 'px'
        if (this.progress[0] <= 0) {
            this.sendMsg({
                type: config.GAME_ONLINE.MESSAGE.NOTICE,
                data: {
                    noticeType: config.GAME_ONLINE.MESSAGE.NOTICE_TYPE.GAME_RESULT,
                    success: false
                }
            })
            this.messageDialog.open('你的颜料耗尽啦')
        }
    }

    /**
     * 游戏胜利
     * @param sphere
     */
    gameWin(sphere) {
        if (!this.gameOver) {
            this.gameOver = true

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
                //第三视角设置为2
                z: sphere.self.position.z + 3,
                complete: () => {
                    sphere.animeWin().then(() => {
                        this.sendMsg({
                            type: config.GAME_ONLINE.MESSAGE.NOTICE,
                            data: {
                                noticeType: config.GAME_ONLINE.MESSAGE.NOTICE_TYPE.GAME_RESULT,
                                success: true
                            }
                        })
                    })
                }
            })
        }
    }

    /**
     * 修改底部颜色
     * @param pos
     * @param callback
     */
    updateFloorColor(pos, callback) {
        let mapPos = pos.mapPos
        let realPos = pos.realPos
        if (!pos.mapPos) {
            mapPos = coverMapPos(this.MAP_POS_NAME, pos.realPos)
        }
        if (!pos.realPos) {
            realPos = coverRealPos(this.MAP_POS_NAME, pos.mapPos)
        }

        let target = this.floorList.find(item => item.x === realPos.x && item.z === realPos.z).target

        let theFloor = this.MAPS_MATRIX[mapPos.z][mapPos.x]
        if (typeof theFloor !== 'object') {
            theFloor = []
        }

        callback && callback(theFloor)

        if (theFloor.length === 0) {
            target.material.color.set(config.FLOOR_COLOR)
        } else {
            if (this.mode === 2) {
                let color = [0, 0, 0]
                theFloor.forEach((item, index) => {
                    let thisColor = JSON.parse(item.color)
                    color[0] += thisColor[0] * (index === 0 ? 1.2 : .8)
                    color[1] += thisColor[1] * (index === 0 ? 1.2 : .8)
                    color[2] += thisColor[2] * (index === 0 ? 1.2 : .8)
                })
                target.material.color.set(`rgb(${parseInt(color[0] / theFloor.length)}, ${parseInt(color[1] / theFloor.length)}, ${parseInt(color[2] / theFloor.length)})`)
            } else if (this.mode === 1) {
                if (theFloor.find(item => item.uuid === this.selfId)) {
                    let spirit = this.spirit.find(item => item.uuid === this.selfId)
                    let color = JSON.parse(spirit.color)
                    target.material.color.set(`rgb(${color[0]}, ${color[1]}, ${color[2]})`)
                }else {
                    target.material.color.set(config.FLOOR_COLOR)
                }
            }
        }

        this.MAPS_MATRIX[mapPos.z][mapPos.x] = theFloor
    }

}

export default GameOnline
