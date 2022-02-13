import config from "./Config.js";
import {GLTFLoader} from "../GLTFLoader.js";
import * as SkeletonUtils from "../SkeletonUtils.js";
import {FontLoader} from "../FontLoader.js";


/**
 * 工厂 用来创建加载资源 节约性能
 */
class Factory {

    static container = {}

    static manager = new THREE.LoadingManager();

    /**
     * 预加载模型
     * @returns {Promise<unknown>}
     */
    static preload() {
        if (!Factory.init) {
            Factory.buildColumn()
            Factory.buildFloor()
            this.promise = new Promise((resolve) => {
                Object.keys(config.MODEL).forEach(item => {
                    Factory.buildModel(config.MODEL[item])
                })
                fetch('./data/randomNames.json').then(res => res.json()).then(res => {
                    Factory.container[config.NAMES] = res
                })
                Factory.buildFont()

                Factory.manager.onLoad = () => {
                    Factory.init = true
                    resolve()
                    console.log('Loading complete!');
                }
            })
        }
        return this.promise
    }

    /**
     *  加载状态
     * @param callback (url — 被加载的项的url,itemsLoaded — 目前已加载项的个数,itemsTotal — 总共所需要加载项的个数)
     */
    static loading(callback) {
        Factory.manager.onProgress = callback
    }

    static buildColumn() {
        if (Factory.container[config.COLUMN]) {
            return Factory.container[config.COLUMN].clone()
        } else {
            let geometry = new THREE.BoxGeometry(config.BLOCK_SIZE, config.BLOCK_SIZE, config.BLOCK_SIZE);
            //生成box信息
            // geometry.computeBoundingBox()

            // geometry.position.set(0, 0, 0)
            // let material = new THREE.MeshToonMaterial({
            //     color: 0xffffff,
            //     'TOON': ''
            // });

            let texture = new THREE.TextureLoader().load("./image/wall.png");

            let material = new THREE.MeshPhongMaterial({emissive: '#f18484', map: texture, side: THREE.DoubleSide});

            let cube = new THREE.Mesh(geometry, material);

            Factory.container[config.COLUMN] = cube

            return cube
        }
    }


    static buildFloor() {
        if (Factory.container[config.FLOOR]) {
            Factory.container[config.FLOOR].material = Factory.container[config.FLOOR].material.clone()
            return Factory.container[config.FLOOR].clone()
        } else {
            let floorGeometry = new THREE.PlaneGeometry(config.BLOCK_SIZE, config.BLOCK_SIZE, config.BLOCK_SIZE, config.BLOCK_SIZE)
            let floor = new THREE.Mesh(floorGeometry, new THREE.MeshBasicMaterial({
                color: '#d3ebf8',
                side: THREE.DoubleSide
            }))
            Factory.container[config.FLOOR] = floor
            return floor
        }
    }


    static getModel(id) {
        let model = SkeletonUtils.clone(Factory.container[id])
        model.animations = Factory.container[id].animations
        return model
    }

    static buildModel(obj) {
        return new Promise((resolve, reject) => {
            if (Factory.container[obj.id]) {
                resolve(Factory.container[obj.id].clone())
            } else {
                new GLTFLoader(Factory.manager).load(config.CDN_URL_PREFIX + obj.url, (gltf) => {
                    // 模型发光
                    gltf.scene.traverse(function (child) {
                        if (child.isMesh) {
                            child.frustumCulled = false;
                            //模型阴影
                            child.castShadow = true;
                            //模型自发光
                            child.material.emissive = child.material.color;
                            child.material.emissiveMap = child.material.map;
                        }
                    })

                    gltf.scene.animations = gltf.animations

                    Factory.container[obj.id] = gltf.scene

                    resolve(gltf.scene)

                })
            }
        })
    }

    static buildFont() {
        return new Promise(resolve => {
            if (Factory.container[config.FONT]) {
                resolve(Factory.container[config.FONT])
            } else {
                new FontLoader().load(config.CDN_URL_PREFIX + 'fonts/FZCuQian-M17S_Regular.json', (font) => {
                    Factory.container[config.FONT] = font
                    resolve(font)
                })
            }
        })
    }


}

export default Factory
