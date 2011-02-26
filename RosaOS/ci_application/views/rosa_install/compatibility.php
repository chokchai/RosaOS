<table class="table">
    <tr>
        <td class="head" width="200px;" >PHP</td>
        <td class="<?=$php?'complete':'error'?>"><?=$php? 'Yes': 'No, <br/> PHP version MUST be 5 or upper'?></td>
    </tr>
    <tr>
        <td class="head" >CodeIgniter Config file</td>
        <td class="<?=$config?'complete':'error'?>"><?=$config? 'Yes': 'No, "ci_application/config/config.php" is not writable'?></td>
    </tr>
    <tr>
        <td class="head" >CodeIgniter Database file</td>
        <td class="<?=$database?'complete':'error'?>"><?=$database? 'Yes': 'No, "ci_application/config/dataabse.php" is not writable'?></td>
    </tr>
    <tr>
        <td class="head" >RosaOS Folder</td>
        <td class="<?=$rosa_os?'complete':'error'?>"><?=$rosa_os? 'Yes': 'No, "rosa_os/" is not writable'?></td>
    </tr>
	<tr>
        <td class="head" >Apps Folder</td>
        <td class="<?=$apps?'complete':'error'?>"><?=$apps? 'Yes': 'No, "rosa_os/apps/" is not writable'?></td>
    </tr>
	<tr>
        <td class="head" >Userfiles Folder</td>
        <td class="<?=$users_file?'complete':'error'?>"><?=$users_file? 'Yes': 'No, "rosa_os/user_files/" is not writable'?></td>
    </tr>
    <tr>
        <td class="head" >ZipArchive</td>
        <td class="<?=$zip?'complete':'error'?>"><?=$zip? 'Yes': 'No, PHP Class ZipArchive not found...'?></td>
    </tr>
</table>