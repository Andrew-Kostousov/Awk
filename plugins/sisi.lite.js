(function () {
    'use strict';

    function Sisi(object) {
      var network = new Lampa.Reguest();
      var scroll = new Lampa.Scroll({
        mask: true,
        over: true
      });
      var last;
      var items = [];
      var html = $('<div></div>');
      var body = $('<div class="category-full"></div>');
      var wait_parse_video = false;
      var unic_id = Lampa.Storage.get('sisi_unic_id', '');
      var filter = new Lampa.Filter(object);
      var filter_sources = [];

      function account(url) {
        if (url.indexOf('account_email') == -1 && url.indexOf(window.plugin_sisi_localhost.replace(/http:\/\//g, '').split('/')[0]) >= 0) {
          var email = Lampa.Storage.get('account_email') || Lampa.Storage.get('lampac_unic_id', '');
          if (email) url = Lampa.Utils.addUrlComponent(url, 'account_email=' + encodeURIComponent(email));
        }

        return url;
      }

      this.create = function () {
        var _this = this;

        Lampa.Background.immediately('');

        if (!unic_id) {
          unic_id = Lampa.Utils.uid(8);
          Lampa.Storage.set('sisi_unic_id', unic_id);
        }

        unic_id = unic_id.toLowerCase();
        var btn = filter.render().find('.torrent-filter');
        var uid = $('<div style="-webkit-align-self: center; -ms-flex-item-align: center; align-self: center; font-size: 1.2em;"><span>Ваш ID</span> <span style="background-color: rgba(255, 255, 255, 0.3); padding: 0 0.5em; border-radius: 0.2em; font-size: 1.1em;">' + unic_id + '</span></div>');
        if (btn.length) btn.append(uid);else {
          filter.render().attr('style', 'padding: 0 1.2em 1.2em 1.2em; display: flex;').append(uid);
          filter.render().find('.simple-button').addClass('sisi--filter-button');
        }
        network["native"](account(window.plugin_sisi_localhost), function (data) {
          if (data.accsdb) return _this.empty(data.msg);
          filter_sources = data.channels;
          var last_url = Lampa.Storage.get('sisi_last_url', '');

          if (last_url) {
            filter_sources.forEach(function (a) {
              if (last_url.indexOf(a.playlist_url) >= 0) a.selected = true;
            });
          }

          if (!filter_sources.find(function (a) {
            return a.selected;
          })) filter_sources[1].selected = true;

          _this.build();

          _this.load(Lampa.Storage.get('sisi_last_url', '') || filter_sources.find(function (a) {
            return a.selected;
          }).playlist_url);
        }, function () {
          _this.empty();
        });
        return this.render();
      };

      this.empty = function (msg) {
        var empty = new Lampa.Empty({
          title: msg ? 'Ошибка' : '',
          descr: msg
        });
        html.append(empty.render());
        this.start = empty.start;
        this.activity.loader(false);
        this.activity.toggle();
      };

      this.clear = function () {
        wait_parse_video = false;
        object.page = 1;
        last = false;
        items = [];
        body.empty();
        scroll.reset();
        this.activity.loader(false);
      };

      this.load = function (url) {
        var _this2 = this;

        this.activity.loader(true);
        if (url.indexOf('box_mac=') == -1) url = Lampa.Utils.addUrlComponent(url, 'box_mac=' + unic_id);else url = url.replace(/box_mac=[^&]+/, 'box_mac=' + unic_id);
        network["native"](account(url), function (data) {
          Lampa.Storage.set('sisi_last_url', url);

          _this2.clear();

          _this2.append(data.list);

          _this2.updateFilter(data.menu);

          _this2.activity.toggle();
        }, function () {
          _this2.clear();

          var empty = Lampa.Template.get('list_empty');
          empty.css('padding-left', '0.75em');
          body.append(empty);

          _this2.activity.toggle();
        });
      };

      this.next = function () {
        var _this3 = this;

        if (object.page < 20 && object.page) {
          object.page++;
          var url = Lampa.Storage.get('sisi_last_url', '') + '';
          if (url.indexOf('pg=') >= 0) url = url.replace(/pg=\d+/, 'pg=' + object.page);else url = Lampa.Utils.addUrlComponent(url, 'pg=' + object.page);
          network["native"](account(url), function (data) {
            _this3.append(data.list);

            Lampa.Controller.enable('content');
          }, function () {
          });
        }
      };

      this.append = function (data) {
        var _this4 = this;

        data.forEach(function (element) {
          var card = Lampa.Template.get('card', {
            title: element.name
          });
          card.addClass('card--collection');
          card.find('.card__img').attr('src', account(element.picture));
          card.find('.card__age').remove();
          if (element.quality) card.find('.card__view').append('<div class="card__quality"><div>' + element.quality + '</div></div>');
          if (element.time) card.find('.card__view').append('<div class="card__type">' + element.time + '</div>');
          card.on('hover:focus', function () {
            last = card[0];
            scroll.update(card, true);
            var maxrow = Math.ceil(items.length / 7) - 1;
            if (Math.ceil(items.indexOf(card) / 7) >= maxrow) _this4.next();
          });
          card.on('hover:enter', function () {
            if (element.json) {
              if (!wait_parse_video) {
                network["native"](account(element.video + '&json=true'), function (qualitys) {
                  wait_parse_video = false;

                  for (var i in qualitys) {
                    qualitys[i] = account(qualitys[i]);
                  }

                  var video = {
                    title: element.name,
                    url: account(qualitys[Lampa.Arrays.getKeys(qualitys)[0]]),
                    quality: qualitys
                  };
                  Lampa.Player.play(video);
                  Lampa.Player.playlist([video]);
                }, function () {
                  wait_parse_video = false;
                  Lampa.Noty.show(Lampa.Lang.translate('torrent_parser_nofiles'));
                });
              }

              wait_parse_video = true;
            } else {
              if (element.qualitys) {
                for (var i in element.qualitys) {
                  element.qualitys[i] = account(element.qualitys[i]);
                }
              }

              var video = {
                title: element.name,
                url: account(element.video),
                quality: element.qualitys
              };
              Lampa.Player.play(video);
              Lampa.Player.playlist([video]);
            }
          });
          body.append(card);
          items.push(card);
        });
      };

      this.biuldFilter = function () {
        var _this5 = this;

        filter.render().removeClass('scroll--nopadding').find('.filter--search,.filter--sort').remove();
        filter.render().find('.selector').on('hover:focus', function (e) {
          last = e.target;
        });

        filter.onSelect = function (type, a, b) {
          if (type == 'filter') {
            if (b) _this5.load(b.playlist_url);
            setTimeout(Lampa.Select.close, 10);
          }
        };

        filter.onBack = function () {
          Lampa.Controller.toggle('content');
        };

        this.updateFilter([]);
      };

      this.updateFilter = function (data) {
        var filter_items = [{
          title: Lampa.Lang.translate('settings_rest_source'),
          subtitle: filter_sources.find(function (a) {
            return a.selected;
          }).title,
          items: filter_sources
        }];

        if (data) {
          data.forEach(function (menu) {
            if (!menu.search_on) {
              var title = menu.title.split(':')[0];
              var subti = menu.title.split(':')[1].trim();

              if (menu.submenu) {
                menu.submenu.forEach(function (a) {
                  if (a.title == subti) a.selected = true;
                });
              }

              filter_items.push({
                title: title,
                subtitle: subti,
                items: menu.submenu
              });
            }
          });
        }

        filter.set('filter', filter_items);
        this.updateFilterSelected();
      };

      this.updateFilterSelected = function () {
        filter.chosen('filter', filter.get('filter').map(function (a) {
          return a.title + ': ' + a.subtitle;
        }));
      };

      this.build = function () {
        scroll.minus();
        html.append(scroll.render());
        this.biuldFilter();
        scroll.append(filter.render());
        scroll.append(body);
      };

      this.start = function () {
        Lampa.Controller.add('content', {
          toggle: function toggle() {
            Lampa.Controller.collectionSet(scroll.render());
            Lampa.Controller.collectionFocus(last || false, scroll.render());
          },
          left: function left() {
            if (Navigator.canmove('left')) Navigator.move('left');else Lampa.Controller.toggle('menu');
          },
          right: function right() {
            if (Navigator.canmove('right')) Navigator.move('right');else filter.show(Lampa.Lang.translate('title_filter'), 'filter');
          },
          up: function up() {
            if (Navigator.canmove('up')) Navigator.move('up');else Lampa.Controller.toggle('head');
          },
          down: function down() {
            if (Navigator.canmove('down')) Navigator.move('down');
          },
          back: function back() {
            Lampa.Activity.backward();
          }
        });
        Lampa.Controller.toggle('content');
      };

      this.pause = function () {};

      this.stop = function () {};

      this.render = function () {
        return html;
      };

      this.destroy = function () {
        network.clear();
        scroll.destroy();
        html.remove();
        items = [];
      };
    }

    function startPlugin() {
      window.plugin_sisi_ready = true;
      window.plugin_sisi_localhost = '{localhost}';

      if (!Lampa.Lang) {
        var lang_data = {};
        Lampa.Lang = {
          add: function add(data) {
            lang_data = data;
          },
          translate: function translate(key) {
            return lang_data[key] ? lang_data[key].ru : key;
          }
        };
        Lampa.Lang.add({
          torrent_parser_nofiles: {
            ru: 'Не удалось извлечь подходящие файлы'
          },
          settings_rest_source: {
            ru: 'Источник'
          },
          title_filter: {
            ru: 'Фильтр'
          }
        });
        Lampa.Template.add('sisi_style', "\n            <style>\n                .sisi--filter-button{\n                    background-color: #393a44;\n                    padding: .7em 1em;\n                    font-size: 1.1em;\n                    -webkit-border-radius: .2em;\n                    -moz-border-radius: .2em;\n                    border-radius: .2em;\n                    font-weight: 300;\n                    margin-right: 1em;\n                    display:-webkit-box;\n                    display:-webkit-flex;\n                    display:-moz-box;\n                    display:-ms-flexbox;\n                    display:flex;\n                }\n                .sisi--filter-button > div{\n                    margin-left: .5em;\n                }\n                .sisi--filter-button.focus{\n                    background-color: #d81f26;\n                }\n            </style>\n        ");
        $('body').append(Lampa.Template.get('sisi_style', {}, true));
      }

      Lampa.Component.add('sisi', Sisi);

      function add() {
        var button = $("<li class=\"menu__item selector\">\n            <div class=\"menu__ico\">\n                <svg width=\"200\" height=\"243\" viewBox=\"0 0 200 243\" fill=\"none\" xmlns=\"http://www.w3.org/2000/svg\"><path d=\"M187.714 130.727C206.862 90.1515 158.991 64.2019 100.983 64.2019C42.9759 64.2019 -4.33044 91.5669 10.875 130.727C26.0805 169.888 63.2501 235.469 100.983 234.997C138.716 234.526 168.566 171.303 187.714 130.727Z\" stroke=\"currentColor\" stroke-width=\"15\"/><path d=\"M102.11 62.3146C109.995 39.6677 127.46 28.816 169.692 24.0979C172.514 56.1811 135.338 64.2018 102.11 62.3146Z\" stroke=\"currentColor\" stroke-width=\"15\"/><path d=\"M90.8467 62.7863C90.2285 34.5178 66.0667 25.0419 31.7127 33.063C28.8904 65.1461 68.8826 62.7863 90.8467 62.7863Z\" stroke=\"currentColor\" stroke-width=\"15\"/><path d=\"M100.421 58.5402C115.627 39.6677 127.447 13.7181 85.2149 9C82.3926 41.0832 83.5258 35.4214 100.421 58.5402Z\" stroke=\"currentColor\" stroke-width=\"15\"/><rect x=\"39.0341\" y=\"98.644\" width=\"19.1481\" height=\"30.1959\" rx=\"9.57407\" fill=\"currentColor\"/><rect x=\"90.8467\" y=\"92.0388\" width=\"19.1481\" height=\"30.1959\" rx=\"9.57407\" fill=\"currentColor\"/><rect x=\"140.407\" y=\"98.644\" width=\"19.1481\" height=\"30.1959\" rx=\"9.57407\" fill=\"currentColor\"/><rect x=\"116.753\" y=\"139.22\" width=\"19.1481\" height=\"30.1959\" rx=\"9.57407\" fill=\"currentColor\"/><rect x=\"64.9404\" y=\"139.22\" width=\"19.1481\" height=\"30.1959\" rx=\"9.57407\" fill=\"currentColor\"/><rect x=\"93.0994\" y=\"176.021\" width=\"19.1481\" height=\"30.1959\" rx=\"9.57407\" fill=\"currentColor\"/></svg>\n            </div>\n            <div class=\"menu__text\">\u041A\u043B\u0443\u0431\u043D\u0438\u0447\u043A\u0430</div>\n        </li>");
        button.on('hover:enter', function () {
          Lampa.Activity.push({
            url: '',
            title: 'Клубничка',
            component: 'sisi',
            page: 1
          });
        });
        $('.menu .menu__list').eq(0).append(button);
      }

      if (window.appready) add();else {
        Lampa.Listener.follow('app', function (e) {
          if (e.type == 'ready') add();
        });
      }
    }

    if (!window.plugin_sisi_ready) startPlugin();

})();
