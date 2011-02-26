 (function(window, $, undefined){
    var R = window.R;
    var App = R.getHelper('rosa_musicplayer');
    var file = R.getClass('file');

    /* Original Source Code PlayList
     * From http://www.happyworm.com/jquery/jplayer/latest/demo-02.htm
     */
    //Play List Class
    var Playlist = function(instance, playlist, options) {
        var self = this;

        this.instance = instance; // String: To associate specific HTML with this playlist
        this.playlist = playlist; // Array of Objects: The playlist
        this.options = options; // Object: The jPlayer constructor options for this playlist

        this.current = 0;

        this.cssId = {
            jPlayer: "jquery_jplayer_",
            Interface: "jp_interface_",
            playlist: "jp_playlist_"
        };
        this.cssSelector = {};

        $.each(this.cssId, function(entity, id) {
            self.cssSelector[entity] = "#" + id + self.instance;
        });

        if(!this.options.cssSelectorAncestor) {
            this.options.cssSelectorAncestor = this.cssSelector.Interface;
        }

        $(this.cssSelector.jPlayer).jPlayer(this.options);

        $(this.cssSelector.Interface + " .jp-previous").click(function() {
            self.playlistPrev();
            $(this).blur();
            return false;
        });

        $(this.cssSelector.Interface + " .jp-next").click(function() {
            self.playlistNext();
            $(this).blur();
            return false;
        });
    };

    Playlist.prototype = {
        displayPlaylist: function() {
            var self = this;
            $(this.cssSelector.playlist + " ul").empty();
            for (i=0; i < this.playlist.length; i++) {
                var listItem = (i === this.playlist.length-1) ? "<li class='jp-playlist-last'>" : "<li>";
                listItem += "<a href='#' id='" + this.cssId.playlist + this.instance + "_item_" + i +"' tabindex='1'>"+ this.playlist[i].name +"</a>";

                // Create links to free media
                if(this.playlist[i].free) {
                    var first = true;
                    listItem += "<div class='jp-free-media'>(";
                    $.each(this.playlist[i], function(property,value) {
                        if($.jPlayer.prototype.format[property]) { // Check property is a media format.
                            if(first) {
                                first = false;
                            } else {
                                listItem += " | ";
                            }
                            listItem += "<a id='" + self.cssId.playlist + self.instance + "_item_" + i + "_" + property + "' href='" + value + "' tabindex='1'>" + property + "</a>";
                        }
                    });
                    listItem += ")</span>";
                }

                listItem += "</li>";

                // Associate playlist items with their media
                $(this.cssSelector.playlist + " ul").append(listItem);
                $(this.cssSelector.playlist + "_item_" + i).data("index", i).click(function() {
                    var index = $(this).data("index");
                    if(self.current !== index) {
                        self.playlistChange(index);
                    } else {
                        $(self.cssSelector.jPlayer).jPlayer("play");
                    }
                    $(this).blur();
                    return false;
                });

                // Disable free media links to force access via right click
                if(this.playlist[i].free) {
                    $.each(this.playlist[i], function(property,value) {
                        if($.jPlayer.prototype.format[property]) { // Check property is a media format.
                            $(self.cssSelector.playlist + "_item_" + i + "_" + property).data("index", i).click(function() {
                                var index = $(this).data("index");
                                $(self.cssSelector.playlist + "_item_" + index).click();
                                $(this).blur();
                                return false;
                            });
                        }
                    });
                }
            }
        },
        playlistInit: function(autoplay) {
            if(autoplay) {
                this.playlistChange(this.current);
            } else {
                this.playlistConfig(this.current);
            }
        },
        playlistConfig: function(index) {
            $(this.cssSelector.playlist + "_item_" + this.current).removeClass("jp-playlist-current").parent().removeClass("jp-playlist-current");
            $(this.cssSelector.playlist + "_item_" + index).addClass("jp-playlist-current").parent().addClass("jp-playlist-current");
            this.current = index;
            if(this.playlist.length > 0){
                $(this.cssSelector.jPlayer).jPlayer("setMedia", this.playlist[this.current]);
            }
        },
        playlistChange: function(index) {
            this.playlistConfig(index);
            $(this.cssSelector.jPlayer).jPlayer("play");
        },
        playlistNext: function() {
            var index = (this.current + 1 < this.playlist.length) ? this.current + 1 : 0;
            this.playlistChange(index);
        },
        playlistPrev: function() {
            var index = (this.current - 1 >= 0) ? this.current - 1 : this.playlist.length - 1;
            this.playlistChange(index);
        }
    };

    //=== APPLICATION ========================================================//
    var music = {
        NAME : 'RosaMusicPlayer',

        init : function(){
            this.tmpl = App.loadTemplate('tmpl_musicplayer.php');
            this.$R = {};
            //now playing index
            this.playItem = 0;
            this.playList = [];
            this.isStart = false;
            this.playListObj = {};
        },

        destroy : function(){
            this.$R(this.playListObj.cssSelector.jPlayer)
                .hide().jPlayer('pause').jPlayer('destroy');
            this.$R.dialog('destroy');
        },

        run : function(){
            var id = R.randID('rosa_musicplayer');
            var $R = R.addHTML(this.tmpl('#tmpl_musicplayer', {
                'id':id
            }));
            $R = $R.ui().rosaDialog({
                title : 'MusicPlayer',
                iconClass: 'rosa_icon_audio_x_generic_24',
                width : 425,
                minWidth: 427,
                maxWidth: 427,
                height: 300,
                minHeight: 200,
                footHeight: 30,
                menuHeight: 82,
                close : function(){
                    self.destroy();
                }
            });

            this.$R = $R;
            var self = this;

            this.playListObj = new Playlist(id, this.playList, {
                ready: function() {
                    self.playListObj.displayPlaylist();
                    self.playListObj.playlistInit(false); // Parameter is a boolean for autoplay.
		},
		ended: function() {
                    self.playListObj.playlistNext();
		},
                swfPath : 'rosa_os/flash/',
                supplied : 'mp3'
            });

            var rePlaylist = function(){
                //relist
                self.playListObj.displayPlaylist();
                self.playListObj.playlistInit(true); // Parameter is a boolean for autoplay.
                //set Remove button
                $R('.jp-playlist > ul > li').each(function(i){
                    var $a = $('<a href="#remove" index="'+i+'" >x</a>')
                                .click(function(){
                                    //remove self form list
                                    self.playList.splice($(this).attr('index'),1);
                                    self.playListObj.playlist = self.playList;
                                    //check playItem is out of bound ?
                                    if( self.playListObj.current > self.playListObj.playlist.length-1 ){
                                        self.playListObj.current = self.playListObj.playlist.length-1;
                                    }
                                    //relist
                                    rePlaylist();
                                }).css('float','right');
                    $(this).append($a);
                })
            }

            // setup Drop area [ Dialog body and foot ]
            $R.dialog.$body
                .add($R.dialog.$footer)
                .rosaDrop({
                    greedy: true,
                    accept : '.rosa_file_icons',
                    hoverClass : 'hover',
                    drop : function(e, ui){
                        var files_info = self.getDraggedFileInfo(ui.draggable);
                        $.each(files_info, function(i, f){
                            //insert only file
                            if(f.type == 1 && f.extension == 'mp3'){
                                var pl = {};
                                pl.name = f.name,
                                pl[f.extension] = R.USERS_FILE_PATH+f.fullrosaname;
                                self.playList.push(pl);
                                //assign to playlist Object
                                self.playListObj.playlist = self.playList;
                            }
                        });
                        //rePlayList
                        rePlaylist();
                    }
            });
        },

        getDraggedFileInfo : function($ele){
            var $r = $ele.data('$R');
            var $f = $r('.ui-selected');
            var files = [];
            $.each($f, function(){
                files.push( $(this).data('file_info') );
            });
            return files;
        }
    };

    R.AppManager.add(music);

})(window, jQuery)