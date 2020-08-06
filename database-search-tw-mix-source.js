let dbSearch;
dbSearch = dbSearch || {};

(function($) {

    dbSearch.Search = function() {
        "use strict";
        this.init();
    };

    dbSearch.Search.prototype = {
        form: null,
        resultsBox: null,
        searching: null,
        searchQuery: {},
        subject: {},
        subjectArea: null,
        api: "./?a=1791159",
        offset: 0,
        limit: 10,
        searchType: null,
        tab: null,
        sort: null,
        q: null,
        databases: null,
        search_scope: "MyInst_and_CI",

        fadeInResults: function(){
            $(this.searching).fadeOut(400, function() {
                $(this.resultsBox).fadeIn();
            }.bind(this));
        },

        renderFail: function() {
            $(this.resultsBox).empty().append("<p>Sorry, your search could not be completed. Please try again later.</p>");
            this.fadeInResults();
        },

        renderEmpty: function() {
            $(this.resultsBox).empty().append("<p>Sorry, no items matched your search.</p>");
            this.fadeInResults();
        },

        arrayToQString: function(params) {
            urls = [];
            for (property in params) {
                param = params[property];
                urls.push(property + "=" + param);
            };
            let url = urls.join("&");
            return url;
        },

        createLinkToPrimo: function() {
            let base;
            let params = {};
            if (this.searchQuery.type == "title") {
                base = "https://tewaharoa.victoria.ac.nz/discovery/search?";
                params.query = "title,contains," + this.searchQuery.term + ",AND&pfilter=rtype,exact,databases,AND&mode=advanced";
                params.tab = this.tab;
                params.sortby = this.sort;
                params.search_scope = this.search_scope;
                params.vid = "64VUW_INST:VUWNUI";
            } else {
                base = "https://tewaharoa.victoria.ac.nz/discovery/dbsearch?"
                params.query = "contains,dbcategory,";
                params.tab = this.tab;
                params.sortby = this.sort;
                params.search_scope = this.search_scope;
                params.vid = "64VUW_INST:VUWNUI";
                this.subject.sub
                    ? params.databases = "category," + this.subject.area + "─" + this.subject.sub
                    : params.databases = "category," + this.subject.area;
            }
            return base + (this.arrayToQString(params));
        },

        renderMore: function(data) {
            let results = data.results;
            let total = data.resultsTotal;
            let ul = $("<ul class='result-list' style='display: none'></ul>");
            this.renderList(results,ul);
            $(this.resultsBox).append(ul);
            $(this.searching).fadeOut(400, function() {
                $(ul).fadeIn(400, function() {
                    let resultPagination = this.renderPagination(total);
                    $(this.resultsBox).append(resultPagination);
                }.bind(this));
            }.bind(this));
        },
        
        renderPagination: function(total) {
            let pagination = "";
            if (total > this.offset + this.limit) {
                let nextStart = this.offset + this.limit + 1;
                let nextEnd = this.offset + this.limit + this.limit;
                if (total < nextEnd) {
                    nextEnd = total;
                }
                pagination = $("<div class='pagination'></div>");
                let more = $("<button class='no-icon load-more'>Load " + nextStart + " to " + nextEnd + " of " + total + "</button>");
                $(more).on("click", function(e) {
                    e.preventDefault();
                    $(pagination).remove();
                    $(this.searching).fadeIn();
                    this.offset += this.limit;
                    let searchResults = this.searchDBs().then(function(data) {
                        if (data) {
                            this.renderMore(data);
                        } else {
                            this.renderFail();
                        }
                    }, function() {
                        this.renderFail();
                    });
                }.bind(this));
                $(pagination).append(more);
            }
            return pagination;
        },

        titleCase: function(string) {
            let words = string.toLowerCase().split(" ");
            let sentence = "";
            words.forEach(function(word) {
               if (word != "and" || word != "in") { 
                   word = word[0].toUpperCase() + word.slice(1);
               }
               sentence += word + " ";
            });
            sentence = sentence.trim();
            console.log(sentence);
            return sentence;
        },

        renderList: function(results,list) {
            results.forEach(function(result) {
                let item = $("<li class='result-item database'></li>");
                let details = $("<div class='details'></div>");
                let linkTitle = "<div class='result-title'><a href='" + result.link + "'>" + result.title + "</a></div>";
                $(details).append(linkTitle);
                let descr = (result.description != null)
                    ? "<div class='detail description'><strong>Description:</strong> " + result.description + "</div>"
                    : "<div class='detail description na'>No description available</div>";
                $(details).append(descr);
                $(item).append(details);
                let buttonLink = (result.link != "")
                    ? "<div><a href='" + result.link + "' class='view-open button flat'><i class='icon-external'></i>Go to database</a>"
                    : "<div class='na'>Not available for access";
                buttonLink += "<a href='" + result.twlink + "' class='view-open button flat'><i class='icon-external'></i>View record in Te Waharoa</a></div>";
                $(item).append(buttonLink);
                $(list).append(item);
            }.bind(this));
        },

        renderGuide: function() {
            let subTitle = this.titleCase(this.searchQuery.term);
            let guideLink = this.subject.link;
            if (guideLink) {
                let subBox = $("<div class='flash-message info'><p>For more information on databases and other resources, refer to the <a href='" + guideLink + "'>" + subTitle + " subject guide</a> or contact the <a href='./?a=1774864?lib-sub=" + this.searchQuery.term + "'>" + subTitle + " subject librarian</a>.</p></div>");
                $(this.resultsBox).prepend(subBox);
            }
        },

        renderResults: function(data) {
            if (data.results) {
                if (this.searchQuery.type == "subject") {
                    this.renderGuide();
                }
                let results = data.results;
                let total = data.resultsTotal;
                if (total > 0) {
                    let resultNav = $("<div id='result-nav' class='result-nav'><span class='number-results'>Total results: " + total + "</span></div>");
                    let primoLink = this.createLinkToPrimo();
                    $(resultNav).append("<span class='primo-link'><a href='" + primoLink + "' target='_blank'><i class='icon-external'></i>View search in Te Waharoa</span>");
                    $(this.resultsBox).append(resultNav);
                    let ul = $("<ul class='result-list'></ul>");
                    this.renderList(results,ul);
                    $(this.resultsBox).append(ul);
                    let resultPagination = this.renderPagination(total);
                    $(this.resultsBox).append(resultPagination);
                    this.fadeInResults();
                } else {
                    renderEmpty();
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

        setParams: function() {
            if (this.searchQuery.type == "title") {
                this.tab = "all";
                this.sort = "rank";
                this.q = "title,contains," + this.searchQuery.term + ",AND;rtype,exact,databases";
                this.databases = "";
            } else {
                this.tab = "jsearch_slot";
                this.sort = "title";
                this.q = "contains,dbcategory,AND;rtype,exact,databases";
                this.subject.sub
                    ? this.databases = "category," + this.subject.area + "─" + this.subject.sub
                    : this.databases = "category," + this.subject.area;
            }
        },

        searchDBs: function() {
            let data = "tab=" + this.tab +
                "&q=" + this.q +
                "&sort=" + this.sort +
                "&offset=" + this.offset +
                "&databases=" + this.databases +
                "&query=" + this.searchQuery.term +
                "&search-type=" + this.searchQuery.type;
            try {
                return $.ajax({
                    method: "GET",
                    context: this,
                    timeout: 5000,
                    url: this.api,
                    data: data,
                    dataType: "json"
                });
            } catch (err) {
                return null;
            }
        },

        scrollTopForm: function() {
            $('html, body').animate({
                scrollTop: this.form.offset().top
            }, 400);
        },

        sendQuery: function(field) {
            this.searchQuery.term = this.purify(this.searchQuery.term);
            if (this.searchQuery.term.includes("+")) {
                this.searchQuery.term = this.searchQuery.term.replace(/\+/g, " ");
            }
            field.val(this.searchQuery.term);
            if (this.searchQuery.type == "subject") {
                this.subject.area = $("#database-by-subject option:selected").attr("data-subject-area").replace(/&/g, "");
                this.subject.sub = $("#database-by-subject option:selected").attr("data-subject");
                this.subject.link = $("#database-by-subject option:selected").attr("data-url");
            }
            this.scrollTopForm();
            $(".results-container").removeClass("hidden");
            $(this.searching).fadeIn();
            $(this.resultsBox).fadeOut().empty();
            this.offset = 0;
            this.setParams();
            let searchResults = this.searchDBs().then(function(data) {
                if (data) {
                    this.renderResults(data);
                } else {
                    this.renderFail();
                }
            }, function() {
                this.renderFail();
            });
        },

        sendSearch: function(queryParameter) {
            this.searchQuery.term = this.purify(this.searchQuery.term);
            let url = window.location.href;
            url = url.split("?")[0];
            url += "?" + queryParameter + "=" + this.searchQuery.term;
            window.history.pushState({}, document.title, url);
            this.scrollTopForm();
            $(".results-container").removeClass("hidden");
            $(this.searching).fadeIn();
            $(this.resultsBox).fadeOut().empty();
            this.offset = 0;
            this.setParams();
            let searchResults = this.searchDBs().then(function(data) {
                if (data) {
                    this.renderResults(data);
                } else {
                    this.renderFail();
                }
            }, function() {
                this.renderFail();
            });
        },

        init: function() {
            this.form = $("#db-search-form");
            let searchTitle = $("input[name='db-title']");
            let searchButton = $("input[name='db-search']");
            let searchSub = $("#database-by-subject");
            let goButton = $("input[name='db-go']");
            this.resultsBox = $(".results");
            this.searching = $(".searching");

            searchButton.on("click", function(e) {
                e.preventDefault();
                if (searchTitle.val()) {
                    $(searchSub).val(0);
                    this.searchQuery.type = "title";
                    this.searchQuery.term = searchTitle.val();
                    this.sendSearch("db-title");
                }
            }.bind(this));

            goButton.on("click", function(e) {
                e.preventDefault();
                if ($(searchSub).find("option:selected").index() != 0) {
                    $(searchTitle).val("");
                    this.subject.area = $(searchSub).find("option:selected").attr("data-subject-area").replace(/&/g, "");
                    this.subject.sub = $(searchSub).find(" option:selected").attr("data-subject");
                    this.subject.link = $(searchSub).find(" option:selected").attr("data-url");
                    this.searchQuery.type = "subject";
                    this.searchQuery.term = searchSub.val();
                    this.sendSearch("db-sub");
                }
            }.bind(this));

            // Check for search query in URL
            let pageUrl = window.location.href;
            let urlQuery = this.getAllUrlParams(pageUrl);

            if ("db-title" in urlQuery) {
                this.searchQuery.type = "title";
                this.searchQuery.term = decodeURIComponent(urlQuery["db-title"]);
                this.sendQuery(searchTitle);
            }

            if ("db-sub" in urlQuery) {
                this.searchQuery.type = "subject";
                this.searchQuery.term = decodeURIComponent(urlQuery["db-sub"]);
                this.sendQuery(searchSub);
            }

            window.addEventListener('popstate', function() {
                location.reload();
            });
        }
    }

    $(document).ready(function() {
        (new dbSearch.Search());
    });

})(jQuery);