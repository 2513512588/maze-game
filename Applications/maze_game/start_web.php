<?php


use Workerman\Worker;
use Workerman\Protocols\Http\Request;
use Workerman\Protocols\Http\Response;
use Workerman\Connection\TcpConnection;

require_once __DIR__ . '/../../vendor/autoload.php';

// WebServer
$web = new Worker("http://0.0.0.0:8090");
// WebServer进程数量
$web->count = 2;

$web->onWorkerStart = function () {
    global $global;
    $global = new \GlobalData\Client('0.0.0.0:2207');
};

$web->name = 'Web';

define('WEBROOT', __DIR__ . DIRECTORY_SEPARATOR . 'web');

$web->onMessage = function (TcpConnection $connection, Request $request) {
    $_GET = $request->get();
    $_POST = $request->post();
    $path = $request->path();

    if ($path === '/') {
        $connection->send(exec_html_file(WEBROOT.'/index.html'));
        return;
    }

    $file = realpath(WEBROOT . $path);

    global $global;

    if ($path === '/room/register') {
        $room = new Room();
        $room_id = Utils::guid();
        $room->setUuid($room_id);
        $room->setMap($_POST['map']);

        $GLOBAL_DATA = $Old_data = $global->Global_Data;
        $GLOBAL_DATA[$room_id] = $room;

        if (!$global->add('Global_Data', $GLOBAL_DATA)) {
            $global->cas('Global_Data', $Old_data, $GLOBAL_DATA);
        }


        $connection->send((new Response())->
        header("Access-Control-Allow-Origin", "*")->
        header("Access-Control-Allow-Methods", "*")->withBody(json_encode(array(
                'success' => true,
                'data' => $room,
                'message' => '成功',
                'code' => 200
            ))
        ));
    } else if ($path === '/room/enter') {

        $GLOBAL_DATA = $global->Global_Data;
        $connection->send((new Response())->
        header("Access-Control-Allow-Origin", "*")->
        header("Access-Control-Allow-Methods", "*")->withBody(json_encode(array(
            'success' => true,
            'data' => array(
                'room' => $GLOBAL_DATA[$_GET['uuid']]
            ),
            'message' => '成功',
            'code' => 200
        ))));
        //包含html
    } else{
        $connection->send((new Response())->withFile($file));
    }

};

function exec_html_file($file)
{
    \ob_start();
    // Try to include php file.
    try {
        include $file;
    } catch (\Exception $e) {
        echo $e;
    }
    return \ob_get_clean();
}


// 如果不是在根目录启动，则运行runAll方法
if (!defined('GLOBAL_START')) {
    Worker::runAll();
}

