import config from "./Config.js";
import anime from '../anime.js'
import Factory from "./Factory.js";


class Obstacle {

    /**
     * @param options {
     *     scene,
     *     type,
     *     position
     * },
     * @param callback 对象创建成功回调
     */
    constructor(options, callback) {
        if (!options || !options.scene || !options.type || !options.position) {
            throw '请传入必要参数'
        }
        if (options.type === 1) {
            this.initColumnParams(options.scene, options.position, Factory.container[config.COLUMN].clone(), callback)
        } else if (options.type === 2) {
            this.initGiftParams(options.scene, options.position, Factory.container[config.MODEL.GIFT.id], callback)
        }
        this.clock = new THREE.Clock()
    }

    initColumnParams(scene, position, cube, callback) {
        cube.position.set(position.x, 0, position.z)

        cube.position.y = .5
        cube.scale.y = 0

        anime({
            targets: cube.scale,
            y: 1,
            easing: 'linear',
            duration: 300,
            complete: () => {
                anime({
                    targets: cube.position,
                    y: 0,
                    easing: 'linear',
                    duration: 300,
                    complete: () => {
                        let box = new THREE.Box3();
                        box.setFromCenterAndSize(new THREE.Vector3(cube.position.x, cube.position.y, cube.position.z), new THREE.Vector3(config.BLOCK_SIZE, config.BLOCK_SIZE, config.BLOCK_SIZE));
                        this.self = {
                            box: box,
                            target: cube,
                            type: 1,
                        }
                        callback && callback(this)
                    }
                })
            }
        })

        scene.add(cube);

        // let helper = new THREE.Box3Helper(box, 'red');
        // scene.add(helper);
    }

    initGiftParams(scene, position, gltfScene, callback) {
        gltfScene.position.set(position.x, -.5, position.z)

        // gltfScene.scale.set(0.5, 0.5, 0.5)

        scene.add(gltfScene)

        let mixer = new THREE.AnimationMixer(gltfScene);

        let animations = []

        gltfScene.animations.forEach((clip) => {
            mixer.clipAction(clip).play();
            animations.push(mixer)
        });

        let box = new THREE.Box3();
        box.setFromCenterAndSize(new THREE.Vector3(gltfScene.position.x, 0, gltfScene.position.z), new THREE.Vector3(config.BLOCK_SIZE, config.BLOCK_SIZE, config.BLOCK_SIZE));

        this.self = {
            box: box,
            target: gltfScene,
            type: 2
        }


        this.animationTask = function (){
            let delta = this.clock.getDelta();
            // 重复播放动画
            animations.forEach(item => {
                item.update(delta)
            })
        }.bind(this)

        callback && callback(this)

    }


    destroy(scene) {
        anime({
            targets: this.self.target.position,
            y: -0.5,
            easing: 'linear',
            duration: 300,
            complete: () => {
                anime({
                    targets: this.self.target.scale,
                    y: 0,
                    easing: 'linear',
                    duration: 300,
                    complete: () => {
                        // this.self.dispose()
                        scene.remove(this.self.target)
                    }
                })
            }
        })
    }

}

export {
    Obstacle
}
