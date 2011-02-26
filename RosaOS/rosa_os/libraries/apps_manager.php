<?php

class Apps_Manager extends Model {

    private static $instance;

    private function Apps_Manager(){
        parent::Model();
    }

    static function get_instance() {
        if( !isset(self::$instance) ) {
            self::$instance = new Apps_Manager();
        }
        return self::$instance;
    }

    private $json_apps = Array();
    //full information of application
    private $apps_information = Array();
    //list of objectname, path, classname ( Index of Array is objectname )
    private $apps_class = Array();
    
    function init($disable = FALSE){
        $this->json_apps = $this->get_applications_json($disable);
        $this->apps_information = $this->parse_application_json($this->json_apps);

        //add system libraries to appsClass and appInformation for developer
        $this->load->helper('file');
        $libs = json_decode(read_file(R_BASE_PATH.'libraries/libraries.json'), TRUE);
        $libsFx = Array();
        foreach($libs as $class => $info ){
            $info['objectname'] = $class;
            $this->apps_class[$class] = $info;
            $this->apps_class[$class]['name'] = '_';
            $this->apps_information['rosa_core']['php'][] = $info;
        }

    }
    
    function folder_list(){
        $this->load->helper('directory');

        return Array( 
            "isFile" => is_file(R_APPS_PATH.'hello/hello.json'),
            "data" => read_file(R_APPS_PATH.'hello/hello.json') );
    }

    // get all Applications description (JSON file)
    // by traversal in 'rosa_os/apps/*' folder
    // so Applications description is name '${app_name}.json'
    // it return Array of json path
    // key = ${folder_name}, value = ${json_path}
    private function get_applications_json($disable = FALSE){
        $this->load->helper('directory');
        // use directory map in CI, also see
        // http://codeigniter.com/user_guide/helpers/directory_helper.html
        $apps_map = directory_map(R_APPS_PATH);

        $json = Array();
        foreach( $apps_map as $folder_name => $value ){
            //when index type is String, means is folder
            if(is_string($folder_name)){
                //check is have ${app_name}.xml ?
                $json_path = R_APPS_PATH.$folder_name.'/'.$folder_name.'.json';
                if(is_file($json_path)){
                    $json[$folder_name] = $json_path;
                } else if($disable == TRUE){
                    //try to include disable apps too
                    $json_disable_path = R_APPS_PATH.$folder_name.'/__disable_'.$folder_name.'.json';
                    if(is_file($json_disable_path)){
                        $json['__disable_'.$folder_name] = $json_disable_path;
                    }
                }
            }
        }
        return $json;
    }

    function parse_application_json( $json ){
        $this->load->helper('file');
        $apps = Array();
        foreach( $json as $name => $path ){
            //decode json to php array
            $info = json_decode(read_file($path), TRUE);
            //mark app is disable or not
            //by checking prefix of folder name
            $enable = 'Yes';
            if(strpos($name, '__disable_') === 0){
                $name = str_replace('__disable_', '', $name);
                $enable = 'No';
            }
            //set info
            if( $info ){
                //get startup js
                $js = Array();
                if(isset($info['js'])){
                    foreach($info['js'] as $j){
                        $js[] = R_HTTP_APPS_PATH.$name.'/'.$j.'.js';
                    }
                }
                //get startup css
                $css = Array();
                if(isset($info['css'])){
                    foreach($info['css'] as $c){
                        $css[] = R_HTTP_APPS_PATH.$name.'/'.$c.'.css';
                    }
                }
                //get php model
                $php = Array();
                if(isset($info['php'])){
                    foreach($info['php'] as $i=>$p){
                        if(is_string($p) ){
                            //file location only
                            $classname = ucfirst(array_pop(explode('/', $p)));
                            $php[$i] = Array(
                                'classname' => $classname,
                                'objectname' => strtolower($classname),
                                'file' => $name.'/'.$p
                            );
                        } else if(is_array($p)){
                            $php[$i] = Array(
                                'classname' => ucfirst(array_pop(explode('/', $p['file']))),
                                'objectname' => $p['name'],
                                'file' => $name.'/'.$p['file']
                            );
                        }
                        //for import apps
                        $this->apps_class[$php[$i]['objectname']] = $php[$i];
                        $this->apps_class[$php[$i]['objectname']]['name'] = $name;
                    }
                }
                //set about
                $about = Array(
                    'enable' => $enable,
                    'name' => $name,
                    'version' => '',
                    'description' => '',
                    'developer' => '',
                    'email' => '',
                    'website' => ''
                );
                if(isset($info['about'])){
                    $about = array_merge($about, $info['about']);
                }
                //set icon, if apps no icon is mean is can't run by user [ui mode]
                $icon = false;
                if(isset($info['icon'])){
                    $icon = Array(
                        'title' => 'unknow',
                        'iconImage' => '',
                    );
                    $icon = array_merge($icon, $info['icon']);
                    $icon['iconImage'] = R_HTTP_APPS_PATH.$name.'/'.$icon['iconImage'];
                }
                //set onstart for identify app to run and set param at start
                $onStart = Array(
                    'appName' => ucfirst($name),
                    'param' => ''
                );
                if(isset($info['onStart'])){
                    $onStart = array_merge($onStart, $info['onStart']);
                    $onStart['param'] = implode(',', $onStart['param']);
                }

                $apps[$name] = Array(
                    'about' => $about,
                    'onStart' => $onStart,
                    'icon' => $icon,
                    'js' => $js,
                    'css' => $css,
                    'php' => $php
                );
            }
        }
        return $apps;
    }


