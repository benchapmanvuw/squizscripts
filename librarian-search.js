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
        offset: 0,
        limit: 10,

        config: {
            emailapi: null,
            libapi: null
        },

        // Returns a list item <li> with the result details
        renderResult: function(result) {
            // Get Details
            let image = result.image;
            let name = result.name;
            let title = result.title;
            let ophone = result.ophone;
            let unit = result.unit;
            let email = result.email;




            // Build HTML
            let article = "<article>";
            article = article + "<img class='profile-picture' src='" + image + "' alt='" + name + " profile-picture photograph'>";
            article = article + "<div class='summary'>";
            article = article + "<header class='formatting'>";
            article = article + "<h3>" + name + "</h3>";
            article = article + "<p class='subtitle'><strong>" + title + "</strong>";
            if (unit) {
                article = article + "<span>" + unit + "</span></p>";
            } else {
                article = article + "</p>";
            }
            article = article + "</header>";
            article = article + "<!-- Quick contact info -->";
            article = article + "<ul class='meta'>";
            article = article + "<li class='highlight'>";
            article = article + "<a href=mailto:'" + email + "' title='Send an email to " + name + "'>";
            article = article + "<i class='icon-mail'></i>" + email + "</a>";
            article = article + "</li>";
            article = article + "<li class='highlight'>";
            article = article + "<a href='tel:" + ophone + "' title='Call " + name + " work phone'>";
            article = article + "<i class='icon-phone'></span>" + ophone + "</a>";
            article = article + "</li>";
            article = article + "</ul>";
            article = article + "</div>";
            article = article + "</article>";

            return article;
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
            $(this.results).append(result);
            let self = this;
            $(".searching").fadeOut(400, function() {
                $(self.results).fadeIn();
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
            let data = "email=" + email;

            try {
                $.ajax({
                    method: "GET",
                    jsonp: false,
                    context: this,
                    timeout: 5000,
                    url: this.config.libapi,
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
                    url: this.config.emailapi,
                    data: edata,
                    dataType: "json",
                    complete: function(data) {
                        data = null;
                    },
                    success: function(data) {


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
                self.emailQuery = result;
            }).promise();
        },

        searchLibrarians: function() {
            if ($(".results-container").hasClass("hidden")) {
                $(".results-container").removeClass("hidden");
            }
            $(".searching").fadeIn();
            $(this.results).fadeOut().empty();
            query = this.libQuery;
            let subQuery;
            let librarian;
            let self = this;
            subQuery = this.getEmail(query).done(function() {
                librarian = self.getLibrarian(self.emailQuery);
            });

        },

        setUp: function() {
            let div = $(".search-panel");
            let form = $("#librarian-search-form");
            let searchSub = $("#librarian-by-subject");
            let goButton = $("input[name='go-librarian']");
            this.results = $(".results");
            this.form = form;
            this.widget = div;

            goButton.on("click", { context: this }, function(e) {
                e.data.context.libQuery = searchSub.val();
                console.log(e.data.context.libQuery);
                e.preventDefault();
                e.data.context.searchLibrarians();
            });

            // Check for search query in URL
            let pageUrl = window.location.href;
            console.log(pageUrl);
            let urlQuery = this.getAllUrlParams(pageUrl);
            console.log(urlQuery);
            let sub = urlQuery["sub"];
            sub = decodeURIComponent(sub);
            if ("sub" in urlQuery) {
                console.log(sub);
                searchSub.val(sub);
                console.log(searchSub.val())
                goButton.trigger("click");
                console.log(searchSub.val());
            }
        },

        init: function() {
            this.widget = null;
            this.form = null;
            this.results = null;
            this.emailQuery = null;
            this.libQuery = null;
            this.config = {
                emailapi: "%globals_asset_file_contents:1768409^json_decode^index:prod%/library/dev/search-librarians-by-subject",
                libapi: "%globals_asset_file_contents:1768409^json_decode^index:prod%/library/dev/subject-librarian-contact-details-search"
            };

            this.setUp();
        }
    }

    // Run when page has loaded
    $(document).ready(function() {
        (new librarianSearch.Search());
    });

})(jQuery);
