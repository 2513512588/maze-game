maze_game_online
=======
 特性
======
 * 使用websocket协议
 * 多房间支持
 * 自定义迷宫
 * 视角跟随
 * 玩法新颖

安装
=====
composer install

启动停止(Linux系统)
=====
以debug方式启动  
```php start.php start  ```

以daemon方式启动  
```php start.php start -d ```

启动(windows系统)
======
双击start_for_win.bat  

注意：  
windows系统下无法使用 stop reload status 等命令  
如果无法打开页面请尝试关闭服务器防火墙  

测试
=======
浏览器访问 http://服务器ip或域:55151,例如http://127.0.0.1:55151

