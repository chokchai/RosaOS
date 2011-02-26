<!DOCTYPE html PUBLIC "-//W3C//DTD XHTML 1.0 Transitional//EN" "http://www.w3.org/TR/xhtml1/DTD/xhtml1-transitional.dtd">
<html xmlns="http://www.w3.org/1999/xhtml">
    <head>
    <meta http-equiv="Content-Type" content="text/html; charset=utf-8" />
    <title>ROSA Operating System</title>
    <?php foreach ($rosa['css'] as $href): ?>
    <link rel="stylesheet" href="<?= site_url($href) ?>" />
    <?php endforeach; ?>
    </head>
    <body>
        <div id="rosa_desktop"></div>
        <script type="text/javascript">
            //GLOBALS VARIABLE
            window.R = {
                'BASE_URL' : "<?= base_url() ?>",
                'BASE_PATH': "<?= base_url() ?>",
                'APPS_PATH' : "<?= base_url().R_HTTP_APPS_PATH ?>",
                'USERS_FILE_PATH' : "<?= base_url().R_HTTP_USER_FILE_PATH ?>",
                'USER' : <?= json_encode($rosa['user']) ?>
            };
        </script>
        <?php foreach ($rosa['core_js'] as $src): ?>
        <script src="<?= site_url($src) ?>" type="text/javascript"></script>
        <?php endforeach; ?>
        <script type="text/javascript">
        <?php foreach($rosa['application_helper'] as $app) : ?>
        R.setApplicationHelper(<?=json_encode($app)?>);
        <?php endforeach; ?>
        </script>
        <?php foreach ($rosa['application_js'] as $src): ?>
        <script src="<?= site_url($src) ?>" type="text/javascript"></script>
        <?php endforeach; ?>
        <div id="rosa_html_dock"  style="display: none;"></div>
        <div id="rosa_drag_helper_temp"></div>
    </body>
</html>