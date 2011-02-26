<?php

class Path_Provider extends Model {
    private static $instance;

    private function Path_Provider(){
        parent::Model();
    }

    static function get_instance() {
        if( !isset(self::$instance) ) {
            self::$instance = new Path_Provider();
        }
        return self::$instance;
    }

    function setup_config(){
        //set username template
        $this->config->set_item('rosa_path_template',
            array('{%username%}' => rosa_user_info('username'))
        );

        //parse protocol themplate
        $protocol = $this->config->item('rosa_protocol');
        foreach( $protocol as $key => $path ){
            $protocol[$key] = $this->parse_path_template( $path );
        }
        $this->config->set_item('rosa_protocol', $protocol);
    }

    function js( $path ){
        return $this->get_path( $path );
    }

    function css( $path ){
        return $this->get_path( $path );
    }

    function app( $path, $data = array() ){
        if( is_array($path) ){
            foreach( $path as $i => $p ){
                $path[$i] = $this->get_path( $p );
            }
        } else {
            //make it to array
            $path = array( $this->get_path($path) );
        }
        //echo HTML
        ob_start();
        //extract data for html
        extract($data);
        //include html path
        foreach( $path as $p ){
            include $p;
        }
        //get content
        $buffer = ob_get_contents();
        @ob_end_clean();
        //echo html
        echo $buffer;
    }

    function get_path( $path, $parse = FALSE ){
        if( gettype( $path ) === 'array' ){
            $ary_path = array();
            foreach( $path as $p ){
                $ary_path[] = $this->get_real_path($p, $parse);
            }
            return $ary_path;
        } else {
            return $this->get_real_path($path, $parse);
        }
    }
    
    /* ===== PRIVATE ======================================================== */

    private function get_real_path( $path, $parse = FALSE ){
        $rosa_path = $this->config->item('rosa_protocol');
        foreach( $rosa_path as $namespace => $location ){
            if( strpos($path, $namespace) === 0 ){
                if( $parse === TRUE ){
                    return $this->parse_path_template($location.str_replace($namespace, '', $path));
                }
                return $location.str_replace($namespace, '', $path);
            }
        }
        return FALSE;
    }

    private function parse_path_template( $path ){
        $template = $this->config->item('rosa_path_template');
        foreach( $template as $temp => $str ){
            if( strpos($path, $temp) !== FALSE ){
                return str_replace($temp, $str, $path);
            }
        }
        return $path;
    }

}//end class
?>