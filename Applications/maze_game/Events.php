<?php

/**
 * 用于检测业务代码死循环或者长时间阻塞等问题
 * 如果发现业务卡死，可以将下面declare打开（去掉//注释），并执行php start.php reload
 * 然后观察一段时间workerman.log看是否有process_timeout异常
 */

//declare(ticks=1);
use \GatewayWorker\Lib\Gateway;

/**
 * 主逻辑
 * 主要是处理 onConnect onMessage onClose 三个方法
 * onConnect 和 onClose 如果不需要可以不用实现并删除
 */
class Events
{

    /**
     * @var $Map <$room_id, room>
     */

    public static function onConnect($client_id){
        global $global;
        $global = new \GlobalData\Client('0.0.0.0:2207');
    }


    /**
     * 当客户端发来消息时触发
     * @param int $client_id 连接id
     * @param mixed $message 具体消息
     * @throws Exception
     */
    public static function onMessage($client_id, $message)
    {

        $message_data = json_decode($message, true);

        global $global;
        $GLOBAL_DATA = $global->Global_Data;

        switch ($message_data['type']) {
            case MessageType::$OPEN:
                $room_id = $message_data['data']['roomId'];
                $_SESSION['room_id'] = $room_id;
                $_SESSION['user_id'] = $message_data['sender'];
                //通过房间id 找出房间列表

                if ($GLOBAL_DATA[$room_id] === '') {
                    Gateway::closeCurrentClient();
                } else {

                    $room = $GLOBAL_DATA[$room_id];
                    $player_list = $room->getPlayerList();

                    $player = new Player();
                    $player->setSkin($message_data['data']['skin']);
                    $player->setColor($message_data['data']['color']);
                    $player->setNickName($message_data['data']['nickName']);
                    $player->setUuid($message_data['sender']);
                    $player->setPosition($message_data['data']['position']);
                    $player_list[$message_data['sender']] = $player;
                    Gateway::joinGroup($client_id, $room_id);

                    $message_result = new Message();
                    $message_result->setType(MessageType::$OPEN);
                    $message_result->setData(array(
                        'players' => array_values($player_list)
                    ));

                    $room->setPlayerList($player_list);
                    $GLOBAL_DATA[$room_id] = $room;

                    self::updateGlobalData($GLOBAL_DATA);
                    Gateway::sendToGroup($room_id, json_encode($message_result));
                }
                return;
            //玩家修改皮肤
            case MessageType::$UPDATE_SKIN:
                $room_id = $_SESSION['room_id'];
                $room = $GLOBAL_DATA[$room_id];
                $player_list = $room->getPlayerList();
                $player = $player_list[$message_data['sender']];
                $player->setSkin($message_data['data']['skin']);

                $player_list[$message_data['sender']] = $player;
                $room->setPlayerList($player_list);
                $GLOBAL_DATA[$room_id] = $room;
                self::updateGlobalData($GLOBAL_DATA);
                Gateway::sendToGroup($room_id, $message);
                return;
            //玩家移动
            case MessageType::$MOVE:
                $room_id = $_SESSION['room_id'];
                Gateway::sendToGroup($room_id, $message);
                return;
            //游戏通知
            case MessageType::$NOTICE:
                $room_id = $_SESSION['room_id'];
                $notice_type = $message_data['data']['noticeType'];
                Gateway::sendToGroup($room_id, $message);
                if ($notice_type === MessageType::$NOTICE_TYPE_OPERATION) {
                    $player_list = $GLOBAL_DATA[$room_id]->getplayerList();
                    $player_list = [];
                    $GLOBAL_DATA[$room_id]->setPlayerList($player_list);
                    self::updateGlobalData($GLOBAL_DATA);
                }
                return;
            //玩家数据同步
            case MessageType::$UPDATE_FLOOR:
                $floor_list = $message_data['data']['floorList'];
                $position = $message_data['data']['position'];
                $room_id = $_SESSION['room_id'];
                $room = $GLOBAL_DATA[$room_id];
                $player_list = $room->getPlayerList();
                $player = $player_list[$message_data['sender']];
                $player->setPosition($position);
                $player->setFloors($floor_list);

                $room->setPlayerList($player_list);
                $GLOBAL_DATA[$room_id] = $room;
                self::updateGlobalData($GLOBAL_DATA);

                Gateway::sendToGroup($room_id, json_encode(array(
                    'type' => MessageType::$UPDATE_FLOOR,
                    'data' => array(
                        'player' => $player
                    )
                )));
                return;
        }
    }

    /**
     * 当用户断开连接时触发
     * @param int $client_id 连接id
     */
    public static function onClose($client_id)
    {

        global $global;
        $GLOBAL_DATA = $global->Global_Data;

        $room_id = $_SESSION['room_id'];
        $user_id = $_SESSION['user_id'];
        $room = $GLOBAL_DATA[$room_id];
        $player_list = $room->getPlayerList();

        unset($player_list[$user_id]);

        $room->setPlayerList($player_list);
        $GLOBAL_DATA[$room_id] = $room;
        self::updateGlobalData($GLOBAL_DATA);

        $message_result = new Message();
        $message_result->setType(MessageType::$OPEN);
        $message_result->setData(array(
            'players' => array_values($player_list)
        ));

        Gateway::sendToGroup($room_id, json_encode($message_result));
    }


    public static function updateGlobalData($new_value){
        do
        {
            global $global;
            $old_data = $global->Global_Data;
        }
        while(!$global->cas('Global_Data', $old_data, $new_value));
    }

}
