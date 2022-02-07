package com.example.maze_game_online.entity;

import lombok.Data;

import java.util.concurrent.CopyOnWriteArrayList;

@Data
public class Room {

    private String uuid;
    private String map;
    private CopyOnWriteArrayList<Player> playerList = new CopyOnWriteArrayList<>();

}
