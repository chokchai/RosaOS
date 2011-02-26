<?php

class Administrator extends Model {

    private static $instance;
    private $table_user = 'users';
    private $table_files = 'files';
    private $table_user_group = 'user_groups';

    private function Administrator() {
        parent::Model();
        $this->user = rosa_api('user');
        $this->file = rosa_api('file');
        $this->apps = rosa_api('apps');

        $this->apps->init(TRUE);
    }

    static function get_instance() {
        if (!isset(self::$instance)) {
            self::$instance = new Administrator();
        }
        return self::$instance;
    }

    /* -------------------------------------------------------------------------
     * APPLICATIONS
     * -----------------------------------------------------------------------*/

    function get_application_info($name = FALSE){
        $this->load->helper('file');
        $apps_info = $this->apps->get_apps_information();
        if($name === FALSE){
            return $apps_info;
        } else if(isset($apps_info[$name])){
            return $apps_info[$name];
        }
        return FALSE;
    }

    function disable_app($name){
        //disable application by change application description files name
        //using prepend by "__disable_" that it !!
        rename( R_APPS_PATH.$name.'/'.$name.'.json',
                R_APPS_PATH.$name.'/__disable_'.$name.'.json' );
    }

    function enable_app($name){
        //enable application by change application description files name
        //using remove "__disable_" that it !!
        $name = str_replace('__disable_', '', $name);
        rename( R_APPS_PATH.$name.'/__disable_'.$name.'.json',
                R_APPS_PATH.$name.'/'.$name.'.json' );
    }

    function delete_app($name){
		//delete application
        $this->load->helper('file');
		//delete all files and folder in folder
		delete_files(R_APPS_PATH.$name.'/', TRUE);
		//delete folder
		rmdir(R_APPS_PATH.$name.'/');
    }

    /* -------------------------------------------------------------------------
     * USERS
     * -----------------------------------------------------------------------*/

    function search_user($keyword = ''){
        $this->db->like('username', $keyword);
        $query = $this->db->get($this->table_user);
        $user = rosa_q2a($query);
        return $this->assign_information($user);
    }

    function get_user($id = FALSE){
        if( $this->is_admin() ){
            if($id === FALSE){
                $query = $this->db->get($this->table_user);
                $user = rosa_q2a($query);
                return $this->assign_information($user);
            } else {
                $user = $this->user->user_info($id);
                return $this->assign_information($user);
            }
        }//end if
    }

    function update_user_info($id, $data){
        //update user database
        $this->db->update($this->table_user, $data, Array('id'=>$id));
    }

    function del_user($id){
        //get all user files
        $query = $this->db->get_where(
            $this->table_files,
            Array( 'user_id'=>$id, 'type'=>1 )
        );
        $files = rosa_q2a($query);
        //del all files [on disk]
		if($files){
			foreach($files as $f){
				$f = $this->file->more_file_info($f);
				unlink(R_USERS_FILE_PATH.$f['fullrosaname']);
			}
		}
        //del all virtual files [on database]
        $this->db->delete($this->table_files, Array('user_id'=>$id));
        //del user
        $this->db->delete($this->table_user, Array('id'=>$id));
    }

    function get_groups(){
        if( $this->is_admin() ){
            $query = $this->db->get($this->table_user_group);
            $groups = rosa_q2a($query);
            if(is_array($groups)){
                // remap group result from [ { id:?, name: ? }, .... ]
                // to { id: name, id2 : name2, ... }
                $ary = Array();
                foreach($groups as $g){
                    $ary[$g['id']] = $g['name'];
                }
                return $ary;
            }
            return FALSE;
        }//end if
    }

    private function assign_information($user){
        if($user === FALSE){
            return Array();
        }
        //get groups
        $groups = $this->get_groups();
        //if is list of user we need to add group_name to each users
        if( is_array($user) && ! isset($user['id']) ){
            foreach( $user as $i => $u ){
                $user[$i] = $this->assign_information($u);
            }
            return $user;
        } else {
            $user['group_name'] = $groups[$user['group_id']];
            $user['quota_used'] = $this->user->storage_used($user['id']);
            $user['quota_remain'] = $this->user->storage_remain($user['id']);
            return $user;
        }
    }

    function is_admin(){
        if( $this->user->is_login() ){
            $groupname = $this->user->user_info($this->user->get_info('id'), 'group_name');
            if($groupname === 'administrator'){
                return $this->user->get_info();
            }
        }
        return FALSE;
    }

}// end class