(function(window, $, undefined){
    var R = window.R;

    var ApplicationManager = {
        init : function(){
            this.appList = {};
            this.run = {};
            this.restart = {};
            this.terminate = {};
        },

        add : function( app ){
            //checking application interface
            if( ! $.isFunction(app.run) || ! typeof(app.NAME) == 'string' ){
                R.alert('Error : Application Added unmatch Interface Specification');
            }

            var name = app.NAME;
            var self = this;
            if( ! this.isAppExist(name) ){
                //clone original apps to AppList
                this.appList[name] = $.extend({}, app);
                //fix accept signal
                app.ACCEPT_SIGNAL = app.ACCEPT_SIGNAL ? app.ACCEPT_SIGNAL.toLowerCase().split('|') : [];
                //set default
                app = $.extend({
                    ONE_INSTANCE : false,
                    IS_PROCESS : false,
                    init : $.noop,
                    onSignal : $.noop,
                    $R : {},
                    setProcess : function(p){this.process = p;},
                    getProcess : function(){return this.process;},
                    destroy : function(){
                        if( $.isFunction(app.$R) ){
                            app.$R('*').unbind();
                            app.$R().remove();
                        }
                    },
                    onMoreInstance : $.noop
                }, app);
                //add to run method
                //can call by R.AppManager.exec.Explorer( param[, ... ] );
                this.run[name] = function(){
                    var pid = R.ProcessManager.getProcessIDByAppName(name);
                    if(app.ONE_INSTANCE && pid.length > 0 ){
                        app.onMoreInstance.apply(R.ProcessManager.getApp(pid), arguments);
                        return pid;
                    } else {
                        app.__rosa__parameter = arguments;
                        return R.ProcessManager.addApplication(app);
                    }
                };

                //restart apps
                this.restart[name] = function(){
                    var pid = R.ProcessManager.getProcessIDByAppName(name);
                    //is running
                    $.each(pid, function(){
                        //kill runing apps
                        R.ProcessManager.kill(this);
                        //when not start just start!!
                        self.run[name].apply(self, arguments);
                    });
                    return pid;
                }

                //close apps
                this.terminate[name] = function(){
                    var pid = R.ProcessManager.getProcessIDByAppName(name);
                    //is running
                    $.each(pid, function(){
                        //kill runing apps
                        R.ProcessManager.kill(this);
                    });
                    return pid;
                }

            } else {
                console.log('Warning : Add Exist Application_name ('+name+')');
            }
        },

        remove : function(name){
            delete(this.run[name]);
        },

        getAppList : function(){
            return this.appList;
        },

        getApp : function(name){
            return $.extend({}, this.appList[name]);
        },

        isAppExist : function( name ){
            return (this.appList[name] !== undefined)? true : false;
        }

    };

    ApplicationManager = R.makeObject(ApplicationManager);
    
    window.R.ApplicationManager = window.R.AppManager = new ApplicationManager();

})(window, jQuery);