<?php

class Admin extends Controller {

    private $user;

    function Admin() {
        parent::Controller();
		
		$this->load->database();
		
        //load kernal
        rosa_import('libraries', Array('user_manager', 'file_system',
            'apps_manager', 'path_provider',
            'administrator'));
        //register default api
        rosa_api_register(Array(
            'file' => File_System::get_instance(),
            'user' => User_Manager::get_instance(),
            'apps' => Apps_Manager::get_instance(),
            'path' => Path_Provider::get_instance()
        ));

        $this->admin = Administrator::get_instance();
        $this->user = rosa_api('user');
        $this->apps = rosa_api('apps');
    }

    function index() {
        $this->view();
    }

    /* -------------------------------------------------------------------------
     * APPLICATION
     * ----------------------------------------------------------------------- */

    function applications_search($keyword = '') {
        if (isset($_POST['keyword'])) {
            redirect('admin/applications_search/' . $_POST['keyword'] . '/');
        } else if ($keyword == '') {
            redirect('admin/applications/');
        }
        //search application
        $data = Array();
        $data['menu'] = 2;
        $app_info = $this->admin->get_application_info();
        $data['keyword'] = $keyword;
        //search by manual (check app name have a piece of keyword ?)
        $data['app_info'] = Array();
        foreach ($app_info as $name => $app) {
            if (isset($app['about']['name']) && strpos(strtolower($app['about']['name']), $keyword) !== FALSE) {
                $data['app_info'][$name] = $app;
            }
        }
        $this->view('applications/main', $data);
    }

    function applications() {
        $data = Array();
        $data['menu'] = 2;
        $data['app_info'] = $this->admin->get_application_info();
        $data['js'] = Array('jquery/jquery.ocupload.js', 'rosa/admin/add_app.js');
        $this->view('applications/main', $data);
    }

    function applications_info($name = '') {
        if ($name == '') {
            redirect('admin/applications/');
        }
        $app_info = $this->admin->get_application_info($name);
        $data = Array();
        $data['app_name'] = $name;
        $data['menu'] = 2;
        $data['css'] = Array('admin/apps_info.css');
        //isset app_info ?
        if ($app_info) {
            $this->load->helper('directory');
            $data['directory'] = directory_map(R_APPS_PATH . $name . '/');
            $data['page_name'] = $app_info['about']['name'];
            $data['app_info'] = $app_info;
            $this->view('applications/info', $data);
        } else {
            $data['error'] = TRUE;
            $this->view('applications/info', $data);
        }
    }

    function disable_app($name) {
        $this->force_login();
        if ($name && trim($name) !== '' && strpos($name, '/') === FALSE) {
            $this->admin->disable_app($name);
        }
        redirect('admin/applications/');
    }

    function enable_app($name) {
        $this->force_login();
        if ($name && trim($name) !== '' && strpos($name, '/') === FALSE) {
            $this->admin->enable_app($name);
        }
        redirect('admin/applications/');
    }

    function delete_app($name) {
        $this->force_login();
        if (trim($name) !== '' && file_exists(R_APPS_PATH.$name.'/')) {
            $this->admin->delete_app($name);
        }
        redirect('admin/applications/');
    }

    function upload_application() {
        $config['upload_path'] = R_APPS_PATH;
        $config['allowed_types'] = 'zip';
        //upload files to server
        $this->load->library('upload', $config);
        if (!$this->upload->do_upload('file')) {
            echo json_encode(Array('error' => $this->upload->display_errors()));
        } else {
            $file_data = $this->upload->data();
            //extract zip file to apps foldder
            if(class_exists('ZipArchive')){
                $zip = new ZipArchive();
                $res = $zip->open($file_data['full_path']);
                //extrack zip file
                if ($res === TRUE && $zip->extractTo(R_APPS_PATH)) {
                    $zip->close();
                    //delete source file
                    unlink($file_data['full_path']);
                    echo json_encode(Array('upload_data' => $this->upload->data()));
                }
            } else {
                echo json_encode(Array('error' => 'Extract file (.zip) error'));
            }
        }
    }

    /* -------------------------------------------------------------------------
     * MEMBER
     * ----------------------------------------------------------------------- */

