var network = new Lampa.Reguest();
var api = Lampa.Utils.protocol() + Lampa.Manifest.cub_domain + '/api/';

function addDevice(message) {
    var displayModal = function displayModal() {
        var html = Lampa.Template.get('account_add_device');
		
		if (message) {
			html.find('.about').html(message);
			html.find('.simple-button').html('Сменить аккаунт');
		}
		else {
			html.find('.about').html('{cubMesage}');
			html.find('.simple-button').html('Авторизация');
		}
		
        html.find('.simple-button').on('hover:enter', function() {
            Lampa.Modal.close();
            Lampa.Input.edit({
                free: true,
                title: Lampa.Lang.translate('account_code_enter'),
                nosave: true,
                value: '',
                layout: 'nums'
            }, function(new_value) {
				displayModal();
				
                var code = parseInt(new_value);
				
                if (new_value && new_value.length == 6 && !isNaN(code)) {
                    Lampa.Loading.start(function() {
                        network.clear();
                        Lampa.Loading.stop();
                    });
                    network.clear();
                    network.silent(api + 'device/add', function(result) {
                        Lampa.Loading.stop();
                        Lampa.Storage.set('account', result, true);
                        Lampa.Storage.set('account_email', result.email, true);
                        window.location.reload();
                    }, function() {
                        Lampa.Loading.stop();
                        Lampa.Noty.show(Lampa.Lang.translate('account_code_error'));
                    }, {
                        code: code
                    });
                } else {
                    Lampa.Noty.show(Lampa.Lang.translate('account_code_wrong'));
                }
            });
        });
        Lampa.Modal.open({
            title: '',
            html: html,
            size: 'full',
            onBack: function onBack() {
                Lampa.Modal.close();
                displayModal();
            }
        });
    };
    displayModal();
}

function checkAutch() {
	var url = '{localhost}/testaccsdb';
    var email = Lampa.Storage.get('account_email') || Lampa.Storage.get('lampac_unic_id', '');
    if(email) url = Lampa.Utils.addUrlComponent(url,'account_email=' + encodeURIComponent(email))
	  
    network.silent(url, function(res) {
        if (res.accsdb) addDevice(res.msg);
        else {
            network.clear();
            network = null;
        }
    }, function() {
        //setTimeout(checkAutch, 1000 * 3);
    });
}
var lisen = function lisen(e) {
    if (e.name == 'content') {
        //checkAutch();
		setTimeout(checkAutch, 1000);
        Lampa.Controller.listener.remove('toggle', lisen);
    }
};
Lampa.Controller.listener.follow('toggle', lisen);