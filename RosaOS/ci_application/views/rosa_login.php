<!DOCTYPE html PUBLIC "-//W3C//DTD XHTML 1.0 Transitional//EN" "http://www.w3.org/TR/xhtml1/DTD/xhtml1-transitional.dtd">
<html xmlns="http://www.w3.org/1999/xhtml">
    <head>
        <meta http-equiv="Content-Type" content="text/html; charset=utf-8" />
        <title>ROSA Operating System</title>
        <?php foreach ($css as $href): ?>
            <link rel="stylesheet" href="<?=site_url($href) ?>" />
        <?php endforeach; ?>
    </head>
    <body>
        <div id="r_login_dialog" class="r_dialog" style="width:260px; height:120px;" r_title="Login" r_resizable="false" r_modal="true" >
            <? if ($status === 'error') : ?>
            <div class="ui-widget">
                <div style="padding: 0pt 0.7em;" class="ui-state-error ui-corner-all">
                    <p><span style="float: left; margin-right: 0.3em;" class="ui-icon ui-icon-alert"></span>
                        <strong>Alert:</strong> Username or Password is Incorrect !!</p>
                </div>
            </div>
            <? endif; ?>
            <form action="<?=site_url('rosa/do_login') ?>" method="POST" >
                <table class="r_table">
                    <tr>
                        <td width="80">Username : </td>
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
                            <a href="#" id="rosa_signup" class="button" >Sign up</a>
                        </td>
                    </tr>
                </table>
            </form>
            <form id="signup_form" action="<?=site_url('rosa/signup') ?>" method="POST" style="display: none;">
                <hr/>
                <table class="r_table">
                    <tr>
                        <td width="80">Username : </td>
                        <td><input class="text_input" type="text" size="25" name="username" /></td>
                    </tr>
                    <tr>

                        <td>Password : </td>
                        <td><input class="text_input" type="password" size="25" name="password" /></td>
                    </tr>
                    <tr>
                        <td>Confirm Password : </td>
                        <td><input class="text_input" type="password" size="25" name="password_confirm" /></td>
                    </tr>
                    <tr>
                        <td>Email : </td>
                        <td><input class="text_input" type="text" size="25" name="email" /></td>
                    </tr>
                    <tr>
                        <td></td>
                        <td>
                            <input class="button" type="submit" value="Signup" />
                        </td>
                    </tr>
                </table>
            </form>
        </div>
        <script type="text/javascript">
            //GLOBALS VARIABLE
            window.R = {
                'BASE_URL' : "<?= base_url() ?>",
                'BASE_PATH': "<?= base_url() ?>",
                'APPS_PATH' : "<?= R_HTTP_APPS_PATH ?>"
            };
        </script>
        <?php foreach ($js as $src): ?>
                <script src="<?=site_url($src) ?>" type="text/javascript"></script>
        <?php endforeach; ?>
    </body>
</html>