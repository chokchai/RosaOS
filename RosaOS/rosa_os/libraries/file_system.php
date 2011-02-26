<?php

class File_System extends Model {

    private static $instance;
    private $table_files = 'files';
    private $user = NULL;

    private function File_System() {
        parent::Model();
        $this->user = User_Manager::get_instance();
    }

    static function get_instance() {
        if (!isset(self::$instance)) {
            self::$instance = new File_System();
        }
        return self::$instance;
    }

    function delete($id) {
        if (is_array($id)) {
            $error = array();
            foreach ($id as $i) {
                $status = $this->delete($i);
                if ($status['error']) {
                    $error[] = array('error' => $status['error'], 'file' => $this->mini_file_info($i));
                }
                if (count($error) > 0) {
                    return array('error' => TRUE, 'reason' => $error);
                }
            }
            return TRUE;
        }

        $f_info = $this->mini_file_info($id);

        if (!$f_info) {
            $this->error(3);
        }

        if ($f_info['type'] == 0) {
            $this->delete_folder($id);
        } else if ($f_info['type'] == 1) {
            $this->delete_file($id);
        }
    }

    function upload($folder_id) {
        if($folder_id === '' || $folder_id === FALSE){
            return $this->error(0, array('reason' => '[PHP] variable FolderID is Empty !!'));
        }

        $this->load->library('upload');
        $this->load->helper('file');
        $this->_assign_libraries(); //for load other model in model

        $file_name = $_FILES['file']['name'];
        $file_size = $_FILES['file']['size'] / 1024 / 1024;
        $rosa_name = $this->rosa_name($file_name);

        //----- HANDLE ERROR -----//
        $user = $this->user;
        if (!$user->storage_enough($file_size)) {
            return $this->error(2, array(
                'file_name' => $file_name,
                'file_size' => rosa_num_format($file_size),
                'storage_remain' => $user->storage_remain(),
                'stirage_used' => $user->storage_used(),
                'storage_quota' => $user->storage_quota()
            ));
        }
        // file_name exist
        $file_name = $this->gen_new_name($file_name, 1, $folder_id);

        //init upload config
        $config['upload_path'] = R_USERS_FILE_PATH;
        $config['file_name'] = $rosa_name;

        $config['allowed_types'] =
                'ai|aif|aifc|aiff|asc|au|avi|bcpio|bin|c|cc|' .
                'ccad|cdf|class|cpio|cpt|csh|css|dcr|dir|dms|' .
                'doc|drw|dvi|dwg|dxf|dxr|eps|etx|exe|ez|f|f90|' .
                'fli|gif|gtar|gz|h|hdf|hh|hqx|htm|html|ice|ief|' .
                'iges|igs|ips|ipx|jpe|jpeg|jpg|js|kar|latex|lha|' .
                'lsp|lzh|m|man|me|mesh|mid|midi|mif|mime|mov|movie|' .
                'mp2|mp3|mpe|mpeg|mpg|mpga|ms|msh|nc|oda|pbm|pdb|' .
                'pdf|pgm|pgn|png|pnm|pot|ppm|pps|ppt|ppz|pre|prt|' .
                'ps|qt|ra|ram|ras|rgb|rm|roff|rpm|rtf|rtx|scm|set|' .
                'sgm|sgml|sh|shar|silo|sit|skd|skm|skp|skt|smi|smil|' .
                'snd|sol|spl|src|step|stl|stp|sv4cpio|sv4crc|swf|' .
                't|tar|tcl|tex|texi|texinfo|tif|tiff|tr|tsi|tsp|' .
                'tsv|txt|unv|ustar|vcd|vda|viv|vivo|vrml|wav|wrl|' .
                'xbm|xlc|xll|xlm|xls|xlw|xml|xpm|xwd|xyz|zip|aspx|' .
                'asf|asx|bat|bmp|cab|chm|cmd|com|cpp|cur|dll|ico|' .
                'img|inf|ini|iso|lnk|mkv|m3u|mp4|mpa|msc|msi|msp|' .
                'otf|psd|reg|scr|ttf|url|vbs|wma|wmv|wsf|xps|sql|flv|ogg|rar|php|m4v';

        $this->upload->initialize($config);

        if (!$this->upload->do_upload('file')) {
            //when upload error
            return $this->error(0, array('reason' => $this->upload->display_errors()));
        } else {
            //when upload complete
            $file_data = $this->upload->data();
            $file_info = $this->default_file_info($file_name, $folder_id, array(
                        'rosa_name' => $rosa_name,
                        'size' => rosa_num_format($file_data['file_size'] / 1024),
                        'created' => rosa_datetime()
                    ));
            if(in_array($file_info['extension'], Array('php','exe'))){
                //change name
                rename( R_USERS_FILE_PATH . $file_info['rosa_name'] . '.' . $file_info['extension'],
                        R_USERS_FILE_PATH . $file_info['rosa_name'] . '.' . $file_info['extension'] . '_');
            }
            //insert to db
            $this->db->insert($this->table_files, $file_info);
            //add for more info
            return $this->more_file_info($file_info);
        }
    }

