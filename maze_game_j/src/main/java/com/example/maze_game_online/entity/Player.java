package com.example.maze_game_online.entity;

import com.example.maze_game_online.server.WebSocketServer;
import com.fasterxml.jackson.annotation.JsonIgnore;
import lombok.Data;
import java.util.Map;
import java.util.concurrent.CopyOnWriteArrayList;

@Data
public class Player {

    /**
     * 玩家唯一标识符
     */
    private String uuid;
    /**
     * 玩家皮肤
     */
    private String skin;

    /**
     * 游戏昵称
     */
    private String nickName;

    /**
     * 玩家位置
     */
    private Map<String, Object> position;

    /**
     * 玩家移动过的位置
     */
    private CopyOnWriteArrayList<Map<String, Object>> floors;

    /**
     * 玩家颜色
     */
    private String color;

    /**
     * 用户的连接对象
     */
    @JsonIgnore
    private WebSocketServer webSocketServer;

    public static Player find(String uuid, CopyOnWriteArrayList<Player> players){
        for (Player player : players) {
            if (uuid.equals(player.uuid)){
                return player;
            }
        }
        return null;
    }

}
