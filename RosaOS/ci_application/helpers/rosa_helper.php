<?php

/* ====================================================
 * ROSA KERNAL FUNCTION
 * ====================================================
 */

function rosa_import($path, $path_list = FALSE) {
    if (is_array($path_list)){
        foreach ($path_list as $p) {
            _rosa_import($path.'/'.$p);
        }
    } else if (is_array($path)) {
        foreach ($path as $p) {
            _rosa_import($path);
        }
    } else {
        _rosa_import($path);
    }
}

function rosa_is_root() {
    return User_Manager::is_root();
}

//save as a global for it can register
$ROSA_API = Array();
function rosa_api_register($key, $object = FALSE){
    global $ROSA_API;
    //when is array foreach them
    if( is_array($key) && $object === FALSE ){
        foreach( $key as $name => $obj ){
            $ROSA_API[$name] = $obj;
        }
    } else if($object !== FALSE){
        $ROSA_API[$key] = $object;
    }
}

function rosa_api($key = FALSE) {
    global $ROSA_API;
    //init avaliable rosa_api
    if ($key == FALSE) {
        return $ROSA_API;
    } else {
        return $ROSA_API[$key];
    }
}

/* .............................................................................
 * UTILITY
 * .............................................................................
 */

function rosa_user_info($key = '') {
    $user = User_Manager::get_instance();
    return $user->get_info($key);
}

function rosa_rand($prefix = '') {
    if ($prefix != '') {
        $prefix .= '_';
    }
    return $prefix . rand(100000000, 999999999);
}

function rosa_print_r($obj) {
    echo '<pre>' . htmlentities(print_r($obj, TRUE)) . '</pre>';
}

/* * *** OLD FILE SYSTEM **** */

//function rosa_dir_size($path) {
//    //get self size
//    $f_self = get_file_info($path);
//    $size = $f_self['size'];
//    //get inner file
//    $f_tmp = get_dir_file_info($path);
//    //sum of inner_file size
//    foreach ($f_tmp as $f) {
//        $size += $f['size'];
//    }
//    return $size;
//}
//
////end function
//
//function rosa_dir_file_info($source_dir, $dir_size = FALSE) {
//    static $_rosa_filedata = array();
//    $relative_path = $source_dir;
//
//    if ($fp = opendir($source_dir)) {
//        while (FALSE != ($file = readdir($fp))) {
//            if (strncmp($file, '.', 1) != 0) {
//                $tmp = get_file_info($source_dir . $file);
//                //hidden private url
//                //unset($tmp['server_path']);
//                $tmp['date'] = rosa_datetime($tmp['date']);
//                $tmp['name'] = $file;
//
//                if (@is_dir($source_dir . $file)) {
//                    $tmp['dir'] = TRUE;
//                    //get folder size
//                    if ($dir_size) {
//                        $tmp['size'] = rosa_dir_size($source_dir . $file);
//                    }
//                    $_rosa_filedata[] = $tmp;
//                } else if ($tmp['name'] != 'index.html') {
//                    //ignore index.html
//                    $tmp['dir'] = FALSE;
//                    $_rosa_filedata[] = $tmp;
//                }
//            }
//        }
//        return $_rosa_filedata;
//    } else {
//        return FALSE;
//    }
//}
//end function

$GLOBALS['rosa_log'] = array();

function rosa_log($str = FALSE, $obj = FALSE) {
    if (is_object($str)) {
        $obj = $str;
        $str = '';
    }

    $log['time'] = rosa_datetime();
    $log['string'] = $str;
    if ($obj != FALSE) {
        $log['parent_name'] = get_parent_class($obj);
        $log['class_name'] = get_class($obj);
        $log['class_vars'] = get_class_vars($obj);
        $log['class_method'] = get_class_methods($obj);
    }

    $GLOBALS['rosa_log'][] = $log;
}

function rosa_get_log() {
    $log = $GLOBALS['rosa_log'];
    return $log;
}

function rosa_date($unixtime = FALSE) {
    if ($unixtime != FALSE) {
        date('Y-m-d', $unixtime);
    }
    return date('Y-m-d');
}

function rosa_datetime($unixtime = FALSE) {
    if ($unixtime != FALSE) {
        date('Y-m-d H:i:s', $unixtime);
    }
    return date('Y-m-d H:i:s');
}

//query to array
function rosa_q2a($query, $key = FALSE, $index = FALSE) {
    //when no result reurn false
    if ($query->num_rows() == 0) {
        return FALSE;
    }
    //turn all query to array
    $array = array();

    //turn query to array
    $i = 0;
    foreach ($query->result_array() as $row) {
        $array[$i++] = $row;
    }

    //return specify position or keys
    if ($key != FALSE) {
        if ($index == FALSE) {
            $index = count($array) - 1;
        }
        if ($key == 'ROSA_ALL_KEYS') {
            return $array[$index];
        }
        return $array[$index][$key];
    }

    return $array;
}

function rosa_query2array($query, $key, $index) {
    rosa_q2a($query, $key, $index);
}

function rosa_br2nl($string) {
    $string = str_replace('<br />', '', $string);
    $string = str_replace('<br>', '', $string);
    return $string;
}

function rosa_array_nl2br($array) {
    foreach ($array as $k => $v) {
        $array[$k] = nl2br($v);
    }
    return $array;
}

function rosa_array_br2nl($array) {
    foreach ($array as $k => $v) {
        $array[$k] = $this->br2nl($v);
    }
    return $array;
}

function rosa_app_url($uri) {
    $path = rosa_api('path');
    return site_url($path->get_path('apps://' . $uri));
}

function rosa_num_format($number) {
    if ($number < 0.01)
        $number = 0.01;
    return number_format($number, 3, '.', '');
}

/* -----------------------------------------------------------------------------
 * PRIVATE
 * -----------------------------------------------------------------------------
 */

function _rosa_import($path) {
    //file exist?
    if (file_exists(R_BASE_PATH . $path . EXT)) {
        require_once R_BASE_PATH . $path . EXT;
    }
}

?>
