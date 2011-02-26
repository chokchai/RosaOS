<?php

class Rosa extends Controller {

    private $file;
    private $user;
    private $apps;
    private $path;

    function Rosa() {
        parent::Controller();
	
		//check is installed ?
        if( ! is_file(R_AB_PATH.'rosa_os/index.html')){
            echo '<meta http-equiv="Refresh" content="0; url=install/index" />';
			exit();
        }
		
        $this->load->database();

        /* ---------------------------------------------------------------------
         * ROSA INITALIZE
         * -------------------------------------------------------------------*/

        //load kernal
        rosa_import('libraries', array( 'user_manager',
                                        'file_system',
                                        'apps_manager',
                                        'path_provider'
                                    )
                   );

        //decare system libraries
        $this->file = File_System::get_instance();
        $this->user = User_Manager::get_instance();
        $this->apps = Apps_Manager::get_instance();
        $this->path = Path_Provider::get_instance();

        //seup config
        if( $this->user->is_login() ){
            $this->path->setup_config();
        }

        //register default api
        rosa_api_register(Array(
            'file' => File_System::get_instance(),
            'user' => User_Manager::get_instance(),
            'apps' => Apps_Manager::get_instance(),
            'path' => Path_Provider::get_instance()
        ));
    }

    function index() {
        //check user is login
        if( ! $this->user->is_login() ){
            redirect('login');
        } else {
            //init application manager
            $this->apps->init();
            //load config
            $rosa_path = $this->config->item('rosa_path');

            //default js and css
            $init['rosa']['user'] = $this->user->get_info();
            $init['rosa']['core_js'] = Array(
                $rosa_path['os']['js'] . 'jquery/jquery-1.4.4.js',
                $rosa_path['os']['js'] . 'jquery/jquery-ui-1.8.6.js',
                $rosa_path['os']['js'] . 'jquery/jquery.tmpl.js',
                $rosa_path['os']['js'] . 'jquery/jquery.ocupload.js',
                $rosa_path['os']['js'] . 'jquery/jquery.getcss.js',
                $rosa_path['os']['js'] . 'jquery/jquery.jqote2.js',
                $rosa_path['os']['js'] . 'jquery/jquery.rightclick.js',
                $rosa_path['os']['js'] . 'jquery/jquery.scrollto.js',
                $rosa_path['os']['js'] . 'jquery/jquery.jplayer.js',
                $rosa_path['os']['js'] . 'jquery/jquery.contextMenu.js',
                $rosa_path['os']['js'] . 'rosa/rosa_core.js',
                $rosa_path['os']['js'] . 'rosa/rosa_processManager.js',
                $rosa_path['os']['js'] . 'rosa/rosa_applicationManager.js',
                $rosa_path['os']['js'] . 'rosa/rosa_openwith.js',
                $rosa_path['os']['js'] . 'rosa/rosa_init.js'
            );
            $init['rosa']['css'] = array(
                $rosa_path['os']['css'] . 'rosa_core.css',
                $rosa_path['os']['css'] . 'jquery_ui_theme/rosa_original/all.css',
                $rosa_path['os']['css'] . 'jplayer.blue.monday.css'
            );

            //it use for init Application heper
            $init['rosa']['application_helper'] = $this->apps->get_application_helper_information();

            //add all apps js and css startup
            $apps_js = $this->apps->get_application_js();
            foreach($apps_js as $js){
                $init['rosa']['application_js'][] = $js;
            }
            $apps_css = $this->apps->get_application_css();
            foreach($apps_css as $css){
                $init['rosa']['css'][] = $css;
            }

            $this->load->view('rosa_desktop', $init);
        }
    }

    function api($class, $method) {
        //check user is login
        if( ! $this->user->is_login() ){
            redirect('login');
        } else {
            $this->apps->init();
            $this->apps->import_application($class);

            //param form post
            $param = $this->input->post('param');
            //get api class
            $api_class =& rosa_api($class);
            $api_method = $method;
            //call api
            $result = call_user_func_array(Array(&$api_class, $api_method), $param);
            if (is_array($result)) {
                echo json_encode($result);
            }
        }
    }

    function login( $status = FALSE ) {
        //load config
        $rosa_path = $this->config->item('rosa_path');

        $data['js'] = Array(
            $rosa_path['os']['js'] . 'jquery/jquery-1.4.4.js',
            $rosa_path['os']['js'] . 'jquery/jquery-ui-1.8.6.js',
            $rosa_path['os']['js'] . 'rosa/rosa_core.js',
            $rosa_path['os']['js'] . 'rosa/rosa_login.js'
        );
        $data['css'] = array(
            $rosa_path['os']['css'] . 'rosa_core.css',
            $rosa_path['os']['css'] . 'jquery_ui_theme/rosa_original/all.css'
        );
        $data['status'] = $status;

        $this->load->view('rosa_login', $data);
    }

    function do_login() {
        //logout current user
        $this->user->logout();
        
        $success = $this->user->authen( $this->input->post('username'),
                                        $this->input->post('password')
                                      );
        if ($success) {
            redirect('/');
        } else {
            redirect('login/login_error');
        }
    }