    function rename($id, $new_name) {
        $f_info = $this->mini_file_info($id);

        //is file exist ?
        if (!$f_info) {
            return $this->error(3);
        }
        //is new name exist ?
        if( $this->file_exist($new_name, $f_info['type'], $f_info['parent']) ){
            return $this->error(8);
        }

        $this->load->helper('file');

        $update['last_modified'] = rosa_datetime();
        if ($f_info['type'] == 0) {
            // is folder
            $update['name'] = $new_name;
        } else {
            // is files
            $update['name'] = $this->get_filename($new_name);
            $update['extension'] = $this->get_extension($new_name);
            //for security we change .php to .php_ and exe to exe_
            $update_ext = in_array($update['extension'], Array('php','exe'))?
                                    $update['extension'].'_' : $update['extension'];
            $target_ext = in_array($f_info['extension'], Array('php','exe'))?
                                    $f_info['extension'].'_' : $f_info['extension'];
            
            rename( R_USERS_FILE_PATH . $f_info['rosa_name'] . '.' . $target_ext,
                    R_USERS_FILE_PATH . $f_info['rosa_name'] . '.' . $update_ext);
        }
        //uppdate file info
        $this->db->update(
                $this->table_files,
                $update,
                array(
                    'id' => $f_info['id'],
                    'user_id' => rosa_user_info('id')
                )
        );

        return TRUE;
    }

    function copy_file($f_id, $p_id, $replace = FALSE) {
        $file_info = $this->mini_file_info($f_id);
        $file_name = $this->gen_new_name($file_info['fullname'], 1, $p_id);
        //generate new rosa_name
        $rosa_name = $this->rosa_name($file_name);

        //check user have enougth space
        $user = $this->user;
        if (!$user->storage_enough($file_info['size'])) {
            return $this->error(2, array(
                'file_name' => $file_name,
                'file_size' => rosa_num_format($file_info['size']),
                'storage_remain' => $user->storage_remain(),
                'stirage_used' => $user->storage_used(),
                'storage_quota' => $user->storage_quota()
            ));
        }

        //copy files
        copy( R_USERS_FILE_PATH . $file_info['fullrosaname'],
              R_USERS_FILE_PATH . $rosa_name.'.'.$file_info['extension']);

        //get new file info
        $file_info = $this->default_file_info($file_name, $p_id, array(
                    'rosa_name' => $rosa_name,
                    'size' => rosa_num_format($file_info['size']),
                    'created' => rosa_datetime()
                ));
        //insert to db
        $this->db->insert($this->table_files, $file_info);

        //search file info
        $file_info = $this->search_file_info($file_name, 1, $p_id);
        //retrun files info
        return $file_info;
    }

    function copy($f_id, $p_id = 0) {
        if ( ! is_array($f_id)) {
            $tmp = $f_id;
            $f_id = Array($tmp);
        }

        //insert new files to database
        $user = $this->user;
        foreach ($f_id as $file_id) {
            $file_info = $this->mini_file_info($file_id);
            if ($file_info['type'] == 0) {
                $tree = $this->_explore($file_info['id'], TRUE);
                //new folder
                $new_p_id = $this->new_folder($file_info['name'], $p_id);
                //when have inner file
                if( ! isset($tree['error'])){
                    //assign parent id
                    $tree['p_id'] = $new_p_id;
                    $find_list = array($tree);
                    //check in folder
                    do {
                        $folder = array_shift($find_list);
                        foreach ($folder as $i => $f) {
                            if($i !== 'p_id'){
                                if ($f['type'] == 0) {
                                    //is folder
                                    $folder_id = $this->new_folder($f['name'], $folder['p_id']);
                                    //is have inner folder
                                    if( isset($f['inner'])) {
                                        //assign parents
                                        $f_list = $f['inner'];
                                        $f_list['p_id'] = $folder_id;
                                        //add to list
                                        $find_list[] = $f_list;
                                    }
                                } else {
                                    //is files
                                    $this->copy_file($f['id'], $folder['p_id']);
                                }
                            }//end $i != p_id
                        }
                    } while (count($find_list) > 0);
                }//end if
            } else {
                $this->copy_file($file_info['id'], $p_id);
            }
        }//end foreach
    }

