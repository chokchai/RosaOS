(function(window, $, undefined){
    var R = window.R;
    
    var rename = {
        NAME : 'RosaRename',

        init : function(){
            R.getCSS('rosa_rename/css/rosa_rename.css');
            this.tmpl = R.loadTemplate('app://rosa_rename/tmpl/rosa_rename.php');
            this.$R = {};
            //for disable when user changed name
            this.clicked = false;
        },

        run : function(file){
            //check file object is correct object
            //if not we need to show error
            if( $.type(file) === 'object' ){
                var self = this;
                this.file = file;
                if(file.type == 0){
                    file.extension = 'folder';
                }
                //make dialog
                this.$R = R.addHTML( this.tmpl('#tmpl_rosa_rename', file) );
                this.$R = this.$R().rosaDialog({
                    title: 'Rosa Rename',
                    resizable: false,
                    height: 100,
                    width: 300,
                    modal: true,
                    buttons: [
                        {text: 'Confirm',
                            click: function(){
                                //stop click to button when already submit
                                if(self.clicked === true){
                                    return;
                                }
                                self.clicked = true;
                                //use system call to rename file
                                //send 2 parameter [ file_id, new_name ]
                                $dialog = $(this);
                                R.sysCall( 'file/rename',
                                    [self.file.id, $.trim(self.$R('textarea').val())],
                                    function(res){
                                        if(res && res.error){
                                            //when have Error
                                            //show error
                                            self.$R.dialog.$body //access to dialog body
                                                .find('.ui-state-error').remove().end() //remove old error
                                                .animate({height: 70}) //resize body and append error message
                                                .append('<div class="clear ui-state-error" style="padding:5px;">'+
                                                        res.reason+
                                                        '</div>');
                                            //make user edit again
                                            //by enable
                                            self.$R('textarea')
                                                .removeClass('rename_disable')
                                                .removeAttr('disable');
                                            //can rename again
                                            self.clicked = false;
                                        } else {
                                            //when work fine

                                            //send signal
                                            //for relation app who use this file can be know
                                            self.signal('file', {
                                                command: 'rename',
                                                file_target: self.file
                                            });
                                            //destroy dialog when user changed
                                            $dialog.dialog('destroy');
                                            self.destroy();
                                        }
                                    }
                                );
                                //disable text area
                                self.$R('textarea')
                                    .addClass('rename_disable')
                                    .attr('disable', true);
                            }
                        },
                        {text: 'Cancle',
                            click: function(){
                                //destroy dialog when user cancle to rename
                                $(this).dialog('destroy');
                                self.destroy();
                            }
                        }
                    ]
                });

                //handle when user press enter on textarea
                //we trigger to Confirm Button for shotcut to change file name
                this.$R('textarea')
                    .focus()
                    .select()
                    .keypress(function(e){
                        if(e.which === 13){
                            //is Enter
                            self.$R('.ui-button-text:first').click();
                            return false;
                        }
                        return true;
                    });
            } else {
                R.alert('unvalid File info...', 'Error!! Rosa Rename');
            }
        }
    };

    //add to rosa application manager
    R.AppManager.add(rename);

})(window, jQuery);