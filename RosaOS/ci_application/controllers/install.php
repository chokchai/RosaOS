<?

class Install extends Controller {

    private $table_user = 'users';

    function Install() {
        parent::Controller();
		
        //check is installed ?
        if(is_file(R_AB_PATH.'rosa_os/index.html')){
            show_error('Rosa Operating System is Installed. You can not install again !!! <p/> By the way you can re-install by drop table in database and delete flag file at "rosa_os/index.html"');
        }
    }

    function index() {
        //check Compatibility
        $data['php'] = phpversion() > 4;
        $data['database'] = is_really_writable(R_AB_PATH . 'ci_application/config/database.php');
        $data['config'] = is_really_writable(R_AB_PATH . 'ci_application/config/config.php');
        $data['htaccess'] = is_really_writable(R_AB_PATH . '.htaccess');
        $data['rosa_os'] = is_really_writable(R_AB_PATH . 'rosa_os/');
		$data['apps'] = is_really_writable(R_AB_PATH . 'rosa_os/apps/');
		$data['users_file'] = is_really_writable(R_AB_PATH . 'rosa_os/users_file/');
        $data['zip'] = class_exists('ZipArchive');
        //all of section is pass ?
        $pass = TRUE;
        foreach ($data as $val) {
            if (!$val) {
                $pass = FALSE;
                break;
            }
        }
        $data['pass'] = $pass;

        $data['css'] = Array('install/compat.css');
        $this->view('compatibility', $data);
    }

    function config_ci($status = FALSE) {
        $this->load->helper('file');
        //config ci
        $data = Array('step' => 1, 'status'=>$status);
        $this->view('ci_config', $data);
    }

    function config_db($status = FALSE) {
        $this->load->helper('file');
        //config database
        $data = Array('step' => 2, 'status'=>$status);
        $this->view('db_config', $data);
    }

    function assign_admin($status = FALSE) {
        //config use and password
        $data = Array('step' => 3, 'status'=>$status);

        $data['css'] = Array('install/assign_admin.css');
        $this->view('assign_admin', $data);
    }

    function final_step($status = FALSE) {
        $this->load->helper('file');
        $data = Array('step' => 4, 'status'=>$status);
        
        //----- CHOWN APPS FOLDER --------------------------------------------//

        //rename original folder for temp
        rename(R_AB_PATH . 'rosa_os/apps', R_AB_PATH . 'rosa_os/original_apps');
        //copy file in original apps to apps folder ( for get chown folder to www-data )
        $this->copy(R_AB_PATH . 'rosa_os/original_apps', R_AB_PATH . 'rosa_os/apps');
        //remove original folder
        //delete_files(R_AB_PATH . 'rosa_os/original_apps/', TRUE);
        //rmdir(R_AB_PATH . 'rosa_os/original_apps/');

        //----- CHOWN USERS_FILE FOLDER --------------------------------------//

        //rename original folder for temp
        rename(R_AB_PATH . 'rosa_os/users_file', R_AB_PATH . 'rosa_os/original_users_file');
        //copy file in original apps to apps folder ( for get chown folder to www-data )
        $this->copy(R_AB_PATH . 'rosa_os/original_users_file', R_AB_PATH . 'rosa_os/users_file');
        //remove original folder
        //delete_files(R_AB_PATH . 'rosa_os/original_users_file/', TRUE);
        //rmdir(R_AB_PATH . 'rosa_os/original_users_file/');

        //add flag file to let system know rosa os is install ed
        write_file(R_AB_PATH.'rosa_os/index.html', '<html><head><title>403 Forbidden</title></head><body><p>Directory access is forbidden.</p></body></html>');

        $data['css'] = Array('install/final.css');
        $this->view('final', $data);
    }

    function config_ci_save() {
        $this->load->helper('file');
        if( is_really_writable(R_AB_PATH . 'ci_application/config/config.php') ){
            write_file(R_AB_PATH . 'ci_application/config/config.php', $_POST['source']);
            //load new config
            $CI =& get_instance();
            $CI->config->load();
            redirect('install/config_db/');
        }
        redirect('install/config_ci/error');
    }

    function config_db_save() {
        $this->load->helper('file');
        if( is_really_writable(R_AB_PATH . 'ci_application/config/database.php') ){
            write_file(R_AB_PATH . 'ci_application/config/database.php', $_POST['source']);
			redirect('install/assign_admin/');
        }
        redirect('install/config_db/error');
    }

