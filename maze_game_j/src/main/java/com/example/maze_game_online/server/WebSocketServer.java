package com.example.maze_game_online.server;


import java.io.IOException;
import java.util.*;
import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.CopyOnWriteArrayList;
import javax.websocket.OnClose;
import javax.websocket.OnError;
import javax.websocket.OnMessage;
import javax.websocket.OnOpen;
import javax.websocket.Session;
import javax.websocket.server.PathParam;
import javax.websocket.server.ServerEndpoint;

import com.alibaba.fastjson.JSONObject;
import com.example.maze_game_online.entity.Message;
import com.example.maze_game_online.entity.MessageType;
import com.example.maze_game_online.entity.Player;
import com.example.maze_game_online.entity.Room;
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.SneakyThrows;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Component;
import org.springframework.util.StringUtils;


/**
 * uuid 房间号
 */
@SuppressWarnings("ALL")
@ServerEndpoint("/game/{roomUUID}")
@Component
@Slf4j
public class WebSocketServer {

    /**
     * concurrent包的线程安全Set，用来存放每个客户端对应的MyWebSocket对象。
     */
    public static final ConcurrentHashMap<String, Room> WEB_SOCKET_MAP = new ConcurrentHashMap<>();

    /**
     * 与某个客户端的连接会话，需要通过它来给客户端发送数据
     */
    public Session session;
    /**
     * 房间uuid
     */
    private String roomUUID;

    /**
     * 用户uuid
     */
    private String userUUID;


    /**
     * 连接建立成功调用的方法
     */
    @OnOpen
    public void onOpen(Session session, @PathParam("roomUUID") String roomUUID) throws IOException {
        if (WEB_SOCKET_MAP.containsKey(roomUUID)) {
            this.session = session;
            this.roomUUID = roomUUID;
        } else {
            if (session != null) {
                session.close();
            }
        }
    }

    /**
     * 连接关闭调用的方法
     */
    @OnClose
    public void onClose() {
        //从set中删除
        if (!StringUtils.isEmpty(roomUUID) && !StringUtils.isEmpty(userUUID)){
            Room room = WEB_SOCKET_MAP.get(roomUUID);
            if (!StringUtils.isEmpty(roomUUID) && room != null) {
                CopyOnWriteArrayList<Player> players = room.getPlayerList();
                Player player = Player.find(userUUID, players);

                players.remove(player);
                sendAllUser(players, Message.buildAllPlayers(players));
            }
        }
    }

    /**
     * @param session 连接用户的session
     * @param error   错误信息
     */
    @OnError
    public void onError(Session session, Throwable error) {
        error.printStackTrace();
        if(!StringUtils.isEmpty(userUUID)){
            Room room = WEB_SOCKET_MAP.get(roomUUID);
            if (!StringUtils.isEmpty(roomUUID) && room != null) {
                CopyOnWriteArrayList<Player> players = room.getPlayerList();
                sendAllUser(players, Message.buildAllPlayers(players));
            }
        }
    }

    /**
     * 收到客户端消息后调用的方法
     *
     * @param message 客户端发送过来的消息
     */
    @SneakyThrows
    @OnMessage
    public void onMessage(String message, Session session) {
        if (!StringUtils.isEmpty(roomUUID)){
            Room room = WEB_SOCKET_MAP.get(roomUUID);
            if (room != null) {
                Message message1 = JSONObject.parseObject(message, Message.class);
                CopyOnWriteArrayList<Player> players = room.getPlayerList();
                //找到发消息的玩家对象
                Player player = Player.find(message1.getSender(), players);
                //玩家加入 将玩家信息加入到 WEB_SOCKET_MAP 并转发给所有用户
                if (message1.getType() == MessageType.OPEN) {
                    if (player == null && !StringUtils.isEmpty(message1.getSender())) {
                        this.userUUID = message1.getSender();
                        player = new Player();
                        //设置初始化信息
                        player.setSkin(message1.getData().get("skin").toString());
                        player.setColor(message1.getData().get("color").toString());
                        player.setNickName(message1.getData().get("nickName").toString());
                        player.setUuid(message1.getSender());
                        Map<String, Object> position = (Map<String, Object>) message1.getData().get("position");
                        player.setPosition(position);
                        player.setWebSocketServer(this);
                        players.add(player);
                        sendAllUser(players, Message.buildAllPlayers(players));
                    }
                    //玩家修改皮肤
                } else if (message1.getType() == MessageType.UPDATE_SKIN) {
                    player.setSkin(message1.getData().get("skin").toString());
                    sendAllUser(players, message1);
                    //玩家移动
                } else if (message1.getType() == MessageType.MOVE) {
                    //将玩家移动发给所有房间用户
                    sendAllUser(players, message1);
                    // 游戏通知
                } else if (message1.getType() == MessageType.NOTICE) {
                    if (message1.getData().get("noticeType") == MessageType.NOTICE_TYPE_GAME_RESULT){
                        sendAllUser(players, message1);
                    }else if (message1.getData().get("noticeType") == MessageType.NOTICE_TYPE_OPERATION){
                        sendAllUser(players, message1);
                        players.clear();
                    }
                    // 更新游戏数据
                } else if (message1.getType() == MessageType.UPDATE_FLOOR) {
                    List<Map<String, Object>> floors = (List<Map<String, Object>>) message1.getData().get("floorList");
                    Map<String, Object> position = (Map<String, Object>) message1.getData().get("position");
                    player.setFloors(new CopyOnWriteArrayList<>(floors));
                    player.setPosition(position);
                    sendAllUser(players, Message.build().type(MessageType.UPDATE_FLOOR).data("player", player));
                }
            }
        }
    }


    /**
     * 实现服务器主动推送
     */
    @SneakyThrows
    public void sendMessage(String message) {
        if (session.isOpen()){
            synchronized(this.session) {
                this.session.getBasicRemote().sendText(message);
            }
        }
    }

    @SneakyThrows
    public void sendAllUser(CopyOnWriteArrayList<Player> players, Message message) {
        //将加入的玩家信息发个其他用户
        for (Player player1 : players) {
            player1.getWebSocketServer().sendMessage(new ObjectMapper().writeValueAsString(message));
        }
    }

}



