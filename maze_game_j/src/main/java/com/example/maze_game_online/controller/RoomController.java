package com.example.maze_game_online.controller;

import com.example.maze_game_online.entity.Room;
import com.example.maze_game_online.server.WebSocketServer;
import com.example.maze_game_online.utils.R;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.UUID;

@RestController
@RequestMapping("/room")
public class RoomController {

    @RequestMapping("/register")
    public R registerRoom(String map){
        Room room = new Room();
        String uuid = UUID.randomUUID().toString();
        room.setMap(map);
        room.setUuid(uuid);
        WebSocketServer.WEB_SOCKET_MAP.put(uuid, room);
        return R.ok().data("uuid", uuid).data("map", map);
    }

    @RequestMapping("/enter")
    public R enterRoom(String uuid){
        return R.ok().data("room", WebSocketServer.WEB_SOCKET_MAP.get(uuid));
    }


}
