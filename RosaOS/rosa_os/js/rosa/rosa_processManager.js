(function(window, $, undefined){
    var R = window.R;

    /* -------------------------------------------------------------------------
     * PROCESS : one apps instance, one process
     * -------------------------------------------------------------------------
     */

    //private class
    var Process = {
        init : function(App){
            //init attr
            this.processManager = R.ProcessManager;
            this.app = {};
            this.raw_app = $.extend({}, App);
            this._isApp = false;
            var self = this;
            
            //check is App or Process
            //when is process mean is not apps
            this._isApp = ! App.IS_PROCESS;
            
            //get init args
            var args = App.__rosa__parameter;

            //setup apps and start
            App = R.makeObject(App);
            this.app = new App();

            //override App.destroy function
            this.app.__rosa__destroy = this.app.destroy; //fixed reclusive
            this.app.destroy = function(){
                self.processManager._kill(self.getID());
                self.app.__rosa__destroy();
            };

            //add signal to application
            this.app.signal = function(type, data, pid){
                //add sender to data
                data = $.extend({sender: self.app}, data);
                self.signal(type, data, pid);
            };
            
            this.app.setProcess(this);
            this.app.run.apply(this.app, args);
        },

        isApp : function(){
            return this._isApp;
        },

        isUI : function(){
            return this._isApp;
        },

        getRawApp : function(){
            return this.raw_app;
        },

        getApp : function(){
            return this.app;
        },

        setProcessManager : function(pm){
            this.processManager = pm;
        },

        signal : function(type, data, pid){
            //send self_pid for send not send signal to self_application
            this.processManager.signal(type, data, pid, this);
        },

        destroy : function(){
            this.app.destroy();
        }
    };

    Process = R.makeObject(Process);

    /* -------------------------------------------------------------------------
     * PROCESS MANAGER
     * -------------------------------------------------------------------------
     */

    var ProcessManager = {
        init : function(){
            this.processList = {};
        },

        getAppList : function(){
            return this.getApplicationList();
        },

        getApplicationList : function(){
            var pli = this.getProcessList();
            var ali = [];
            $.each(pli, function(id, p){
                if(p.isApp()){
                    ali.push(p.getApp());
                }
            });
            return ali;
        },

        getProcessIDByAppName : function( name ){
            var plist = this.getProcessList();
            var pid = [];
            $.each(plist, function(){
                if( this.getApp().NAME == name ){
                    pid.push(this.getID());
                }
            });
            return pid;
        },

        getProcessList : function(){
            return this.processList;
        },

        getProcess : function(pid){
            return this.processList[pid];
        },

        getApp : function(pid){
            return this.processList[pid].getApp();
        },

        addApp : function(app){
            return this.addApplication(app);
        },

        addApplication : function(app){
            var p = new Process(app);
            //make a relation
            p.setProcessManager(this);
            // change pid to string for minimize array
            var pid = p.getID();
            this.processList[pid] = p;
            //tell observer
            this.signal('processManager_add', pid);

            return pid;
        },

        newProcess : function(name, func, $r, accept_sig){
            if( $.isFunction(func) ){
                var app = {
                    //flag to identify is not application
                    NAME : name,
                    IS_PROCESS : true,
                    ACCEPT_SIGNAL : (accept_sig)? accept_sig.split('|') : ['all'],
                    init : $.noop,
                    run : $.noop,
                    onSignal : func,
                    setProcess : function(p){this.process = p;},
                    $R : $r,
                    destroy : function(){
                        if($r !== undefined){
                            $r('*').unbind();
                            $r().remove();
                        }
                    }
                }
                var pid = this.addApplication(app);
                return this.getProcess(pid);
            }

            R.alert('ERROR !! newProcess require Function');
            
            return false;
        },
        
        kill : function(pid){
            this.processList[pid].destroy();
            delete(this.processList[pid]);
        },

        restart : function(pid){
            //keep old apps by clone
            var app = this.processList[pid].getRawApp();
            //destroy current apps
            this.kill(pid);
            //add apps to Process Manager again
            this.addApplication(app);
        },

        //private function for Process Object only
        _kill : function( pid ){
            delete(this.processList[pid]);
            //tell observer
            this.signal('processManager_kill', pid);
        },

        signal : function(type, data, pid, p_sender){
            p_sender = (p_sender)? p_sender : this;

            if( pid !== undefined ){
                //is fixed target [pid]
                var app = this.processList[pid].getApp();
                if($.inArray(type.toLowerCase(), app.ACCEPT_SIGNAL) && p.getID() != pid ){
                    app.onSignal(type, data, p_sender);
                }
            } else {
                //is send to accepted process
                $.each(this.processList, function(i, p){
                    var app = p.getApp();
                    //sent to apps who accept signal and not send to same apps
                    if($.inArray(type.toLowerCase(), app.ACCEPT_SIGNAL) != -1 && p.getID() != p_sender.getID() || app.ACCEPT_SIGNAL[0] == 'all'){
                        app.onSignal(type, data, p_sender);
                    }
                });
            }
        }
    };

    ProcessManager = R.makeObject(ProcessManager);
    window.R.ProcessManager = window.R.procManager = new ProcessManager();

})(window, jQuery);