    function users() {
        $data = Array();
        $data['menu'] = 1;
        $data['users'] = $this->admin->get_user();
        $this->view('users/main', $data);
    }

    function users_search($keyword = '') {
        if (isset($_POST['keyword'])) {
            redirect('admin/users_search/' . $_POST['keyword']);
        } else if ($keyword === '') {
            //when no key word not need to search
            redirect('admin/users/');
        } else {
            $data = Array();
            $data['menu'] = 1;
            $data['users'] = $this->admin->search_user($keyword);
            $data['keyword'] = $keyword;
            $this->view('users/main', $data);
        }
    }

    function edit_user($id, $status = '') {
        $this->force_login();
        if ($id) {
            //data
            $data['user_info'] = $this->admin->get_user($id);
            $data['groups'] = $this->admin->get_groups();
            //template
            $data['status'] = $status;
            $data['menu'] = 1;
            $data['page_name'] = 'Edit User';
            $data['css'] = Array('admin/users_edit.css');
            $this->view('users/edit_user', $data);
        } else {
            redirect('admin/');
        }
    }

    function change_user_info() {
        $this->force_login();
        $p = $_POST;
        if ($p) {
            $id = $p['id'];
            unset($p['id']);
            $this->admin->update_user_info($id, $p);
            redirect('admin/edit_user/' . $id . '/success/');
        }
        redirect('admin/edit_user/' . $id . '/error/');
    }

    function del_user($id) {
        $this->force_login();
        if ($id) {
            $this->admin->del_user($id);
            redirect('admin/users/');
        } else {
            redirect('admin/');
        }
    }

    /* -------------------------------------------------------------------------
     * (PRIVATE) VIEW
     * ----------------------------------------------------------------------- */

    private function view($view = 'welcome', $data = Array()) {
        //make sure that user is
        $this->force_login();

        $rosa_path = $this->config->item('rosa_path');
        //merge to default array
        $data = array_merge(
                        //default added
                        Array(
                            //menu list can config for template
                            'menu_list' => Array(
                                'Main' => 'admin',
                                'Users' => 'admin/users/',
                                'Application' => 'admin/applications/',
                                'Logout' => 'admin/logout/'
                            ),
                            'menu' => 0,
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
                            $rosa_path['os']['js'] . 'rosa/admin/core.js'
                        ), $data['js']
        );
        //add default css
        $data['css'] = array_merge(
                        Array(
                            $rosa_path['os']['css'] . 'rosa_core.css',
                            $rosa_path['os']['css'] . 'jquery_ui_theme/rosa_original/all.css',
                            $rosa_path['os']['css'] . 'admin/core.css'
                        ), $data['css']
        );

        $data['base_url'] = base_url();
        //for parse to adminstrator template!!
        $this->load->view('rosa_admin/header', $data);
        $this->load->view('rosa_admin/menu', $data);
        $this->load->view('rosa_admin/' . $view, $data);
        $this->load->view('rosa_admin/footer', $data);
    }

    /* -------------------------------------------------------------------------
     *  LOG IN - LOG OUT
     * ----------------------------------------------------------------------- */

    private function force_login() {
        if (!$this->admin->is_admin()) {
            redirect('admin/login/');
        }
    }

    function login($status = '') {
        //load config
        $rosa_path = $this->config->item('rosa_path');

        $data = Array();
        $data['js'] = Array(
            $rosa_path['os']['js'] . 'jquery/jquery-1.4.4.js',
            $rosa_path['os']['js'] . 'jquery/jquery-ui-1.8.6.js',
            $rosa_path['os']['js'] . 'rosa/admin/login.js',
        );
        $data['css'] = Array(
            $rosa_path['os']['css'] . 'rosa_core.css',
            $rosa_path['os']['css'] . 'jquery_ui_theme/rosa_original/all.css',
            $rosa_path['os']['css'] . 'admin/login.css',
        );
        $data['status'] = $status;

        $this->load->view('rosa_admin/login', $data);
    }

    function do_login() {
        $success = $this->user->authen($this->input->post('username'), $this->input->post('password'));
        if ($success) {
            redirect('admin/');
        } else {
            redirect('admin/login/error');
        }
    }

    function logout() {
        $this->user->logout();
        redirect('admin/login/');
    }

}
