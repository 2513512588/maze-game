<?php

/**
 * 消息类型
 * 1 玩家加入 2 修改皮肤 3 游戏操作 4 游戏通知 5 游戏移动位置记录上报
 */

class MessageType
{

    public static $OPEN = 1;
    public static $UPDATE_SKIN = 2;
    public static $MOVE = 3;
    public static $NOTICE = 4;
    public static $UPDATE_FLOOR = 5;
    public static $NOTICE_TYPE_GAME_RESULT = 1;
    public static $NOTICE_TYPE_OPERATION = 2;

}