    function do_assign_admin(){
        $user = $this->input->post('username');
        $pass = $this->input->post('password');
        $re_pass = $this->input->post('re_password');
        $email = $this->input->post('email');

        if( $pass !== '' && $pass == $re_pass ){
			$this->load->helper('file');
            //insert database table
            $this->load->database();
			$sql_list = explode(';', read_file(R_AB_PATH . 'rosa_os/rosa_os.sql'));
			array_pop($sql_list);//pop empty string
			foreach($sql_list as $sql){
				$this->db->query($sql);
			}
            //insert addmin user
            $this->db->insert(
                $this->table_user,
                Array(
                    'username' => $user,
                    'password' => md5($pass),
                    'email' => $email,
                    'date_register' => rosa_datetime(),
                    'group_id' => 1,
                    'quota_max' => 1024
                )
            );
			//load kernal
			rosa_import('libraries', Array('user_manager', 'file_system'));
			//register default api
			rosa_api_register(Array( 'user' => User_Manager::get_instance(), 'file' => File_System::get_instance() ));
			$this->user = rosa_api('user');
            //authen
            $this->user->authen($user, $pass);
			//create default folder
			$this->user->create_default_folder();
            redirect('install/final_step/');
        }
        redirect('install/assign_admin/error');
    }
	
		
	function uninstall(){
		$this->load->helper('file');
		delete_files(R_AB_PATH . 'rosa_os/users_file/', TRUE);
        rmdir(R_AB_PATH . 'rosa_os/users_file/');
		delete_files(R_AB_PATH . 'rosa_os/apps/', TRUE);
        rmdir(R_AB_PATH . 'rosa_os/apps/');
		//unlink(R_AB_PATH .'rosa_os/index.html');
		echo 'UN_INSTALL_SUCCESS';
	}

    private function view($view = 'prepare', $data = Array()) {
        $rosa_path = $this->config->item('rosa_path');
        //merge to default array
        $data = array_merge(
                        //default added
                        Array(
                            //menu list can config for template
                            'step_list' => Array(
                                'Compatibility' => 'install/index',
                                'Config CodeIgniter' => 'install/config_ci',
                                'Config Database' => 'install/config_db',
                                'Assign Administrator' => 'install/assign_admin',
                                'Finish' => 'install/final_step'
                            ),
                            'step' => 0,
                            'js' => Array(),
                            'css' => Array()
                        ), $data);
        //set rosa prefix to js and css
        foreach ($data['js'] as $i => $js) {
            $data['js'][$i] = $rosa_path['os']['js'] . $js;
        }
        foreach ($data['css'] as $i => $css) {
            $data['css'][$i] = $rosa_path['os']['css'] . $css;
        }
        //add default js
        $data['js'] = array_merge(
                        Array(
                            $rosa_path['os']['js'] . 'jquery/jquery-1.4.4.js',
                            $rosa_path['os']['js'] . 'jquery/jquery-ui-1.8.6.js',
                            $rosa_path['os']['js'] . 'rosa/install/core.js',
                            $rosa_path['os']['js'] . 'rosa/install/codemirror/codemirror.js'
                        ), $data['js']
        );
        //add default css
        $data['css'] = array_merge(
                        Array(
                            $rosa_path['os']['css'] . 'rosa_core.css',
                            $rosa_path['os']['css'] . 'jquery_ui_theme/rosa_original/all.css',
                            $rosa_path['os']['css'] . 'install/core.css',
                            $rosa_path['os']['css'] . 'install/codemirror.css'
                        ), $data['css']
        );

        $data['base_url'] = base_url();
        //for parse to adminstrator template!!
        $this->load->view('rosa_install/header', $data);
        $this->load->view('rosa_install/' . $view, $data);
        $this->load->view('rosa_install/footer', $data);
    }

    /* -------------------------------------------------------------------------
     * Source From : gimmicklessgpt at gmail dot com@php.net
     * (http://th.php.net/manual/en/function.copy.php#91010)
     *
     * Here's a simple recursive function to copy entire directories
     * Note to do your own check to make sure the directory exists that you first call it on. 
     * ----------------------------------------------------------------------- */

    private function copy($src, $dst) {
        $dir = opendir($src);
        mkdir($dst);
        while (false !== ( $file = readdir($dir))) {
            if (( $file != '.' ) && ( $file != '..' )) {
                if (is_dir($src . '/' . $file)) {
                    $this->copy($src . '/' . $file, $dst . '/' . $file);
                } else {
                    copy($src . '/' . $file, $dst . '/' . $file);
                }
            }
        }
        closedir($dir);
    }

}

// end class
?>
