<?php
use \Workerman\Worker;
require_once __DIR__ . '/../../vendor/autoload.php';

// 监听端口
$worker = new GlobalData\Server('0.0.0.0', 2207);

// 如果不是在根目录启动，则运行runAll方法
if(!defined('GLOBAL_START'))
{
    Worker::runAll();
}
