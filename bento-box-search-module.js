const ccSearch = (function($) {
    "use strict";

    let course = {};

    function init() {
        course = { state: "empty" };
        ccSearch.widget.init();
        ccSearch.router.init();
    };

    return {
        init: init
    }
})(jQuery);

ccSearch.search = (function($) {
    "use strict";

    const params = {
        detUrl: "./?a=1849368",
        detQ: "query=",
        detData: "collection=wgtn_courses",
        guidesUrl: "./?a=1845872",
        guidesQ: "sub=",
        libUrl: "./?a=1801898",
        libQ: "name=",
        rlUrl: "./?a=1849382",
        rlQ: "code=",
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

    function searchExams(course) {
        const query = course.toLowerCase();
        let data = params.examsQ + query;
        for (let key in params.examsData) {
            data = data + "&" + key + "=" + params.examsData[key];
        };
        const url = params.examsUrl + "?" + data;

        try {
            return $.ajax({
                url: url,
                timeout: 10000
            })
        } catch (e) {
            return false;
        }
    };

    function searchReserves(course) {
        const query = course.toLowerCase();
        let data = params.resQ + query;
        for (let key in params.resData) {
            data = data + "&" + key + "=" + params.resData[key];
        };
        const url = params.resUrl + "?" + data;

        try {
            return $.ajax({
                url: url,
                timeout: 10000
            })
        } catch (e) {
            return false;
        }
    };

    function searchReadinglist(course) {
        const query = course.toLowerCase();
        const data = params.rlQ + query;
        const url = params.rlUrl + "?" + data;
        try {
            return $.ajax({
                url: url,
                timeout: 10000
            })
        } catch (e) {
            return false;
        }
    };

    function searchLibrarians(guides) {
        let libList = [];
        let libs = [];
        if (guides.length == 0) {
            return Promise.resolve([]);
        } else {
            guides.forEach(function(guide) {
                let librarian = guide.owner.first_name;
                librarian = librarian.trim();
                if (!libList.includes(librarian)) {
                    libList.push(librarian);
                }
            });
            libList.forEach(function(librarian) {
                let url = params.libUrl + "?name=" + librarian;
                libs.push($.ajax({
                    url: url,
                    timeout: 10000
                }));
            });
            return Promise.all(libs);
        }
    };

    function searchGuides(course) {
        const query = course.substring(0, 4);
        const data = params.guidesQ + query;
        const url = params.guidesUrl + "? " + data;
        try {
            return $.ajax({
                url: url,
                timeout: 10000
            })
        } catch (e) {
            return false;
        }
    };

    function searchDetails(course) {
        const query = course.toLowerCase();
        const data = params.detQ + query + "&" + params.detData;
        const url = params.detUrl + "?" + data;
        try {
            return $.ajax({
                url: url,
                timeout: 10000
            })
        } catch (e) {
            return false;
        }
    };

    function searchCC(courseCode, callback) {

        function getData() {

            const searches = [
                details,
                guides,
                librarians,
                rlist,
                reserves,
                exams
            ];
            /*Promise.allSettled(searches).then(function(data) {
                callback(data);
            });*/
            let searchesResults = searches.map(function(p) {
                return p
                    .then(function(value) {
                        return ({
                            status: "fulfilled",
                            value: value
                        })
                    })
                    .catch(function(reason) {
                        return ({
                            status: "rejected",
                            reason: reason
                        })
                    })
            });
            Promise.all(searchesResults).then(function(data) {
                callback(data);
            });
        };
        let details = searchDetails(courseCode);
        const guides = searchGuides(courseCode);
        let librarians;
        const rlist = searchReadinglist(courseCode);
        const reserves = searchReserves(courseCode);
        const exams = searchExams(courseCode);

        guides.always(function(guidesData) {
            guides.then(function(guidesData) {
                librarians = searchLibrarians(guidesData);
                librarians.then(getData());
            }, function() {
                librarians = Promise.resolve([]);
                librarians.then(getData());
            });
        });
    };

    return {
        searchCC: searchCC
    }

})(jQuery);

ccSearch.courseObj = (function($) {
    "use strict";

    let course = {};

    function setExams(data) {
        if (!data.info) {
            course.exams = "error";
        } else if (data.info.total && data.info.total > 0) {
            let items = [];
            data.docs.forEach(function(doc) {
                const item = {};
                item.title = doc.pnx.display.title;
                item.author = doc.pnx.display.creator;
                item.url = doc.delivery.availabilityLinksUrl[0];
                item.date = doc.pnx.display.creationdate;
                item.recordid = doc.pnx.control.sourcerecordid;
                items.push(item);
            });
            course.totalexams = data.info.total;
            course.exams = items;
        } else {
            course.exams = null;
        }
    };

    function setReserves(data) {
        let items = [];
        if (!data.info) {
            course.reserves = "error";
        } else if (data.info.total && data.info.total > 0) {
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
            course.totalres = data.info.total;
            course.reserves = items;
        } else {
            course.reserves = null;
        }
    };

    function setReadingList(data) {
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
    };

    function setLibrarians(data) {
        course.librarians = [];
        data.forEach(function(i) {
            const lib = i[0];
            const librarian = {};
            librarian.photo = "https://www.wgtn.ac.nz/images/staffpics/" + lib.first_name.trim().toLowerCase() + "-" + lib.last_name.trim().toLowerCase() + ".jpg";
            librarian.name = lib.first_name + " " + lib.last_name;
            librarian.title = lib.title;
            librarian.email = lib.email;
            librarian.ophone = lib.Office_Phone;
            librarian.subjectAreas = lib.subject_area;
            librarian.subjects = lib.subjects;
            course.librarians.push(librarian);
        })
    };

    function setGuides(data) {
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
    };

    function setDetails(data) {
        const metaData = data.results[0].metaData;
        course.shortCode = metaData.shortCode;
        course.courseTitle = metaData.courseTitle;
        course.description = metaData.description;
        course.faculty = metaData.faculty;
        course.school = metaData.school;
        course.points = metaData.points;
        course.days = metaData.daysTaught;
        course.trimester = metaData.trimesterTaught;
        course.year = metaData.year;
        course.url = data.results[0].displayUrl;
    };

    function setCourse(data) {
        const detailsData = data[0];
        const guidesData = data[1];
        const librariansData = data[2];
        const rlistData = data[3];
        const reservesData = data[4];
        const examsData = data[5];
        course = {};
        if (detailsData.status == "rejected") {
            course = { state: "error" };
        } else if ("resultsSummary" in detailsData.value) {
            if (detailsData.value.resultsSummary.fullyMatching == 0) {
                course = { state: "no-course" };
            } else if (detailsData.value.resultsSummary.fullyMatching != 0) {
                setDetails(detailsData.value);
                ("value" in guidesData) ? setGuides(guidesData.value): course.guides = "error";
                ("value" in librariansData) ? setLibrarians(librariansData.value): course.librarians = "error";
                ("value" in rlistData) ? setReadingList(rlistData.value): course.rlist = "error";
                ("value" in reservesData) ? setReserves(reservesData.value): course.reserves = "error";
                ("value" in examsData) ? setExams(examsData.value): course.exams = "error";
                course.state = "valid-course";
            } else {
                course = { state: "error" };
            }
        } else {
            course = { state: "error" };
        }
        return course;
    };

    return {
        setCourse: setCourse
    }
})(jQuery);

ccSearch.widget = (function($) {
    "use strict";

    let form, searchCodeField, searchButton, messageBox, ccResults,
        courseResults, guideResults, librarianResults, readingListResults,
        reserveResults, examResults, emptyMessage, errorMessage,
        nocourseMessage, invalidMessage, searching;
    let limits = {};

    function resetDisplay() {
        $(".cc-results-container").children().fadeOut(400);
        setTimeout(function() {
            $(".cc-results-container").empty().append(searching);
            $(searching).fadeIn(400);
        }, 400);
    };

    function renderInvalid() {
        $(".cc-results-container").children().fadeOut(400);
        setTimeout(function() {
            $(".cc-results-container").empty().append(invalidMessage);
            $(invalidMessage).fadeIn();
        }, 400);
    };

    function renderError() {
        $(".cc-results-container").children().fadeOut(400);
        setTimeout(function() {
            $(".cc-results-container").empty().append(errorMessage);
            $(errorMessage).fadeIn();
        }, 400);
    };

    function renderEmpty() {
        $(".cc-results-container").empty().append(emptyMessage);
    };

    function renderNoCourse() {
        $(searching).fadeOut(400)
        setTimeout(function() {
            $(searching).remove();
            $(".cc-results-container").append(nocourseMessage);
            $(nocourseMessage).fadeIn();
        }, 400);
    };

    function scrollToTop(element) {
        $("html, body").animate({
            scrollTop: element.offset().top
        }, 400);
    };

    function init() {
        form = $("#cc-search-form");
        searchCodeField = $("input[name='cc-search']");
        searchButton = $("#search-button");

        emptyMessage = $("<div class='message-box'>" +
            "<div class='message'>" +
            "<p>Search by course code above for:</p>" +
            "<ul>" +
            "<li>subject guides for your course and subject librarian contact information</li>" +
            "<li>link to any Talis reading list set by your course coordinator</li>" +
            "<li>list of physical books available on short-term loan for your course</li>" +
            "<li>list of past exam papers</li>" +
            "</ul>" +
            "</div>" +
            "<div class='message-icon'>" +
            "<svg version='1.1' id='search-folders' aria-hidden='true' xmlns='http://www.w3.org/2000/svg' xmlns:xlink='http://www.w3.org/1999/xlink' x='0px' y='0px' width='205px' height='139px' viewBox='0 0 205 139'>" +
            "<path d='M152.75,38a39,39,0,1,0,39,39A39,39,0,0,0,152.75,38Zm0,63a24,24,0,1,1,24-24A24,24,0,0,1,152.75,101Z' transform='translate(0.16 0.01)'/>" +
            "<path d='M119.85,9.19,46.51,9a4,4,0,0,1-3.2-1.62L39,1.61A4,4,0,0,0,35.83,0h-32a4,4,0,0,0-4,4V95a4,4,0,0,0,4,4h13.5V17a4,4,0,0,1,4-4H64.83A4,4,0,0,1,68,14.61l4.26,5.76A4,4,0,0,0,75.52,22h48.32v-8.8A4,4,0,0,0,119.85,9.19Z' transform='translate(0.16 0.01)'/>" +
            "<path d='M191.89,134.86l-25-26L177.09,99l25,26a3.75,3.75,0,0,1-.16,5.3l-4.78,4.6A3.75,3.75,0,0,1,191.89,134.86Z' transform='translate(0.16 0.01)'/>" +
            "<path d='M148.4,31.61a4,4,0,0,0-3.66-2.42L71.51,29a4,4,0,0,1-3.2-1.63L64,21.61A4,4,0,0,0,60.83,20h-32a4,4,0,0,0-4,4v91a4,4,0,0,0,4,4h13.5l-.47-82a4,4,0,0,1,4-4h43.9A4,4,0,0,1,93,34.68l3.61,5.12a4,4,0,0,0,3.27,1.69h24.61A45.22,45.22,0,0,1,148.4,31.61Z' transform='translate(0.16 0.01)'/>" +
            "<path d='M166.15,120.49A45.49,45.49,0,0,1,116.9,49H96.17A4,4,0,0,1,93,47.38L88.7,41.62A4,4,0,0,0,85.48,40h-32a4,4,0,0,0-4,4v91a4,4,0,0,0,4,4h116a4,4,0,0,0,4-4v-6.85Z' transform='translate(0.16 0.01)'/>" +
            "</svg></div></div>");
        nocourseMessage = $("<div class='message-box'>" +
            "<p id='no-course-message'>No course found matching this code.</p>" +
            "</div>");
        invalidMessage = $("<div class='message-box'>" +
            "<p id='invalid-entry-message'>Invalid course code. Please ensure code is in the form of a four-letter subject code followed by a three-digit number.</p>");
        errorMessage = $("<div class='message-box'>" +
            "<p id='error-message'>Error retrieving course information. Please try again later.</p>");
        searching = $("<div class='searching' style='display: none'>" +
            "<div class='loader text slow'>loading...</div></div>");

        limits = {
            resOffset: 0,
            resInc: 5,
            examsOffset: 0,
            examsInc: 6
        };

        searchButton.on("click", function(e) {
            scrollToTop(form);
            e.preventDefault();
            ccSearch.router.updateUrl(searchCodeField.val());
        });
    };

    function renderCourse(course) {
        let ccResultsHtml = "<div class='cc-results' style='display: none'>";
        ccResultsHtml += "<section class='course-results'></section>";
        ccResultsHtml += "<ul role='tablist' class='tab-controls'>";
        ccResultsHtml += "<li><button role='tab' id='guides-tab' class='content-tab no-icon' role='tab' aria-controls='guidelib-results' aria-selected='true'>Subject guides and librarians</button></li>";
        ccResultsHtml += "<li><button role='tab' id='rlist-tab' class='content-tab no-icon' role='tab' aria-controls='reading-list-results' aria-selected='false'>Reading list</button></li>";
        ccResultsHtml += "<li><button role='tab' id='reserves-tab' class='content-tab no-icon' role='tab' aria-controls='reserve-results' aria-selected='false'>Course reserves</button></li>";
        ccResultsHtml += "<li><button role='tab' id='exams-tab' class='content-tab no-icon' role='tab' aria-controls='exam-results' aria-selected='false'>Past exams</button></li>";
        ccResultsHtml += "</ul>";
        ccResultsHtml += "<div role='tab-panel' aria-labelledby='guides-tab' class='guidelib-results result-box result-box-wrapper active'>";
        ccResultsHtml += "<section class='guide-results'></section>";
        ccResultsHtml += "<section class='librarian-results'></section>";
        ccResultsHtml += "</div>";
        ccResultsHtml += "<section role='tab-panel' aria-labelledby='rlist-tab' class='reading-list-results result-box'></section>";
        ccResultsHtml += "<section role='tab-panel' aria-labelledby='reserves-tab' class='reserve-results result-box'></section>";
        ccResultsHtml += "<section role='tab-panel' aria-labelledby='exams-tab' class='exam-results result-box'></section>";
        ccResultsHtml += "</div>";
        $(".cc-results-container").children().fadeOut(400);
        setTimeout(function() {
            $(".cc-results-container").empty().append(ccResultsHtml);
            ccResults = $(".cc-results");
            courseResults = $(".course-results");
            guideResults = $(".guide-results");
            librarianResults = $(".librarian-results");
            readingListResults = $(".reading-list-results");
            reserveResults = $(".reserve-results");
            examResults = $(".exam-results");
            renderDetails(course);
            renderGuides(course);
            renderLibrarians(course);
            renderReadingList(course);
            renderReserves(course, 1);
            renderExams(course, 1);

            $(".content-tab").on("click", function() {
                if ($(this).attr("aria-selected", "false")) {
                    $(".content-tab").attr("aria-selected", "false");
                    $(this).attr("aria-selected", "true");
                    const s = $(this).attr("aria-controls");
                    $(".result-box").removeClass("active");
                    $("." + s).addClass("active");
                }
            });

            $(ccResults).fadeIn();

        }, 400);
    };

    function renderExams(course, min) {
        let article = "<h3>Past exams</h3>";
        let max = ((min + limits.examsInc) > course.totalexams) ? course.totalexams : min + limits.examsInc - 1;
        let linkToPrimo = "https://tewaharoa.victoria.ac.nz/discovery/search?query=any,contains," + course.shortCode + "&tab=course_exams&search_scope=Exams&sortby=date_d&vid=64VUW_INST:VUWNUI&lang=en&offset=0";

        if (course.exams == "error") {
            let tabID = "#" + $(examResults).attr("aria-labelledby");
            $(tabID).addClass("no-results");
            article += "<p>Past exams could not be retrieved. Please try again later.";
        } else if (course.exams && course.totalexams > 0) {
            article += "<div id='result-nav' class='result-nav'>";
            article += "<div class='number-results'>Displaying ";
            article += (course.totalexams > limits.examsInc) ? min + "–" + max + " of " + course.totalexams + " results</div>" : course.totalexams + " results</div>";
            article += "<div class='primo-link'><a href='" + linkToPrimo + "' target='blank'>View search in Te Waharoa<i class='icon-arrow-right'></i></a></div>";
            article += "</div>"

            article += "<ul>";
            for (let index = min; index <= max; index++) {
                let exam = course.exams[index - 1];
                exam.url = exam.url.replace("exams.victoria.ac.nz", "exams.victoria.ac.nz.helicon.vuw.ac.nz");
                article += "<li>";
                article += "<div class='result-date-author'><span>" + exam.date + "</span>";
                if (exam.author != undefined) {
                    article += ", " + exam.author + "</div>";
                } else {
                    article += " (no author listed)</div>";
                }
                article += "<div class='result-link'><a href='" + exam.url + "' target='_blank'><i class='icon-external'></i>View/open</a>";
                article += "</li>";
            };
            article += "</ul>";
            if (course.totalexams > limits.examsInc) {
                article += "<div class='pagination'>";
                (min > 1) ? article += "<button class='no-icon previous'>Back</button>": article += "<button class='no-icon previous disabled'>Back</button>";
                (max < course.totalexams) ? article += "<button class='no-icon next'>Next</button>": article += "<button class='no-icon next disabled'>Next</button>";
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
            renderExams(course, min + limits.examsInc);
        });
        $(".exam-results button.previous").not(".disabled").on("click", function() {
            renderExams(course, min - limits.examsInc);
        });
    };

    function renderReserves(course, min) {
        let article = "<h3>Course reserves</h3>";
        let max = ((min + limits.resInc) > course.totalres) ?
            course.totalres :
            min + limits.examsInc - 1;
        let linkToPrimo = "https://tewaharoa.victoria.ac.nz/discovery/search?query=any,contains," + course.shortCode + "&offset=0&vid=64VUW_INST:VUWNUI&tab=CourseReserves";
        if (course.reserves == "error") {
            let tabID = "#" + $(reserveResults).attr("aria-labelledby");
            $(tabID).addClass("no-results");
            article += "<p>Course reserves could not be retrieved. Please try again later.";
        } else if (course.reserves && course.totalres > 0) {
            article += "<div id='result-nav' class='result-nav'>";
            article += "<div class='number-results'>Displaying ";
            article += (course.totalres > limits.resInc) ? min + "–" + max + " of " + course.totalres + " results</div>" : course.totalres + " results</div>";
            article += "<div class='primo-link'><a href='" + linkToPrimo + "' target='_blank'>View search in Te Waharoa<i class='icon-arrow-right'></i></a></div>";
            article += "</div>"
            article += "<ul>";
            for (let index = min; index <= max; index++) {
                let item = course.reserves[index - 1];
                article += "<li>";
                article += "<div class='result-title'>" + item.title + "</div>";
                article += (item.author != null) ? "<div class='result-author'>" + item.author + "</div>" : "<div class='result-author'>No author details available</div>";
                if (item.avail != null) article += "<div class= 'result-avail'>" + item.avail + " at " + item.loc;
                article += "<div class='result-callN'>" + item.callN + "</div>";
                if (item.recordid != null) article += "<div class='result-link'><a href='https://tewaharoa.victoria.ac.nz/discovery/fulldisplay?vid=64VUW_INST:VUWNUI&lang=en&search_scope=CourseReserves&tab=CourseResearves&docid=alma" + item.recordid + "' class='TW-link' target='_blank'><i class='icon-external'></i>View record in Te Waharoa</a></div>"
                article += "</li>";
            };
            article += "</ul>";
            if (course.totalres > limits.examsInc) {
                article += "<div class='pagination'>";
                (min > 1) ? article += "<button class='no-icon previous'>Back</button>": article += "<button class='no-icon previous disabled'>Back</button>";
                (max < course.totalres) ? article += "<button class='no-icon next'>Next</button>": article += "<button class='no-icon next disabled'>Next</button>";
                article += "</div>";
            }
        } else {
            let tabID = "#" + $(reserveResults).attr("aria-labelledby");
            $(tabID).addClass("no-results");
            article += "<p>There are no reserves for " + course.shortCode + ".</p>";
        }
        reserveResults.empty();
        reserveResults.append(article);
        $(".reserve-results button.next").not(".disabled").on("click", function() {
            renderReserves(course, min + limits.resInc);
        });
        $(".reserve-results button.previous").not(".disabled").on("click", function() {
            renderReserves(course, min - limits.resInc);
        });
    };

    function renderReadingList(course) {
        let article = "<h3>Reading list</h3>";
        if (course.rlist == "error") {
            let tabID = "#" + $(readingListResults).attr("aria-labelledby");
            $(tabID).addClass("no-results");
            article += "<p>Reading list could not be retrieved. Please try again later.";
        } else if (course.readingList === null) {
            let tabID = "#" + $(readingListResults).attr("aria-labelledby");
            $(tabID).addClass("no-results");
            article += "<p>No Talis reading list set for " + course.shortCode + ". Check Blackboard or with your course coordinator to confirm if there are additional readings.</p>";
        } else {
            article += "<p><a href='" + course.readingList.url + "' target='_blank'><i class='icon-external'></i>Reading list for " + course.shortCode + " on Talis</a> (last updated: " + course.readingList.updated + ")</p>";
        }
        readingListResults.append(article);
    };

    function renderLibrarians(course) {
        let article = "<h3>Subject librarians</h3>";
        if (course.guides == "error" || course.librarians == "error") {
            article += "<p>Subject librarians could not be retrieved. Please try again later.";
            article += "<p><a href='./?a=1774864' target='_blank'>Subject librarians<i class='icon-arrow-right'></i></a></p>";
        } else if (course.librarians.length == 0) {
            article += "<p>No librarians listed for this course.";
            article += "<p><a href='./?a=1774864' target='_blank'>Subject librarians<i class='icon-arrow-right'></i></a></p>";
        } else {
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
                article += "</div>";
                article += "</li>";
            });
            article += "</ul>";
        }
        librarianResults.append(article);
    };

    function renderGuides(course) {
        let article = "<h3>Subject guides</h3>";
        if (course.guides == "error") {
            let tabID = "#" + $(".guidelib-results").attr("aria-labelledby");
            $(tabID).addClass("no-results");
            article += "<p>Subject guides could not be retrieved. Please try again later.";
        } else if (course.guides.length == 0) {
            let tabID = "#" + $(".guidelib-results").attr("aria-labelledby");
            $(tabID).addClass("no-results");
            article += "<p>No subject guides listed for this course.";
        } else {
            article += "<ul class='button-list'>";
            course.guides.forEach(function(i) {
                article += "<li><a href='" + i.url + "' class='button large no-icon flat' target='_blank'><i class='icon-book'></i>" + i.name + "</a></li>";
            });
            article += "</ul>";
        }
        article += "<p><a href='./?a=1774998' target='_blank'>Browse all library guides<i class='icon-arrow-right'></i></a></p>";
        guideResults.empty();
        guideResults.append(article);
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
    };

    function updateSearchField(code) {
        searchCodeField.val(code);
    };

    function buttonState(newState) {
        if (newState == "off") {
            $(searchButton).prop("disabled", true);
        } else {
            $(searchButton).prop("disabled", false);
        }
    };

    function updateView(course) {
        const view = ({
            "valid-course": renderCourse,
            "no-course": renderNoCourse,
            "invalid": renderInvalid,
            "empty": renderEmpty,
            "error": renderError
        })[course.state](course);
        return view;
    };

    return {
        init: init,
        updateView: updateView,
        updateSearchField: updateSearchField,
        resetDisplay: resetDisplay,
        buttonState: buttonState
    };

})(jQuery);

