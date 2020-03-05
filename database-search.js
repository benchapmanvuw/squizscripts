let dbSearch;
dbSearch = dbSearch || {};

(function($) {

    dbSearch.Search = function() {
        "use strict";
        this.init();
    };

    dbSearch.Search.prototype = {
        widget: null, form: null, results: null, searchQuery: null, api: "./?a=1791399", searchType: null, q: null, redirectLink: "https://library.victoria.ac.nz/casimir/public/resources/redirect/",

        fadeInResults: function(){
          $(".searching").fadeOut(400, function() {
              $(this.results).fadeIn();
          }.bind(this));
        },

        buildItem: function(title, description, nextra, nextranote, subextra, linkUrl) {
            let li = $("<li class='result-item database'></li>");
            let details = $("<div class='details'></div>");
            let linkTitle = "<a href='" + linkUrl + "'><h3 class='result-title'>" + title + "</h3></a>";
            $(details).append(linkTitle);
            let descr = (description != null) ?
                "<div class='detail description'><strong>Description:</strong> " + description + "</div>":
                "<div class='detail description na'>No description available</div>";
            $(details).append(descr);

            let accnote = (nextra != null) && (nextranote == "accessnote") ?
                "<div class='detail access-note'><strong>Access note:</strong> " + nextra + "</div>" :
                null;
            $(details).append(accnote);

            subextra.forEach(function(i) {
              if (i.resourcelinktype_code == "accessnote") {
                let accnote = "<div class='detail access-note'><strong>Access note:</strong> " + i.resourcelink_html + "</div>";
                $(details).append(accnote);
              };
            });

            $(li).append(details);
            let buttonLink = (linkUrl != "") ?
              "<div><a href='" + linkUrl + "' class='view-open'><i class='icon-external'></i>Go to database</a></div>" :
              "<div class='na'>Not available for access</div>"
            $(li).append(buttonLink);

            return li;
        },

        // Returns a list item <li> with the result details
        renderResultName: function(result) {
            // Get details
            let title = result.resource_title;
            let description = result.resource_description;
            let extra = result.resourcelink_html;
            let extranote = result.resourcelinktype_code;
            let id = result.resource_id;
            let linkUrl = this.redirectLink + id;

            let item = this.buildItem(title, description, extra, extranote, [], linkUrl);
            return item;
        },

        renderResultSub: function(result) {
            // Get details
            let title = result.details.resource_title;
            let description = result.details.resource_description;
            let extra = result.links;
            let id = result.details.resource_id;
            let linkUrl = this.redirectLink + id;

            let item = this.buildItem(title, description, null, null, extra, linkUrl);
            return item;
        },

        renderFail: function() {
            $(this.results).empty().append("<p>Sorry, your search could not be completed. Please try again later.</p>");
            this.fadeInResults();
        },

        renderError: function() {
            $(this.results).empty().append("<p>Sorry, no items matched your search.</p>");
            this.fadeInResults();
        },

        renderResults: function(data) {
            if (data.search.results) {
              let results;
              let q = this.q;
              if (q == "title") {
                results = data.search.results;
                let extra = data.search.extra;
                //Combine "extra" data with corresonding "results" data
                results.forEach(function(i, index, array) {
                  extra.forEach(function(j) {
                    if (i.resource_id == j.resource_id) {
                      array[index] = $.extend({}, i , j);
                    }
                  })
                });
              } else {
                //Extract and sort data array from data object
                results = Object.keys(data.search.results).map(function(e) {
                  return data.search.results[e]
                }).sort(function (a, b) {
                  let nameA = a.details.resource_title.toLowerCase();
                  let nameB = b.details.resource_title.toLowerCase();
                  if (nameA < nameB) {return -1;}
                  if (nameA > nameB) {return 1;}
                  return 0;
                });
              }
              let total = results.length;
              if (total > 0) {
                let resultNav = $("<div id='result-nav' class='result-nav'></div>");
                $(resultNav).append("<span class='number-results'>Displaying " + total + " results</span>");
                $(this.results).append(resultNav);
                let ul = $("<ul class='result-list'></ul>");
                results.forEach(function(i) {
                    result = (q == "title") ? this.renderResultName(i) : this.renderResultSub(i);
                    $(ul).append(result);
                }.bind(this));
                $(this.results).append(ul);
            this.fadeInResults();
              } else {
                if (this.searchQuery.length > 1) {
                    this.searchQuery = this.searchQuery.slice(0,-1);
                    this.searchDBs();
                } else {
                    this.renderError();
                }
              }
            } else {
                this.renderFail();
            }
        },

        purify: function(val) {
            let regex = new RegExp(/(<.*>)(.*)(<.*\/.*>)/g);
            let test = regex.exec(val);
            if (test != null) {
                val = val.replace(regex, "");
            }
            return val;
        },

        checkQuery: function() {
            let query = this.purify(this.searchQuery);
            this.searchQuery = query;
        },

        getAllUrlParams: function(url) {
            let queryString = url ? url.split("?")[1] : window.location.search.slice(1);
            let obj = {};
            if (queryString) {
                queryString = queryString.split("#")[0];
                let arr = queryString.split("&");
                arr.forEach(function(i) {
                    let a = i.split("=");
                    let paramName = a[0];
                    let paramValue = typeof(a[1]) === "undefined" ? true : a[1];
                    paramName = paramName.toLowerCase();
                    if (typeof paramValue === "string") paramValue = paramValue.toLowerCase();
                    if (paramName.match(/\[(\d+)?\]$/)) {
                        let key = paramName.replace(/\[(\d+)?\]/, "");
                        if (!obj[key]) obj[key] = [];
                        if (paramName.match(/\[\d+\]$/)) {
                            let index = /\[(\d+)\]/.exec(paramName)[1];
                            obj[key][index] = paramValue;
                        } else {
                            obj[key].push(paramValue);
                        }
                    } else {
                        if (!obj[paramName]) {
                            obj[paramName] = paramValue;
                        } else if (obj[paramName] && typeof obj[paramName] === "string") {
                            obj[paramName] = [obj[paramName]];
                            obj[paramName].push(paramValue);
                        } else {
                            obj[paramName].push(paramValue);
                        }
                    }
                });
            }
            return obj;
        },

        searchDBs: function() {
            this.checkQuery();
            $(".results-container").removeClass("hidden");
            $(".searching").fadeIn();
            $(this.results).fadeOut().empty();
            let query = this.searchQuery;
            let type = this.searchType;
            let q = this.q;

            let data = "searchType=" + type + "&q=" + q + "&db-keyword=" + query;

            try {
                $.ajax({
                    method: "GET",
                    context: this,
                    timeout: 5000,
                    url: this.api,
                    data: data,
                    dataType: "json",
                    complete: function(data) {
                        data = null;
                    },
                    success: function(data) {
                        if (data) {
                            this.renderResults(data);
                        } else {
                            this.renderFail();
                        }
                    },
                    error: function(e) {
                        this.renderFail();
                    }
                });
            } catch (err) {
                this.renderFail();
            }
        },

        init: function() {
            this.widget = $(".search-panel");
            this. form = $("#db-search-form");
            let searchKeyword = $("input[name='db-keyword']");
            let searchButton = $("input[name='db-search']");
            let searchSub = $("#database-by-subject");
            let goButton = $("input[name='go-db']");
            this.results = $(".results");

            function scrollTopForm() {
                $('html, body').animate({
                    scrollTop: $("#db-search-form").offset().top
                }, 400);
            };

            searchButton.on("click", function(e) {
                scrollTopForm();
                e.preventDefault();
                this.searchQuery = searchKeyword.val();
                this.searchType = "search";
                this.q = "title";
                this.searchDBs();
            }.bind(this));;

            goButton.on("click", function(e) {
                scrollTopForm();
                e.preventDefault();
                this.searchQuery = searchSub.val();
                this.searchType = "subject";
                this.q = "subject";
                this.searchDBs();
            }.bind(this));

            // Check for search query in URL
            let pageUrl = window.location.href;
            let urlQuery = this.getAllUrlParams(pageUrl);

            if ("db-keyword" in urlQuery) {
                let dbkword = decodeURIComponent(urlQuery["db-keyword"]);
                dbkword = this.purify(dbkword);
                if (dbkword.includes("+")) {
                    dbkword = dbkword.replace(/\+/g, " ");
                }
                searchKeyword.val(dbkword);
                searchButton.trigger("click");
            }

            if ("db-sub" in urlQuery) {
                let dbsub = decodeURIComponent(urlQuery["db-sub"]);
                searchSub.val(dbsub)
                goButton.trigger("click");
            }
        }
    }

    // Run when page has loaded
    $(document).ready(function() {
        (new dbSearch.Search());
    });

})(jQuery);
