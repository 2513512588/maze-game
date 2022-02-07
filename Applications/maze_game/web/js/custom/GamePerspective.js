import config from "./Config.js";
import {Sphere} from "./Sphere.js";

import {coverMapPos, coverRealPos, random} from './Utils.js'
import anime from "../anime.js";


import Dialog from './Dialog.js'
import Toast from "./Toast.js";
import {TrackballControls} from "../TrackballControls.js";
import {Game} from "./Game.js";
import Factory from "./Factory.js";


class GamePerspective extends Game {



    initScene() {
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


        //辅助线
        // const axesHelper = new AxesHelper(500)
        // const gridHelper = new GridHelper(400, 400, 'rgb(200, 200, 200)', 'rgb(100, 100, 100)')
        // gridHelper.position.x = -config.BLOCK_SIZE / 2
        // gridHelper.position.z = -config.BLOCK_SIZE / 2
        // this.scene.add(axesHelper)
        // this.scene.add(gridHelper)

        // const cameraHelper = new THREE.CameraHelper(this.camera)
        // this.scene.add(cameraHelper)


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


        this.addTask(() => {
            let delta = this.clock.getDelta();
            mixer.update(delta)
        })
        this.scene.add(environment)

        //渲染地图
        this.renderMap(true)

        this.renderer.setClearColor('rgb(245,158,158)', 1.0);


        this.generateSpirit({
            z: this.MAPS_POSITION[0],
            x: this.MAPS_POSITION[1],
        })


        this.renderer.setSize(window.innerWidth, window.innerHeight);
        this.sceneContainer.appendChild(this.renderer.domElement);

        // 视角控制器
        // this.controls = new TrackballControls(this.camera, this.renderer.domElement);
        // this.controls.minDistance = 1
        // this.controls.maxDistance = 40

        this.animate()

    }


    generateSpirit(position) {
        let sphere = new Sphere(this.scene, this.GAME_RECORD.skin, coverRealPos(this.MAP_POS_NAME, position), () => {
            this.moveThisFloor(sphere)

            this.camera.position.y = 4

            this.cameraMove(sphere, 4)

            this.camera.rotateOnWorldAxis(
                new THREE.Vector3(0, 1, 0),
                Math.PI
            );

            sphere.currentDir = 4

            this.spirit.push(sphere)
            sphere.animationTask && this.addTask(sphere.animationTask)

            sphere.moveOnUpdate = (pos) => {

                let hitObj = this.obstacles.filter(item => item.self.target.position.x === pos.x && item.self.target.position.z === pos.z)

                hitObj.forEach(item => {
                    //获得礼物
                    if (item.self.type === config.GIFT) {
                        item.destroy(this.scene)
                        this.obstacles.splice(this.obstacles.indexOf(item), 1)
                        let value = 15
                        this.progress[0] += value
                        if (this.progress[1] < this.progress[0]) {
                            this.progress[1] = this.progress[0]
                        }
                        this.updateProgress(this.progress[0])
                        new Toast('获得能量 +' + value).show()
                    }
                })


                this.cameraMove(sphere)

                this.moveThisFloor(sphere, this.spirit.indexOf(sphere) === 0 && this.mode === 1, pos)
            }
            sphere.moveOnComplete = () => {
                this.paused = false
            }


            // 提示换皮肤
            // if (this.level !== 0 && this.GAME_RECORD.point[this.level].star === 0){
            //     this.skinDialog.open()
            // }

        })

    }