ccSearch.router = (function($) {
    "use strict";

    let pageUrl, path, queryString;
    let urlQuery = {};
    let courseCode;

    function checkCourse(queryCode) {
        let ccCheck;
        const cChck = new RegExp(/([A-Za-z]{4}[0-9]{3})/g);
        courseCode = queryCode.replace(/[\s\+]/g, "");
        ccCheck = cChck.exec(courseCode);
        if (ccCheck != null) {
            courseCode = ccCheck[0];
            courseCode = courseCode.toUpperCase();
            ccSearch.widget.updateSearchField(courseCode);
            return courseCode;
        } else {
            return null;
        }
    };

    function getAllUrlParams(queryString) {
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
    };

    function checkUrl() {
        let searchCode;
        pageUrl = window.location.href;
        path = pageUrl.split("?")[0];
        queryString = pageUrl.split("?")[1] || null;
        queryString == null ? urlQuery = {} : urlQuery = getAllUrlParams(queryString);

        if ("course-code" in urlQuery) {
            courseCode = decodeURIComponent(urlQuery["course-code"]);
            searchCode = checkCourse(courseCode);
            if (searchCode != null) {
                ccSearch.widget.resetDisplay();
                ccSearch.widget.buttonState("off");
                ccSearch.search.searchCC(searchCode, function(courseData) {
                    ccSearch.course = ccSearch.courseObj.setCourse(courseData);
                    ccSearch.widget.buttonState("on");
                    ccSearch.widget.updateView(ccSearch.course);
                });
            } else {
                ccSearch.course = { state: "invalid" };
                ccSearch.widget.updateView(ccSearch.course);
            }
        } else {
            ccSearch.course = { state: "empty" };
            ccSearch.widget.updateView(ccSearch.course);
        }
        return courseCode;

    };

    function updateUrl(code) {
        let state = {};
        let title = "";
        let newUrl;

        pageUrl = window.location.href;
        path = pageUrl.split("?")[0];
        queryString = pageUrl.split("?")[1] || null;
        if (queryString != null) {
            urlQuery = getAllUrlParams(queryString);
        }

        urlQuery["course-code"] = code.toLowerCase();
        queryString = Object.keys(urlQuery).map(function(key) {
            return key + '=' + urlQuery[key];
        }).join('&');
        newUrl = path + "?" + queryString;
        history.pushState(state, title, newUrl);
        checkUrl();
    };

    function init() {
        pageUrl = null;
        path = null;
        queryString = null;
        urlQuery = {};
        courseCode = null;
        window.addEventListener('popstate', function() {
            checkUrl();
        });
        checkUrl();
    };

    return {
        init: init,
        updateUrl: updateUrl
    };

})(jQuery);

$(document).ready(function() {
    ccSearch.init();
});