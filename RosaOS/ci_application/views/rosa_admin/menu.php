<div id="admin_menu" >
    <ul>
        <? $i=-1; $menu_name = FALSE; ?>
        <? foreach($menu_list as $name => $link):
            $i++;
            if($menu==$i){
                $menu_name = $name;
            }
        ?>
        <li class="<?=($menu==$i)? 'selected' : ''?>">
            <a href="<?=site_url($link)?>" target="_self"><?=$name?></a>
        </li>
        <? endforeach; ?>
    </ul>
</div>
<div id="admin_content">
    <div id="admin_content_header">
        <a href="<?=site_url($menu_list[$menu_name])?>" target="_self" ><?=$menu_name?></a>
        <? if(isset($page_name)): ?>
        &nbsp;>&nbsp;
        <?=$page_name?>
        <? endif; ?>
    </div>
    
