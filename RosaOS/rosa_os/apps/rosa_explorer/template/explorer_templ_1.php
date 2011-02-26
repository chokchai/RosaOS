<div id="templ_rosa_ex_main">
    <div>
        <div class="rosa_dialog_menu">
            <div class="rosa_ex_path">
                <span id="rosa_ex_control" >
                    <button id="rosa_ex_path_back" class="cursor_pointer " >Back</button>
                    <button id="rosa_ex_path_forward" class="cursor_pointer" >Previous</button>
                </span>
                <input class="text_input path_input" name="path" type="text" size="70" value="<%= this.path %>" />
                <input class="text_input search_input" name="search" type="text" size="15" value="" />
            </div>
            <div class="rosa_ex_menu" >
                <div id="rosa_ex_new_folder" class="left cursor_pointer unselect" >New Folder</div>
                <div id="rosa_ex_copy" class="copy left cursor_pointer rosa_ex_file_menu unselect" >Copy</div>
                <div id="rosa_ex_cut" class="cut left cursor_pointer rosa_ex_file_menu unselect" >Cut</div>
                <div id="rosa_ex_paste" class="paste left cursor_pointer unselected">Paste</div>
                <div id="rosa_ex_delete" class="delete left cursor_pointer rosa_ex_file_menu unselect" >Delete</div>
                <div id="rosa_ex_rename" class="rename left cursor_pointer rosa_ex_file_menu unselect" >Rename</div>
                <div id="rosa_ex_download" class="download left cursor_pointer rosa_ex_file_menu unselect" >Download.zip</div>
                <div class="left"><span class="upload unselect" >Upload</span></div>
                <div class="clear"></div>
            </div>
        </div>
        <div class="rosa_ex_content_wrap rosa_dialog_body">
            <div class="rosa_ex_content"></div>
            <div class="ui-corner-all rosa_ex_file_drop_area" ></div>
        </div>
        <div class="rosa_dialog_footer" >
        </div>
    </div>
</div>
<div id="templ_rosa_ex_med_icons">
    <div class="rosa_file_icons rosa_file_med_icons ui-corner-all" >
        <div class="rosa_icons_64 rosa_icons_<%= this.image %>_64"></div>
        <input size="15" value="<%= this.name %>" />
    </div>
</div>
<div id="templ_rosa_ex_sm_icons">
    <div class="rosa_file_icons rosa_file_sm_icons cursor_default" >
        <div class="rosa_icons_32 rosa_icons_<%=this.image%>_32 left" style="position:relative; top:-12px;" ></div>
        <div class="left rosa_file_name" style="padding-left:5px;" ><%=this.name%></div>
        <div class="right" style="width:32px; padding-left: 3px;">
            <div class="left ui-button-icon-primary ui-icon ui-icon-arrowthickstop-1-s download" title="download" style="cursor: pointer; display: none;" ></div>
            <div class="left ui-button-icon-primary ui-icon ui-icon-help properties" title="properties" style="cursor: help; display: none;" ></div>
            <div class="left" style="width:1px;">&nbsp</div>
        </div>
        <div class="right"><%=this.last_modified%></div>
        <div class="clear"></div>
    </div>
</div>
<div id="temp_rosa_ex_drag_helper">
    <div class="rosa_icons_64 rosa_icons_<%= this.image %>_64 rosa_drag_helper" style="z-index:999999; margin:0px !important;">
        <% if(this.count > 0) { %>
        <div style="position:relative; top:45px; left:50px; font-size:12px;">
            <span style="background-color: #ffffff; border: 1px solid #000000; padding:1px 4px" ><%= this.count %></span>
        </div>
        <% } %>
    </div>
</div>
<div id="templ_rosa_ex_warning">
    <div style="padding:10px;" class="ui-state-highlight ui-corner-all">
        <p><span style="float: left; margin-right: 0.3em;" class="ui-icon ui-icon-info"></span>
            <strong>Warning : </strong><%= this.message %></p>
    </div>
</div>
<div id="templ_rosa_ex_alert" >
    <div style="padding:10px;" class="ui-state-error ui-corner-all">
        <p><span style="float: left; margin-right: 0.3em;" class="ui-icon ui-icon-alert"></span> 
            <strong>Alert : </strong><%= this.message %>
        </p>
    </div>
</div>
