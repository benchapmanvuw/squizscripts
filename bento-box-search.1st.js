let bbSearch;
bbSearch = bbSearch || {};

(function($) {

    bbSearch.Search = function() {
        "use strict";
        this.init();
    };

    bbSearch.Search.prototype = {
        course: {},
        searchQuery: null,
        form: null,
        searchCode: null,
        searchButton: null,
        courseResults: null,
        guideResults: null,
        librariansResults: null,
        readingListResults: null,
        reservesResults: null,
        examsResults: null,
        limit: 10,

        fadeInResults: function(section){
          $(".searching").fadeOut(400, function() {
              $(section).fadeIn();
          }.bind(this));
        },

        renderError: function() {
            $(this.results).empty().append("<p>Sorry, there were no matching items.</p>");
            $(".searching").fadeOut(400, function() {
                $(this.results).fadeIn();
            }.bind(this));
        },

        renderExams: function() {
            let article = "<h3>Past exams</h3>";
            let showLinkToPrimo = true;
            let linkToPrimo = "https://tewaharoa.victoria.ac.nz/discovery/search?query=any,contains," + this.course.shortCode + "&tab=course_exam&search_scope=Exams&sortby=date_d&vid=64VUW_INST:VUWNUI";
            if (this.course.exams && this.course.exams.length > 0) {
                article += "<div id='result-nav' class='result-nav'>";
                article += "<div class='number-results'>Displaying ";
                article += (this.course.totalexams > 5)
                    ? 1 + "–" + this.course.exams.length + " of " + this.course.totalexams + " results</div>"
                    : this.course.exams.length + " results</div>";
                if (showLinkToPrimo === true)
                    article += "<div class='primo-link'><a href='" + linkToPrimo + "'>View search in Te Waharoa<i class='icon-arrow-right'></i></a></div>";
                article += "</div>"
                article += "<ul>";
                this.course.exams.forEach(function(exam) {
                    article += "<li>";
                    article += "<div class='result-date-author'><span>" + exam.date + "</span>, " + exam.author + "</div>";
                    article += "<div class='result-link'><a href='" + exam.url + "'><i class='icon-external'></i>View/open</a>";
                    article += "</li>";
                });
                    article += "</ul>";
            } else {
                article += "<p>There are no exams for this course.</p>";
            }
            this.examsResults.empty();
            this.examsResults.append(article);
            $(".searching").fadeOut(400, function() {
                $(this.examsResults).fadeIn();
            }.bind(this));
        },

        setExams: function(data) {
          if (data.info.total && data.info.total > 0) {
            let items = [];
            data.docs.forEach(function(doc) {
              const item = {};
              item.title = doc.pnx.display.title;
              item.author = doc.pnx.display.creator;
              item.url = doc.delivery.availabilityLinksUrl
              item.date = doc.pnx.display.creationdate;
              item.recordid = doc.pnx.control.sourcerecordid;
              items.push(item);
            });
            this.course.totalexams = data.info.total;
            this.course.exams = items;
          }
        },

        searchExams: function(course) {
            let offset = 0;
            let limit = 5;
            let baseUrl = "https://www.wgtn.ac.nz/library/dev/exam-search";
            let searchType = "any,contains";
            let tab = "couse_exam";
            let sortby = "date_d";
            let data = "searchType=" + searchType + "&course=" + course + "&offset=" + offset + "&limit=" + limit;
            let url = baseUrl + "?" + data;

            try {
              return $.getJSON(url);
            } catch (e) {
              return false;
            }
        },

        renderReserves: function() {
            let article = "<h3>Course reserves</h3>";
            let linkToPrimo = " https://tewaharoa.victoria.ac.nz/discovery/search?query=any,contains," + this.course.shortCode + "&mode=advanced&tab=CourseReserves&search_scope=CourseReserves&sortby=rank&vid=64VUW_INST:VUWNUI";
            if (this.course.reserves && this.course.reserves.length > 0) {
              article += "<div id='result-nav' class='result-nav'>";
              article += "<div class='number-results'>Displaying ";
              article += (this.course.reserves.length > this.limit)
                  ? 1 + "–" + this.course.reserves.length + " of " + this.course.reserves.length + " results</div>"
                  : this.course.reserves.length + " results</div>";
              article += "<div class='primo-link'><a href='" + linkToPrimo + "'>View search in Te Waharoa<i class='icon-arrow-right'></i></a></div>";
              article += "</div>"
              article += "<ul>";
              this.course.reserves.forEach(function(item) {
                // Build HTML
                article += "<li>";
                article += "<div class='result-title'>" + item.title + "</div>";
                article += "<div class='result-edition'>" + item.edition + "</div>";
                article += (item.author != null)
                  ? "<div class='result-author'>" + item.author + "</div>"
                  : "<div class='result-author'>No author details available</div>";
                if (item.avail != null) article += "<div class= 'result-avail'>" + item.type + ", " + item.avail + " at " + item.loc;
                article += "<div class='result-callN'>" + item.callN + "</div>";
                if (item.recordid != null) article += "<div class='result-link'><a href='https://tewaharoa.victoria.ac.nz/discovery/fulldisplay?vid=64VUW_INST:VUWNUI&lang=en&search_scope=CourseReserves&tab=CourseResearves&docid=alma" + item.recordid + "' class='TW-link' target='_blank'><i class='icon-external'></i>View record in Te Waharoa</a></div>"
                article += "</li>";
              });
              article += "</ul>";
            } else {
              article += "<p>There are no reserves for this course.</p>";
            }

            this.reservesResults.empty();
            this.reservesResults.append(article);
            $(".searching").fadeOut(400, function() {
                $(this.reservesResults).fadeIn();
            }.bind(this));
        },

        setReserves: function(data) {
          let items = [];
            if (data.info.total) {
                if (data.info.total > 0) {
                    data.docs.forEach(function(doc) {
                      const item = {};
                      item.title = doc.pnx.addata.btitle;
                      item.type = doc.pnx.addata.format;
                      item.edition = doc.pnx.addata.edition;
                      item.author = doc.pnx.addata.au;
                      item.recordid = doc.pnx.control.sourcerecordid;
                      item.delCat = doc.delivery.deliveryCategory;
                      if (doc.delivery.bestlocation != null) {
                          item.avail = doc.delivery.bestlocation.availabilityStatus;
                          item.loc = doc.delivery.bestlocation.mainLocation;
                          item.callN = doc.delivery.bestlocation.callNumber;
                      }
                      items.push(item);
                    });
                    this.course.reserves = items;
                } else {
                }
            } else {
            }
        },

        searchReserves: function(course) {
            let baseUrl = "./?a=1786077";
            let searchType = "any,contains";
            let tab = "CourseReserves";
            let sortby = "rank";
            let data = "searchType=" + searchType + "&course=" + course + "&offset=0&limit=10";
            let url = baseUrl + "?" + data;

            try {
              return $.getJSON(url);
            }
            catch (e) {
              return false;
            }
        },

        renderReadingList: function() {
          let article = "<h3>Reading list</h3>";
          if (this.course.readingList === null) {
            article += "<p>No reading list set for " + this.course.shortCode + ".</p>";
          } else {
            article += "<p><a href='" + this.course.readingList.url + "'<i class='icon-external'>Reading list for " + this.course.shortCode + " on Talis</a> (last updated: " + this.course.readingList.updated + ")</p>";
          }
          this.readingListResults.empty();
          this.readingListResults.append(article);
          $(".searching").fadeOut(400, function() {
              this.readingListResults.fadeIn();
          }.bind(this));
        },

        setReadingList: function(data) {
          let rList = {};
          let listUrl = null;
          let lastUpdated, updatedDate;
          let keys = Object.keys(data);
          keys.forEach(function(key) {
            if (key.indexOf("/lists/") !== -1) {
              listUrl = key;
            }
          });
          if (listUrl === null) {
            this.course.readingList = null;
          } else {
            lastUpdated = data[listUrl]["http://purl.org/vocab/resourcelist/schema#lastUpdated"][0].value;
            updatedDate = new Date(lastUpdated);
            let months = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];
            rList.url = listUrl;
            rList.updated = updatedDate.getDate() + " " + months[updatedDate.getMonth()] + " " + updatedDate.getFullYear();
            this.course.readingList = rList;
          }
        },

        searchReadinglist: function(course) {
          course = course.toLowerCase();
          const url = "https://victoria.rl.talis.com/courses/" + course + ".json?cb=?";
          try {
            return $.getJSON(url)
          }
          catch (e) {
            return false;
          }
        },

        renderLibrarian: function(librarian) {
          let photo, firstName, lastName, title, email, ophone, subjects, guides, name;
          // Get Details
          photo = librarian.photo;
          firstName = librarian.first_name;
          lastName = librarian.last_name;
          title = librarian.title;
          email = librarian.email;
          ophone = librarian.Office_Phone;
          subjectAreas = librarian.subject_area;
          subjects = librarian.subjects;
          name = firstName + " " + lastName;

          // Build HTML
          let article = "<li>";
          article += "<div class='librarian-details'>";
          article += "<img class='profile-picture' src='" + photo + "' alt='" + name + " profile-picture photograph'>";
          article += "<h4>" + name + "</h4>";
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
          article += "</div>";
          if (subjects) {
            article += "<div class='librarian-subjects'><p>";
            article += subjects[0].name;
            subjects.slice(1).forEach(function(i){
              article += ", " + i.name;
            });
            article += "</p></div>";
          }
          article += "</li>";
          this.librariansResults.append(article);
          $(".searching").fadeOut(400, function() {
              this.librariansResults.fadeIn();
          }.bind(this));
        },

        setLibrarian: function(data) {
          let librarian = {};
          // Get Details
          librarian.photo = data.photo;
          librarian.name = data.first_name + " " + data.last_name;
          librarian.title = data.title;
          librarian.email = data.email;
          librarian.ophone = data.Office_Phone;
          librarian.subjectAreas = data.subject_area;
          librarian.subjects = data.subjects;
          this.course.librarians.push(librarian);
        },

        searchLibrarian: function(librarian) {
            librarian = librarian.trim();
            librarian = librarian.trimEnd();
            let url = "https://linkresolver.victoria.ac.nz/libapi/guides/getLibrarian/n/" + librarian + "/subjects/full";
            return $.getJSON(url);
        },

        renderGuides: function() {
          let article = "<h3>Subject guides</h3>";
          article += "<ul>";
          this.course.guides.forEach(function(i) {
            article += "<li><a href='" + i.url + "'>" + i.name + "</a></li>";
          });
          article += "</ul>";
          this.guideResults.empty();
          this.guideResults.append(article);
          $(".searching").fadeOut(400, function() {
              this.guideResults.fadeIn();
          }.bind(this));
        },

        setGuides: function(data) {
          const librarians = [];
          this.course.guides = [];
          data.forEach(function(i) {
            const guide = {};
            guide.name = i.name;
            guide.url = i.friendly_url;
            guide.description = i.description;
            guide.update = i.owner.updated;
            guide.owner_first_name = i.owner.first_name;
            guide.owner_last_name = i.owner.last_name;
            guide.tags = [];
            i.tags.forEach(function(i) {
              guide.tags.push(i.text);
            });
            this.course.guides.push(guide);
          }.bind(this));
        },

        searchGuides: function(course) {

        let query = course.substring(0, 4);
        let url = "./?a=1845872?sub=" + query;

          try {
              return $.getJSON(url);
          } catch (e) {
              return false;
          }
        },

        renderDetails: function() {
          let article = "<header><h2>" + this.course.shortCode + ": " + this.course.courseTitle + "</h2></header>";
          article += "<div class='course-results-description'>";
          article += "<p><strong>" + this.course.faculty + ", " + this.course.school + "</strong></p>";
          article += "<p>" + this.course.description + "</p>";
          article += "</div>";
          article += "<dl class='course-results-details'>";
          article += "<div><dt><i aria-hidden='true' class='icon-graduation-cap'></i>Total points</dt><dd>" + this.course.points + "</dd></div>";
          article += "<div><dt><i aria-hidden='true' class='icon-clock'></i>Days taught</dt><dd>" + this.course.days + "</dd></div>";
          article += "<div><dt>Trimesters taught</dt><dd>" + this.course.trimester + "</dd></div>";
          article += "<div><dt><i class='icon-calendar'></i>Year</dt><dd>" + this.course.year + "</dd></div>";
          article += "</dl>";
          article += "<footer class='details-link'><a href='" + this.course.url + "'><i class='icon-external'></i>Further course details</a></footer>";
          this.courseResults.append(article);
          $(".searching").fadeOut(400, function() {
              this.courseResults.fadeIn();
          }.bind(this));
        },

        setDetails: function(data) {
          const metaData = data.response.resultPacket.results[0].metaData;
          this.course.courseTitle = metaData.courseTitle;
          this.course.description = metaData.description;
          this.course.faculty = metaData.faculty;
          this.course.school = metaData.school;
          this.course.points = metaData.points;
          this.course.days = metaData.daysTaught;
          this.course.trimester = metaData.trimesterTaught;
          this.course.year = metaData.year;
          this.course.url = data.response.resultPacket.results[0].displayUrl;
        },

        searchDetails: function(course) {

          let url = "https://search.wgtn.ac.nz/s/search.json?collection=wgtn_courses&query=" + course;

          try {
            return $.getJSON(url);
          } catch (e) {
            return false;
          }
        },

        searchBB: function(course) {
          this.courseResults.fadeOut();
          this.courseResults. empty();
          this.guideResults.fadeOut();
          this.guideResults.empty();
          this.librariansResults.fadeOut();
          this.librariansResults.empty();
          this.readingListResults.fadeOut();
          this.readingListResults.empty();
          this.reservesResults.fadeOut();
          this.reservesResults.empty();
          $(".searching").fadeIn();
          const details = this.searchDetails(course);
          details.done(function(data) {
            this.setDetails(data);
            this.renderDetails();
          }.bind(this));
          const guides = this.searchGuides(course);
          guides.done(function(data) {
            this.setGuides(data);
            this.renderGuides();
            this.course.librarians = [];
            const librarians = [];
            this.course.guides.forEach(function(guide) {
              if (!librarians.includes(guide.owner_first_name)) {
                librarians.push(guide.owner_first_name);
              }
            });
            librarians.forEach(function(librarian) {
              const lib = this.searchLibrarian(librarian);
              lib.done(function(data) {
                this.setLibrarian(data);
                this.renderLibrarian(data[0]);
              }.bind(this));
            }.bind(this));
          }.bind(this));
          const rlist = this.searchReadinglist(course);
          rlist.done(function(data) {
            this.setReadingList(data);
            this.renderReadingList(data);
          }.bind(this));
          const reserves = this.searchReserves(course);
          reserves.done(function(data) {
            this.setReserves(data);
            this.renderReserves();
          }.bind(this));
          const exams = this.searchExams(course);
          exams.done(function(data) {
            this.setExams(data);
            this.renderExams();
          }.bind(this));
        },

        getAllUrlParams: function(url) {
            let queryString = url ? url.split("?")[1] : window.location.search.slice(1);
            let urlQuery = {};
            if (queryString) {
                queryString = queryString.split("#")[0];
                let arr = queryString.split("&");
                arr.forEach(function(i) {
                    let param = i.split("=");
                    let paramName = param[0];
                    let paramValue = typeof(param[1]) === "undefined" ? true : param[1];
                    paramName = paramName.toLowerCase();
                    if (typeof paramValue === "string") paramValue = paramValue.toLowerCase();
                    if (paramName.match(/\[(\d+)?\]$/)) {
                        let key = paramName.replace(/\[(\d+)?\]/, "");
                        if (!urlQuery[key]) urlQuery[key] = [];
                        if (paramName.match(/\[\d+\]$/)) {
                            let index = /\[(\d+)\]/.exec(paramName)[1];
                            urlQuery[key][index] = paramValue;
                        } else {
                            urlQuery[key].push(paramValue);
                        }
                    } else {
                        if (!urlQuery[paramName]) {
                            urlQuery[paramName] = paramValue;
                        } else if (urlQuery[paramName] && typeof urlQuery[paramName] === "string") {
                            urlQuery[paramName] = [urlQuery[paramName]];
                            urlQuery[paramName].push(paramValue);
                        } else {
                            urlQuery[paramName].push(paramValue);
                        }
                    }
                });
            }
            return urlQuery;
        },

        checkCourse: function(queryCode) {
          let courseCode, checkCode;
          const cChck = new RegExp(/([A-Za-z]{4}[0-9]{3})/g);
          courseCode = queryCode.replace(/[\s\+]/g,"");
          courseCode = cChck.exec(courseCode)[0];
          if (courseCode != null) {
            courseCode = courseCode.toUpperCase();
            this.course.shortCode = courseCode;
            this.searchCode.val(courseCode);
            return true;
          } else {
            return false;
          }
        },

        scrollTopForm: function() {
            $('html, body').animate({
                scrollTop: $(this.form).offset().top
            }, 400);
        },

        init: function() {

            this.form = $("#bb-search-form");
            this.searchCode = $("input[name='bb-search']");
            this.searchButton = $("#search-button");
            this.courseResults = $(".course-results");
            this.guideResults = $(".guide-results");
            this.librariansResults = $(".librarian-list");
            this.readingListResults = $(".reading-list-results");
            this.reservesResults = $(".reserve-results");
            this.examsResults = $(".exam-results");

            this.searchButton.on("click", function(e) {
                this.scrollTopForm();
                e.preventDefault();
                this.course = {};
                if (this.checkCourse(this.searchCode.val())) {
                  this.searchBB(this.course.shortCode);
                } else {
                  this.renderInvalid();
                }
            }.bind(this));

            // Check for search query in URL
            const pageUrl = window.location.href;
            const urlQuery = this.getAllUrlParams(pageUrl);

            if ("course-code" in urlQuery) {
              let bbkword = decodeURIComponent(urlQuery["course-code"]);
              this.searchCode.val(bbkword);
              this.searchButton.trigger("click");
            }
        }
    }

    // Run when page has loaded
    $(document).ready(function() {
        (new bbSearch.Search());
    });

})(jQuery);
