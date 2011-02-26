(function($, window, undefined){

    var R = window.R;
    
    //define Application Object
    var SigLog = {
        
        NAME: 'SignalLog',   //application name
        ACCEPT_SIGNAL : 'all',

        init: function(){
            this.counter = 0;
        },

        run: function(){
            var self = this;
            //add HTML to RosaDesktop and create ADA (Application DOM Area) from HTML
            var $R = R.addHTML(['<div class="rosa_dialog_menu">',
                '<div id="siglog_head"><button id="clearlog" style="float:right;">Clear</button></div>',
                '</div>',
                '<div class="rosa_dialog_body">',
                '<table id="logtable" class="rosa_table" width="100%" >',
                '<tr><th width="50">#</th><th width="150">Type</th><th>Data</th><th width="100">Sender PID</th><th width="100">Sender Name</th></tr>',
                '</table>',
                '</div>'
                ].join(''));
            //create RosaDialog
            this.$R = $R.ui().rosaDialog({
                iconClass: 'rosa_icon_emblem_system_24',      //set dialog icon
                title: 'Signal Log',                          //set dialog title
                menuHeight: 30,                               //set menuHeight(px)
                bodyHeight: 450,                              //set bodyHeight (px)
                width: 640,                                   //set width (px)
                close: function(){                            //set onClose function
                    self.destroy();
                }
            });

            //set clear log button
            this.$R('#clearlog').click(function(){
                //reset counter
                self.counter = 0;
                //reset log
                self.$R('#logtable tr:gt(0)').remove();
            });
        },

        onSignal: function(type, data, sender){

            var appname;
            //handle signal from Process Manager
            if(sender.getID() == R.ProcessManager.getID() ){
                data = undefined;
                appname = "ProcessManager";
            } else if(type == 'file'){
                data = data.command;
                appname = sender.getApp().NAME;
            } else {
                data = undefined;
                appname = sender.getApp().NAME;
            }

            //append log
            this.$R('#logtable').append([
                '<tr>',
                '<td>',this.counter++,'</td>',
                '<td>',type,'</td>',
                '<td>',data,'</td>',
                '<td>',sender.getID(),'</td>',
                '<td>',appname,'</td>',
                '</tr>'
                ].join(''));
            //scroll to bottom
            this.$R.dialog.$body.scrollTo('max');
        },

        destroy: function(){
            //destroy ADA (Application DOM Area)
            this.$R.dialog('destroy');
        }

    };

    //add Application to Rosa Application Manager
    R.ApplicationManager.add(SigLog);

})(jQuery, window);