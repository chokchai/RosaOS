<?php

class Rosa_taskbar extends Rosa_Application {

    function Rosa_taskbar(){
        parent::Rosa_Application();
        $this->load_api('apps');
    }
  
    function getApplicationInformation(){
        return $this->apps->get_apps_information();
    }

}

?>