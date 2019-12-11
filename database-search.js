let dbSearch;
dbSearch = dbSearch || {};

(function($) {

    dbSearch.Search = function() {
        "use strict";
        this.init();
    };

    dbSearch.Search.prototype = {
        widget: null,
        form: null,
        results: null,
        searchQuery: null,
        api: "https://www.wgtn.ac.nz/library/dev/database-search",
        searchType: null,
        q: null,

        // Returns a list item <li> with the result details
        renderResultName: function(result) {
            // Get details
            let title = result.resource_title;
            let description = result.resource_description;
            let extra = result.resourcelink_html;
            let extranote = result.resourcelinktype_code;
            let id = result.resource_id;
            let linkUrl = "https://library.victoria.ac.nz/casimir/public/resources/redirect/" + result.resource_id;

            // Build HTML
            let li = $("<li class='result-item database'></li>");
            let details = $("<div class='details'></div>");
            let linkTitle = "<a href='" + linkUrl + "'><h3 class='result-title'>" + title + "</h3></a>";
            $(details).append(linkTitle);
            let descr = (description != null) ?
              "<div class='detail description'><strong>Description:</strong> " + description + "</div>":
              "<div class='detail description na'>No description available</div>";
              $(details).append(descr);
            let accnote = (extra != null) && (extranote == "accessnote") ?
                "<div class='detail access-note'><strong>Access note:</strong> " + extra + "</div>" :
                null;
            $(details).append(accnote);
            $(li).append(details);
            let buttonLink = (linkUrl != "") ?
              "<div><a href='" + linkUrl + "' class='view-open'><i class='icon-external'></i>Go to database</a></div>" :
              "<div class='na'>Not available for access</div>"
            $(li).append(buttonLink);
            return li;
        },

        renderResultSub: function(result) {
            // Get details
            let title = result.details.resource_title;
            let description = result.details.resource_description;
            let extra = result.links;
            let linkUrl = "https://library.victoria.ac.nz/casimir/public/resources/redirect/" + result.details.resource_id;

            // Build HTML
            let li = $("<li class='result-item database'></li>");
            let details = $("<div class='details'></div>");
            let linkTitle = "<a href='" + linkUrl + "'><h3 class='result-title'>" + title + "</h3></a>";
            $(details).append(linkTitle);
            let descr = (description != null) ?
              "<div class='detail description'><strong>Description:</strong> " + description + "</div>":
              "<div class='detail description na'>No description available</div>";
              $(details).append(descr);
            extra.forEach(function(i) {
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

        renderError: function() {
            $(this.results).empty().append("<p>Sorry, there were no matching items.</p>");
            let self = this;
            $(".searching").fadeOut(400, function() {
                $(self.results).fadeIn();
            });
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
                let self = this;
                results.forEach(function(i) {
                    result = (q == "title") ? self.renderResultName(i) : self.renderResultSub(i);
                    $(ul).append(result);
                });
                $(this.results).append(ul);
              } else {
                $(this.results).empty().append("<p>Sorry, there were no matching items.</p>");
              }
            } else {
                $(this.results).empty().append("<p>Sorry, there were no matching items.</p>");
            }
            let self = this;
            $(".searching").fadeOut(400, function() {
                $(self.results).fadeIn();
                $('html, body').animate({
                  scrollTop: $("#db-search-form").offset().top
                }, 400);
            });
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
            if ($(".results-container").hasClass("hidden")) {
                $(".results-container").removeClass("hidden");
            }
            $(".searching").fadeIn();
            $(this.results).fadeOut().empty();
            query = this.searchQuery;
            type = this.searchType;
            q = this.q;

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
                            this.renderError();
                        }
                    },
                    error: function(e) {
                        this.renderError();
                    }
                });
            } catch (err) {
                this.renderError();
            }
        },

        setUp: function() {
            let div = $(".search-panel");
            let form = $("#db-search-form");
            let searchKeyword = $("input[name='db-keyword']");
            let searchButton = $("input[name='db-search']");
            let goButton = $("input[name='go-db']");
            let searchSub = $("#database-by-subject");
            this.results = $(".results");
            this.form = form;
            this.widget = div;

            searchButton.on("click", { context: this }, function(e) {
                e.data.context.searchQuery = searchKeyword.val();
                e.data.context.searchType = "search";
                e.data.context.q = "title";
                e.preventDefault();
                e.data.context.searchDBs();
            });

            goButton.on("click", { context: this }, function(e) {
                e.data.context.searchQuery = searchSub.val();
                e.data.context.searchType = "subject";
                e.data.context.q = "subject";
                e.preventDefault();
                e.data.context.searchDBs();
            });

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
        },

        init: function() {
            this.widget = null;
            this.form = null;
            this.results = null;
            this.searchQuery = null;
            this.api = "https://www.wgtn.ac.nz/library/dev/database-search";
            this.searchType = null;
            this.q = null;
            this.setUp();
        }
    }

    // Run when page has loaded
    $(document).ready(function() {
        (new dbSearch.Search());
    });

})(jQuery);