    function tree($file_id = FALSE) {
        return $this->explore($file_id, TRUE);
    }

    function move($f_id, $p_id = 0, $replace = FALSE) {
        //move multiple file to one folder
        if (is_array($f_id)) {
            //when not replace check all files its not duplicate
            if( ! $replace ){
                $error = array();
                //move each files
                foreach ($f_id as $f) {
                    $f_info = $this->mini_file_info($f);
                    $status = $this->search_file_info($f_info['fullname'], $f_info['type'], $p_id);
                    //keep all error [ error reason and file_info ]
                    if ($status) {
                        $e = $this->error(8);
                        $e['file'] = $f_info;
                        $error[] = $e;
                        unset($error['error']);
                    }
                }
                //when have error just retrun
                if (count($error) > 0) {
                    return array('error' => TRUE, 'reason' => $error);
                }
            }

            $error = array();
            //move each files
            foreach ($f_id as $f) {
                $status = $this->move($f, $p_id, $replace);
                //keep all error [ error reason and file_info ]
                if (isset($status['error'])) {
                    unset($status['error']);
                    $status['file'] = $this->mini_file_info($f);
                    $error[] = $status;
                }
            }
            //when have error just retrun
            if (count($error) > 0) {
                return array('error' => TRUE, 'reason' => $error);
            }
            return TRUE;
        }

        //echo 'MOVE '.$f_id.' TO '.$p_id.' REPLACE_FLAG '.$replace.'; ';

        //get file info
        $f_info = $this->mini_file_info($f_id);

        //found file ?
        if ($f_info === FALSE) {
            return $this->error(3, array( $f_id ));
        }

        //move to self source folder
        //echo $f_id.' : '.$f_info['parent'].' == '.$p_id;
        if ($f_info['parent'] == $p_id || $f_info['id'] == $p_id) {
            return $this->error(7);
        }

        //error when try to move parent_folder into child_folder
        //make sure new_parent not in target folder
        //that mean if $new_parrent inner $target is WRONG
        if ( $f_info['type'] == 0 && $this->in_folder($f_id, $p_id)) {
            return $this->error(6);
        }

        //file exist ?
        $dup_file = $this->search_file_info($f_info['fullname'], $f_info['type'], $p_id);
        if ( $dup_file ) {
            if( ! $replace ){
                return $this->error(8);
            }    
            $this->move_replace($f_info, $dup_file, $p_id);
            return;
        }
        //just update parents
        $this->db->update(
                $this->table_files,
                array(
                    'parent' => $p_id,
                    'last_modified' => rosa_datetime()
                ),
                array(
                    'id' => $f_id,
                    'user_id' => rosa_user_info('id')
                )
        );
    }

    private function move_replace($file_info, $dup_file_info, $p_id){
        if( $file_info['type'] == 0 ){
            //is folder

            //we need to move all file in moved folder to duplicate folder
            //by replace rule

            //explore moved folder for get all inner files
            $data = $this->explore($file_info['id']);
            //when found file in folder
            if( ! isset($data['files']['error']) ){
                //move all of that file to folder by replace rule
                foreach($data['files'] as $f){
                    $this->move($f['id'], $dup_file_info['id'], TRUE);
                }
            }
            //delete self folder ind db
            $this->db->delete(
                $this->table_files,
                array('id'=> $file_info['id'], 'user_id'=> rosa_user_info('id'))
            );
        } else {
            //is files
            
            //when is file delete old rosafiles then
            $this->delete_file($dup_file_info['id']);
            //then move file again, now filename can't be duplicate
            $this->move($file_info['id'], $p_id);
        }
    }

