<? if(isset($error)): ?>
<div class="error" > Error !! Not found applications "<?=$app_name?>"</div>
<? endif; ?>
<? if(! isset($error)): ?>
<table class="app_table" >
    <? foreach($app_info as $name => $info): ?>
    <tr>
        <td colspan="2" class="header" ><?=$name?></td>
    </tr>
    <? if( !$info || count($info) == 0){ ?>
    <tr><td style="width: 150px;">&nbsp;</td></tr>
    <? } else { ?>
    <? foreach($info as $key => $val): ?>
        <? if(is_array($val)){ ?>
        <tr>
            <td style="width: 150px;"><?=is_numeric($key)?($key+1):$key?>:</td>
            <td>
                <table class="app_sub_table" >
                    <? foreach($val as $k => $v): ?>
                    <tr>
                        <td style="width:100px;"><?=is_numeric($k)?($k+1):$k?>:</td>
                        <td><?=$v?><?=($k=='file')?'.php':''?></td>
                    </tr>
                    <? endforeach; ?>
                </table>
            </td>
        </tr>
        <? } else { ?>
        <tr>
            <td style="width: 150px;"><?=is_numeric($key)?($key+1):$key?>:</td>
            <td><?=$val?></td>
        </tr>
        <? } ?>
    <? endforeach; ?>
    <? } ?>
    <? endforeach; ?>
</table>
<div class="app_dir_wrap" >
    <div class="app_dir_header">Directory</div>
    <pre class="app_dir">
<?print_r($directory)?>

** Provide By CodeIgniter Directory Hepler
+ directory_map('source directory')
  - This function reads the directory path specified in the first parameter
    and builds an array representation of it and all its contained files.
    (http://codeigniter.com/user_guide/helpers/directory_helper.html)
    </pre>
</div>
<? endif; ?>