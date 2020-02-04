let librarianSearch;
librarianSearch = librarianSearch || {};

(function($) {

    librarianSearch.Search = function() {
        "use strict";
        this.init();
    };

    librarianSearch.Search.prototype = {
        widget: null,
        form: null,
        results: null,
        nameQuery: null,
        libQuery: null,
        emailapi: null,
        libapi: null,

        // Returns a list item <li> with the result details
        renderResult: function(result) {
            if (result.status == "listed") {

                // Get Details
                let image = result.image;
                let name = result.name;
                let title = result.title;
                let ophone = result.ophone;
                let unit = result.unit;
                let email = result.email;

                // Build HTML
                let article = "<article>";
                article += "<img class='profile-picture' src='" + image + "' alt='" + name + " profile-picture photograph'>";
                article += "<div class='summary'>";
                article += "<header class='formatting'>";
                article += "<h3>" + name + "</h3>";
                article += "<p class='subtitle'><strong>" + title + "</strong>";
                article += (unit) ? "<span>" + unit + "</span></p>" : "</p>";
                article += "</header>";
                article += "<!-- Quick contact info -->";
                article += "<ul class='meta'>";
                article += "<li class='highlight'>";
                article += "<a href=mailto:'" + email + "' title='Send an email to " + name + "'>";
                article += "<i class='icon-mail'></i>" + email + "</a>";
                article += "</li>";
                article += "<li class='highlight'>";
                article += "<a href='tel:" + ophone + "' title='Call " + name + " work phone'>";
                article += "<i class='icon-phone'></span>" + ophone + "</a>";
                article += "</li>";
                article += "</ul>";
                article += "</div>";
                article += "</article>";
                return article;
            } else {
                let image = "./?a=1796112";
                let name = this.libName;
                let email = this.nameQuery;
                let article = "<article>";
                article += "<img class='profile-picture' src='" + image + "' alt='" + name + " profile-picture photograph'>";
                article += "<div class='summary'>";
                article += "<header class='formatting'>";
                article += "<h3>" + name + "</h3>";
                article += "</header>";
                article += "<!-- Quick contact info -->";
                article += "<ul class='meta'>";
                article += "<li class='highlight'>";
                article += "<a href=mailto:'" + email + "' title='Send an email to " + name + "'>";
                article += "<i class='icon-mail'></i>" + email + "</a>";
                article += "</li>";
                article += "</ul>";
                article += "</div>";
                article += "</article>";
                return article;
            }
        },

        renderError: function() {
            let self = this;
            $(".searching").fadeOut(400, function() {
                $(self.results).empty().append("<p>Sorry, there were no matching items.</p>");
                $(self.results).fadeIn();
            });
        },

        retrieveResults: function(data) {
            let results = data;
            let result = this.renderResult(results);
            let self = this;
            $(this.results).append(result);
            $(".searching").fadeOut(400, function() {
                $(self.results).fadeIn();
                $('html, body').animate({
                  scrollTop: $("#librarian-search-form").offset().top
                }, 400);
            });
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

        getLibrarian: function(email) {
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
                        this.retrieveResults(data);
                    },
                    error: function() {
                        this.renderError();
                    }
                });
            } catch (err) {
                this.renderError();
            }
        },

        getEmail: function(sub) {
            let deferred = $.Deferred();
            let edata = "sub=" + sub;
            let result;
            try {
                $.ajax({
                    method: "GET",
                    jsonp: false,
                    context: this,
                    timeout: 5000,
                    url: this.emailapi,
                    data: edata,
                    dataType: "json",
                    complete: function(data) {
                        data = null;
                    },
                    success: function(data) {
                        this.libName = data.name;
                        result = data.email;
                        deferred.resolve();
                    },
                    error: function(e) {
                        this.renderError();
                    }
                });
            } catch (err) {
                this.renderError();
            }
            let self = this;
            return $.when(deferred).done(function() {
                self.nameQuery = result;
            }).promise();
        },

        searchLibrarians: function() {
          let query, subQuery, librarian
            let self = this;
            $(".results-container").removeClass("hidden");
            $(this.results).fadeOut().empty();
            $(".searching").fadeIn(function() {
              query = self.libQuery;
              subQuery = self.getEmail(query).done(function() {
                  librarian = self.getLibrarian(self.nameQuery);
              });
            });
        },

        searchName: function() {
            let query, librarian;
            let self = this;
            $(".results-container").removeClass("hidden");
            $(this.results).fadeOut().empty();
            $(".searching").fadeIn(function() {
              query = self.nameQuery;
              librarian = self.getLibrarian(query);
            });
        },

        setUp: function() {
            let div = $(".search-panel");
            let form = $("#librarian-search-form");
            let searchName = $("#librarian-by-name");
            let searchSub = $("#librarian-by-subject");
            let goSub = $("input[name='go-librarian']");
            let goName = $("input[name='go-name']");
            this.results = $(".results");
            this.form = form;
            this.widget = div;

            goName.on("click", { context: this }, function(e) {
                e.data.context.nameQuery = searchName.val();
                let selectedLib = $("#librarian-by-name option:selected");
                e.data.context.libName = $(selectedLib).html();
                e.preventDefault();
                e.data.context.searchName();
            });

            goSub.on("click", { context: this }, function(e) {
                e.data.context.libQuery = searchSub.val();
                e.preventDefault();
                e.data.context.searchLibrarians();
            });

            // Check for search query in URL
            let pageUrl = window.location.href;
            let urlQuery = this.getAllUrlParams(pageUrl);
            let sub = urlQuery["sub"];
            sub = decodeURIComponent(sub);
            if ("sub" in urlQuery) {
                searchSub.val(sub);
                goSub.trigger("click");
            }
        },

        init: function() {
            this.widget = null;
            this.form = null;
            this.results = null;
            this.nameQuery = null;
            this.libName = null;
            this.libQuery = null;
            this.emailapi = "%global_asset_attribute_url:1789023%"; // search librarians by subject
            this.libapi = "%global_asset_attribute_url:1801898%"; // subject librarian by name

            this.setUp();
        }
    }

    // Run when page has loaded
    $(document).ready(function() {
        (new librarianSearch.Search());
    });

})(jQuery);
