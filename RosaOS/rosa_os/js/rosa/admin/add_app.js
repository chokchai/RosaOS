$('#upload_app').upload({
    name: 'file',
    action: BASE_URL+'admin/upload_application',
    enctype: 'multipart/form-data',
    autoSubmit: true,
    onSubmit: function(){
        $('#upload_app').val('Uploading...');
    },
    onComplete: function(res){
        $('#upload_app').val('Upload new application');
        res = $.parseJSON(res);
        if( res.error !== undefined ){
            alert(res.error);
        } else {
            window.location = BASE_URL+'admin/applications'
        }
    }
});

