// 这里写全局函数
// 生成唯一ID
function createOnlyId() {
    var random = "";
    for (var i = 0; i < 8; i++) {
        random += getRandomInt(0, 9)+"";
    }
    return random;
}
// 生成随机数
function getRandomInt(min, max) {
    return Math.floor(Math.random() * (max - min + 1)) + min;
}
