<?php

class User_Manager extends Model {

    private static $instance;
    private $table_user = 'users';
    private $table_files = 'files';
    private $table_user_group = 'user_groups';

    private function User_Manager() {
        parent::Model();
    }

    static function get_instance() {
        if (!isset(self::$instance)) {
            self::$instance = new User_Manager();
        }
        return self::$instance;
    }

    /* -------------------------------------------------------------------------
     * PUBLIC
     * -------------------------------------------------------------------------
     */

    function create_user($data) {
        //init default user data
        $data = array_merge_recursive(
                        array(
                            'date_register' => rosa_datetime(),
                            'group_id' => 2,
                            'quota_max' => 1024
                        ), $data
        );
        //convert some data
        $password = $data['password']; // keep password for authen
        $data['password'] = md5($data['password']);
        //insert user to database
        $this->db->insert($this->table_user, $data);
        //login for user
        if ($this->authen($data['username'], $password)) {
            //create default folder
            $this->create_default_folder();
        }
        return TRUE;
    }

    function create_default_folder() {
        //create default folder to user
        $file = File_System::get_instance();
        //init folder_list
        $main_folder = array(
            'Desktop',
            'Apps',
            'Disk',
            'Libraries'
        );
        $lib_id = 0;
        foreach ($main_folder as $value) {
            $lib_id = $file->new_folder($value, 0);
        }
        $sub_folder = array(
            'Documents',
            'Music',
            'Pictures',
            'Videos'
        );
        foreach ($sub_folder as $value) {
            $file->new_folder($value, $lib_id);
        }
    }

    function username_exits($username) {
        //check $username count
        $this->db->where('username', $username);
        $this->db->from($this->table_user);
        $count = $this->db->count_all_results();

        if ($count > 0) {
            return TRUE; //is exits
        }
        return FALSE; //not exits
    }

    function authen($user, $pass) {
        //find in database ...
        $query = $this->db->get_where(
            $this->table_user,
            array('username' => $user, 'password' => md5($pass))
        );
        //when found
        if ($query->num_rows() > 0) {
            $info = rosa_q2a($query, 'ROSA_ALL_KEYS');
            $this->set_info($info);
            //set last login
            $this->db->update(
                $this->table_user, array('last_login' => rosa_datetime()),
                array('username' => $user, 'password' => md5($pass))
            );
            return TRUE;
        }
        //when not
        return FALSE;
    }

    function logout() {
        $this->session->unset_userdata('user');
    }

    function is_login() {
        $info = $this->get_info();
        if(isset($info['username'], $info['password'])){
            //find in database ...
            $query = $this->db->get_where(
                $this->table_user,
                array('username' => $info['username'], 'password' => $info['password'])
            );
            //when found
            if ($query->num_rows() > 0) {
                return TRUE;
            }
        }
        return FALSE;
    }

    function get_info($key = FALSE) {
        $info = $this->session->userdata('user');
        
        if( ! is_array($info) ){
            return array();
        }
        else if ($key == FALSE) {
            return $info;
        } else {
            return $info[$key];
        }
    }

    function user_info( $id, $key = 'ROSA_ALL_KEYS' ){
        //get user standard info
        $query = $this->db->get_where( $this->table_user, array( 'id'=> $id ));
        $user = rosa_q2a($query, 'ROSA_ALL_KEYS');
        //get group name
        $query = $this->db->get_where( $this->table_user_group, Array( 'id' => $user['group_id'] ));
        $user['group_name'] = rosa_q2a($query, 'name');
        if($key == 'ROSA_ALL_KEYS'){
            return $user;
        }
        return $user[$key];
    }

    function storage_used($id = FALSE) {
        if($id === FALSE){
            $id = rosa_user_info('id');
        }
        //get form db
        $this->db->select_sum('size');
        $this->db->where('user_id', $id);
        $query = $this->db->get($this->table_files);
        //query result
        if ($query->num_rows() == 1) {
            $storage = $query->first_row('array');
            return rosa_num_format($storage['size']);
        }
        //when not have file in database , mean user not have any files
        return 0;
    }

    function storage_remain($id = FALSE){
        $storage_quota = $this->storage_quota($id);
        $storage_used = $this->storage_used($id);
        return rosa_num_format( $storage_quota - $storage_used);
    }

    function storage_quota($id = FALSE){
        if($id === FALSE){
            $id = rosa_user_info('id');
        }
        $query = $this->db->get_where($this->table_user, array( 'id' => $id ));
        if( $query->num_rows() == 1 ){
            $storage = $query->first_row('array');
            return rosa_num_format($storage['quota_max']);
        }
        return 0;
    }

    function storage_enough($file_size = 0) {
        $storage_quota = $this->storage_quota();
        $storage_used = $this->storage_used();

        if ($storage_used + $file_size <= $storage_quota) {
            return TRUE;
        }
        return FALSE;
    }

    /* -------------------------------------------------------------------------
     * PRIVATE
     * -------------------------------------------------------------------------
     */

    private function set_info($key, $val = FALSE) {
        if (is_array($key)) {
            $info = $this->get_info();
            $info = array_merge($info, $key);
            $this->session->set_userdata(array('user' => $info));
        } else {
            $info = $this->get_info();
            $info[$key] = $val;
            $this->session->set_userdata(array('user' => $info));
        }
    }
}
?>