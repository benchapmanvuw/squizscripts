
let examSearch
examSearch = examSearch || {};

(function($) {

 examSearch.Search = function() {
     "use strict";
     this.init();
 }

 examSearch.Search.prototype = {
     widget: null,
     form: null,
     results: null,
     offset: 0,
     limit: 10,

     config: {
         api: "https://www.wgtn.ac.nz/library/dev/exam-search",
         searchType: "any,contains",
         offset: 0,
         limit: 10
     },

     arrayToUrl: function(params) {
         urls = new Array();
         for (property in params) {
             param = params[property];
             urls.push(property + "=" + param);
         }
         let url = urls.join("&");
         return url;
     },

     createLinkToPrimo: function() {
         let base = "https://tewaharoa.victoria.ac.nz/discovery/search?";
         let params = new Array();
         params.query = this.config.searchType + "," + this.searchQuery;
         params.tab = this.config.tab;
         params.search_scope = this.config.search_scope;
         params.sortby = this.config.sortby;
         params.vid = "64VUW_INST:VUWNUI";
         return base + (this.arrayToUrl(params));
     },

     // Returns a list item <li> with the result details
     renderResult: function(result) {
         // Get Details
         let title = result.pnx.display.title;
         let author = result.pnx.display.creator;
         let date = result.pnx.display.creationdate;

         let linkRsrc = result.delivery.availabilityLinksUrl;
         let linkUrl = linkRsrc;

         // Build HTML
         let li = $("<li class='result-item exam_paper'></li>");
         let details = $("<div class='details'>");
         $(li).append(details);
         let a = $("<a class='link' target='_blank'>");
         $(a).attr("href", linkUrl);
         $(a).append(title);
         $(details).append(a);
         if (date != null) {
             $(details).append("<div class='detail creationdate'><strong>Date:</strong> " + date + "</div>");
         }
         if (author != null) {
             $(details).append("<div class='detail author'><strong>Author:</strong> " + author + "</div>");
         }
         let buttonLink = $("<a href='" + linkUrl + "' class='view-open' target='_blank'><i class='icon-external'></i>View/open</i></a>");
         $(li).append(buttonLink);
         return li;
     },

     goNext: function() {
         this.config.offset = this.config.offset + this.config.limit;
         this.searchExams();
     },
     goBack: function() {
         this.config.offset = this.config.offset - this.config.limit;
         if (this.config.offset < 0) {
             this.config.offset = 0;
         }
         this.searchExams();
     },

     renderPagination: function(results) {
         let pagination = "";
         if (results.info.total > this.config.limit) {
             pagination = $("<div class='pagination'>");
             if (this.config.offset > 0) {
                 let prev = $("<a class='no-icon button previous' href='#'>Back</a>");
                 $(prev).on("click", { context: this }, function(e) {
                     e.preventDefault();
                     e.data.context.goBack();
                 });
                 $(pagination).append(prev);
             }
             let lasthit = results.info.last * 1.0;
             let totalhits = results.info.total * 1.0;
             if (lasthit < totalhits) {
                 let next = $("<a class='no-icon button next' href='#'>Next</a>");
                 $(next).on("click", { context: this }, function(e) {
                     e.preventDefault();
                     e.data.context.goNext();
                 });
                 $(pagination).append(next);
             }
         }
         return pagination;
     },

     renderError: function() {
         $(this.results).empty().append("<p>Sorry, there were no matching items.</p>");
         let self = this;
         $(".searching").fadeOut(400, function() {
             $(self.results).fadeIn();
         });
     },

     renderResults: function(data) {
         if (data.info.total) {
             let results = data;
             if (results.info.total > 0) {
                 let resultNav = $("<div id='result-nav' class='result-nav'></div>");
                 if (results.info.total > this.limit) {
                     $(resultNav).append("<span class='number-results'>Displaying " + (results.info.first) + "–" + (results.info.last) + " of " + results.info.total + " results</span>");
                 } else {
                     $(resultNav).append("<span class='number-results'>Displaying " + results.info.total + " results</span>");
                 }
                 if (this.config.showLinkToPrimo === true) {
                     let primoLink = this.createLinkToPrimo();
                     $(resultNav).append("<span class='primo-link'><a href='" + primoLink + "' target='_blank'><i class='icon-external'></i>View search in Te Waharoa</i></span>");
                 }
                 $(this.results).append(resultNav);

                 let ul = $("<ul class='result-list'>");
                 if (results.docs.length > 0) {
                     let self = this;
                     results.docs.forEach(function(i) {
                         result = self.renderResult(i);
                         $(ul).append(result);
                     });
                 } else {
                     $(ul).append(this.renderResult(results.docs));
                 }
                 $(this.results).append(ul);
                 let resultPagination = this.renderPagination(results);


                 $(this.results).append(resultPagination);
             } else {
                 $(this.results).empty().append("<p>Sorry, there were no matching items.</p>");
             }
         } else {
             $(this.results).empty().append("<p>Sorry, there were no matching items.</p>");
         }
         $(this.widget).find(".results").animate({
             opacity: 1
         }, 500);
         let self = this;
         $(".searching").fadeOut(400, function() {
             $(self.results).fadeIn();
             $('html, body').animate({
               scrollTop: $("#exam-search-form").offset().top
             }, 400);
         });
         $(".no-paper").removeClass("hidden");
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
         let query = this.searchQuery;
         query = this.purify(query);
         let chkCourseSpace = new RegExp(/([A-Za-z]{4} [0-9]+)/g);
         let chkCourse = new RegExp(/([A-Za-z]{4}[0-9]+)(?:(\.[A-Za-z]{3}))|([A-Za-z]{4}[0-9]+)|([A-Za-z]{4}$)/g);

         // Remove spaces between the course code
         let original = chkCourseSpace.exec(query);
         if (query.includes("+")) {
             query = query.replace(/\+/g, " ");
         }
         if (/\d/.test(query)) {
             if (/\s/.test(query)) {
                 query = query.replace(/\s+/g, "");
             }
             query = query.toUpperCase();
         }
         original = chkCourse.exec(query);
         this.searchQuery = query;
         $("input[name='course']").val(query);
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

     searchExams: function() {
         this.checkQuery();
         if ($(".results-container").hasClass("hidden")) {
             $(".results-container").removeClass("hidden");
         }
         $(".searching").fadeIn();
         $(this.results).fadeOut().empty();
         query = this.searchQuery;
         type = this.config.searchType;
         offset = this.config.offset;
         limit = this.config.limit;

         let data = "searchType=" + type + "&course=" + query + "&offset=" + offset + "&limit=" + limit;

         try {
             $.ajax({
                 method: "GET",
                 jsonp: false,
                 context: this,
                 timeout: 5000,
                 url: this.config.api,
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
                 error: function() {
                     this.renderError();
                 }
             });
         } catch (err) {
             this.renderError();
         }
     },

     setUp: function() {
         let div = $(".search-panel");
         let form = $("#exam-search-form");
         let searchKeyword = $("input[name='course']");
         let searchButton = $("input[name='exam-search']");
         this.results = $(".results");
         this.form = form;
         this.widget = div;

         searchButton.on("click", { context: this }, function(e) {
             e.data.context.searchQuery = searchKeyword.val();
             e.data.context.config.offset = 0;
             e.preventDefault();
             e.data.context.searchExams();
         });

         let pageUrl = window.location.href;
         let urlQuery = this.getAllUrlParams(pageUrl);

         if ("course" in urlQuery) {
             searchKeyword.val(urlQuery["course"]);
             searchButton.trigger("click");
         }
     },

     init: function() {
         this.widget = null;
         this.form = null;
         this.results = null;
         this.searchQuery = null;
         this.config = {
             api: "https://www.wgtn.ac.nz/library/dev/exam-search",
             searchType: "any,contains",
             offset: 0,
             limit: 10,
             tab: "course_exam",
             search_scope: "Exams",
             sort_by: "date_d",
             showLinkToPrimo: true
         };

         this.setUp();
     }
 }


 // Run when page has loaded
 $(document).ready(function(e) {
     (new examSearch.Search());
 });

})(jQuery);
