<!DOCTYPE html PUBLIC "-//W3C//DTD XHTML 1.0 Transitional//EN" "http://www.w3.org/TR/xhtml1/DTD/xhtml1-transitional.dtd">
<html xmlns="http://www.w3.org/1999/xhtml">
    <head>
        <meta http-equiv="Content-Type" content="text/html; charset=utf-8" />
        <title>Install | Rosa Operating System</title>
        <?php foreach ($css as $href): ?>
            <link rel="stylesheet" href="<?='../'.$href ?>" />
        <?php endforeach; ?>
        </head>
            <body>
                <div class="container" >
                    <h1>Installer - ROSA Operating System</h1>
                    <div class="step_list">
                        <? $i = 0; $step_name = ''; ?>
                        <? foreach( $step_list as $key => $value ): ?>
                        <? if($i==$step) $step_name = $key; ?>
                        <div class="<?=($i++==$step)? 'selected' : '' ?>" >
                            <?=$i.'. '.$key?>
                            <?=count($step_list) > $i ? ' > ':' '?>
                        </div>
                        <? endforeach; ?>
                    </div>
                    <div class="content">
                        <h2><?=$step_name?></h2>

