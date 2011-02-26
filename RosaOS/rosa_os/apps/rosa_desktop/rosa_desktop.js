(function(window, $, undefined){
    var R = window.R;
    
    var desktop = {
        //----- INTERFACE ----------------------------------------------------// 
        NAME : 'RosaDesktop',
        ACCEPT_SIGNAL : 'file',
        ONE_INSTANCE : true,
        IS_PROCESS : true,

        init : function(){
            //load css
            R.getCSS('rosa_desktop/main.css');
            //load and parse template
            this.tmpl = R.loadTemplate('app://rosa_desktop/tmpl.php');
            this.$R = R.addHTML('<div class="rosa_app_desktop"></div>');
            this.$R().data(
                'file_info',
                R.syncSysCall('file/explore_path', ['drive://desktop']).self
            );
            //add context menu
            this.$R.contextmenu = R.addHTML(this.tmpl('#tmpl_contextmenu').hide());
            
            this.scope = {};
            //desktop tilebase { 0 = unuse, 1 = used }
            // axis: X = width, aixs: Y = height
            this.tile = []; 

            //setup scope
            this.setupScope(R.CLIENT.width, R.CLIENT.height);

            //change scope when window resize
            var self = this;
            R.onWindowResize(function(width, height){
                var old_scope = self.scope;
                self.setupScope(width, height);
                //desktop size change
                if( old_scope.maxX != self.scopeX || old_scope.maxY != self.scopeY ){
                    self.resetIconPosition();
                }
            });
        },
        onSignal : function(type, data){
            var self = this;
            switch(data.command){
                case 'prepare_copy':
                case 'prepare_move':
                    self.$R.contextmenu().enableContextMenuItems('#paste');
                    break;
                case 'move':
                    //diable paste when moved data
                    self.$R.contextmenu().disableContextMenuItems('#paste');
                    if(data.files_info[0].parent == self.$R().data('file_info').id){
                        self.refresh();
                    }
                case 'copy':
                case 'new_folder':
                case 'new_file':
                case 'upload':
                    //check is action relate with desktop or not?
                    if( data.file_target.id == self.$R().data('file_info').id ){
                        self.refresh();
                    }
                    break;
                case 'rename':
                    //check is action relate with desktop or not?
                    if( data.file_target.parent == self.$R().data('file_info').id ){
                        self.refresh();
                    }
                    break;
                case 'delete':
                    //check is action relate with desktop or not?
                    if( data.file_target[0].parent == self.$R().data('file_info').id ){
                        self.refresh();
                    }
                    break;
            }
        },

        run : function(){
            this.setDesktopFileList();
            this.initEvent();
        },

        destroy : function(){
            this.$R('*').unbind();
            this.$R().remove();

            this.$R.contextmenu('*').unbind();
            this.$R.contextmenu().remove();
        },

        //----- FUNCTION -----------------------------------------------------//
        setupScope : function(width, height){
            this.scope = {
                maxX : parseInt(Math.floor(width/84)),
                maxY : parseInt(Math.floor(height/84)-1)// -1 becuase taskbar
            }
            this.$R().css({
                height: height - 32,
                width: width
            });
        },

        initEvent : function(){
            var $R = this.$R;
            var self = this;
            //properties
            $R.contextmenu('.properties > a').rosaProperties();
            //download
            $R.contextmenu('.download > a').rosaDownload();
            //upload
            $R.contextmenu('.upload')
                .hover(function(){
                    $(this).addClass('hover');
                },function(){
                    $(this).removeClass('hover');
                })
                .find('a')
                .attr('folder_id', $R().data('file_info').id)
                .rosaUpload(function(ui){
                    switch(ui.status){
                        case 'complete':
                            self.refresh();
                            break;
                    }
                });
        },

        findIconPosition : function(){
            //find from tile [check y first]
            for(var i=0; i<this.scope.maxX; i++){
                if( this.tile[i] === undefined ){
                    this.tile[i] = new Array(this.scope.maxY);
                }
                for(var j=0; j<this.scope.maxY; j++){
                    if( this.tile[i][j] !== 1 ){
                        this.tile[i][j] = 1;
                        return {left: i*84, top: j*84};
                    }
                }
            }
            return false;
        },

        resetIconPosition : function(){
            this.tile = [];
            var self = this;
            this.$R('.dt_icon').each(function(){
                $(this).css(self.findIconPosition());
            });
        },

        moveIconPosition : function(oldX, oldY, newX, newY){
            this.tile[oldX][oldY] = 0;
            this.tile[newX][newY] = 1;
        },

        refresh : function(){
            this.setDesktopFileList();
        },

        setDesktopFileList : function(){
            var self = this;
            R.sysCall('file/explore/', [this.$R().data('file_info').id], function(json){
                if( ! json.self.error ){
                    //bind folder to drop area
                    self.$R().data('file_info', json.self);
                    //clear tiles
                    self.tile = [];
                    if( json.files.error ){
                        json.files = [];
                    }
                    //show files to dasktop
                    self.setFilesToDeskTop(json.files);
                } else {
                    R.alert( 'Fatal Error!! error to access Desktop folder',
                             'Rosa Desktop' );
                }
            }, this.getID());
        },

        setFilesToDeskTop : function(files){
            //clear html
            this.$R().unbind()
                    .find('.dt_icon').unbind()
                    .end().empty();
            //add all html
            var self = this;
            $.each(files, function(){
                if(this.type == 0){
                    this.extension = 'folder';
                }
                //append icons and bind file_data to it
                var tmpl = self.tmpl('#tmpl_icon', this)
                               .data('file_info', this)
                               .css(self.findIconPosition());
                self.$R().append(tmpl);
            });
            this.setDefaultEvent();
        },

        setDefaultEvent : function(){
            /*------------------------------------------------------------------
             * THIS FUNCTION SAME AS ROSA_EXPLORER
             *----------------------------------------------------------------*/
            var $R = this.$R;
            var self = this;
            //FOR SELECTABLE
            $R().selectable("destroy")
            .selectable({
                filter : '.dt_icon',
                stop : function(){
                },
                unselected : function(){
                    //IGNORE
                },
                start : function(){
                    //for hide menu when selectable Event stopPropagation
                    $R.contextmenu().fadeOut(75);
                }
            })
            .find('.dt_icon')
            .hover(
                //hover effect
                function(){$(this).addClass('hover');},
                function(){$(this).removeClass('hover');}
            )
            .dblclick(function(){
                //open files
                R.openwith.open($(this).data('file_info'));
            })
            .mousedown(function(e){
                //selected effect

                //when ctrl select
                if(e.ctrlKey){
                    $R('.dt_icon').removeClass('rosa_last_click');
                    if( $(this).hasClass('ui-selected') ){
                        $(this).removeClass('ui-selected');
                    } else {
                        $(this).addClass('ui-selected rosa_last_click');
                    }
                } else if(e.shiftKey){
                    //when shift select
                    if( ! $R('.dt_icon').hasClass('rosa_last_click') ){
                        $(this).addClass('ui-selected rosa_last_click');
                    } else {
                        $R('.dt_icon').removeClass('ui-selected rosa_shift_click');

                        $(this).addClass('rosa_shift_click');
                        var $next = $R('.rosa_last_click').nextAll('.rosa_shift_click');
                        if( $next.size() > 0 ){
                            $R('.rosa_last_click').nextUntil('.rosa_shift_click')
                                                .andSelf().not('.clear')
                                                .addClass('ui-selected');
                        } else {
                            $R('.rosa_last_click').prevUntil('.rosa_shift_click')
                                                .andSelf()
                                                .addClass('ui-selected');
                        }
                        $R('.rosa_shift_click').addClass('ui-selected');
                    }
                } else if($R('.dt_icon.ui-selected').size() == 1){
                    //when select other file
                    $R('.dt_icon').removeClass('ui-selected rosa_last_click');
                    $(this).addClass('ui-selected rosa_last_click');
                } else {
                    //when first select file
                    $(this).addClass('ui-selected rosa_last_click');
                }
            })
            .rosaDrag({
                //dragable
                scope: $R(),
                data: {app : self, '$R' : $R},
                cursor: 'default',
                opacity: 0.7,
                cursorAt: {
                    top: 64,
                    left: 36
                },
                helper: function(){
                    var f_info = $(this).data('file_info');
                    return self.tmpl('#tmpl_rosa_drag_helper', {
                        image : (f_info.type == 0)? 'folder': f_info.extension,
                        count : $R('.ui-selected').size()
                    });
                },
                start : function(){
                    $(this).addClass('ui-selected');
                }
            })
            .add($R())
            .rosaDrop({
                greedy: true,
                accept : '.rosa_file_icons',
                hoverClass : 'hover',
                drop : function(e, ui){
                    //drop to selected items
                    if( $(this).hasClass('ui-selected')){
                        return false;
                    }
                    var $drag = ui.draggable;
                    var file_self = $(this).data('file_info');
                    var file_move = $drag.data('file_info');
                    //fixed greedy dose not work
                    if( ! $(this).hasClass('dt_icon') && R.isMouseHover(e, $R('.dt_icon'))){
                        //is dropped on dt_icon
                        //let prevent desktop dropable
                        return false;
                    }
                    //stop drop to self desktop
                    if( file_self.id == $R().data('file_info').id && $drag.hasClass('dt_icon') ){
                        return false;
                    }
                    //fixed buggy = ="
                    if( !file_self ){
                        R.alert('Can not found "file_self"', 'ROSA Explorer');
                        return false;
                    }
                    var files = self.getDraggedFileID($drag);
                    var files_info = self.getDraggedFileInfo($drag);
                    if( files.length == 0 ){
                        return false;
                    }
                    if( file_self.type == 0 && file_self.id != file_move.id ){
                        R.api('file/move/',[ files, file_self.id ], function( res ){
                            if( res && res.error ){
                                //add to clipboard
                                R.clipboard = {
                                    sender: $drag.data('app'),
                                    command: 'move',
                                    files_id: files,
                                    files_info: files_info,
                                    file_target: file_self
                                }
                                //check replace
                                self._move_replace(res);
                                return false;
                            } else {
                                self.refresh();
                            }
                            //send signal
                            self.signal('file', {
                                command: 'move',
                                file_target: file_self,
                                files_info: files_info
                            });
                        });//end R.api
                    }
                    return false;
                }
            });

            //context menu
            $R('.dt_icon')
            .add($R())
            .unbind('.rClick')
            .contextMenu({
                menu: $R.contextmenu.getID()
            },function(action, ele, pos) {
                self.command(action, ele);
            })
            .rightClick(function(){
                //check is desktop or is files
                if($(this).attr('id') == $R.getID()){
                    //is desktop
                    $R.contextmenu()
                        .find('.rename,.open,.delete,.download').hide().end()
                        .find('.new_folder,.upload,.refresh,.new_file').show().end()
                        .disableContextMenuItems('#copy,#cut');
                } else {
                    //is files
                    $R.contextmenu()
                        .find('.rename,.open,.delete,.download').show().end()
                        .find('.new_folder,.upload,.refresh,.new_file').hide().end()
                        .enableContextMenuItems('#copy,#cut');
                }

                //add information to rosa ui
                var f_info = $(this).data('file_info');
                $R.contextmenu('.properties > a, .upload > a').data('file_info', f_info);
                $R.contextmenu('.download > a').data('file_info', self.getSelectedFileInfo());
                //make layout of one-click-upload correct
                $R.contextmenu('.upload > div')
                    .css({height: 20, width: 120, position:'relative'})
                    .find('a')
                    .css({ top:0, left:0 });
                $R.contextmenu('.upload form > input')
                    .css({marginTop: -35});
            });
            $R.contextmenu().disableContextMenuItems('#paste');
        },

        command : function(action, ele){
            var $R = this.$R;
            var self = this;
            var filesInfo = this.getSelectedFileInfo();
            var filesID = this.getSelectedFileID();
            var dt_file_info = self.$R().data('file_info');
            var lock_new_folder = R.randID('dt_new_folder');
            var lock_new_file = R.randID('dt_new_file');

            switch(action){
                case 'open':
                    //open file using app in openwith
                    R.openwith.open(filesInfo[0]);
                    break;
                case 'rename':
                    //run RosaRename
                    R.AppManager.run.RosaRename(filesInfo[0]);
                    break;
                case 'cut':
                case 'copy':
                    //setup clipboard
                    action = (action == 'cut')? 'move': action;
                    R.clipboard = {
                        sender: self,
                        command: action,
                        files_id: filesID,
                        files_info: filesInfo
                    };
                    //send signal
                    //convert cut command to move
                    this.signal('file',{
                       command: 'prepare_'+action
                    });
                    //enable to paste
                    $R.contextmenu().enableContextMenuItems('#paste');
                    break;
                case 'delete':
                    var str = (filesID.length == 1)?
                                filesInfo[0].fullname :
                                filesID.length+' files';

                    R.confirm('Are you sure to delete <u>'+str+'</u> ?', 'Delete files',
                        function(){
                            //when user say yes
                            R.sysCall('file/delete', [filesID], function(){
                                self.refresh();
                                //signal
                                self.signal('file', {
                                    command: 'delete',
                                    file_target: filesInfo
                                });
                            });
                        }
                    );
                    break;
                case 'paste':
                    switch( R.clipboard.command ){
                        case 'copy':
                            self._copy();
                            break;
                        case 'move':
                            self._move();
                            break;
                    }
                    break;
                case 'new_folder':
                    var folder_name = 'New Folder';
                    //call file api
                    R.api('file/new_folder/', [folder_name, dt_file_info.id], function(){
                        self.refresh();
                        self.signal('file', {
                           command: 'new_folder',
                           file_target: dt_file_info
                        });
                    }, lock_new_folder);
                    break;
                case 'new_file' :
                    var file_name = 'New File.txt';
                    //call file api
                    R.api('file/new_file/', [file_name, dt_file_info.id], function(){
                        self.refresh();
                        self.signal('file', {
                           command: 'new_file',
                           file_target: dt_file_info
                        });
                    }, lock_new_file);
                    break;
                case 'refresh':
                    self.refresh();
                    break;
            }//end switch
        },

        _copy : function(){
            var cb = R.clipboard;
            var self = this;
            var dt_file_info = self.$R().data('file_info');

            R.sysCall(
                'file/copy/',
                [cb.files_id, dt_file_info.id],
                function(res){
                    //when error show the error
                    if(res && res.error){
                        self.error(res);
                        return;
                    }
                    self.refresh();
                    //send signal to refresh relate apps
                    self.signal('file', {
                        command: 'copy',
                        file_target: dt_file_info,
                        files_info: cb.files_info
                    });
                }, self.getID()
            );
        },

        _move : function(replace){
            var cb = R.clipboard;
            var self = this;
            var dt_file_info = (cb.file_target)?
                                cb.file_target :
                                self.$R().data('file_info');
            R.sysCall(
                'file/move/',
                [cb.files_id, dt_file_info.id, replace],
                function(res){
                    //when error show the error
                    if(res && res.error){
                        self._move_replace(res);
                        return;
                    }
                    //refresh when move file to other
                    self.refresh();
                    cb.sender.refresh();
                    //send signal to refresh relate apps
                    self.signal('file', {
                        command: 'move',
                        file_target: dt_file_info,
                        files_info: cb.files_info
                    });
                    //disable paste when move
                    self.$R.contextmenu().disableContextMenuItems('#paste');
                    //clear clipboard
                    R.clipboard = {};
                }, self.getID()
            );
        },

        _move_replace : function(res){
            var self = this;
            //error filename exist we need to let user confirm move
            if( res.reason[0].reason == 'FILE_OR_FOLDER_NAME_IS_EXIST' ){
                //analysis error
                var error_count = res.reason.length;
                //let user confirm to replace files and folder
                R.confirm(
                    'Do you still want to merge all files ?<br/>'+
                    '<u>'+error_count+' items</u>',
                    'Confirm Folder Replace',
                    function(){
                        //when user say yes
                        self._move(true);
                    }//end yes function
                );
            } else {
                self.error(res);
            }
        },

        getSelectedFileID : function(){
            var files = this.getSelectedFileInfo();
            var f = [];
            $.each(files, function(){
                f.push(this.id);
            });
            return f;
        },

        getSelectedFileInfo : function(){
            var files = [];
            this.$R('.ui-selected').each(function(){
                files.push( $(this).data('file_info') );
            });
            return files;
        },

        getDraggedFileID : function($ele){
            var files = this.getDraggedFileInfo($ele);
            var f = [];
            $.each(files, function(){
                f.push(this.id);
            });
            return f;
        },

        getDraggedFileInfo : function($ele){
            var $r = $ele.data('$R');
            var $f = $r('.ui-selected');
            var files = [];
            $.each($f, function(){
                files.push( $(this).data('file_info') );
            });
            return files;
        },

        error : function( res ){
            var table = [
            '<table class="rosa_table" >',
                '<tr>',
                    '<th width="150">File</th>',
                    '<th width="300">Reason</th>',
                '</tr>'
            ];
            $.each(res.reason, function(){
                table.push(
                    '<tr>',
                        '<td vlign="top">',this.file.fullname,'</td>',
                        '<td vlign="top">',this.reason,'</td>',
                    '</tr>'
                );
            });
            table.push('</table>');

            R.popup(table.join(''), {
                title: 'Rosa Explorer',
                width: 450,
                height: 300
            });
        }
    };

    R.AppManager.add(desktop);
    
    $(function(){
        R.AppManager.run.RosaDesktop();
    });

})(window, jQuery);