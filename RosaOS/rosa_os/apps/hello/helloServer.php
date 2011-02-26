<?php

class HelloServer extends Rosa_Application {
    function getDate(){
        return Array(
            'message' => 'Server time is',
            'datetime' => date('Y-m-d H:i:s')
        );
    }
} //end class

?>