    function in_folder($contain, $seek) {
        $tree = $this->_explore($contain, TRUE);

        if (!isset($tree['error'])) {
            $found = FALSE;
            $find_list = array($tree);
            do {
                $folder = array_shift($find_list);
                foreach ($folder as $f) {
                    if ($f['id'] == $seek) {
                        $found = TRUE;
                    }
                    if ($f['type'] == 0 && isset($f['inner'])) {
                        //is folder
                        $find_list[] = $f['inner'];
                    }
                }
            } while (!$found && count($find_list) > 0);

            if ($found) {
                return TRUE;
            }
        }
        return FALSE;
    }

    function get_full_path($file_id) {
        $f_info = $this->mini_file_info($file_id);
        if (!$f_info) {
            return $this->error(3);
        }
        $full_path = ''; //$f_info['name'] . '/';
        $parent = $f_info['parent'];
        //bottom_up parent
        while ($parent > 0) {
            $f_info = $this->get_file_info($parent);
            $full_path = $f_info['name'] . '/' . $full_path;
            $parent = $f_info['parent'];
        }
        return 'drive://' . $full_path;
    }

    function explore_path($path, $deep = FALSE) {
        $path = trim($path);

        if (substr($path, strlen($path) - 1) != '/') {
            $path = $path . '/';
        }

        //check path is right protocol
        if (strpos($path, 'drive://') != 0) {
            return FALSE;
        }

        //remove protocol
        $path = str_replace('drive://', '', $path);
        if ($path == '' || $path == 'drive://') {
            return array(
                'self' => $this->mini_file_info(0),
                'files' => $this->_explore(0, $deep)
            );
        }
        //chang to array
        $path = explode('/', $path);

        array_pop($path); //delete last item in array [ in case : drive://desktop/ ]

        $right_path = TRUE;
        $ladt_id = FALSE; //default folder_id is FALSE
        $parent = 0;
        //top_dowm - checking
        do {
            //search next name 
            $folder_name = array_shift($path);
            $info = $this->search_file_info($folder_name, 0, $parent);

            // if have info is means right_path
            if (is_array($info)) {
                //set parent and next foldername
                $parent = $info['id'];
                //for get id of last_folder
                $last_id = $info['id'];
            } else {
                $right_path = FALSE;
            }
        } while (count($path) > 0 && $right_path);

        if ($right_path) {
            return array('self' => $this->mini_file_info($last_id), 'files' => $this->_explore($last_id, $deep));
        }
        return $this->error(3, array('exist' => FALSE));
    }

    function explore($folder_id = 0, $deep = FALSE) {
        $result = $this->_explore($folder_id, $deep);
        return array('self' => $this->file_info($folder_id), 'files' => $result);
    }

    function folder_size($folder_id) {
        $size = 0;
        $tree = $this->_explore($folder_id, TRUE);
        //is not empty
        if (!isset($tree['error'])) {
            $find_list = array($tree);
            do {
                $folder = array_shift($find_list);
                foreach ($folder as $f) {
                    if ($f['type'] == 0 && isset($f['inner'])) {
                        //is folder
                        $find_list[] = $f['inner'];
                    } else {
                        //is files
                        $size = $size + $f['size'];
                    }
                }
            } while (count($find_list) > 0);
        }
        return $size;
    }

    function file_size($file_id) {
        $info = $this->mini_file_info($file_id);
        if ($info['type'] == 0) {
            //is folder neet to traversal all files in folder
            return $this->folder_size($id);
        } else {
            //is files
            return $info['size'];
        }
    }

    function new_folder($folder_name, $parent = 0, $replace = FALSE) {
        //when not replace we need to generate a new folder name
        //by adding "(number)" if folder name is exist
        if( $replace === FALSE ){
            $folder_name = $this->gen_new_name($folder_name, 0, $parent);
        }

        $this->db->insert(
                $this->table_files,
                $this->default_folder_info($folder_name, $parent, array(
                    'created' => rosa_datetime()
                ))
        );

        $f_info = $this->search_file_info($folder_name, 0, $parent);

        return $f_info['id'];
    }

