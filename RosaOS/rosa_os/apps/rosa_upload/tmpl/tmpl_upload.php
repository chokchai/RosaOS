<div id="tmpl_upload_dialog">
    <div class="ul_progress">
        <div class="ul_folder_path">${folder_path}</div>
        <input class="ul_button" type="button" value="upload" />
        <input class="ul_fake_button" type="button" value="Upload" />
        <div class="ul_log"></div>
    </div>
</div>
<div id="tmpl_upload_wait">
    <div class="upload_wait rosa_icons_ajaxload_16">Uploading...</div>
</div>
<div id="tmpl_upload_log">
    <div class="ul_log_wrap">
        <div class="upload_complete_icon rosa_icons_64 rosa_icons_${extension}_64"></div>
        <div class="upload_complete_description">
            <a class="ul_open" href="#ul_open">${fullname}</a>
            <div class="ul_path">${fullpath}</div>
            <a class="ul_show_in_folder" href="#ul_show_in_folder">Show in folder</a>
            <a class="ul_remove_list" href="#ul_remove_list">Remove from list</a>
        </div>
    </div>
</div>