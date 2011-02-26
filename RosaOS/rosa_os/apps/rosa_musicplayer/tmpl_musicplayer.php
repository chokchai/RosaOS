<div id="tmpl_musicplayer">
    <div>
        <div class="rosa_dialog_menu">
            <div id="jquery_jplayer_${id}" class="jp-jplayer"></div>
            <div class="jp-audio" style="margin-left: 4px;" >
                <div class="jp-type-playlist">
                    <div class="jp-interface" id="jp_interface_${id}" >
                        <ul class="jp-controls">
                            <li><a href="#" class="jp-play" tabindex="1">play</a></li>
                            <li><a href="#" class="jp-pause" tabindex="1">pause</a></li>
                            <li><a href="#" class="jp-stop" tabindex="1">stop</a></li>
                            <li><a href="#" class="jp-mute" tabindex="1">mute</a></li>
                            <li><a href="#" class="jp-unmute" tabindex="1">unmute</a></li>
                            <li><a href="#" class="jp-previous" tabindex="1">previous</a></li>
                            <li><a href="#" class="jp-next" tabindex="1">next</a></li>
                        </ul>
                        <div class="jp-progress">
                            <div class="jp-seek-bar">
                                <div class="jp-play-bar"></div>
                            </div>
                        </div>
                        <div class="jp-volume-bar">
                            <div class="jp-volume-bar-value"></div>
                        </div>
                        <div class="jp-current-time"></div>
                        <div class="jp-duration"></div>
                    </div>
                </div>
            </div>
        </div>
        <div class="jp-audio" style="width: 100% !important;">
            <div class="jp-type-playlist">
                <div id="jp_playlist_${id}" class="jp-playlist">
                    <ul style="border-top: 1px solid #009BE3;">
                        <li><!-- The function displayPlayList() uses this unordered list --></li>
                    </ul>
                </div>
            </div>
        </div>
        <div class="rosa_dialog_footer" >
            <div style="padding: 6px 20px; font-size: 14px; color:#cccccc;" id="mp_droparea" >
                Drop music files(mp3) to add to playlist...
            </div>
        </div>
    </div>
</div>