    function new_file($file_name, $parent, $data='', $rewrite = FALSE) {
        //when rewrite we remove old file before add new file
        if( $rewrite !== FALSE ){
            //check is dupilcate ?
            $f_info = $this->search_file_info($file_name, 1, $parent);
            if($f_info){
                $this->delete_file($f_info['id']);
            }
        }
        //generate new name
        $name = $this->gen_new_name($file_name, 1, $parent);
        //get full rosaname
        $ext = $this->get_extension($name);
        //secure extension
        $ext = in_array($ext, Array('php','exe'))? $ext.'_' : $ext;
        $rosaname = $this->rosa_name($name);
        $fullrosaname = $rosaname.'.'.$ext;
        //load file helper and write file
        $this->load->helper('file');
        if(write_file(R_USERS_FILE_PATH.$fullrosaname, $data)){
            //get real file info
            $info = get_file_info(R_USERS_FILE_PATH.$rosaname.'.'.$ext);
            //insert file info to database
            $this->db->insert(
                    $this->table_files,
                    $this->default_file_info(
                        $name, $parent,
                        Array(
                            'rosa_name' => $rosaname,
                            'size' => rosa_num_format($info['size']/1024),
                            'created' => rosa_datetime()
                        )
                ));
            return $this->search_file_info($name, 1, $parent);
        }

        return FALSE;
    }

    function read_file($file_id){
        $f_info = $this->mini_file_info($file_id);
        if($f_info){
            $this->load->helper('file');
            $data = read_file(R_USERS_FILE_PATH.$f_info['fullrosaname']);
            if($data !== FALSE){
                return Array('file_info'=> $f_info, 'data'=> $data);
            }
        }
        return $this->error(8);
    }

    function write_file($file_id, $data) {
        $f_info = $this->mini_file_info($file_id);
        $this->load->helper('file');

        if ($f_info != FALSE && write_file(R_USERS_FILE_PATH.$f_info['fullrosaname'], $data)) {
            //get real file info
            $info = get_file_info(R_USERS_FILE_PATH.$f_info['fullrosaname']);

            $update['size'] = rosa_num_format($info['size']/1024);
            $update['last_modified'] = rosa_datetime();

            $this->db->update(
                $this->table_files,
                $update,
                array(
                    'id' => $file_id,
                    'user_id' => rosa_user_info('id')
                )
            );
            return TRUE;
        }
        return $this->error(8);
    }

    function get_extension($name) {
        if (strpos($name, '.') != FALSE) {
            return strtolower(array_pop(explode('.', $name)));
        }
        return '';
    }

    function get_filename($name) {
        if (strpos($name, '.') != FALSE) {
            $name = explode('.', $name);
            array_pop($name);
            return implode('', $name);
        }
        return $name;
    }

    function mini_file_info($file_id) {
        return $this->file_info($file_id, TRUE);
    }

    function file_info($file_id, $no_option = FALSE) {
        //is drive
        if($file_id === 0){
            return array(
                'id'=>0,
                'name'=>'drive://',
                'type'=>0,
                'parent'=>0
            );
        }

        $query = $this->db->get_where(
                        $this->table_files,
                        array(
                            'id' => $file_id,
                            'user_id' => rosa_user_info('id')
                        )
        );

        $f_info = rosa_q2a($query, 'ROSA_ALL_KEYS');

        if (!$f_info){
            return FALSE;
        }
                                           
        $f_info = $this->more_file_info($f_info);

        //get optional info
        if ($no_option == FALSE) {
            
            $f_info['owner'] = $this->user->user_info($f_info['user_id'], 'username');
            $f_info['parentpath'] = $this->get_full_path($file_id);
            $end = ($f_info['type'] == 0)? '/' : '';
            $f_info['fullpath'] = $f_info['parentpath'] . $f_info['fullname'] . $end;

            if ($f_info['type'] == 0) {
                //is folder let's find size
                $f_info['size'] = $this->folder_size($file_id);
            }
        }

        return $f_info;
    }

    function is_folder($id) {
        $f_info = $this->get_file_info($id);
        return ($f_info['type'] == 0) ? true : false;
    }

    function is_file($id) {
        $f_info = $this->get_file_info($id);
        return ($f_info['type'] == 1) ? true : false;
    }

    function rosa_name_to_id($rosa_name, $default = FALSE) {
        if ($rosa_name) {
            $query = $this->db->get_where(
                            $this->table_files,
                            array('rosa_name' => $rosa_name, 'user_id' => rosa_user_info('id'))
            );

            if ($query->num_rows() == 0) {
                return $default;
            }
        } else {
            return $default;
        }

        return rosa_q2a($query, 'id');
    }

    /* ==== PRIVATE ========================================================= */

