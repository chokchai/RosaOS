R.onLoad(function(){
    var tmpl = R.getHelper('rosa_saveas').loadTemplate('tmpl_saveas.php');
    var file = R.getClass('file');

    if(R.AppManager.isAppExist('RosaExplorer')){
        //when rosaBrowse is not exist make them !!
        var Ex = R.AppManager.getApp('RosaExplorer');
        //override header
        Ex.NAME = 'RosaSaveAs';
        Ex.IS_PROCESS = true;
        //override run function
        Ex._run = Ex.run;
        Ex.run = function(path, data, func){
            this.save_callback = func;
            this.save_data = data;
            this._run(path);
        }
        //set hook dialog [resize dialog and change title]
        Ex.setHookDialog({
            modal: true,
            title: 'Rosa Save As',
            width: 400,
            height: 250,
            minHeight: 250,
            minWidth: 400,
            footerHeight: 60
        });
        //set hook start [ add footer +open +close ]
        Ex.setHookStart(function(){
            var self = this;
            var $R = this.$R;
            $R.dialog.$footer.html(tmpl('#tmpl_rosaSave'));
            //setup button
            $R('.rsave_save').click(function(){
                var fname = $R('.rsave_file_name').val();
                var folder = self.getCurrentFolder();
                if( fname !== '' ){
                    //check file name is Exist ?
                    var files_info = self.getAllFileInfo();
                    var duplicate = false;
                    $.each(files_info, function(i, f){
                        //each all files and check it save full name?
                        if( f.fullname.toLowerCase() == fname.toLowerCase() ){
                            duplicate = true;
                        }
                    });
                    //if filename is duplicate
                    //we need to ask user to replace file or not
                    if(duplicate === true){
                        R.confirm(  'File name is exist. Do you want to replace ? <br/> '+fname,
                                    'Rosa Save as',
                                    function(){
                                        //new file
                                        var f_info =file.new_file(fname, folder.id, self.save_data, true);
                                        //send f info to callback
                                        self.save_callback(f_info, folder);
                                        //send signal
                                        self.signal('file', {
                                            command : 'new_file',
                                            file_target: folder
                                        });
                                        //close rosaExplorer
                                        $R.dialog('close');
                                    }
                                 );
                    } else {
                        //new file
                        var f_info = file.new_file(fname, folder.id, self.save_data);
                        //send f info to callback
                        self.save_callback(f_info, folder);
                        //send signal
                        self.signal('file', {
                            command : 'new_file',
                            file_target: folder
                        });
                        //close rosaExplorer
                        $R.dialog('close');
                    }
                } else {
                    R.alert('Please Select File or Change File Name', 'Rosa Save As');
                }
            });
            $R('.rsave_cancel').click(function(){
                //close rosaExplorer when cancel
                $R.dialog('close');
            });
            //resize path input + hide search
            $R('.path_input').css('width', 300);
            $R('.search_input').hide();
        });

        //set hook select file [ add data to ]
        Ex.setHookSelectFile(function(files){
            var $R = this.$R;
            if( files[0].type == 1){
                $R('.rsave_file_name').val(files[0].fullname);
            } else {
                $R('.rsave_file_name').val('');
            }
        });
        //set hook open file [dbl files]
        Ex.setHookOpenFile(function(file_info){
            var $R = this.$R;
            if( file_info.type == 1 ){
                $R('.rsave_file_name').val(file_info.fullname);
            } else {
                $R('.rsave_file_name').val('');
            }
            //trigger click to open
            $R('.rsave_open').click();
            //break open files
            return false;
        });
        //set hook After Explore
        Ex.setHookAfterExplore(function(){
            var $R = this.$R;
            //disable dropable
            $R('.rosa_file_icons').draggable("destroy");
            $R('.rosa_file_icons .right').hide();
            //disable seletable
            $R('.ui-dialog-content').selectable("destroy");
        });

        //add RosaBrowse to AppManager
        R.AppManager.add(Ex);
    } else {
        console.log('RosaSaveAs Error : Require "RosaExplorer" in AppManager to run...');
    }
});


