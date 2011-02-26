<?php
class Rosa_Application extends Model {
    function Rosa_Application(){
        parent::Model();
    }
    //for load rosa_api
    function load_api($name, $objName = FALSE){
        if(is_array($name)){
            //when is array load each items
            foreach( $name as $n ){
                $this->load_api($n);
            }
        } else {
            global $ROSA_API;
            //check is already in API LIBRARIES ?
            if(isset($ROSA_API[$name])){
                //when found
                if( is_string($objName) ){
                    $this->$objName =& rosa_api($name);
                } else {
                    $this->$name =& rosa_api($name);
                }
            } else {
                //when not found try to load
                //by using appManager to import
                $apps =& rosa_api('apps');
                $status = $apps->import_application($name);
                if($status === TRUE){
                    //load again
                    $this->load_api($name);
                }
            }
        }//end else
    }

}//end class

?>
