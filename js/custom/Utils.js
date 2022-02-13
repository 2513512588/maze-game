/**
 * 将真实坐标转化为地图上的坐标
 * @param namespace
 * @param position
 * @returns {{x: *, z: *}}
 */
export function coverMapPos(namespace, position) {
    let find = namespace.find(item => item.mapIndex.x === position.x && item.mapIndex.z === position.z)
    return find.realPos
}

/**
 * 将地图做坐标转化成真实坐标
 * @param namespace
 * @param position
 */
export function coverRealPos(namespace, position) {
    let find = namespace.find(item => item.realPos.x === position.x && item.realPos.z === position.z)
    return find.mapIndex
}

function S4() {
    return (((1 + Math.random()) * 0x10000) | 0).toString(16).substring(1);
}

/**
 * 用于生成uuid
 * @returns {string}
 */
export function uuid() {
    return (S4() + S4() + "-" + S4() + "-" + S4() + "-" + S4() + "-" + S4() + S4() + S4());
}

/**
 * 生成某个范围下的随机数
 * @param min
 * @param max
 * @returns {number}
 */
export function random(min, max){
    return Math.floor(Math.random() * (max - min) + min)
}

/**
 * 获取url参数
 * @param variable
 * @returns {string|boolean}
 */
export function getQueryVariable(variable) {
    let query = window.location.search.substring(1);
    let vars = query.split("&");
    for (var i=0;i<vars.length;i++) {
        var pair = vars[i].split("=");
        if(pair[0] === variable){return pair[1];}
    }
    return false;
}
