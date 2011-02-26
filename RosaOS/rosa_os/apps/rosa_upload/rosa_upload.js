(function(window, $, undefined){
    var R = window.R;
    
    var upload = {
        NAME : 'RosaUpload',

        init : function(){
            R.getCSS('rosa_upload/css/rosa_upload.css');
            this.tmpl = R.loadTemplate('app://rosa_upload/tmpl/tmpl_upload.php');
            this.$R = {};
            this.queue = 0;
        },

        run : function( folder ){
            if( $.type(folder) === 'number' ){
                //is id of path folder
                this.folder = R.syncSysCall('file/file_info', [folder.id]);
            } else if($.type(folder.id) === 'number' || $.type('fullpath') === 'string'){
                //is correct file object
                this.folder = folder;
            } else {
                //on error
                R.alert('Runtime Error... "folder_id" must be integer',
                        'RosaUpload Error !!');
                return;
            }

            var tmpl = this.tmpl;
            var self = this;

            //set folder path from file object
            this.path = folder.fullpath;

            //create dialog
            this.$R = R.addHTML(tmpl('#tmpl_upload_dialog', { folder_path: this.path }));
            this.$R = this.$R().rosaDialog({
                height: 300,
                maxWidth: 400,
                minWidth: 400,
                width: 400,
                title: 'Upload'
            });

            //use rosaUpload for fileUpload,
            //set upload callback for change fileupload status
            this.$R('.ul_button')
                .button()
                .attr('folder_id', this.folder.id)
                .rosaUpload(function(ui, res){
                    if(ui.error === true){
                        //when error
                        R.alert(res, 'Upload Files Error !!!');
                    } else if(ui.status === 'submit'){
                        //on submit,
                        //we need to show user what file is upload in progress
                        self.addFileProgress();
                    } else if(ui.status === 'complete'){
                        self.setFileComplete(res);
                    }
                });

            this.$R('.ul_log')
                .delegate('.ul_open', 'click.upload', function(){
                    //open files
                    //upto .ul_log_wrap
                    R.openwith.open($(this).parent().parent().data('file_info'));
                });

            this.$R('.ul_log')
                .delegate('.ul_show_in_folder', 'click.upload', function(){
                    //open current folder
                    R.openwith.open(self.folder);
                });

            this.$R('.ul_log')
                .delegate('.ul_remove_list', 'click.upload', function(){
                    //remove from list
                    //upto .ul_log_wrap
                    $(this).parent().parent().remove();
                });
        },

        addFileProgress : function(){
            //add one to queue
            this.queue = this.queue + 1;
            //prepend one waiting status
            this.$R('.ul_log').prepend(this.tmpl('#tmpl_upload_wait'));
            //disable button and hide upload-input
            this.$R('.ul_button')
                .button("disable")
                .find('input')
                .hide();
        },

        setFileComplete : function(file){
            //add fullpath
            file.fullpath = this.path + file.fullname;
            //add complete files and remove waiting file.
            this.$R('.ul_log > .upload_wait:last')
                .after( this.tmpl('#tmpl_upload_log', file).data('file_info',file) )
                .remove();

            //send signal
            this.signal('file', {
                command: 'upload',
                file_target: this.folder
            });
            //show fake button and hide real button
            //for stop user try to upload multiple files
            this.$R('.ul_button')
                .button("enable")
                .find('input')
                .show();
        }

    };

    //add to appmanager
    window.R.AppManager.add(upload);

})(window, jQuery);