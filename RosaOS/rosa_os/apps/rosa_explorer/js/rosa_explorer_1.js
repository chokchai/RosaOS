R.onLoad('app://rosa_explorer/template/explorer_templ.php', function( templ ){

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
            //defind variable
            this.process = {};
            this.templ = templ;
            this.path = 'drive://';
            this.file_info = {};
            this.history_index = 0;
            this.history = [];
            this.$R = null;
            this.lock_explore = false;
            this.viewType = 'sm';
            this.tmp_path = '';
            this.forward = [];
            this.forward_index = 0;
        },

        setProcess : function(p){
            this.process = p;
        },

        onSignal : function(type, data, process){
            var self = this;
            if( data !== undefined){
                switch(data.command){
                    case 'prepare_copy':
                    case 'prepare_move':
                        this.$R('#rosa_ex_paste').show();
                        break;
                    case 'copy':
                    case 'move':
                    case 'new_folder':
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
            //get mail template
            var main_templ = this.templ.getHTML('#templ_rosa_ex_main', {
                'path': this.path
            });
            var $R = R.addHTML( main_templ );

            //==== dialog ====================================================//
            $R = this.$R = $R.ui().rosaDialog({
                title : 'ROSA Explorer',
                minWidth : 400,
                minHeight : 300,
                height: 400,
                close : function(){
                    self.destroy();
                }
            });
            
            //==== setup interface =======================================//

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

            $R('.rosa_ex_menu > div').hover(function(e){
                if( R.isMouseHover(e, this) ){
                    $(this).addClass('rosa_ex_button_hover');
                }
            },function(){
                $(this).removeClass('rosa_ex_button_hover');
            });
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

            //parse rosa ui [ upload ]
            $R.ui.parse( function( ui, response ){
                //upload callback
                if( ui.type == 'upload' ){
                    if( ui.status == 'complete' ){
                        //error
                        if( response && response.error ){
                            if( response.reason == 'FILE_NAME_EXIST' ){
                                R.alert('<b>File Names is Exist !!</b><br/>'+response.file_name, 'File Explorer');
                            } else if( response.reason == 'OUT_OF_QUOTA' ) {
                                R.alert([
                                    '<b>Out of Quota !! </b><br/>',
                                    'File Name : ',response.file_name,' Mbytes<br/>',
                                    'File Size : ',response.file_size,' Mbytes<br/>',
                                    'Remain Quota : ',response.storage_remain,' Mbyts'
                                    ].join(''), 'File Explorer');
                            } else {
                                R.alert('<b>Error !! </b><br/>'+response.error, 'File Explorer');
                            }
                        } else {
                            //okey
                            self.refresh();
                            //send signal
                            self.signal('file',{
                                command: 'upload',
                                file_target: $(ui.element).data('file_info')
                            });
                        }
                    }
                }
                //delete callback
                if( ui.type == 'delete' ){
                    self.refresh();
                    //send signal
                    self.signal('file', {
                        command: 'delete',
                        file_target: $(ui.element).data('file_info')
                    });
                }
            });

            //new folder
            var lock_new_folder = R.randID('folder_lock');
            $R('#rosa_ex_new_folder').click(function(){
                //lock for force user not move to other folder
                self.lockExplore();

                var now_parent = $(this).attr('folder_id');
                var file_parent = $(this).data('file_info');
                var folder_name = 'New Folder';

                //call file api
                R.api('file/new_folder/', [folder_name, now_parent], function(){
                    //unlock explore and self explore
                    self.unlockExplore();
                    self.refresh();

                    self.signal('file', {
                       command: 'new_folder',
                       file_target: file_parent
                    });
                }, lock_new_folder);
            });
            
            //copy
            $R('#rosa_ex_copy').click(function(){
                R.clipboard = {
                    sender : self,
                    command : 'copy',
                    files_id : self.getSelectedFileID(),
                    files_info : self.getSelectedFileInfo()
                };

                //show paste button
                $R('#rosa_ex_paste').show();
                //send signal to other rosa explorer
                self.signal('file', {command: 'prepare_copy'});
            });

            //cut
            $R('#rosa_ex_cut').click(function(){
                R.clipboard = {
                    sender : self,
                    command : 'cut',
                    files_id : self.getSelectedFileID(),
                    files_info : self.getSelectedFileInfo()
                };
                //show paste button
                $R('#rosa_ex_paste').show();
                //send signal to other rosa explorer
                self.signal('file', {command: 'prepare_move'});
            });

            //paste
            $R('#rosa_ex_paste').click(function(){
                var cb = R.clipboard;
                switch( cb.command ){
                    case 'move':
                    case 'copy':
                        R.sysCall(
                            'file/'+cb.command,
                            [cb.files_id, self.getCurrentFolder().id],
                            function(res){
                                //when error show the error
                                if(res && res.error){
                                    self.error(res);
                                    return;
                                }
                                self.refresh();
                                if(cb.sender.getID() != self.getID()){
                                    cb.sender.refresh();
                                }
                                //send signal
                                self.signal('file', {
                                    sender: self,
                                    command: cb.command,
                                    file_target: self.getCurrentFolder(),
                                    files_info: cb.files_info
                                });
                            },
                            self.getID()
                        );
                        break;
                }
            }).hide();
        },

        bindEventToContent : function(){
            var self = this;
            var $R = this.$R;

            //click name to rename
            $R('#rosa_ex_rename')
            .unbind('.rosaEX_Rename')
            .bind('click.rosaEX_Rename',function(){
                var f = $(this).data('file_info')[0];
                var $this = $('.rosa_file_name',f.element);
                
                var file_id = f.id;
                var file_name = f.name;
                if(f.type == 1){
                    file_name = file_name + '.' + f.extension;
                }

                var input_id = R.randID('rename');
                $this.html(['<input id="',input_id,'" class="text_input rosa_file_rename" style="position: relative; top: -4px; left: -5px;" value="',file_name,'" size="40" />'].join(''))
                .ready(function(){
                    $('#'+input_id).keyup(function(e){
                        //when press enter
                        if( e.which == 13 ){
                            var new_name = $(this).val();
                            //call rename
                            if( file_name != new_name ){
                                R.api('file/rename/',[ file_id, new_name ],function(){
                                    self.refresh();
                                    //send signal
                                    self.signal('file', {
                                        command: 'rename',
                                        file_target: f
                                    });
                                });
                            }
                            $(this).unbind();
                            $this.html(new_name);
                        }
                    }).bind('rename',function(){
                        var new_name = $(this).val();
                        //call rename
                        if( file_name != new_name ){
                            R.api('file/rename/',[ file_id, new_name ],function(){
                                self.refresh();
                                //send signal
                                self.signal('file', {
                                    command: 'rename',
                                    file_target: f
                                });
                            });
                        }
                        $(this).unbind();
                        $this.html(new_name);
                    }).bind('dblclick mousedown click',function(e){
                        //for clear event bubble 
                        e.stopPropagation();
                    }).focus(); //for focus rename field
                });
            });
            
            //select files
            var setup_file_menu = function(){
                var $selected = $R('.rosa_file_icons.ui-selected');
                if( $selected.size() > 0 ){
                    //hide or show menu
                    $R('.rosa_ex_file_menu').show();

                    //show or hide rename
                    $R('#rosa_ex_rename').hide();
                    if($selected.size() == 1){
                        $R('#rosa_ex_rename').show();
                    }

                    //get seletced files data
                    var f_info = [];
                    $selected.each(function(){
                        f_info.push($(this).data('file_info'));
                    });
                    //add files data to menu
                    $R('#rosa_ex_rename, #rosa_ex_copy, #rosa_ex_cut, #rosa_ex_delete, #rosa_ex_download').data('file_info',f_info);                    
                } else {
                    $R('.rosa_ex_file_menu').hide();
                }
            };
            
            $R('.rosa_ex_file_menu').hide();
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
                    setup_file_menu();
                    //for rename
                    $R('.rosa_file_rename').trigger('rename');
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
                
                setup_file_menu();
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
                            
                            setup_file_menu();
                            //un lock explore
                            self.unlockExplore();
                        });
                    } else if( f_info.type == 1 ) {
                        //open files
                        R.openwith.open(f_info);
                        //R.alert('open files : '+f_info['name']+'.'+f_info['extension'], 'Open with...');
                        self.unlockExplore();
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
            this.setDraggable( this.$R('.rosa_file_icons') );
            this.setDroppable( this.$R('.rosa_file_icons, .ui-dialog-content') );

            //parse ui
            $R.ui.parse();
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
                    'top': 64,
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
                                self.error(res);
                            } else {
                                self.refresh();
                                //refresh
                                if( $drag.data('drop') == 'outer' ){
                                    $drag.data('app').refresh();
                                }
                            }
                            //send signal
                            self.signal('file', {
                                sender: self,
                                command: 'move',
                                file_target: file_self,
                                files: files
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
                    self.addHistory({
                        'path' : self.getCurrentPath(),
                        'file_info' : json.self
                    });

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
                    self.addHistory({
                        'path' : self.getCurrentPath(),
                        'file_info' : json.self
                    });
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
            if( this.tmp_path == this.getCurrentPath() ){
                this.history[this.history_index-1] = data;
            } else {
                this.history[this.history_index++] = data;
            }
            this.tmp_path = this.getCurrentPath();
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
                height: 500
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

}, true);