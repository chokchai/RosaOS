<? if($status == 'error'): ?>
<div class="error" style="padding: 5px 10px; margin: 5px 0;">Error... Please try again</div>
<? endif; ?>
<form action="<?='../install/do_assign_admin/'?>" method="post">
<table class="table" border="0">
    <tr>
        <td>Username : </td>
        <td><input type="text" name="username" size="40" /></td>
    </tr>
    <tr>
        <td>Password : </td>
        <td><input type="password" name="password" size="40" /></td>
    </tr>
    <tr>
        <td>Re-Password : </td>
        <td><input type="password" name="re_password" size="40" /></td>
    </tr>
    <tr>
        <td>Email : </td>
        <td><input type="text" name="email" size="40" /></td>
    </tr>
</table>
</form>