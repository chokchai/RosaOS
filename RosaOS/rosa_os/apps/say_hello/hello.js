(function($, window, undefined){

    var R = window.R;
    
    //define Application Object
    var SayHello = {
        
        NAME: 'SayHello',   //application name

        run: function(){
            var self = this;
            //add HTML to RosaDesktop and create ADA (Application DOM Area) from HTML
            var $R = R.addHTML('<div>Hello, Everyone !!</div>');
            //create RosaDialog
            this.$R = $R.ui().rosaDialog({
                iconClass: 'rosa_icon_app_default_orange_24', //set dialog icon
                title: 'Say Hello Application',               //set dialog title
                width: 200,                                   //set height (px)
                height: 200,                                  //set width (px)
                close: function(){                            //set onClose function
                    self.destroy();
                }
            });
        },

        destroy: function(){
            //destroy ADA (Application DOM Area)
            this.$R.dialog('destroy');
        }

    };

    //add Application to Rosa Application Manager
    R.ApplicationManager.add(SayHello);

})(jQuery, window);