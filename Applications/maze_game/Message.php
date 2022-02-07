<?php



/**
 * 1 玩家加入 2 修改皮肤 3 游戏操作 4 游戏通知 5 游戏移动位置记录上报
 */
class Message implements JsonSerializable
{
    /**
     * 消息类型
     */
    private $type;

    /**
     * 消息发送者的uuid
     */
    private $sender;

    /**
     * 消息数据
     */
    private $data;

    /**
     * @return mixed
     */
    public function getType()
    {
        return $this->type;
    }

    /**
     * @param mixed $type
     */
    public function setType($type)
    {
        $this->type = $type;
    }

    /**
     * @return mixed
     */
    public function getSender()
    {
        return $this->sender;
    }

    /**
     * @param mixed $sender
     */
    public function setSender($sender)
    {
        $this->sender = $sender;
    }

    /**
     * @return mixed
     */
    public function getData()
    {
        return $this->data;
    }

    /**
     * @param mixed $data
     */
    public function setData($data)
    {
        $this->data = $data;
    }

    public function jsonSerialize()
    {
        $data = [];
        foreach ($this as $key=>$val){
            if ($val !== null) $data[$key] = $val;
        }
        return $data;
    }
}