    function import_all_applications(){
        //convert all path to array.
        //and import all of them.
        foreach($this->apps_resource as $name => $app){
            //each files, import and register to API
            if( isset($app['php']['files']) ){
                foreach($app['php']['files'] as $f){
                    rosa_import('apps/'.$f['path']);
                    rosa_api_register($f['objectname'], new $f['classname']());
                }
            }
        }
    }

    function get_apps_information(){
        return $this->apps_information;
    }

    function get_apps_class(){
        return $this->apps_class;
    }

    function import_application($name){
        global $ROSA_API;
        if( ! isset($ROSA_API[$name]) && isset($this->apps_class[$name])){
            $class = $this->apps_class[$name]['classname'];
            //import and register to api
            rosa_import('apps/'.$this->apps_class[$name]['file']);
            rosa_api_register($name, new $class());
            return TRUE;
        }
        return FALSE;
    }

    function get_application_helper_information($name = FALSE){
        //get all application class information
        if($name == FALSE){
            $data = Array();
            foreach( $this->apps_information as $n => $app ){
                if( count($app['php']) == 0 ){
                    //is not have php_resource in server
                    //add only name and set default to other
                    $data[$n] = Array(
                        'name'=>$n,
                        'classname'=>$n,
                        'methods'=>Array()
                    );
                } else {
                    //is have php_resource
                    //get infor mation of them
                    foreach( $app['php'] as $p ){
                        $data[$p['objectname']] = $this->get_application_helper_information($p['objectname']);
                    }
                }
            }
            //sort for order by name
            sort($data);
            return $data;
        }

        //make sure is imported
        if( ! isset($ROSA_API[$name])){
            //import and register to api
            rosa_import('apps/'.$this->apps_class[$name]['file']);
        }
        //get class name
        $class = $this->apps_class[$name]['classname'];
        //get method
        $methods = get_class_methods($class);
        //get objectname[class nick-name]
        $objname = $this->apps_class[$name]['objectname'];
        //unset waste function
        return Array(
            'name' => $this->apps_class[$name]['name'],
            'classname' => $objname,
            'methods' => $methods
        );
    }

    function get_application_js($name = FALSE){
        if($name == FALSE ){
            //get all css
            $js = Array();
            foreach( $this->apps_information as $apps_res){
                if(isset($apps_res['js'])){
                    $js = array_merge($js, $apps_res['js']);
                }
            }
            return $js;
        } else {
            return $this->apps_information[$name]['js'];
        }
    }

    function get_application_css($name = FALSE){
        if($name == FALSE){
            //get all css
            $css = Array();
            foreach( $this->apps_information as $apps_res){
                if(isset($apps_res['css'])){
                    $css = array_merge($css, $apps_res['css']);
                }
            }
            return $css;
        } else {
            return $this->apps_information[$name]['css'];
        }
    }

}//end class

?>