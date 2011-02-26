<!DOCTYPE html PUBLIC "-//W3C//DTD XHTML 1.0 Transitional//EN" "http://www.w3.org/TR/xhtml1/DTD/xhtml1-transitional.dtd">
<html xmlns="http://www.w3.org/1999/xhtml">
    <head>
        <meta http-equiv="Content-Type" content="text/html; charset=utf-8" />
        <title>ROSA Operating System</title>
        <?php foreach ($css as $href): ?>
            <link rel="stylesheet" href="<?= site_url($href) ?>" />
        <?php endforeach; ?>
        </head>
        <body>
            <div class="r_dialog" >
                <form action="<?= site_url('admin/do_login') ?>" method="POST" >
                    <table class="r_table">
                    <? if ($status === 'error'): ?>
                    <tr>
                        <td class="error" colspan="2" align="center" >
                            <div class="ui-state-error ui-corner-all" style="padding: 10px;">
                                <p><span class="ui-icon ui-icon-alert" style="float: left; margin-right: 0.3em;"></span>
                                username or password is invalid.</p>
                            </div>
                        </td>
                    </tr>
                    <? endif; ?>
                    <tr>
                        <td>Username : </td>
                        <td><input class="text_input" type="text" size="25" name="username" /></td>
                    </tr>
                    <tr>
                        <td>Password : </td>
                        <td><input class="text_input" type="password" size="25" name="password" /></td>
                    </tr>
                    <tr>
                        <td></td>
                        <td>
                            <input class="button" type="submit" value="Login" />
                        </td>
                    </tr>
                    </table>
                </form>
            </div>
        <?php foreach ($js as $src): ?>
        <script src="<?= site_url($src) ?>" type="text/javascript"></script>
        <?php endforeach; ?>
    </body>
</html>
