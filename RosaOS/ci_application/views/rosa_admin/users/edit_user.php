<form action="<?=site_url('admin/change_user_info/')?>" method="post" >
<table class="edit_table" >
    <? if($status == 'success'): ?>
    <tr>
        <td colspan="2" class="complete" >
            Update Complete...
        </td>
    </tr>
    <? endif; ?>
    <? if($status == 'error'): ?>
    <tr>
        <td colspan="2" class="error" >
            Error !! Please try again...
        </td>
    </tr>
    <? endif; ?>
    <tr>
        <td>ID : </td>
        <td>
            <input type="text" class="input" size="10" disabled="true" value="<?=$user_info['id']?>" />
            <input type="hidden" name="id" value="<?=$user_info['id']?>" />
        </td>
    </tr>
    <tr>
        <td>Username : </td>
        <td>
            <input type="text" class="input" size="30" disabled="true" value="<?=$user_info['username']?>" />
        </td>
    </tr>
    <tr>
        <td>Email : </td>
        <td><input type="text" class="input" size="30" disabled="true" value="<?=$user_info['email']?>" /></td>
    </tr>
    <tr>
        <td>Quota : </td>
        <td><input type="text" class="input" size="10" name="quota_max" value="<?=$user_info['quota_max']?>" /> MB</td>
    </tr>
    <tr>
        <td>Group : </td>
        <td>
            <select name="group_id" class="input">
            <? foreach( $groups as $id => $name ): ?>
                <option value="<?=$id?>" <?=($id==$user_info['group_id'])?'selected="true"':''?> ><?=$name?></option>
            <? endforeach; ?>
            </select>
        </td>
    </tr>
    <tr>
        <td></td>
        <td>
            <input type="submit" value="Update" />&nbsp;
            <a href="<?=site_url('admin/users/')?>" target="_self"><button>Cancel</button></a>
        </td>
    </tr>
</table>
</form>