    initListener() {

        document.onkeydown = e => {
            if (!this.paused && !this.gameOver) {
                if (e.code === 'KeyA' || e.code === 'KeyD' || e.code === 'KeyW' || e.code === 'KeyS' || e.code === 'ArrowLeft' || e.code === 'ArrowRight' || e.code === 'ArrowUp' || e.code === 'ArrowDown') {
                    this.paused = true

                    this.spirit.forEach(sphere => {
                        if (sphere.dir === config.SPIRIT.DIR.NONE) {
                            if (e.code === 'KeyA' || e.code === 'ArrowLeft') {
                                sphere.dir = turnCorner(sphere, 'left')
                                Promise.all([
                                    new Promise(resolve => {
                                        anime({
                                            targets: this.camera.rotation,
                                            y: this.camera.rotation.y - Math.PI / 2,
                                            easing: 'linear',
                                            duration: 600,
                                            complete: () => {
                                                resolve()
                                            }
                                        })
                                    }),
                                    this.cameraMove(sphere, sphere.dir)
                                ]).then(() => {
                                    sphere.moveTween(this.MAPS_MATRIX, this.MAP_POS_NAME)
                                })
                            } else if (e.code === 'KeyD' || e.code === 'ArrowRight') {
                                sphere.dir = turnCorner(sphere, 'right')
                                Promise.all([
                                    new Promise(resolve => {
                                        anime({
                                            targets: this.camera.rotation,
                                            y: this.camera.rotation.y + Math.PI / 2,
                                            easing: 'linear',
                                            duration: 600,
                                            complete: () => {
                                                resolve()
                                            }
                                        })
                                    }),
                                    this.cameraMove(sphere, sphere.dir)
                                ]).then(() => {
                                    sphere.moveTween(this.MAPS_MATRIX, this.MAP_POS_NAME)
                                })

                            } else if (e.code === 'KeyW' || e.code === 'ArrowUp') {
                                sphere.dir = sphere.currentDir
                                Promise.all([
                                    new Promise(resolve => {
                                        anime({
                                            targets: this.camera.rotation,
                                            y: this.camera.rotation.y,
                                            easing: 'linear',
                                            duration: 600,
                                            complete: () => {
                                                resolve()
                                            }
                                        })
                                    }),
                                    this.cameraMove(sphere, sphere.dir)
                                ]).then(() => {
                                    sphere.moveTween(this.MAPS_MATRIX, this.MAP_POS_NAME)
                                })

                            } else if (e.code === 'KeyS' || e.code === 'ArrowDown') {
                                sphere.dir = turnCorner(sphere, 'down')
                                Promise.all([
                                    new Promise(resolve => {
                                        anime({
                                            targets: this.camera.rotation,
                                            y: this.camera.rotation.y + Math.PI,
                                            easing: 'linear',
                                            duration: 600,
                                            complete: () => {
                                                resolve()
                                            }
                                        })
                                    }),
                                    this.cameraMove(sphere, sphere.dir)
                                ]).then(() => {
                                    sphere.moveTween(this.MAPS_MATRIX, this.MAP_POS_NAME)
                                })
                            }


                        }
                    })
                }
                //障碍物反转
                // if (e.code === 'Space') {
                //     this.updateScene()
                // }
            }
        }


        //获取下一次方向
        function turnCorner(sphere, dir) {
            if (sphere.currentDir === config.SPIRIT.DIR.LEFT) {
                if (dir === 'left') {
                    return config.SPIRIT.DIR.DOWN
                } else if (dir === 'right') {
                    return config.SPIRIT.DIR.UP
                } else if (dir === 'down') {
                    return config.SPIRIT.DIR.RIGHT
                }
            } else if (sphere.currentDir === config.SPIRIT.DIR.RIGHT) {
                if (dir === 'left') {
                    return config.SPIRIT.DIR.UP
                } else if (dir === 'right') {
                    return config.SPIRIT.DIR.DOWN
                } else if (dir === 'down') {
                    return config.SPIRIT.DIR.LEFT
                }
            } else if (sphere.currentDir === config.SPIRIT.DIR.UP) {
                if (dir === 'left') {
                    return config.SPIRIT.DIR.LEFT
                } else if (dir === 'right') {
                    return config.SPIRIT.DIR.RIGHT
                } else if (dir === 'down') {
                    return config.SPIRIT.DIR.DOWN
                }
            } else if (sphere.currentDir === config.SPIRIT.DIR.DOWN) {
                if (dir === 'left') {
                    return config.SPIRIT.DIR.RIGHT
                } else if (dir === 'right') {
                    return config.SPIRIT.DIR.LEFT
                } else if (dir === 'down') {
                    return config.SPIRIT.DIR.UP
                }
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


    cameraMove(sphere, dir) {
        return new Promise((resolve) => {
            if ((dir || sphere.dir) === config.SPIRIT.DIR.LEFT) {
                anime({
                    targets: this.camera.position,
                    z: sphere.self.position.z,
                    x: sphere.self.position.x + 3,
                    easing: 'linear',
                    duration: 300,
                    complete: () => {
                        resolve()
                    }
                })
            }
            if ((dir || sphere.dir) === config.SPIRIT.DIR.RIGHT) {
                anime({
                    targets: this.camera.position,
                    z: sphere.self.position.z,
                    x: sphere.self.position.x - 3,
                    easing: 'linear',
                    duration: 300,
                    complete: () => {
                        resolve()
                    }
                })
            }
            if ((dir || sphere.dir) === config.SPIRIT.DIR.UP) {
                anime({
                    targets: this.camera.position,
                    z: sphere.self.position.z + 3,
                    x: sphere.self.position.x,
                    easing: 'linear',
                    duration: 300,
                    complete: () => {
                        resolve()
                    }
                })
            }
            if ((dir || sphere.dir) === config.SPIRIT.DIR.DOWN) {
                anime({
                    targets: this.camera.position,
                    z: sphere.self.position.z - 3,
                    x: sphere.self.position.x,
                    easing: 'linear',
                    duration: 300,
                    complete: () => {
                        resolve()
                    }
                })
            }
        })
    }


    gameWin(sphere) {
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
            this.GAME_RECORD.level = Math.min(this.level + 1, this.MAPS.filter(item => item.type === config.MAP_TYPE.NORMAL).length - 1)
        }
        localStorage.setItem(config.LOC_KEY, JSON.stringify(this.GAME_RECORD))

        this.levelDialog.initLevelDialog(this.MAPS)

        this.levelDialog.open()

    }

}


export {
    GamePerspective
}
