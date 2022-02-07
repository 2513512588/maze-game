package com.example.maze_game_online.entity;

import lombok.Data;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

@Data
public class Message {

    /**
     * 消息类型
     * 1 玩家加入 2 修改皮肤 3 游戏操作 4 游戏通知 5 游戏移动位置记录上报
     */
    private Integer type;

    private String sender;

    private Map<String, Object> data = new HashMap<>();

    private Message(){

    }

    public static Message build(){
        return new Message();
    }

    public Message type(Integer type){
        this.setType(type);
        return this;
    }

    public Message data(String key, Object value){
        this.data.put(key, value);
        return this;
    }

    public Message sender(String uuid){
        this.setSender(uuid);
        return this;
    }

    public static Message buildAllPlayers(List<Player> players){
        return Message.build().type(MessageType.OPEN).data("players", players);
    }
}
