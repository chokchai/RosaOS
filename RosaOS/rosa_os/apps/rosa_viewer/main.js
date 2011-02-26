R.onload(function(){

    var viewer = function( file ){
        
        //----- core function ------------------------------------------------//

        var html = '';
        var randID = R.randID();
        var wHeight = 480;
        var wWidth = 640;
        var resize = true;

        //select html
        if( $.inArray(file.extension,['jpg','png','gif','bmp']) != -1 ){
            html = '<img src="'+R.USERS_FILE_PATH+file.fullrosaname+'" height="100%" />';
        } else if( $.inArray(file.extension,['pdf']) != -1 ){
            html = '<iframe src="'+R.USERS_FILE_PATH+file.fullrosaname+'" height="100%" frameborder="0" border="0" style="border:0px;" width="100%" height="100%" ></iframe>';
        } else if(file.extension == 'swf'){
            resize = false;
            html = ['<object width="640" height="480">',
                    '<param name="movie" value="',R.USERS_FILE_PATH,file.fullrosaname,'">',
                    '<embed src="',R.USERS_FILE_PATH,file.fullrosaname,'" width="640" height="480"></embed>',
                    '</object>'].join('');
        } else if(file.extension == 'mp4'){
            resize = false;
            html = '<video src="'+R.USERS_FILE_PATH+file.fullrosaname+'" controls="controls" width="640" height="480" >Sorry, your browser does not support the video tag</video>';
        } else if( $.inArray(file.extension,['ogg','mp3']) != -1 ){
            wWidth = 423;
            wHeight = 109;
            resize = false;
            html = ['<div>',
                    '<div id="jquery_jplayer',randID,'"></div>',
                    '<div class="jp-audio">',
                        '<div class="jp-type-single">',
                                '<div class="jp-interface" id="jp_interface',randID,'">',
                                        '<ul class="jp-controls">',
                                                '<li><a tabindex="1" class="jp-play" href="#">play</a></li>',
                                                '<li><a tabindex="1" class="jp-pause" href="#">pause</a></li>',
                                                '<li><a tabindex="1" class="jp-stop" href="#">stop</a></li>',
                                                '<li><a tabindex="1" class="jp-mute" href="#">mute</a></li>',
                                                '<li><a tabindex="1" class="jp-unmute" href="#">unmute</a></li>',
                                        '</ul>',
                                        '<div class="jp-progress">',
                                                '<div class="jp-seek-bar">',
                                                        '<div class="jp-play-bar"></div>',
                                                '</div>',
                                        '</div>',
                                        '<div class="jp-volume-bar">',
                                                '<div class="jp-volume-bar-value"></div>',
                                        '</div>',
                                        '<div class="jp-current-time"></div>',
                                        '<div class="jp-duration"></div>',
                                '</div>',
                                '<div id="jplayer_playlist" class="jp-playlist">',
                                    '<ul>',
                                        '<li>',file.fullname,'</li>',
                                    '</ul>',
                                '</div>',
                        '</div>',
                    '</div>',
                    '</div>'].join('');
        }

        var $R = R.addHTML(html);
        var process = {};

        $R = $R.ui().rosaDialog({
            title : file.name+'.'+file.extension+' - ROSA Viewer',
            height : wHeight,
            width : wWidth,
            resizable : resize,
            close : function(){
                process.destroy();
            }
        });

        //----- add to Process Manager ---------------------------------------//

        //on signal function
        process = R.ProcessManager.newProcess('Rosa Viewer', function(type, data){
            //when app start
        }, $R);

         //----- display window -----------------------------------------------//

        $R().ready(function(){
            //set jPlayer to player mp3 or ogg
            if( $.inArray(file.extension,['ogg','mp3']) != -1 ){
                $R("#jquery_jplayer"+randID).jPlayer({
                    ready: function () {
                        var opts = {};
                        opts[file.extension] = R.USERS_FILE_PATH + file.fullrosaname;
                        $(this).jPlayer("setMedia",opts).jPlayer("play");
                    },
                    swfPath: 'rosa_os/flash/',
                    cssSelectorAncestor: '#jp_interface'+randID,
                    ended : function(){
                        $(this).jPlayer("play");
                    },
                    supplied: 'mp3, ogg'
                });
            }
        });

    }//end function

    var description = {
        name : 'Rosa Viewer',
        version : '1.0',
        detail : 'simple file viewer. support txt, jpg, png, gif, bmp, txt, pdf, swf, mp4(needed HTML5), ogg',
        developer : 'Chokchai Puttan'
    }

    R.openwith.register('mp3|ogg|png|gif|jpg|bmp|pdf|mp4|swf', viewer, 'Rosa Viewer', description);

});