let ccSearch;
ccSearch = ccSearch || {};

(function($) {

    ccSearch.Widget = function() {
        "use strict";
        this.init();
    };

    ccSeach.Widget.prototype = {
        form = $("#cc-search-form"),
        searchCodeField = $("input[name='cc-search']");
        searchButton = $("#search-button");
        messageBox = $(".message-box");
        ccResults = $(".cc-results");
        courseResults = $(".course-results");
        guideResults = $(".guide-results");
        librarianResults = $(".librarian-results");
        readingListResults = $(".reading-list-results");
        reserveResults = $(".reserve-results");
        examResults = $(".exam-results");
        limits = {
            resOffset: 0,
            resInc: 5,
            examsOffset: 0,
            examsInc: 6
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
                    if (typeof paramValue === "string") {
                        paramValue = paramValue.toLowerCase();
                    }
                    if (paramName.match(/\[(\d+)?\]$/)) {
                        let key = paramName.replace(/\[(\d+)?\]/, "");
                        if (!urlQuery[key]) {
                            urlQuery[key] = [];
                        }
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
            };
            return urlQuery;
        },

        checkCourse: function(queryCode) {
            let courseCode;
            const cChck = new RegExp(/([A-Za-z]{4}[0-9]{3})/g);
            courseCode = queryCode.replace(/[\s\+]/g, "");
            courseCode = cChck.exec(courseCode)[0];
            if (courseCode != null) {
                courseCode = courseCode.toUpperCase();
                searchCode = courseCode;
                searchCodeField.val(courseCode);
                return true;
            } else {
                return false;
            }
        },

        scrollToTop: function(element) {
            $('html, body').animate({
                scrollTop: element.offset().top
            }, 400);
        };  

        init: function() {
            searchButton.on("click", function(e) {
                scrollToTop(form);
                e.preventDefault();
                if (checkCourse(searchCodeField.val())) {
                    search.searchCC(searchCode);
                } else {
                    renderInvalid();
                }
            });

            // Check for search query in URL
            const pageUrl = window.location.href;
            const urlQuery = getAllUrlParams(pageUrl);

            if ("course-code" in urlQuery) {
                let cckword = decodeURIComponent(urlQuery["course-code"]);
                searchCodeField.val(cckword);
                widget.searchButton.trigger("click");
            };
        },

            resetDisplay: function() {
                $(messageBox).add(ccResults).fadeOut(400).promise().done(function() {
                    $(".searching").fadeIn(400);
                    courseResults.empty();
                    guideResults.empty();
                    librarianResults.empty();
                    readingListResults.empty();
                    reserveResults.empty();
                    examResults.empty();
                });
            },

            renderCourse: function(course) {
                renderDetails(course);
                renderGuides(course);
                renderLibrarians(course);
                renderReadingList(course);
                renderReserves(course,1);
                renderExams(course,1);
    
                $(".content-tab").on("click", function() {
                    if ($(this).attr("aria-selected", "false")) {
                        $(".content-tab").attr("aria-selected", "false");
                        $(this).attr("aria-selected", "true");
                        const s = $(this).attr("aria-controls");
                        $(".result-box").removeClass("active");
                        $("." + s).addClass("active");
                    }
                });
    
    
                $(".searching").fadeOut(400, function() {
                    $(ccResults).fadeIn();
                });
                console.log("course rendered");
            }
        };

        function renderExams (course,min) {
            let article = "<h3>Past exams</h3>";
            let max = ((min + limits.examsInc) > course.totalexams) ?
                course.totalexams :
                min + limits.examsInc - 1;
            let linkToPrimo = "https://tewaharoa.victoria.ac.nz/discovery/search?query=any,contains," + course.shortCode + "&tab=course_exams&search_scope=Exams&sortby=date_d&vid=64VUW_INST:VUWNUI&lang=en&offset=0";

            if (course.exams && course.totalexams > 0) {
                article += "<div id='result-nav' class='result-nav'>";
                article += "<div class='number-results'>Displaying ";
                article += (course.totalexams > limits.examsInc) ?
                    min + "–" + max + " of " + course.totalexams + " results</div>" :
                    course.totalexams + " results</div>";
                article += "<div class='primo-link'><a href='" + linkToPrimo + "'>View search in Te Waharoa<i class='icon-arrow-right'></i></a></div>";
                article += "</div>"

                article += "<ul>";
                for (let index = min; index <= max; index++) {
                    exam = course.exams[index - 1];
                    exam.url = exam.url.replace("exams.victoria.ac.nz", "exams.victoria.ac.nz.helicon.vuw.ac.nz");
                    article += "<li>";
                    article += "<div class='result-date-author'><span>" + exam.date + "</span>";
                    if (exam.author != undefined) {
                        console.log("author", exam.author);
                        article += ", " + exam.author + "</div>";
                    } else {
                        article += " (no author listed)</div>";
                    }
                    article += "<div class='result-link'><a href='" + exam.url + "'><i class='icon-external'></i>View/open</a>";
                    article += "</li>";
                };
                article += "</ul>";
                console.log(course.totalexams);
                console.log(limits.examsInc);
                if (course.totalexams > limits.examsInc) {
                    article += "<div class='pagination'>";
                    (min > 1) ?
                    article += "<button class='no-icon previous' >Back</button>":
                        article += "<button class='no-icon previous disabled' >Back</button>";
                    (max < course.totalexams) ?
                    article += "<button class='no-icon next' >Next</button>":
                        article += "<button class='no-icon next disabled' >Next</button>";
                    article += "</div>";
                }
            } else {
                let tabID = "#" + $(examResults).attr("aria-labelledby");
                $(tabID).addClass("no-results");
                article += "<p>There are no exams held for " + course.shortCode + "</p>";
            }
            examResults.empty();
            examResults.append(article);
            $(".exam-results button.next").not(".disabled").on("click", function() {
                renderExams(min + limits.examsInc);
            });
            $(".exam-results button.previous").not(".disabled").on("click", function() {
                renderExams(min - limits.examsInc);
            });
            console.log("exams rendered");
        };

        function renderReserves(course,min) {
            let article = "<h3>Course reserves</h3>";
            let max = ((min + limits.resInc) > course.totalres) ?
                course.totalres :
                min + limits.examsInc - 1;
            let linkToPrimo = "https://tewaharoa.victoria.ac.nz/discovery/search?query=any,contains," + course.shortCode + "&offset=0&vid=64VUW_INST:VUWNUI&tab=CourseReserves";
            if (course.reserves && course.totalres > 0) {
                article += "<div id='result-nav' class='result-nav'>";
                article += "<div class='number-results'>Displaying ";
                article += (course.totalres > limits.resInc) ?
                    min + "–" + max + " of " + course.totalres + " results</div>" :
                    course.totalres + " results</div>";
                article += "<div class='primo-link'><a href='" + linkToPrimo + "'>View search in Te Waharoa<i class='icon-arrow-right'></i></a></div>";
                article += "</div>"
                article += "<ul>";
                for (let index = min; index <= max; index++) {
                    item = course.reserves[index - 1];
                    article += "<li>";
                    article += "<div class='result-title'>" + item.title + "</div>";
                    article += "<div class='result-edition'>" + item.edition + "</div>";
                    article += (item.author != null) ?
                        "<div class='result-author'>" + item.author + "</div>" :
                        "<div class='result-author'>No author details available</div>";
                    if (item.avail != null) article += "<div class= 'result-avail'>" + item.type + ", " + item.avail + " at " + item.loc;
                    article += "<div class='result-callN'>" + item.callN + "</div>";
                    if (item.recordid != null) article += "<div class='result-link'><a href='https://tewaharoa.victoria.ac.nz/discovery/fulldisplay?vid=64VUW_INST:VUWNUI&lang=en&search_scope=CourseReserves&tab=CourseResearves&docid=alma" + item.recordid + "' class='TW-link'><i class='icon-external'></i>View record in Te Waharoa</a></div>"
                    article += "</li>";
                };
                article += "</ul>";
                console.log(course.totalres);
                console.log(limits.resInc);
                if (course.totalres > limits.examsInc) {
                    article += "<div class='pagination'>";
                    (min > 1) ?
                    article += "<button class='no-icon previous' >Back</button>":
                        article += "<button class='no-icon previous disabled' >Back</button>";
                    (max < course.totalres) ?
                    article += "<button class='no-icon next' >Next</button>":
                        article += "<button class='no-icon next disabled' >Next</button>";
                    article += "</div>";
                }
            } else {
                let tabID = "#" + $(widget.reserveResults).attr("aria-labelledby");
                $(tabID).addClass("no-results");
                article += "<p>There are no reserves for " + course.shortCode + ".</p>";
            }
            reserveResults.append(article);
            $(".reserve-results button.next").not(".disabled").on("click", function() {
                renderReserves(min + limits.resInc);
            });
            $(".reserve-results button.previous").not(".disabled").on("click", function() {
                renderReserves(min - limits.resInc);
            });
            console.log("reserves rendered");
        };

        function renderReadingList(course) {
            let article = "<h3>Reading list</h3>";
            if (course.readingList === null) {
                let tabID = "#" + $(widget.readingListResults).attr("aria-labelledby");
                $(tabID).addClass("no-results");
                article += "<p>No reading list set for " + course.shortCode + ".</p>";
            } else {
                article += "<p><a href='" + course.readingList.url + "'<i class='icon-external'>Reading list for " + course.shortCode + " on Talis</a> (last updated: " + course.readingList.updated + ")</p>";
            }
            console.log("reading list article",article);
            readingListResults.append(article);
            console.log("reading list rendered");
        };

        function renderLibrarians(course) {
            let article = "<h3>Subject Librarians</h3>"
            article += "<ul class='librarian-list'>";
            course.librarians.forEach(function(librarian) {
                let photo, name, title, email, ophone, subjectAreas, subjects, guides;
                // Get Details
                photo = librarian.photo;
                name = librarian.name;
                title = librarian.title;
                email = librarian.email;
                ophone = librarian.ophone;
                subjectAreas = librarian.subjectAreas;
                subjects = librarian.subjects;

                // Build HTML
                article += "<li>";
                article += "<img class='profile-picture' src='" + photo + "' alt='" + name + " profile-picture photograph'>";
                article += "<div class='librarian-details'>";
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
                if (subjects) {
                    article += "<p><strong>Subjects:</strong> ";
                    article += subjects[0].name;
                    subjects.slice(1).forEach(function(i) {
                        article += ", " + i.name;
                    });
                    article += "</p>";
                }
                article += "</li>";
            });
            article += "</ul>";
            article += "</div>"
            librarianResults.append(article);
            console.log("librarians rendered");
        };

        function renderGuides(course) {
            let article = "<h3>Subject guides</h3>";
            article += "<ul class='button-list'>";
            course.guides.forEach(function(i) {
                article += "<li><a href='" + i.url + "' class='button large no-icon flat-border' target='_blank'><i class='icon-book-open'></i>" + i.name + "</a></li>";
            });
            article += "</ul>";
            guideResults.empty();
            guideResults.append(article);
            console.log("guides rendered");
        }

        function renderDetails(course) {
            let article = "<header><h2>" + course.shortCode + ": " + course.courseTitle + "</h2></header>";
            article += "<div class='course-results-description'>";
            article += "<p><strong>" + course.faculty + ", " + course.school + "</strong></p>";
            article += "<p>" + course.description + "</p>";
            article += "</div>";
            article += "<dl class='course-results-details'>";
            article += "<div><dt><i aria-hidden='true' class='icon-graduation-cap'></i>Total points</dt><dd>" + course.points + "</dd></div>";
            article += "<div><dt><i aria-hidden='true' class='icon-clock'></i>Days taught</dt><dd>" + course.days + "</dd></div>";
            article += "<div><dt>Trimesters taught</dt><dd>" + course.trimester + "</dd></div>";
            article += "<div><dt><i class='icon-calendar'></i>Year</dt><dd>" + course.year + "</dd></div>";
            article += "</dl>";
            article += "<footer class='details-link'><a href='" + course.url + "' target='_blank'><i class='icon-external'></i>Further course details</a></footer>";
            courseResults.append(article);
            console.log("details rendered");
        };

    })();

    const courseObj = (function() {
        let code = null;

        const info = {};
        let course = {};

        const setExams = function(data) {
            if (data.info.total && data.info.total > 0) {
                let items = [];
                data.docs.forEach(function(doc) {
                    const item = {};
                    item.title = doc.pnx.display.title;
                    item.author = doc.pnx.display.creator;
                    item.url = doc.delivery.availabilityLinksUrl[0]
                    item.date = doc.pnx.display.creationdate;
                    item.recordid = doc.pnx.control.sourcerecordid;
                    items.push(item);
                });
                info.totalexams = data.info.total;
                info.exams = items;
            } else {
                info.exams = null;
            }
            console.log("exams set");
        };

        const setReserves = function(data) {
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
                    info.totalres = data.info.total;
                    info.reserves = items;
                } else {
                    info.reserves = null;
                }
            } else {
                course.reserves = null;
            }
            console.log("reserves set");
        };

        const setReadingList = function(data) {
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
                course.readingList = null;
            } else {
                lastUpdated = data[listUrl]["http://purl.org/vocab/resourcelist/schema#lastUpdated"][0].value;
                updatedDate = new Date(lastUpdated);
                let months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
                rList.url = listUrl;
                rList.updated = updatedDate.getDate() + " " + months[updatedDate.getMonth()] + " " + updatedDate.getFullYear();
                course.readingList = rList;
            }
            console.log("reading list set");
        };

        const setLibrarians = function(data) {
            course.librarians = [];
            data.forEach(function(i) {
                const lib = i[0];
                const librarian = {};
                librarian.photo = lib.photo;
                librarian.name = lib.first_name + " " + lib.last_name;
                librarian.title = lib.title;
                librarian.email = lib.email;
                librarian.ophone = lib.Office_Phone;
                librarian.subjectAreas = lib.subject_area;
                librarian.subjects = lib.subjects;
                course.librarians.push(librarian);
            })
            console.log("librarians set");
        };

        const setGuides = function(data) {
            course.guides = [];
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
                course.guides.push(guide);
            });
            console.log("guides set");
        };

        const setDetails = function(data) {
            const metaData = data.response.resultPacket.results[0].metaData;
            course.shortCode = metaData.shortCode;
            course.courseTitle = metaData.courseTitle;
            course.description = metaData.description;
            course.faculty = metaData.faculty;
            course.school = metaData.school;
            course.points = metaData.points;
            course.days = metaData.daysTaught;
            course.trimester = metaData.trimesterTaught;
            course.year = metaData.year;
            course.url = data.response.resultPacket.results[0].displayUrl;
            console.log("details set");
        };

        return {
            setCourse: function(data) {
                course = {};
                const [detailsData, guidesData, librariansData, rlistData, reservesData, examsData] = data;
                setDetails(detailsData);
                setGuides(guidesData);
                setLibrarians(librariansData);
                setReadingList(rlistData);
                setReserves(reservesData);
                setExams(examsData);
                widget.renderCourse(course);
            }
        };
    })();

    const search = (function() {

        const params = {
            detUrl: "https://search.wgtn.ac.nz/s/search.json",
            detQ: "query=",
            detData: "collection=wgtn_courses",
            guidesUrl: "./?a=1845872",
            guidesQ: "sub=",
            libUrl: "./?a=1801898",
            libQ: "name=",
            rlUrl: "https://victoria.rl.talis.com/courses/",
            rlQ: "",
            rlData: ".json?cb=?",
            resUrl: "./?a=1786077",
            resQ: "course=",
            resData: {
                searchType: "any,contains",
                tab: "CourseReserves",
                sortby: "rank",
                offset: "0",
                limit: "100"
            },
            examsUrl: "./?a=1785326",
            examsQ: "course=",
            examsData: {
                searchType: "any,contains",
                tab: "couse_exam",
                sortby: "date_d",
                offset: "0",
                limit: "100"
            }
        };

        const searchExams = function(course) {
            const query = course;
            let data = params.examsQ + query
            for (let key in params.examsData) {
                data = data + "&" + key + "=" + params.examsData[key];
            };
            const url = params.examsUrl + "?" + data;

            try {
                return $.getJSON(url);
            } catch (e) {
                return false;
            }
        };

        const searchReserves = function(course) {
            const query = course;
            let data = params.resQ + query
            for (let key in params.resData) {
                data = data + "&" + key + "=" + params.resData[key];
            };
            const url = params.resUrl + "?" + data;

            try {
                return $.getJSON(url);
            } catch (e) {
                return false;
            }
        };

        const searchReadinglist = function(course) {
            const query = course.toLowerCase();
            const data = params.rlQ + query + params.rlData;
            const url = params.rlUrl + data;
            try {
                return $.getJSON(url)
            } catch (e) {
                return false;
            }
        };

        const searchLibrarians = function(guides) {
            let libList = [],
                libs = [];
            guides.forEach(function(guide) {
                let librarian = guide.owner.first_name;
                librarian = librarian.trim();
                if (!libList.includes(librarian)) {
                    libList.push(librarian);
                }
            });
            libList.forEach(function(librarian) {
                let url = "./?a=1801898?name=" + librarian;
                libs.push($.getJSON(url));
            });
            return Promise.all(libs);
        };

        const searchGuides = function(course) {
            const query = course.substring(0, 4);
            const data = params.guidesQ + query;
            const url = params.guidesUrl + "? " + data;
            try {
                return $.getJSON(url);
            } catch (e) {
                return false;
            }
        };

        function searchDetails(course) {
            const query = course;
            const data = params.detQ + query + "&" + params.detData;
            const url = params.detUrl + "?" + data;
            try {
                return $.getJSON(url);
            } catch (e) {
                return false;
            }
        }

        return {
            searchCC: function(course) {
                widget.resetDisplay();
                console.log("starting search");
                const details = searchDetails(course);
                const rlist = searchReadinglist(course);
                const reserves = searchReserves(course);
                const exams = searchExams(course);
                const guides = searchGuides(course);
                let librarians;
                guides.then(function(guidesData) {
                    librarians = searchLibrarians(guidesData);
                    librarians.then(function() {
                        console.log("completed search");
                        const searches = [details, guides, librarians, rlist, reserves, exams];
                        console.log("searches:",searches);
                        Promise.all(searches).then(function(data) {
                            console.log("data:",data);
                            console.log("setting course data");
                            courseObj.setCourse(data);
                        });
                    });
                });
            }
        }

    })();

    return {
        init: function() {
            console.log("initiliasing widget");
            widget.init();
        }
    };
})(jQuery);

$(document).ready(function() {
    console.log("initialising ccSearch");
    (new ccSearch());
});