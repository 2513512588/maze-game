package com.example.maze_game_online.utils;

import lombok.Data;
import lombok.experimental.Accessors;

import java.util.HashMap;
import java.util.Map;

/**
 * 统一返回数据格式
 */
@Data
@Accessors(chain = true)
public class R {

    private Integer code;
    private String message;
    private Boolean success;
    private Map<String, Object> data = new HashMap<String, Object>();

    private R(){}

    public static R ok(){
        R r = new R();
        r.setCode(20000);
        r.setMessage("成功");
        r.setSuccess(true);
        return r;
    }

    public static R error(){
        R r = new R();
        r.setCode(20001);
        r.setMessage("失败");
        r.setSuccess(false);
        return r;
    }

    public static R auto(Boolean success){
        return success ? ok() : error();
    }

    public R code(Integer code){
        this.code = code;
        return this;
    }

    public R message(String message){
        this.message = message;
        return this;
    }

    public R success(Boolean success){
        this.success = success;
        return this;
    }

    public R data(String key , Object value){
        data.put(key, value);
        return this;
    }

    public R data(Map<String, Object> map){
        this.data = map;
        return this;
    }


}
