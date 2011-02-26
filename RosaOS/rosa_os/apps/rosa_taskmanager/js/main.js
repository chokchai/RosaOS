(function(window, $, undefined){
    var R = window.R;
    
    var App = R.getHelper('rosa_taskmanager');
    var Task_Manager = {

        NAME : 'RosaTaskManager',
        ACCEPT_SIGNAL : 'ProcessManager_add|ProcessManager_kill',

        init : function(){
            App.getCSS('css/task_manager.css');
            this.templ = App.loadTemplate('/template/templ.php');
            this.apps = [];
            this.$R = {};
        },

        onSignal : function(type, data){
            this.update();
        },

        run : function(){
            var self = this;

            var content = this.templ.getHTML('#templ_task_dialog');
            this.$R = R.addHTML(content);

            this.$R = this.$R.ui().rosaDialog({
               iconClass: 'rosa_icon_system_monitor_24',
               menuHeight: 20,
               bodyHeight: 350,
               footHeight: 30,
               width: 350,
               title: 'TaskManager',
               close: function(){
                   self.destroy();
               }
            });

            this.setupButtons();

            this.update();
        },

        destroy : function(){
            this.$R().remove();
        },

        setupButtons : function(){
            var self = this;
            this.$R('button').button();
            this.$R('#rtask_kill').click(function(){
                var list = self.getSelectedProcess();
                $.each(list, function(){
                    R.ProcessManager.kill(this);
                });
            });

            this.$R('#rtask_restart').click(function(){
                var list = self.getSelectedProcess();
                $.each(list, function(){
                    R.ProcessManager.restart(this);
                });
            });

            this.$R('#rtask_run').click(function(){
                R.prompt(
                    'Enter Application Name (AppName:param1,pram2,...) : ',
                    'Run As...',
                    function(val){
                        val = val.split(':');
                        var appName = val[0];
                        var params = [];
                        if( val.length > 1 ){
                           params = val[1].split(',');
                        }
                        if(R.AppManager.run[appName] !== undefined){
                            R.AppManager.run[appName].apply({}, params);
                        } else {
                            R.alert("Not Found : "+appName);
                        }
                    }
                );
            });
        },

        getSelectedProcess : function(){
            var list = [];
            this.$R('.rosa_dialog_body input[type="checkbox"]:checked').each(function(){
                list.push($(this).val());
            });
            return list;
        },

        update : function(){
            var list = R.ProcessManager.getProcessList();
            var pList = [];
            $.each(list, function(i,p){
                pList.push([
                '<tr>',
                    '<td><input type="checkbox" value="',p.getID(),'" class="checkbox" /></td>',
                    '<td>',p.getApp().NAME,'</td>',
                    '<td>',p.getID(),'</td>',
                    '<td>Running</td>',
                '</tr>'
                ].join(''));
            });

            this.$R('.rosa_dialog_body').html([
                '<table id="apps_table" class="rosa_table" width="100%">',
                    '<tr>',
                        '<th width="13"></th>',
                        '<th>AppsName</th>',
                        '<th>pID</th>',
                        '<th>Status</th>',
                    '</tr>',
                    pList.join(''),
                '</table>'
            ].join(''));
        }
    }
    
    R.AppManager.add(Task_Manager);

})(window, jQuery);