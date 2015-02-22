'use strict';

(function() {
  angular.module('techBookDirectives', []).
    directive('tagOption', function () {
      return {
        restrict: 'A',
        link: function(scope, element) {
          var $el = $(element[0]);
          var $tagOp = $el.find('.tag-option');

          $el.on('click', function(e) {
            $tagOp.trigger('click');
            e.preventDefault();
          });
          $tagOp.on('click', function(e) {
            e.stopPropagation();
          });
        }
      };
    }).
    directive('entryListScrollbar', ['$routeParams', '$timeout', 'EntryService', function ($routeParams, $timeout, EntryService) {
      return {
        restrict: 'A',
        link: function(scope, element) {
          if ($('#entryboard [id$=_dragger_vertical]').length > 0) {
            return;
          }

          var $el = $(element[0]);

          // contentのloadが完了したのちentry-listのheightを設定
          scope.$on('$includeContentLoaded', function() {
            setHeight($el);

            $(window).resize(function() {
              setHeight($el);
            });
          });

          $el.mCustomScrollbar({
            theme        : 'dark',
            scrollInertia: 100,
            mouseWheel   : { scrollAmount: 100 },
            advanced     : { updateOnImageLoad: false },
            callbacks    : {
              onInit: function() {
                var $scrollbar = $('#entryboard [id$=_dragger_vertical]');
                var $entryList = $('.entry-list');
                var observer   = new MutationObserver(function() {doEvent($entryList, $scrollbar);});
                observer.observe($scrollbar[0], {attributes : true, attributeFilter : ['style']});
              }
            }
          });

          function setHeight($el) {
            var $header  = $el.siblings('#entry-list-header');
            var header_h = $header.height();
            var board_h  = $('#entryboard').height();

            $el.height(board_h - header_h);
          }
          function doEvent($entryList, $scrollbar) {
            var entrylist_h = $entryList.height();
            var slidebar_h  = $scrollbar.height();
            var top         = $scrollbar.css('top').replace('px', '');

            if (entrylist_h - slidebar_h - top <= 0) {
              if (!scope.completed && !scope.loading) {
                load('list', scope, $routeParams.tag, ++scope.page, EntryService);
              }
            }
          }
        }
      };
    }]).
    directive('dashboardScrollbar', function () {
      return {
        restrict: 'A',
        link: function(scope, element) {
          $(element[0]).mCustomScrollbar({
            theme        : 'dark',
            scrollInertia: 100,
            mouseWheel   : { scrollAmount: 100 },
            advanced     : { updateOnImageLoad: false }
          });
        }
      };
    }).
    directive('tagListScrollbar', function () {
      return {
        restrict: 'A',
        link: function(scope, element) {
          var $tagList = $(element[0]);

          setHeight($tagList);

          $(window).resize(function() {
            setHeight($tagList);
          });

          $tagList.mCustomScrollbar({
            theme        : 'light',
            scrollInertia: 100,
            mouseWheel   : { scrollAmount: 75 },
            advanced     : { updateOnImageLoad: false }
          });

          function setHeight($tagList) {
            var sidebar_h = $('#sidebar').height();
            var listTop   = $tagList.offset().top;

            $tagList.height(sidebar_h - listTop);
          }
        }
      };
    }).
    directive('dashboardEntryList', function () {
      return {
        restrict: 'A',
        link: function(scope, element) {
          var $entryList = $(element[0]);
          var $container = $entryList.parents('.mCSB_container');

          setWidthAndHeight($entryList, $container);

          $(window).resize(function() {
            setWidthAndHeight($entryList, $container);
          });

          function setWidthAndHeight($entryList, $container) {
            // for width variables
            var adjustment_w = $container.css('margin-right') === '0px' ? 15 : 0;
            var container_w  = $container.width() - adjustment_w;
            var lefPad_w     = 20;
            // for height variables
            var count        = scope.settings.dashboard_count;
            var entry_h      = 101;
            var listHeader_h = $entryList.children('.tag-name').height();
            var list_h       = entry_h * (count + 1) + listHeader_h;

            $entryList.height(list_h);

            if (container_w < 800) {
              $entryList.width(container_w - lefPad_w);
              $entryList.css({height: ''});
            } else if (container_w < 1200) {
              $entryList.width(container_w / 2 - lefPad_w);
            } else {
              $entryList.width(container_w / 3 - lefPad_w);
            }
          }
        }
      };
    }).
    directive('dashboardEntryRepeat', ['$routeParams', '$timeout','EntryService', function ($routeParams, $timeout, EntryService) {
      return {
        restrict: 'A',
        link: function(scope, element) {
          if (scope.$last) {
            $timeout(function() {
              if (!isFullCount()) {
                var targetScope = scope.$parent.$parent;
                load('dashboard', targetScope, targetScope.tag, ++targetScope.entriesData.page, EntryService);
              }
            }, 500);
          }

          function isFullCount() {
            var $entry         = $(element);
            var $entries       = $entry.parent('.entry-list').children('.entry');
            var limitCount     = scope.settings.dashboard_count;
            var visibleEntries = $entries.filter(function(i, entry) {
              return $(entry).css('display') !== 'none';
            });

            return visibleEntries.size() >= limitCount;
          }
        }
      };
    }]).
    directive('entryList', ['$routeParams','EntryService', function ($routeParams, EntryService) {
      return {
        restrict: 'A',
        scope: false,
        link: function(scope) {
          load('list', scope, $routeParams.tag, ++scope.page, EntryService);
        }
      };
    }]).
    directive('entryRepeat', ['$routeParams', '$timeout','EntryService', function ($routeParams, $timeout, EntryService) {
      return {
        restrict: 'A',
        link: function(scope) {
          if (scope.$last) {
            $timeout(function() {
              if (unvisibleScrollBar()) {
                var targetScope = scope.$parent.$parent;
                load('list', targetScope, $routeParams.tag, ++targetScope.page, EntryService);
              }
            }, 500);
          }

          function unvisibleScrollBar() {
            return $('#entryboard [id$=_scrollbar_vertical]').css('display') === 'none';
          }
        }
      };
    }]).
    directive('sidebarLink', function () {
      return {
        restrict: 'A',
        link: function(scope, element, attrs) {
          var $el         = $(element[0]);
          var nextHash    = attrs.sidebarLink;
          var currentHash = document.location.hash;

          if (nextHash === currentHash) {
            $el.addClass('active');
          }

          $el.on('click', function() {
            $el.parents('#sidebar').find('.active').removeClass('active');
            $el.addClass('active');
            document.location.href = nextHash;
          });
        }
      };
    }
  );

  // ====== common functions ======
  function load(type, scope, tag, page, EntryService) {
    if (type === 'dashboard') {
      scope.entriesData.loading = true;
    } else if (type === 'list') {
      scope.loading = true;
    }

    EntryService.load(tag, page).then(function(entriesData) {
      setEntries(type, scope, entriesData);
    }).finally(function() {
      if (type === 'dashboard') {
        scope.entriesData.loading = false;
      } else if (type === 'list') {
        scope.loading = false;
      }
    });
  }
  function setEntries(type, scope, entriesData) {
    if (type === 'dashboard') {
      var limitCount      = scope.settings.dashboard_count;
      var filteredEntries = entriesData.entries.filter(function(entry) {
        return !entry.checked && !entry.latered;
      });

      scope.entriesData.entries = scope.entriesData.entries.concat(filteredEntries).slice(0, limitCount);
      return;
    }

    if (entriesData.completed) {
      scope.completed = true;
      return;
    }
    if (entriesData.sort === 'recent') {
      var prevDate = scope.entries.pop() ? scope.entries.pop().hotentry_date : '9999-99-99';
      angular.forEach(entriesData.entries, function (entry) {
        // マーク済みのエントリを表示しない場合は、未マークのエントリのみを対象とする
        if (scope.settings.visible_marked === 0 && (entry.checked || entry.latered)) {
          return;
        }
        if (prevDate > entry.hotentry_date) {
          entry.visibleDate = true;
        }
        prevDate = entry.hotentry_date;
      });
    }

    scope.entries = scope.entries.concat(entriesData.entries);
  }
})();
