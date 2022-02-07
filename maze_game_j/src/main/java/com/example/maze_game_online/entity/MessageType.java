package com.example.maze_game_online.entity;

/**
 * 消息类型
 * 1 玩家加入 2 修改皮肤 3 游戏操作 4 游戏通知 5 游戏移动位置记录上报
 */
public class MessageType {

    public static final Integer OPEN = 1;
    public static final Integer UPDATE_SKIN = 2;
    public static final Integer MOVE = 3;
    public static final Integer NOTICE = 4;
    public static final Integer UPDATE_FLOOR = 5;
    public static final Integer NOTICE_TYPE_GAME_RESULT = 1;
    public static final Integer NOTICE_TYPE_OPERATION = 2;


}
