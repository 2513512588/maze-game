export default {
    BLOCK_SIZE: 1,
    COLUMN: 1,
    GIFT: 2,
    SPHERE: 3,
    FLOOR: 4,
    LOC_KEY: 'MAZE_GAME',
    SKIN_ARR: ['melon', 'football', 'earth', 'basketball'],
    LOC_MAP_KEY: 'MAZE_GAME_MAP_CUSTOM',
    INIT_KEY: 'MAZE_GAME_INIT',
    MAP_TYPE: {
        NORMAL: 1,
        CUSTOM: 2
    },
    MAIN_COLOR: '#99ea94',
    FLOOR_COLOR: '#d3ebf8',
    FONT: 'font',
    NAMES: 'names',
    // CDN_URL_PREFIX: 'https://maze-game.oss-cn-shenzhen.aliyuncs.com/',
    CDN_URL_PREFIX: './',
    MODEL: {
        //礼物
        GIFT: {
            id: 'MODEL_GIFT',
            url: 'model/gift/scene.gltf',
        },
        //闪电小子
        SONIC: {
            id: 'MODEL_SONIC',
            url: 'model/sonic/scene.gltf'
        },
        //外景
        ENVIRONMENT: {
            id: 'MODEL_ENVIRONMENT',
            url: 'model/environment/scene.gltf'
        },
        //小浣熊
        RACOON: {
            id: 'MODEL_RACOON',
            url: 'model/racoon/scene.gltf'
        },
        //僵尸
        ZOMBIE: {
            id: 'MODEL_ZOMBIE',
            url: 'model/zombie/scene.gltf'
        },
        //怪兽
        MONSTER: {
            id: 'MODEL_MONSTER',
            url: 'model/monster/scene.gltf'
        },
        //小伙子
        STEWART: {
            id: 'MODEL_STEWART',
            url: 'model/stewart/scene.gltf'
        },
        //默认骷髅人
        DEFAULT: {
            id: 'MODEL_DEFAULT',
            url: 'model/skeletonMan/scene.gltf'
        }
    },
    GAME_ONLINE: {
        SELF_KEY: 'MAZE_GAME_PLAYER_SELF',
        // BASE_URL: '183.56.214.183',
        BASE_URL: '192.168.0.103',
        SOCKET_PORT: '8091',
        HTTP_PORT: '8090',
        MESSAGE: {
            OPEN: 1,
            UPDATE_SKIN: 2,
            MOVE: 3,
            NOTICE: 4,
            UPDATE_FLOOR: 5,
            NOTICE_TYPE: {
                GAME_RESULT: 1,
                //重新开始游戏
                OPERATION: 2
            }
        }
    }
}
