<?php



class Room implements JsonSerializable
{

    private $uuid;
    private $map;
    /**
     * <UserId, Player>
     */
    private $playerList;

    /**
     * @return mixed
     */
    public function getUuid()
    {
        return $this->uuid;
    }

    /**
     * @param mixed $uuid
     */
    public function setUuid($uuid)
    {
        $this->uuid = $uuid;
    }

    /**
     * @return mixed
     */
    public function getMap()
    {
        return $this->map;
    }

    /**
     * @param mixed $map
     */
    public function setMap($map)
    {
        $this->map = $map;
    }

    /**
     * @return mixed
     */
    public function getPlayerList()
    {
        return $this->playerList;
    }

    /**
     * @param mixed $playerList
     */
    public function setPlayerList($playerList)
    {
        $this->playerList = $playerList;
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