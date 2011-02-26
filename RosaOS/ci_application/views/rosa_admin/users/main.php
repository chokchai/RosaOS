<form action="<?=site_url('admin/users_search/')?>" method="post" style="margin: 10px; text-align: right;">
    <input name="keyword" type="text" value="<?=isset($keyword)? $keyword : ''?>" style="padding: 3px; border: 1px solid #999999;" size="20" />
    <input type="submit" value="Search" />
    <? if(isset($keyword)): ?>
    <span style="color: #666666; font-size: 12px;" >
        &nbsp; <?=count($users)?> results
    </span>
    <? endif; ?>
</form>
<table class="admin_table">
    <tr>
        <th style="width: 100px;" >#</th>
        <th style="width: 300px;">Username</th>
        <th style="width: 150px;">Group</th>
        <th style="width: 300px;">Email</th>
        <th style="width: 150px;">Used Quota</th>
        <th style="width: 150px;">Remain Quota</th>
        <th style="width: 150px;">Max Quota</th>
        <th style="width: 100px;">Edit</th>
        <th style="width: 100px;">Delete</th>
    </tr>
    <? foreach( $users as $u ): ?>
    <tr>
        <td style="text-align: center;"><?=$u['id']?></td>
        <td><?=$u['username']?></td>
        <td><?=$u['group_name']?></td>
        <td><?=$u['email']?></td>
        <td style="text-align: center;"><?=round($u['quota_used'])?> MB</td>
        <td style="text-align: center;"><?=round($u['quota_remain'])?> MB</td>
        <td style="text-align: center;"><?=$u['quota_max']?> MB</td>
        <td style="text-align: center;">
            <a href="<?=site_url('admin/edit_user/'.$u['id'])?>" target="_self">
                <input type="submit" value="Edit" />
            </a>
        </td>
        <td style="text-align: center;">
            <a href="<?=site_url('admin/del_user/'.$u['id'])?>" class="confirm_link" target="_self" >
                <input type="submit" value="Delete" />
            </a>
        </td>
    </tr>
    <? endforeach; ?>
</table>
