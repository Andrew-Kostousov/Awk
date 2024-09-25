(function () {
    'use strict';
	
    var timer = setInterval(function(){
        if(typeof Lampa !== 'undefined'){
            clearInterval(timer);

            if(!Lampa.Storage.get('lampac_initiale','false')) start();
			
            window.lampa_settings.torrents_use = true;
            window.lampa_settings.demo = false;
            window.lampa_settings.read_only = false;
			
            {deny}
			
            {pirate_store}
        }
    },200);
	
	var dcma_timer = setInterval(function(){
	  if(typeof window.lampa_settings != 'undefined' && (window.lampa_settings.fixdcma || window.lampa_settings.dcma)){
		clearInterval(dcma_timer)
		if (window.lampa_settings.dcma)
			window.lampa_settings.dcma = false;
	  }
	},100);

	function start(){
        Lampa.Storage.set('lampac_initiale','true');
        Lampa.Storage.set('source','cub');
        Lampa.Storage.set('proxy_tmdb','false');
        Lampa.Storage.set('poster_size','w300');
        
        Lampa.Storage.set('parser_use','true');
        Lampa.Storage.set('jackett_url','{jachost}');
        Lampa.Storage.set('jackett_key','1');
        Lampa.Storage.set('parser_torrent_type','jackett');
		
        var unic_id = Lampa.Storage.get('lampac_unic_id', '');

        if (!unic_id) {
			unic_id = Lampa.Utils.uid(8).toLowerCase();
			Lampa.Storage.set('lampac_unic_id', unic_id);
        }

        var plugins = Lampa.Plugins.get();

        var plugins_add = [
			{initiale}
        ];

        var plugins_push = []

        plugins_add.forEach(function(plugin){
            if(!plugins.find(function(a){ return a.url == plugin.url})){
                Lampa.Plugins.add(plugin);
                Lampa.Plugins.save();

                plugins_push.push(plugin.url)
            }
        });

        if(plugins_push.length) Lampa.Utils.putScript(plugins_push,function(){},function(){},function(){},true);

        /*
        setTimeout(function(){
            Lampa.Noty.show('Плагины установлены, перезагрузка через 5 секунд.',{time: 5000})
        },5000)
        */
    }
})();