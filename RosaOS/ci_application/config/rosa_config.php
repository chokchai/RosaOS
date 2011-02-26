<?php

/* =============================================================================
 * SYSTEM CONFIG
 * ===========================================================================*/

// user config ---------------------------------------------------------------//

define('ROSA_DEBUG_MODE', TRUE);

// end user config -----------------------------------------------------------//

// rosa config ---------------------------------------------------------------//

//get form codeiginiter index.php
define('R_AB_PATH', FCPATH);
define('R_SELF', SELF);

// ==== PATH ==== //
define('R_BASE_PATH', R_AB_PATH.'rosa_os/');
define('R_LIBRARIES_PATH', R_BASE_PATH.'libraries/');
define('R_APPS_PATH', R_BASE_PATH.'apps/');
define('R_USERS_FILE_PATH', R_BASE_PATH.'users_file/');

define('R_HTTP_USER_FILE_PATH', 'rosa_os/users_file/');
define('R_HTTP_APPS_PATH', 'rosa_os/apps/');

$config['rosa_path']['os']['apps'] = 'rosa_os/apps/';
$config['rosa_path']['os']['js']  = 'rosa_os/js/';
$config['rosa_path']['os']['css'] = 'rosa_os/css/';

// === PROTOCAL === //
$config['rosa_protocol']['app://'] = R_APPS_PATH;

// end rosa config -----------------------------------------------------------//