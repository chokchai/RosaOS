R.onLoad(function(){
    var tmpl = R.getHelper('rosa_browse').loadTemplate('tmpl.php');
    
    if(R.AppManager.isAppExist('RosaExplorer')){
        //when rosaBrowse is not exist make them !!
        var Ex = R.AppManager.getApp('RosaExplorer');
        //override header
        Ex.NAME = 'RosaBrowse';
        Ex.IS_PROCESS = true;
        //override run function
        Ex._run = Ex.run;
        Ex.run = function(path, func, type){
            this.browse_callback = func;
            this.browse_type = (type !== undefined)? type : 'file';
            this._run(path);
        }
        //set hook dialog [resize dialog and change title]
        Ex.setHookDialog({
            modal: true,
            title: 'Rosa Browse',
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
            $R.dialog.$footer.html(tmpl('#tmpl_rosaBrowse'));
            //setup button
            $R('.rbrowse_open').click(function(){
                var f_info = $R('.rbrowse_file_name').data('file_info');
                if( f_info ){
                    //send f info to callback
                    self.browse_callback(f_info);
                    //close rosaExplorer
                    $R.dialog('close');
                } else {
                    R.alert('Please Select File...', 'Rosa Browse');
                }
            });
            $R('.rbrowse_cancel').click(function(){
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
            if( this.browse_type === 'file' && files[0].type == 1 ||
                this.browse_type === 'folder' && files[0].type == 0 ||
                this.browse_type === 'all'
            ){
                $R('.rbrowse_file_name').data('file_info', files[0])
                                        .val(files[0].fullname);
            } else {
                $R('.rbrowse_file_name').data('file_info', false)
                                        .val('');
            }
        });
        //set hook open file [dbl files]
        Ex.setHookOpenFile(function(file_info){
            var $R = this.$R;
            if( this.browse_type === 'file' && file_info.type == 1 ||
                this.browse_type === 'folder' && file_info.type == 0 ||
                this.browse_type === 'all'
            ){
                $R('.rbrowse_file_name').data('file_info', file_info);
            } else {
                $R('.rbrowse_file_name').data('file_info', false);
            }
            //trigger click to open
            $R('.rbrowse_open').click();
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
        console.log('RosaBrowse Error : Require "RosaExplorer" in AppManager to run...');
    }
});
