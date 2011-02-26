(function($, window, undefined){
    var R = window.R;
    //get class helper
    var HelloServer = R.getClass('helloserver');
    //get application helper
    var HelloHelper = R.getHelper('hello');

    //define Application Object
    var HelloClient = {

        NAME: 'Hello',          //application name
        ACCEPT_SIGNAL: 'home',  //accept signal

        init: function(){
            //load stylesheet (CSS)
            HelloHelper.getCSS('helloStyle.css', true);
            //load template
            this.tmpl = HelloHelper.loadTemplate('helloTemplate.php');
            //log counter
            this.counter = 0;
            //ADA (Application DOM Area)
            this.$R = {};
        },

        run: function(){
            var self = this;
            //get data from server (datetime)
            var data = HelloServer.getDate();
            //set process id
            data.pid = this.process.getID();
            //parse data to template
            var $html = this.tmpl('#tmpl_hello_dialog', data);
            //create ADA (Application DOM Area) from HTML
            this.$R = R.addHTML($html);
            //create RosaDialog
            this.$R = this.$R.ui().rosaDialog({
                iconClass: 'rosa_icon_app_default_24',  //set dialog icon
                title: 'Hello World',                   //set dialog title
                width: 300,                             //set height (px)
                height: 350,                            //set width (px)
                close: function(){                      //set onClose function
                    self.destroy();
                }
            });
            //send signal when click "Send Signal" button
            this.$R('#button_signal').click(function(){
                self.signal('home');
            });

        },

        onSignal: function(type, data, sender){
            //parse data to template
            var $html = this.tmpl(  '#tmpl_table_row',
                            {   counter: this.counter++,
                                'type':type,
                                'processID':sender.getID()
                            }
                         );
            //append to log
            this.$R('#signal_log').append($html);
        }, //end OnSignal

        destroy: function(){
            //destroy ADA (Application DOM Area)
            this.$R.dialog('destroy');
        }

    };

    //add Application to Rosa Application Manager
    R.ApplicationManager.add(HelloClient);

})(jQuery, window);

