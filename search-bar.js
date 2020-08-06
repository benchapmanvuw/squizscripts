let libSearch
libSearch = libSearch || {};

(function($) {
    libSearch.LibSearchBar = function() {
        "use strict";
        this.init();
    };

    libSearch.LibSearchBar.prototype = {
        TWurl: "https://tewaharoa.victoria.ac.nz/discovery/search?vid=64VUW_INST:VUWNUI&query=any,contains,",
        TWQuery: null,
        lastQuery: null,

        // Perform a search
        doSearch: function() {
            let searchUrl = this.TWurl;
            let q = $('#te-waharoa-search-form input[name="twq"]').val();
            q = encodeURI(q);
            q = q.replace('/', ' ');
            q = q.replace('\\', ' ');
            q = q.replace(/\"/g, '%22');
            q = q.replace(/\s/g, '%20');
            q = q.replace(/\&/g, '%26');
            q = q.replace(/\#/g, '%23');
            searchUrl += q; // Add search terms to query
            searchUrl += '&tab=all&search_scope=MyInst_and_CI';
            // Exclude newspaper articles and book reviews by default
            // searchUrl += '&fctExcV=reviews&mulExcFctN=facet_rtype&rfnExcGrp=?&fctExcV=newspaper_articles&mulExcFctN=facet_rtype&rfnExcGrp=?';
            searchUrl += '&facet=rtype,exclude,newspaper_articles&facet=rtype,exclude,reviews';
            let currentHref = document.location.href + '';
            if (currentHref.indexOf('blackboard') > -1) {
                window.open(searchUrl, '_blank');
            } else {
                document.location.href = searchUrl; // Go to Te Waharoa with the full query
            }
        },

        init: function() {
            this.TWQuery = $('#te-waharoa-search-form input[name="twq"]');

            $(".search-input").on("input paste", function() {
                $(".search-input").not(this).val($(this).val());
            });

            // Do a search on 'submit'
            $('#te-waharoa-search-form').on('submit', function(e) {
                e.preventDefault();
                this.doSearch();
            }.bind(this));

            $(".search-tab").on("click", function() {
                if ($(this).attr("aria-selected", "false")) {
                    $(".search-tab").attr("aria-selected", "false");
                    $(this).attr("aria-selected", "true");
                    let s = $(this).attr("aria-controls");
                    $(".lib-search-panel").addClass("hidden");
                    $("#" + s).removeClass("hidden");
                }
            });
        }
    }

    $(document).ready(function() {
        let searchBar = new libSearch.LibSearchBar();
    });
})(jQuery);