    function signup(){
        //logout current user
        $this->user->logout();

        $p = $_POST;

        $username = $p['username'];
        $password = $p['password'];
        $password_confirm = $p['password_confirm'];
        $email = $p['email'];

        if( $this->user->username_exits($username) ){
            //username is exits
            redirect('login/username_error');
        } else if( $password != $password_confirm ){
            //password in valid
            redirect('login/password_error');
        } else {
            unset($p['password_confirm']);
            //regis user
            $success = $this->user->create_user( $p );
            //redirect
            ($success !== TRUE)? redirect('login/create_error') : redirect('/');
        }
    }

    function downloads( $rosa_name ){
		ini_set("memory_limit", "256M");
        //check user is login
        if( ! $this->user->is_login() ){
            redirect('login');
        }

        $this->load->library('zip');
        $this->load->helper('download');
        
        //---- MULTIPLE FILE DOWNLOAD ----//        
        if( strpos($rosa_name, '_') != FALSE ){
            $r_name = explode('_',$rosa_name);
            foreach( $r_name as $r ){
                $f_id = $this->file->rosa_name_to_id($r, -1);
                //get file_info without optional ( full_path, path, size )
                $f_info = $this->file->file_info($f_id, TRUE, TRUE);
                if( $f_info ){
                   if( $f_info['type'] == 0 ){
                        //is folder
                        $this->download_folder($f_info['id']);
                    } else {
                        //is file
                        //$data = $f_info['file_data'];
                        $data = file_get_contents(R_USERS_FILE_PATH.$f_info['fullrosaname']);
                        $this->zip->add_data($f_info['fullname'], $data);
                    }
                } else {
                    echo 'FILE_NOT_FOUND OR ACCESS_DENINE';
                    return TRUE;
                }
            }
            //download zip
            $this->zip->download('rosa_files.zip');
            return TRUE;
        }

        //---- SINGLE FILE DOWNLOAD ----//
        $f_id = $this->file->rosa_name_to_id($rosa_name, -1);
        //get file_info without optional ( full_path, path, size )
        $f_info = $this->file->file_info($f_id, TRUE, TRUE);
        if( $f_info ){
            //download using CI download helper
            if( $f_info['type'] == 1 ){
                //download files
                //$data = $f_info['file_data'];
                $data = file_get_contents(R_USERS_FILE_PATH.$f_info['fullrosaname']);
                force_download($f_info['fullname'], $data);
            } else {
                //add data to zip
                $this->download_folder($f_info['id']);
                //let it download
                $this->zip->download($f_info['name'].'.zip');
                echo 'CAN_NOT_DOWNLOAD_EMPTY_FOLDER';
            }
        } else {
            echo 'FILE_NOT_FOUND OR ACCESS_DENINE';
        }
    }

    private function download_folder( $id ){
        //download folder .zip
        $tree = $this->file->explore( $id, TRUE );
        $root = $tree['self'];
        //have file in folder
        if(isset($tree['files']['error'])){
            if(isset($root)){
                $this->zip->add_dir($root['name']);
            }
            return FALSE;
        }
        //get each file in folder to zip
        $find_list = array($tree['files']);
        do {
            $folder = array_shift($find_list);
            foreach ($folder as $f) {
                if ($f['type'] == 0) {
                    //is folder
                    if(isset($f['inner'])){
                        $find_list[] = $f['inner'];
                    }
                    //add zip folder
                    $this->zip->add_dir($root['name'].'/'.$f['path'].$f['name']);
                } else if ($f['type'] == 1){
                    $data = '';
                    $name = $root['name'].'/'.$f['path'].$f['fullname'];
                    if($f['type'] == 1){
                        //$data = $this->file->file_data($f['id']);
                        $data = file_get_contents(R_USERS_FILE_PATH.$f['fullrosaname']);
                    }
                    //add zip file
                    $this->zip->add_data($name, $data);
                }
            }
        } while (count($find_list) > 0);
    }

    function files( $rosa_name ){
		ini_set("memory_limit", "256M");
        //check user is login
        if( ! $this->user->is_login() ){
            redirect('login');
        }
        //convert rosa_name to id
        $id = $this->file->rosa_name_to_id($rosa_name, -1);
        $f_info = $this->file->mini_file_info($id);
        if( $f_info ){
            //get mimes type from file upload
            $this->load->library('upload');
            $mime = $this->upload->mimes_types($f_info['extension']);
            if( $mime ){
                if( is_array( $mime ) ){
                    $mime = $mime[0];
                }
                //get file data
                //$file_data = $this->file->file_data( $f_info['id'] );
                $file_data = file_get_contents(R_USERS_FILE_PATH.$f_info['fullrosaname']);
                // outputing HTTP headers
                header('Content-Length: '.strlen($file_data));
                header('Content-type: '.$mime);
                // outputing files
                echo $file_data;
            } else {
                echo 'CAN_NOT_OPEN_FILES_TYPE';
            }
        } else {
            echo 'FILE_NOT_FOUND OR ACCESS_DENINE';
        }
    }

    function logout() {
        $this->user->logout();
        redirect('login');
    }

}//end class
?>