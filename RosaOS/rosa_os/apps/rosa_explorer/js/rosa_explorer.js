(function(window, $, undefined){
    
    var R = window.R;

    //===== explorer class ===============================================//
    var Explorer = {
        
        /* ---------------------------------------------------------------------
         * INTERFACE
         * ---------------------------------------------------------------------
         */

        NAME : 'RosaExplorer',
        ACCEPT_SIGNAL : 'file',
        
        init : function(){
            R.getCSS('rosa_explorer/css/rosa_explorer.css');
            R.getCSS('rosa_desktop/main.css');
            //defind variable
            this.templ = R.loadTemplate('app://rosa_explorer/template/explorer_templ.php', false, true);
            //load desktop template for context menu
            this.tmpl = R.loadTemplate('app://rosa_desktop/tmpl.php');
            //local variable
            this.path = 'drive://';
            this.file_info = {};
            this.history_index = 0;
            this.history = [];
            this.$R = null;
            this.lock_explore = false;
            this.viewType = 'sm';
            this.old_path = '';
            this.forward = [];
            this.forward_index = 0;
            this._hook_selectfile = this._hook_selectfile ? this._hook_selectfile : $.noop;
            this._hook_openfile = this._hook_openfile ? this._hook_openfile : $.noop;
            this._hook_dialog = this._hook_dialog ? this._hook_dialog : {};
            this._hook_start = this._hook_start ? this._hook_start : $.noop;
            this._hook_afterExplore = this._hook_afterExplore ? this._hook_afterExplore : $.noop;
        },

        onSignal : function(type, data){
            var self = this;
            if( data !== undefined){
                switch(data.command){
                    case 'prepare_copy':
                    case 'prepare_move':
                        self.$R.contextmenu().enableContextMenuItems('#paste');
                        break;
                    case 'move':
                        //diable paste when moved data
                        self.$R.contextmenu().disableContextMenuItems('#paste');
                        if(data.files_info[0].parent == self.getCurrentFolder().id){
                            self.refresh();
                            break;
                        }
                    case 'copy':
                    case 'new_folder':
                    case 'new_file':
                    case 'upload':
                        if( data.file_target.id == self.getCurrentFolder().id )
                            self.refresh();
                        break;
                    case 'rename':
                        if( data.file_target.parent == self.getCurrentFolder().id)
                            self.refresh();
                        break;
                    case 'delete':
                        if( data.file_target[0].parent == self.getCurrentFolder().id)
                            self.refresh();
                        break;
                }
            }//end if
        },

        destroy : function(){
            this.$R('*').unbind();
            this.$R().remove();

            this.$R.contextmenu('*').unbind();
            this.$R.contextmenu().remove();
        },

        /* ---------------------------------------------------------------------
         * END INTERFACE
         * ---------------------------------------------------------------------
         */

        setViewType : function( type ){
            this.viewType = type;
        },

        getViewType : function(){
            return this.viewType;
        },

        initExplorer : function(){
            var self = this;

            //==== prepare html ==============================================//
            this.$R = R.addHTML(
                this.templ.getHTML('#templ_rosa_ex_main', {'path': this.path})
            );
            // dialog
            this.$R = this.$R.ui().rosaDialog($.extend({
                title : 'ROSA Explorer',
                iconClass : 'rosa_icon_folder_new_24',
                minWidth : 400,
                minHeight : 300,
                height: 400,
                menuHeight: 40,
                close : function(){
                    self.destroy();
                }
            }, this._hook_dialog));
            //add context menu
            this.$R.contextmenu = R.addHTML(this.tmpl('#tmpl_contextmenu').hide());
            //for shotcut
            var $R = this.$R;
            
            //==== setup interface =======================================//
            $R.dialog.$body.mousedown(function(){
                $R.dialog('moveToTop');
            });

            $R('#rosa_ex_path_back').button({
                text: false,
                icons: {
                    primary : 'ui-icon-carat-1-w'
                }
            }).next().button({
                text: false,
                icons: {
                    primary : 'ui-icon-carat-1-e'
                }
            }).parent().buttonset();
            
            //===== event handeler =======================================//
            $R('#rosa_ex_path_back').click(function(){
                var h_info = self.getBackHistory();
                if( h_info ){
                    self.explore(h_info.file_info, function(){
                        self.setCurrentPath( h_info.path );
                    });
                }
            });
            $R('#rosa_ex_path_forward').click(function(){
                var h_info = self.getForwardHistory();
                if( h_info ){
                    self.explore(h_info.file_info, function(){
                        self.setCurrentPath( h_info.path );
                    });
                }
            });
            //enter path
            $R('.path_input').keypress(function(e){
                if(e.which == 13){
                    //clear forward
                    this.forward = [];
                    this.forward_index = 0;

                    var path = self.getCurrentPath();
                    self.explore_path( path );
                }
            });

            //----- CONTEXT MENU -----------------------------------------------
            
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
                .rosaUpload(function(ui){
                    switch(ui.status){
                        case 'complete':
                            self.refresh();
                            break;
                    }
                });

            //hook on start
            //useful at rosaBrowse
            this._hook_start.apply(this, []);
        },

        setHookOpenFile : function(func){
            if($.isFunction(func)){
                this._hook_openfile = func;
            } else {
                console.log('Error setHookOpenfile : parameter must be a function.');
            }
        },

        setHookDialog : function(opts){
            this._hook_dialog = opts;
        },

        setHookStart : function(func){
            if($.isFunction(func)){
                this._hook_start = func;
            } else {
                console.log('Error setHookStart : parameter must be a function.');
            }
        },

        setHookAfterExplore : function(func){
            if($.isFunction(func)){
                this._hook_afterExplore = func;
            } else {
                console.log('Error setHookAfterExplore : parameter must be a function.');
            }
        },

        setHookSelectFile : function(func){
            if($.isFunction(func)){
                this._hook_selectfile = func;
            } else {
                console.log('Error setHookSelectFile : parameter must be a function.');
            }
        },

        bindEventToContent : function(){
            var self = this;
            var $R = this.$R;
            
            $R('.ui-dialog-content')
            .selectable("destroy")
            .selectable({
                'cancle' : '.clear',
                'filter' : '.rosa_file_icons',
                'unselected' : function(){
                    $(this).removeClass('rosa_last_click');
                    //for rename
                    $R('.rosa_file_rename').trigger('rename');
                },
                'stop' : function(){
                    //hook seletfile
                    self._hook_selectfile.apply(self, [self.getSelectedFileInfo()]);
                }
            })
            .find('.rosa_file_icons')
            .mousedown(function(e){
                //when ctrl select
                if(e.ctrlKey){
                    $R('.rosa_file_icons').removeClass('rosa_last_click');
                    if( $(this).hasClass('ui-selected') ){
                        $(this).removeClass('ui-selected');
                    } else {
                        $(this).addClass('ui-selected rosa_last_click');
                    }
                } else if( e.shiftKey ){
                    //when shift select
                    if( ! $R('.rosa_file_icons').hasClass('rosa_last_click') ){
                        $(this).addClass('ui-selected rosa_last_click');
                    } else {
                        $R('.rosa_file_icons').removeClass('ui-selected rosa_shift_click');

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
                } else if($R('.rosa_file_icons.ui-selected').size() == 1){
                    //when select other file
                    $R('.rosa_file_icons').removeClass('ui-selected rosa_last_click');
                    $(this).addClass('ui-selected rosa_last_click');
                } else {
                    //when first select file
                    $(this).addClass('ui-selected rosa_last_click');
                }

                //hook seletfile
                self._hook_selectfile.apply(self, [self.getSelectedFileInfo()]);
            });

            //double click icons
            $R('.rosa_file_'+this.viewType+'_icons').dblclick(function(){
                if( ! self.isLockExplore() ){
                    //lock explore, for can explore once times
                    self.lockExplore();

                    var f_info = $(this).data('file_info');
                    //if is folder
                    if( f_info.type == 0 ){
                        //clear forward
                        self.forward = [];
                        self.forward_index = 0;

                        //drive into folder
                        self.explore( f_info, function(json){
                            if( ! json.error){
                                //set current path
                                self.setCurrentPath(json.self.fullpath);
                                //add history
                                self.addHistory({
                                    'file_info': json.self,
                                    'path': self.getCurrentPath()
                                });
                            } else {
                                //add current path
                                self.addCurrentPath(f_info.name);
                                //add history
                                self.addHistory({
                                    'file_info': f_info,
                                    'path': self.getCurrentPath()
                                });
                            }
                            //un lock explore
                            self.unlockExplore();
                        });
                    } else if( f_info.type == 1 ) {
                        //check is have hook openfile ?
                        //is useful for rosaBrowse
                        if(self._hook_openfile.apply(self, [f_info]) !== false){
                            //open files
                            R.openwith.open(f_info);
                            //R.alert('open files : '+f_info['name']+'.'+f_info['extension'], 'Open with...');
                            self.unlockExplore();
                        }
                    }
                }
            }).hover(
            function(){ //hover
                self.focusIcon( this );
                self.showHoverMenu( this );
            },function(){
                self.blurIcon( this );
                self.hideHoverMenu( this );
            });

            // dragable is set after dropable begin
            this.setDraggable( $R('.rosa_file_icons') );
            this.setDroppable( $R('.rosa_file_icons, .ui-dialog-content') );

            //set context menu
            $R('.rosa_file_icons')
            .add($R.dialog.$body) //add to backgroud
            .unbind('.rClick')
            .contextMenu({
                menu: $R.contextmenu.getID()
            },function(action, ele, pos) {
                self.command(action, ele);
            })
            .rightClick(function(){
                //check is backgroud or is files
                if($(this).attr('id') == $R.dialog.$body.attr('id')){
                    //is backgroud
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
                var f_info = self.getCurrentFolder();
                $R.contextmenu('.properties > a, .upload > a')
                    .data('file_info', f_info);
                $R.contextmenu('.download > a')
                    .data('file_info', self.getSelectedFileInfo());
                //make layout of one-click-upload correct
                $R.contextmenu('.upload > div')
                    .css({height: 20, width: 120, position:'relative'})
                    .find('a')
                    .attr('folder_id', f_info.id) //add folder id for upload
                    .css({top:0, left:0});
                $R.contextmenu('.upload form > input')
                    .css({marginTop: -35});
            });
            //diable paste when no command in clipboard
            if( ! R.clipboard.command ){
                $R.contextmenu().disableContextMenuItems('#paste');
            }

            //parse ui
            $R.ui.parse();

            //hook after explore and init all important function
            this._hook_afterExplore.apply(this, []);
        },

        command : function(action, ele){
            var $R = this.$R;
            var self = this;
            var filesInfo = this.getSelectedFileInfo();
            var filesID = this.getSelectedFileID();
            var current_fileInfo = this.getCurrentFolder();
            var lock_new_folder = R.randID('ex_new_folder');
            var lock_new_file = R.randID('ex_new_file');
            
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
                    R.api('file/new_folder/', [folder_name, current_fileInfo.id], function(){
                        self.refresh();
                        self.signal('file', {
                           command: 'new_folder',
                           file_target: current_fileInfo
                        });
                    }, lock_new_folder);
                    break;
                case 'new_file':
                    var file_name = 'New File.txt';
                    //call file api
                    R.api('file/new_file/', [file_name, current_fileInfo.id], function(){
                        self.refresh();
                        self.signal('file', {
                           command: 'new_file',
                           file_target: current_fileInfo
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
            var current_fileInfo = this.getCurrentFolder();

            R.sysCall(
                'file/copy/',
                [cb.files_id, current_fileInfo.id],
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
                        file_target: current_fileInfo,
                        files_info: cb.files_info
                    });
                }, self.getID()
            );
        },

        _move : function(replace){
            var cb = R.clipboard;
            var self = this;
            //check clipboard is set file target ?
            var current_fileInfo = (cb.file_target)? 
                                    cb.file_target :
                                    this.getCurrentFolder();
            R.sysCall(
                'file/move/',
                [cb.files_id, current_fileInfo.id, replace],
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
                        file_target: current_fileInfo,
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
        
        bindFileData : function(file_list){
            var self = this;
            $.each( file_list, function(i, file){
               var $ele = self.$R('.rosa_file_icons:eq('+i+')');
               //for selcted
               file.element = $ele; //add element for reference to files
               $ele.data('file_info', file).data('app', self);
               //for download and properties
               $ele.find('.ui-icon').data('file_info', file);
            });
        },
        
        setDraggable : function( $ele ){
            var self = this;
            self.$R.ui($ele).rosaDrag({
                'scope': self.$R(),
                'data': {'app' : self, '$R' : self.$R},
                'cursor': 'default',
                'opacity' : 0.7,
                'cursorAt': {
                    'top': 70,
                    'left': 36
                },
                'appendTo': '#rosa_drag_helper_temp',
                'helper': function(){
                    var f_info = $(this).data('file_info');
                    var icon_img = (f_info.type == 0)? self.folderImage( f_info ) : f_info.extension;
                    var count = self.$R('.ui-selected').size();
                    return $( self.templ.getHTML( '#temp_rosa_ex_drag_helper', {
                        'image' : icon_img,
                        'count' : count
                    } ) );
                },
                'start' : function(){
                    $(this).addClass('ui-selected');
                }
            });
        },

        setDroppable : function( $ele ){
            var self = this;

            $ele.rosaDrop({
                greedy : true,
                'accept' : '.rosa_file_icons',
                'hoverClass' : 'rosa_file_'+self.viewType+'_icons_focus',
                'drop' : function(e, ui){
                    var $drag = ui.draggable;
                    var file_self = ($(this).hasClass('ui-dialog-content'))?
                                    self.getCurrentFolder() :
                                    $(this).data('file_info');
                    var file_move = $drag.data('file_info');
                    //fixed buggy = ="
                    if( !file_self ){
                        R.alert('Can not found "file_self"', 'ROSA Explorer');
                        return false;
                    }
                    //drop to selected items
                    if( $(this).hasClass('ui-selected') ){
                        return false;
                    }

                    var files = self.getDraggedFileInfo($drag);
                    var filesID = self.getDraggedFileID($drag);

                    if( filesID.length == 0 ){
                        return false;
                    }
                    if( file_self.type == 0 && file_self.id != file_move.id ){
                        R.api('file/move/',[ filesID, file_self.id ], function( res ){
                            if( res && res.error ){
                                //add to clipboard
                                R.clipboard = {
                                    sender: $drag.data('app'),
                                    command: 'move',
                                    files_id: filesID,
                                    files_info: files,
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
                                files_info: files
                            });
                        });
                    }
                    return false;
                }
            });
        },

        getDraggedFileID : function(ele){
            var files = this.getDraggedFileInfo(ele);
            var f = [];
            $.each(files, function(){
                f.push(this.id);
            });
            return f;
        },
        
        getDraggedFileInfo : function( ele ){
            var $ele = $(ele);
            var $r = $ele.data('$R');
            var $f = $r('.ui-selected');
            var files = [];
            $.each($f, function(){
                files.push( $(this).data('file_info'));
            });
            return files;
        },

        getSelectedFileID : function(){
            var files = this.getSelectedFileInfo();
            var f = [];
            $.each(files, function(){
                f.push( this.id );
            });
            return f;
        },

        getSelectedFileInfo : function(){
            var files = [];
            this.$R('.rosa_ex_content .ui-selected').each(function(){
                files.push( $(this).data('file_info') );
            });
            return files;
        },

        refresh : function( func ){
            func  = ( func )? func : $.noop;
            this.explore( this.getCurrentFolder(), func );
        },

        explore : function( file, func ){
            var self = this;
            R.api('file/explore/', [ file.id ], function( json ){
                self.clearFileInfo();
                if( ! json.error && ! json.files.error ){
                    var content = self.getFileListHTML(json.files);
                    self.addContent(content);
                    self.bindFileData(json.files);
                    self.bindEventToContent();
                } else {
                    self.showError(json);
                    self.bindEventToContent();
                }
                //run call back
                if($.isFunction(func)){
                    func(json);
                }
                //set upload target
                self.setUpload( self.getCurrentFolder() );
                //set new folder target
                self.setNewFolder( self.getCurrentFolder() );
            }, this.getID());
        },
            
        explore_path : function( file_path, func ){
            var self = this;
            R.api('file/explore_path/', [ file_path ], function( json ){
                self.clearFileInfo();
                if( ! json.error && ! json.files.error ){
                    //dont add to history when refresh
                    if( self.old_path != file_path ){
                        self.addHistory({
                            'path' : self.getCurrentPath(),
                            'file_info' : json.self
                        });
                    }

                    var content = self.getFileListHTML(json.files);
                    self.addContent(content);
                    self.bindFileData(json.files);
                    self.bindEventToContent();                  
                } else {
                    self.showError(json);
                    self.bindEventToContent();
                }
                //when folder exist set new folder, upload and history
                if(json.files && json.files.exist){
                    //dont add to history when refresh
                    if( self.old_path != file_path ){
                        self.addHistory({
                            'path' : self.getCurrentPath(),
                            'file_info' : json.self
                        });
                    }
                    //set upload target
                    self.setUpload( self.getCurrentFolder() );
                    //set new folder target
                    self.setNewFolder( self.getCurrentFolder() );
                }
                //run call back
                if( $.isFunction(func) ){
                    func(json);
                }
            }, this.getID());
        },

        lockExplore : function(){
            this.lock_explore = true;
        },

        unlockExplore : function(){
            this.lock_explore = false;
        },

        isLockExplore : function(){
            return this.lock_explore;
        },

        setNewFolder : function( file ){
            this.$R('#rosa_ex_new_folder').attr({
                'folder_id' : (file.id)? file.id : 0
            }).data('file_info', file);
            this.showNewFolder();
        },

        hideNewFolder : function(){
            this.$R('#rosa_ex_new_folder').hide();
        },

        showNewFolder : function(){
            this.$R('#rosa_ex_new_folder').show();
        },

        setUpload : function( file ){
            this.$R('.upload').attr({
                'folder_id' : (file.id)? file.id : 0
            }).data('file_info', file);
            this.showUpload();
        },

        hideUpload : function(){
            this.$R('.upload').hide();
        },

        showUpload : function(){
            this.$R('.upload').show();
        },

        addHistory : function( data ){
            this.history[this.history_index++] = data;
            this.old_path = this.getCurrentPath();
        },

        getCurrentFolder : function(){
            var f = this.history[this.history_index - 1];
            if( f ){
               return f.file_info;
            } else {
                return false;
            }
        },

        getBackHistory : function(){
            var index = this.history_index-2;
            //console.log(index+', '+this.history_index);
            //console.log(this.history);
            if( index >= 0 ){
                this.history_index--;
                //when back we unshift forward
                this.forward.unshift(this.history[index+1]);
                this.forward_index--;
                if( this.forward_index < 0){
                    this.forward_index = 0;
                }
                return this.history[index];
            }
            return false;
        },

        getForwardHistory : function(){
            if(this.forward.length > 0 && this.forward_index >= 0 && this.forward_index < this.forward.length){
                this.history_index++;
                return this.forward[this.forward_index++];
            }
            return false;
        },
            
        run : function( path ){
            this.path = (path)? path : 'drive://';
            this.initExplorer();
            this.explore_path(this.path);
        },

        addContent : function( html ){
            this.$R('.rosa_ex_content').html( html );
        },

        getCurrentPath : function(){
            return this.$R('.path_input').val();
        },

        addCurrentPath : function( folder ){
            var new_path = this.getCurrentPath()+folder+'/';
            this.setCurrentPath(new_path);
        },

        setCurrentPath : function( path ){
            this.$R('.path_input').val( path );
        },

        setFileInfo : function( f_info ){
            //use file_id cuz is never duplicate
            this.file_info[f_info.id] = f_info;
            return f_info.file_id;
        },

        showFileInfo : function(){
            $.each(this.file_info, function(i, v){
                console.log('file_info['+i+'] = '+v.name+' : '+v.type+' : '+v.rosa_name);
            });
        },

        getFileInfo : function( id ){
            return this.file_info[id];
        },

        clearFileInfo : function(){
            this.file_info = {};
        },

        getAllFileInfo : function(){
            return this.file_info;
        },

        getFileListHTML : function( file_list ){
            //console.log('getFileListHTML : ');
            //change json to file list html
            var li = [];
            var self = this;
            $.each( file_list, function(i, file){
                //save file data [ ref using file_id ]
                self.setFileInfo( file );
                if(file.type == 0){
                    //console.log('list : '+'#templ_rosa_ex_'+self.viewType+'_icons');
                    li.push( 
                        self.templ.getHTML(
                            '#templ_rosa_ex_'+self.viewType+'_icons',
                            {'image': self.folderImage(file),
                                'name':file.name,
                                'last_modified': file.last_modified
                            }
                        )
                    );
                }
                else if(file.type == 1){
                    li.push(
                        self.templ.getHTML(
                            '#templ_rosa_ex_'+self.viewType+'_icons',
                            {'name': file.name+'.'+file.extension,
                              'image': file.extension.toLowerCase(),
                              'last_modified': file.last_modified
                            }
                        ) //end getHTML
                    );
                }
            });
            li.push('<div class="clear"></div>');
            return li.join('');
        },

        showError : function( json ){
            if( json.self ){
                //empty folder
                this.addContent( this.templ.getHTML('#templ_rosa_ex_warning', {
                    'message': 'This Folder is Empty ...'
                }) );
            } else if( ! json.self ) {
                //cannot found folder
                this.addContent( this.templ.getHTML('#templ_rosa_ex_alert', {
                    'message': 'File or Folder is Not Found ...'
                }) );
                //hide upload
                this.hideUpload();
                //hide new folder
                this.hideNewFolder();
            }
        },

        folderImage : function( file ){
            if( file.parent == 0 ){
                switch(file.name.toLowerCase()){
                    case 'desktop':
                        return 'desktop';
                    case 'libraries':
                        return 'libraries';
                    case 'disk':
                        return 'disk';
                    case 'apps':
                        return 'apps';
                }
            }
            return 'folder';
        },

        showHoverMenu : function( ele ){
            $('.ui-icon' ,ele).show();
        },

        hideHoverMenu : function( ele ){
            $('.ui-icon' ,ele).hide();
        },

        focusIcon : function( ele ){
            //show focus
            $(ele).siblings().removeClass('rosa_file_'+this.viewType+'_icons_focus');
            $(ele).addClass('rosa_file_'+this.viewType+'_icons_focus');
        },

        blurIcon : function( ele ){
            $(ele).removeClass('rosa_file_'+this.viewType+'_icons_focus');
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

    //regist to app manager
    R.AppManager.add(Explorer);
    //regist to openwith
    R.openwith.register('folder', function( file ){
        R.sysCall('file/file_info/', [file.id], function(f){
            if(f){
                R.AppManager.run.RosaExplorer(f.fullpath);
            } else {
                R.alert( 'Can not open '+file.name+' because is not exist',
                         'Rosa Explorer : Fatal Error' );
            }
        });
    },'RosaExplorer', 'File Manager of Rosa-OS');

    //===== init application =============================================//

    //for testing
    //var pid = R.AppManager.run.RosaExplorer('drive://');
    //var pid2 = R.AppManager.run.RosaExplorer('drive://disk/');

})(window, jQuery);