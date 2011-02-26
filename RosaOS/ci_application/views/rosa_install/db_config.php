<? if($status == 'error'): ?>
<div class="error" style="padding: 5px 10px; margin: 5px 0;">Error... Can not write file "ci_application/config/database.php"</div>
<? endif; ?>
<form action="<?='../install/config_db_save/'?>" method="post" style="margin-top: 10px;">
<textarea name="source" id="source_php" style="width: 96%; height: 400px;" ><?=read_file(R_AB_PATH.'ci_application/config/database.php')?></textarea>
</form>
