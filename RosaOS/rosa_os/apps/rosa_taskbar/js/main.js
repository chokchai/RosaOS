(function(window, $, undefined){
    var R = window.R;
    var pManager = R.ProcessManager;
    var App = R.getHelper("rosa_taskbar");
    var taskbar = R.getClass("rosa_taskbar");

    var taskBar = {
        NAME : 'RosaTaskBar',
        ACCEPT_SIGNAL : 'ProcessManager_add|ProcessManager_kill',
        ONE_INSTANCE : true,
        IS_PROCESS : true,

        onSignal : function( type, data ){
            //not add self application ^^"
            switch(type){
                case 'processManager_add':
                    this._add(data);
                    break;
                case 'processManager_kill':
                    this._remove(data);
                    break;
            }
        },

        init : function(){
            //get Application Helper and set to self
            App.getCSS('css/taskBar.css');
            this.tmpl = App.loadTemplate('tmpl/tmpl.php');
            this.taskList = {};
            this.$R = R.addHTML(this.tmpl('#tmpl_taskbar'));
            this.$task = this.$R('#task');
        },

        run : function(){
            //add current process to taskbar
            var appList = pManager.getAppList();
            var self = this;
            $.each(appList, function(){
                self._add(this.getProcess().getID());
            });
            //start menu
            this.setupStartMenu();
        },

        setupStartMenu : function(){
            var apps_info = taskbar.getApplicationInformation();
            var apps = [];
            $.each(apps_info, function(i, a){
                if( a.icon ){
                    apps.push( $.extend(a.icon, a.onStart) );
                }
            });
            //set start button and hide at first
            var $start = R.appendHTML(this.tmpl('#tmpl_startmenu', {'apps':apps}).hide() );
            //dont close when user click to start menu
            $start().mouseup(function(e){
                e.stopPropagation();
            });
            //open start menu when click start button
            var show = false;
            this.$R('#start').mouseup(function(e){
                e.stopPropagation();
                if( ! show ){
                    show = true;
                    $start().show();
                    $start('.st_search_input').focus();
                    //bind one click to body for hide start menu
                    $("body").one('mouseup.taskbar', function(e){
                        show = false;
                        $start().hide();
                        $start('.st_search_input').val('').keyup();
                    });
                } else {
                    show = false;
                    //trigger body to close
                    $start().hide();
                    $("body").unbind('mouseup.taskbar');
                    $start('.st_search_input').val('').keyup();
                }
            });
            //effect when hover on apps list
            $start('.st_app').hover(function(){
                $(this).addClass('hover');
            }, function(){
                $(this).removeClass('hover');
            })
            //run(start) application using AppManager
            .click(function(){
                var appName = $(this).attr('rosa_app');
                var param = $(this).attr('rosa_param').split(',');
                //test run
                if( R.AppManager.run[appName] === undefined ){
                    R.alert("Can't open application "+appName+"...", "");
                } else {
                    R.AppManager.run[appName].apply({}, param);
                }
                //hide start menu
                show = false;
                //trigger body to close
                $start().hide();
                $("body").unbind('mouseup.taskbar');
            });
            $start('.st_search_input').bind('keyup keydown', function(){
                var keyword = $(this).val().toLowerCase();
                $start('.st_app_install').each(function(){
                    if($(this).text().toLowerCase().indexOf( keyword ) !== -1){
                        $(this).show();
                    } else {
                        $(this).hide();
                    }
                });
            });
            //logoff button
            $start('.wrap_logoff > a').button();
        },

        _add : function( pid ){
            var self = this;
            var proc = this._getProcDetail(pid);
            //check is ui app ?
            if( proc.isApp && ! this.taskList[pid] ){
                //add to taskList
                this.taskList[pid] = proc;
                //add to taskBar
                var data = {
                    taskID: 'task_'+pid,
                    title: 'Unknow',
                    iconClass: ''
                };

                var $r = proc.app.$R;
                
                if( $r.isDialog ){
                    data = $.extend(data, {
                        title: $r.dialog.$title.html(),
                        iconClass: $r.dialog.option.iconClass,
                        hide: $r.taskHide
                    });
                }
                //append tmpl
                var lock_click = false;
                this.$task.append( this.tmpl('#tmpl_taskitem', data) )
                    .find('#'+data.taskID)
                    //click to taskitem show and hide
                    .click(function(){
                        if( lock_click === true ) return;
                        lock_click = true;
                        //click at focus task let's hide
                        if( $(this).hasClass('taskitem-focus') ){
                            $r().hide('fade', function(){
                                lock_click = false;
                            });
                            //blur focus
                            self._blurTask(data.taskID);
                        } else {
                            $r().show('fade', function(){
                                lock_click = false;
                            });
                            //move dialog to top
                            $r.dialog('moveToTop');
                            //set focus
                            self._focusTask(data.taskID);
                        }
                    })
                    .dblclick(function(){
                        //for unselect text
                        var $title = $(this).find('.task_title');
                        $title.text( $title.text() );
                    });
                //set event
                if( $r.isDialog ){
                   //set minimize when clicked minimize button
                    $r.dialog.$minimize.click(function(){
                        $r().hide('fade');
                        self._blurTask(data.taskID);
                    });
                    //set focus task when focus on dialog
                    $r.dialog.$element.bind('dialogfocus', function(){
                        self._focusTask( data.taskID );
                    }).trigger('dialogfocus');
                }
            }
        },

        _blurTask : function( id ){
            this.$task.find('#'+id).removeClass('taskitem-focus');
        },

        _focusTask : function( id ){
            //remove old focus
            this.$task.find('.taskitem-focus').removeClass('taskitem-focus');
            //add current
            this.$task.find('#'+id).addClass('taskitem-focus');
        },

        _remove : function( pid ){
            //check is ui app ?
            if( this.taskList[pid] ){
                //remove from appList
                delete(this.taskList[pid]);
                //remove from task
                this.$task.find('#task_'+pid).unbind().remove();
            }
        },

        _getProcDetail : function(pid){
            var p = pManager.getProcess(pid);
            var a = p.getApp();

            return {
                process: p,
                app: a,
                appid : a.getID(),
                isApp: p.isApp()
            };
        },

        getTaskByApp : function(app){
            if( app.getProcess !== undefined ){
                var pid = app.getProcess().getID();
                var obj = {
                    get$ : function(){
                        return $('#task > #task_'+pid);
                    },
                    setTitle : function(txt){
                        return $('#task > #task_'+pid+' > .task_title').text(txt);
                    }
                };
                return obj;
            } else {
                console.log('Error TaskBar : get$Task need application Object');
            }
            return false;
        },

        getTaskByProcessID : function(pid){
            var obj = {
                get$ : function(){
                    return $('#task > #task_'+pid);
                },
                setTitle : function(txt){
                    return $('#task > #task_'+pid+' > .task_title').text(txt);
                }
            };
            return obj;
        }
    };

    R.AppManager.add(taskBar);

    //add function to R
    R.getTaskByProcessID = taskBar.getTaskByProcessID;
    R.getTaskByApp = taskBar.getTaskByApp;

    R.onload(function(){
        R.AppManager.run.RosaTaskBar();
    });

})(window, jQuery);