<div id="tmpl_taskbar">
    <div class="taskbar" >
        <div id="start">Start</div>
        <div id="task"></div>
        <div id="notification"></div>
        <div class="clear"></div>
    </div>
</div>
<div id="tmpl_taskitem">
    <div class="taskitem" id="${taskID}">
        <div class="task_icon rosa_icons_24 ${iconClass}" ></div>
        <div class="task_title">${title}</div>
        <div class="clear"></div>
    </div>
</div>
<div id="tmpl_startmenu">
    <div class="st_wrap_menu">
        <div class="st_wrap_apps">
            <div class="st_app_list">
                {{each apps}}
                <div class="st_app st_app_install" style="background-image: url('${iconImage}')" rosa_app="${appName}" rosa_param="${param}" >
                    ${title}
                </div>
                {{/each}}
            </div>
            <div class="st_search">
                <input type="text" class="st_search_input" />
            </div>
        </div>
        <div class="wrap_const_apps">
            <div class="const_apps">
                <div class="st_app st_app_default" rosa_app="RosaExplorer" rosa_param="drive://libraries/documents/" >
                    Documents
                </div>
                <div class="st_app st_app_default" rosa_app="RosaExplorer" rosa_param="drive://libraries/music/" >
                    Music
                </div>
                <div class="st_app st_app_default" rosa_app="RosaExplorer" rosa_param="drive://libraries/pictures/">
                    Pictures
                </div>
                <div class="st_app st_app_default separator" rosa_app="RosaExplorer" rosa_param="drive://libraries/videos/">
                    Videos
                </div>
                <div class="st_app st_app_default" rosa_app="RosaExplorer" rosa_param="">
                    Drive
                </div>
                <div class="st_app st_app_default separator" rosa_app="RosaExplorer" rosa_param="drive://apps/">
                    Applications
                </div>
            </div>
            <div class="wrap_logoff">
                <a href="<?=site_url('logout')?>" target="_self" >Log out</a>
            </div>
        </div>
        <div class="clear"></div>
    </div>
</div>