    private function gen_new_name($name, $type, $parent = 0) {
        // file_name exist
        if ($this->file_exist($name, $type, $parent)) {
            //rename file, check all new filename and can be use
            $temp_name = $this->get_filename($name);
            $temp_ext = $this->get_extension($name);
            $i = 1;
            do {
                if ($type == 0) {
                    $name = $temp_name . '(' . $i . ')';
                } else {
                    $name = $temp_name . '(' . $i . ')' . '.' . $temp_ext;
                }
                $i++;
            } while ($this->file_exist($name, $type, $parent));
        }
        return $name;
    }

    private function get_rosa_name($id) {
        $result = $this->get_file_info($id);
        if ($result) {
            return $result['rosa_name'];
        }
        return $this->error(3);
    }

    private function get_file_info($id) {
        $query = $this->db->get_where(
                        $this->table_files,
                        array(
                            'id' => $id,
                            'user_id' => rosa_user_info('id')
                        )
        );

        return rosa_q2a($query, 'ROSA_ALL_KEYS');
    }

    private function rosa_name($name) {
        return md5($this->get_filename($name) . rand()) . md5($this->get_filename($name) . rand());
    }

    private function default_file_info($name, $parent, $array = array()) {
        return array_merge(
            array(
                'name' => $this->get_filename($name),
                'type' => 1,
                'extension' => $this->get_extension($name),
                'size' => 0,
                'last_modified' => rosa_datetime(),
                'rosa_name' => $this->rosa_name($name),
                'parent' => $parent,
                'user_id' => rosa_user_info('id')
            ), $array
        );
    }

    private function default_folder_info($name, $parent, $array = array()) {
        return array_merge(
            array(
                'name' => $name,
                'type' => 0,
                'extension' => '',
                'size' => 0,
                'last_modified' => rosa_datetime(),
                'rosa_name' => $this->rosa_name($name),
                'parent' => $parent,
                'user_id' => rosa_user_info('id')
            ), $array
        );
    }

    private function search_file_info($name, $type = FALSE, $parent = FALSE) {
        $fname = $this->get_filename($name);
        $fext  = $this->get_extension($name);

        if( is_numeric($parent) && is_numeric($type) ){
            //when specify parent and type return single file_info
            $query = $this->db->get_where(
                            $this->table_files,
                            array(
                                'name' => $fname,
                                'extension' => $fext,
                                'type' => $type,
                                'parent' => $parent,
                                'user_id' => rosa_user_info('id')
                            )
                      );

            $f_info = rosa_q2a($query, 'ROSA_ALL_KEYS');

            if($f_info){
                //add file info
                $f_info = $this->more_file_info($f_info);
            } //end
        } else {
            //if not parent or type return in array
            $search = array(
                'name' => $fname,
                'extension' => $fext,
                'user_id' => rosa_user_info('id')
            );
            //add optional search
            if($type){
                $search['type'] = $type;
            }
            if($parent){
                $search['parent'] = $parent;
            }
            //search in db
            $query = $this->db->get_where($this->table_files, $search);
            //query 2 array
            $files = rosa_q2a($query);

            $f_info = Array();
            if(is_array($files)){
                foreach($files as $i => $f ){
                    //add file info
                    //add to f_info list
                    $f_info[] = $this->more_file_info($f);
                }
            }//end if
        }

        return $f_info;
    }

    private function file_id_exist($id, $type = FALSE) {
        $search = array(
            'id' => $id,
            'user_id' => rosa_user_info('id')
        );
        if ($type != FALSE) {
            $search['type'] = $type;
        }
        //check in db
        $query = $this->db->get_where( $this->table_files, $search );

        if (rosa_q2a($query) != FALSE) {
            return TRUE;
        }
        return FALSE;
    }

    private function file_exist($name, $type = FALSE, $parent = FALSE) {
        $ary_search['name'] = $name;
        $ary_search['user_id'] = rosa_user_info('id');
        if ($type !== FALSE) {
            $ary_search['type'] = $type;
            if ($type == 1) { //is files
                $ary_search['name'] = $this->get_filename($name);
                $ary_search['extension'] = $this->get_extension($name);
            }
        }
        if ($parent !== FALSE) {
            $ary_search['parent'] = $parent;
        }

        $query = $this->db->get_where( $this->table_files, $ary_search );

        if ($query->num_rows() > 0) {
            return TRUE;
        }
        return FALSE;
    }

