<form action="<?=site_url('admin/applications_search/')?>" method="post" style="margin: 10px; text-align: right;">
    <input name="keyword" type="text" value="<?=isset($keyword)? $keyword : ''?>" style="padding: 3px; border: 1px solid #999999;" size="20" />
    <input type="submit" value="Search" />
    <? if(isset($keyword)): ?>
    <span style="color: #666666; font-size: 12px;" >
        &nbsp; <?=count($app_info)?> results
    </span>
    <? endif; ?>
</form>
<input type="button" id="upload_app" value="Upload new application" />
<div style="margin-bottom: 5px;"></div>
<table class="admin_table">
    <tr>
        <th style="width: 200px;">Name</th>
        <th style="width: 50px;">Version</th>
        <th style="width: 150px;">Developer</th>
        <th style="width: 100px;">Status</th>
        <th style="width: 100px;">Delete</th>
    </tr>
    <? foreach( $app_info as $name => $app ): ?>
    <? if($name !== 'rosa_core') : ?>
    <tr <? if($app['about']['enable']==='No'):?>style="background-color: #efefef;<?endif;?>">
        <td style="padding-left:20px; padding-right: 20px;">
            <a href="<?=site_url('admin/applications_info/'.$name.'/')?>"><?=$app['about']['name']?></a>
        </td>
        <td align="center"><?=$app['about']['version']?></td>
        <td align="center"><?=$app['about']['developer']?></td>
        <td style="text-align: center;">
            <select style="padding: 3px; color: #333333;" class="submit_select">
                <option value="<?=site_url('admin/enable_app/'.$name.'/')?>" <? if($app['about']['enable']==='Yes')echo'selected="true"'; ?> >Enable</option>
                <option value="<?=site_url('admin/disable_app/'.$name.'/')?>" <? if($app['about']['enable']==='No')echo'selected="true"'; ?> >Disable</option>
            </select>
        </td>
        <td style="text-align: center;">
            <a href="<?=site_url('admin/delete_app/'.$name)?>" class="confirm_link" target="_self" >
                <input type="submit" value="Delete" />
            </a>
        </td>
    </tr>
    <? endif; ?>
    <? endforeach; ?>
</table>

