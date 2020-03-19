let librarianSearch;
librarianSearch = librarianSearch || {};

(function($) {

    librarianSearch.Search = function() {
        "use strict";
        this.init();
    };

    librarianSearch.Search.prototype = {
        widget: null, form: null, results: null, nameQuery: null, libQuery: null, libDets: null, emailapi: "%globals_asset_url:1789023%", libapi: "%globals_asset_url:1801898%",

        // Returns a list item <li> with the result details
        renderResult: function(result) {
          let photo, firstName, lastName, title, email, ophone, subjects, guides, name;
            if (result[0]) {

              // Get Details
              photo = result[0].photo;
              firstName = result[0].first_name;
              lastName = result[0].last_name;
              title = result[0].title;
              email = result[0].email;
              ophone = result[0].Office_Phone;
              subjects = result[0].subject_area;
              guides = result[0].subjects;
              name = firstName + " " + lastName;
            } else {
              photo = "%globals_asset_url:1796112%";
              firstName = this.libDets.first_name;
              lastName = this.libDets.last_name;
              email = this.libDets.email;
              name = firstName + " " + lastName;
            }

            // Build HTML
            let article = "<div class='librarian-profile'>";
            article += "<img class='profile-picture' src='" + photo + "' alt='" + name + " profile-picture photograph'>";
            article += "<div class='summary'>";
            article += "<header class='formatting'>";
            article += "<h3>" + name + "</h3>";
            if (title) article += "<p class='subtitle'><strong>" + title + "</strong></p>";
            article += "</header>";
            article += "<!-- Quick contact info -->";
            article += "<ul class='meta'>";
            article += "<li class='highlight'>";
            article += "<a href='mailto:" + email + "' title='Send an email to " + name + "'>";
            article += "<i class='icon-mail'></i>" + email + "</a>";
            article += "</li> ";
            if (ophone) {
              article += "<li class='highlight'>";
              article += "<a href='tel:" + ophone + "' title='Call " + name + " work phone'>";
              article += "<i class='icon-phone'></i>" + ophone + "</a>";
              article += "</li>";
            }
            article += "</ul>";
            if (guides && firstName != "The Library") {
              article += "<div>";
              guides.forEach(function(i){
                article += "<a class='tag' href='" + i.friendly_url + "'>" + i.name + "</a> ";
              });
              article += "</div>";
            }
            article += "</div>";
            return article;
    },

        renderError: function() {
            $(this.resultsDiv).empty().append("<p>Sorry, there were no matching items.</p>");
            $(".searching").fadeOut(400, function() {
                $(this.resultsDiv).fadeIn();
            }.bind(this));
        },

        retrieveResults: function(data) {
            let results = data;
            let result = this.renderResult(results);
            $(this.resultsDiv).append(result);
            $(".searching").fadeOut(400, function() {
                $(this.resultsDiv).fadeIn();
            }.bind(this));
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

        getLibrarian: function(name) {
            let data = "name=" + name;
            try {
                $.ajax({
                    method: "GET",
                    jsonp: false,
                    context: this,
                    timeout: 5000,
                    url: this.libapi,
                    data: data,
                    dataType: "json",
                    complete: function(data) {
                        data = null;
                    },
                    success: function(data) {
                        (data[0]) ? this.retrieveResults(data) : this.renderError();
                    },
                    error: function() {
                        this.renderError();
                    }
                });
            } catch (err) {
                this.renderError();
            }
        },

        getName: function(sub) {
            let deferred = $.Deferred();
            let ndata = "sub=" + sub;
            let result;
            try {
                $.ajax({
                    method: "GET",
                    jsonp: false,
                    context: this,
                    timeout: 5000,
                    url: this.emailapi,
                    data: ndata,
                    dataType: "json",
                    complete: function(data) {
                        data = null;
                    },
                    success: function(data) {
                        this.libDets = data;
                        deferred.resolve();
                    },
                    error: function(e) {
                        this.renderError();
                    }
                });
            } catch (err) {
                this.renderError();
            }
            return $.when(deferred).done(function() {
                this.nameQuery = this.libDets.first_name;
            }.bind(this)).promise();
        },

        searchLibrarians: function() {
            let query, subQuery, librarian;
            $(".results-container").removeClass("hidden");
            $(this.resultsDiv).fadeOut().empty();
            $(".searching").fadeIn(function() {
                query = this.libQuery;
                subQuery = this.getName(query).done(function() {
                    librarian = this.getLibrarian(this.nameQuery);
              }.bind(this));
            }.bind(this));
        },

        searchName: function() {
            let query, librarian;
            $(".results-container").removeClass("hidden");
            $(this.resultsDiv).fadeOut().empty();
            $(".searching").fadeIn(function() {
                query = this.nameQuery;
                librarian = this.getLibrarian(query);
            }.bind(this));
        },

        init: function() {
            let widget = $(".search-panel");
            let form = $("#librarian-search-form");
            let searchName = $("#librarian-by-name");
            let searchSub = $("#librarian-by-subject");
            let goSub = $("input[name='go-librarian']");
            let goName = $("input[name='go-name']");
            this.resultsDiv = $(".results");
            this.form = form;
            this.widget = widget;

            goName.on("click", function(e) {
                $("html, body").animate({
                  scrollTop: $("#librarian-search-form").offset().top
                }, 400);
                e.preventDefault();
                $(searchSub).val(0);
                this.nameQuery = searchName.val();
                let selectedLib = $("#librarian-by-name option:selected");
                this.libName = $(selectedLib).html();
                this.searchName();
            }.bind(this));

            goSub.on("click", function(e) {
                $("html, body").animate({
                  scrollTop: $("#librarian-search-form").offset().top
                }, 400);
                e.preventDefault();
                $(searchName).val(0);
                this.libQuery = searchSub.val();
                this.searchLibrarians();
            }.bind(this));

            // Check for search query in URL
            let pageUrl = window.location.href;
            let urlQuery = this.getAllUrlParams(pageUrl);
            let sub = urlQuery["lib-sub"];
            sub = decodeURIComponent(sub);
            sub = sub.replace('+', ' ')
            if ("lib-sub" in urlQuery) {
                searchSub.val(sub);
                goSub.trigger("click");
            }
        }
    };

    // Run when page has loaded
    $(document).ready(function() {
        (new librarianSearch.Search());
    });

})(jQuery);
