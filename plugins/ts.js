(function () {
    'use strict';

    Lampa.Storage.set('torrserver_url','{localhost}/ts');
    Lampa.Storage.set('torrserver_auth','true');
    Lampa.Storage.set('torrserver_login',Lampa.Storage.get('account_email') || Lampa.Storage.get('lampac_unic_id', '') || 'ts');
    Lampa.Storage.set('torrserver_password','ts');
	
})();