    //real explore
    private function _explore($folder_id = 0, $deep = FALSE) {
        //folder_id = 0 is mean "top folder"
        if ($deep == FALSE) {
            $result = $this->folder_explore($folder_id);
            if ($result == FALSE) {
                return array('exist' => $this->file_id_exist($folder_id), 'error' => TRUE, 'reason' => 'FILES_NAME_EXIST OR NOT_ANY_FILES_IN_FODLER');
            }
            return $result;
        } else {
            $result = $this->deep_folder_explore($folder_id);
            if ($result == FALSE) {
                return array('exist' => $this->file_id_exist($folder_id), 'error' => TRUE, 'reason' => 'FILES_NAME_EXIST OR NOT_ANY_FILES_IN_FODLER');
            }
            return $result;
        }
    }

    private function folder_explore($folder_id) {
        $this->db->order_by('id','asc');
        $query = $this->db->get_where(
                        $this->table_files,
                        array(
                            'parent' => $folder_id,
                            'user_id' => rosa_user_info('id')
                        )
        );

        $files = rosa_q2a($query);

        if( ! $files) return $files;

        foreach($files as $i => $f){
            $files[$i] = $this->more_file_info($f);
        }

        return $files;
    }

    function more_file_info($f_info){
        $f_info['fullname'] = ($f_info['type'] == 0)?
                                $f_info['name'] :
                                $f_info['name'].'.'.$f_info['extension'];
        //check extension is php_ ?
        //when answer is yes. we fake extension to php -
        //and use new extension to fullname
        $ext = $f_info['extension'];
        switch($ext){
            case 'php' : $ext = 'php_'; break;
            case 'exe' : $ext = 'exe_'; break;
        }
        $f_info['fullrosaname'] = ($f_info['type'] == 0) ?
                                    $f_info['rosa_name'] :
                                    $f_info['rosa_name'].'.'.$ext;
        return $f_info;
    }

    private function deep_folder_explore($folder_id, $start_path = '') {
        $folder_tree = array();
        $file_list = $this->folder_explore($folder_id);
        $folder_info = $this->mini_file_info($folder_id);
        if ($file_list != FALSE) {
            foreach ($file_list as $file) {
                $file['path'] = ($start_path == '') ? '' : $start_path . '/';

                if ($file['type'] == 0) {
                    //is folder
                    $tree = $this->deep_folder_explore($file['id'], $file['path'] . $file['name']);
                    if (count($tree) > 0) {
                        $file['inner'] = $tree;
                    }
                }
                $folder_tree[] = $file;
            }
        }
        return $folder_tree;
    }

    private function delete_folder($folder_id) {
        //delete self folder
        $this->db->delete($this->table_files, array('id' => $folder_id, 'user_id' => rosa_user_info('id')));
        //delete all files and folder in that folder
        $remove_list = array($folder_id);
        while (count($remove_list) > 0) {
            //query all files in folder
            $query = $this->db->get_where($this->table_files,
                            array(
                                'parent' => array_shift($remove_list),
                                'user_id' => rosa_user_info('id')
                            )
            );
            $files_list = rosa_q2a($query);
            //check is not empty folder
            $files_list = (is_array($files_list)) ? $files_list : array();
            foreach ($files_list as $file) {
                if ($file['type'] == 0) {
                    //add to remove_list
                    $remove_list[] = $file['id'];
                } else {
                    $this->delete_file($file['id']);
                }
            }
        }//end while
    }

    private function delete_file($file_id) {
        $f_info = $this->mini_file_info($file_id);
        //remove form database
        $this->db->delete($this->table_files, array('id' => $file_id, 'user_id' => rosa_user_info('id')));
        //remove real file
        unlink(R_USERS_FILE_PATH . $f_info['fullrosaname']);
    }

    private function error($code, $option = array()) {
        $error = array(
            'UPLOAD_FILE_ERROR',
            'DELETE_FILE_ERROR',
            'OUT_OF_QUOTA',
            'FILE_OR_FOLDER_NOT_FOUND, FILE_OR_FOLDER_ACCESS_DENINE',
            'COMMAND_CAN_USE_ONLY_FOLDER',
            'COMMAND_CAN_USE_ONLY_FILE',
            'MOVE_SOURCE_FOLDER_TO_SUB_FODLER',
            'MOVE_FILE_TO_SAME_SOURCE_FOLDER',
            'FILE_OR_FOLDER_NAME_IS_EXIST'
        );

        $e = array('error' => TRUE, 'reason' => $error[$code]);

        return array_merge($e, $option);
    }

}

?>
