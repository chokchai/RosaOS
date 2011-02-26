<?php

class Rosa_notepad extends Rosa_Application {

    function Rosa_notepad(){
        parent::Rosa_Application();
        //$this->load_api('file');
    }

    function save($file_id, $data){
        echo 'SAVE';
    }

    function open($file_id){
        echo 'OPEN';
    }

    function hello($a = FALSE){
        if($a != FALSE){
            return Array('A'=>$a, 'date'=>date('Y-m-d H:i:s'));
        } else {
            echo 'How are you ?';
        }
    }

}//end class

?>