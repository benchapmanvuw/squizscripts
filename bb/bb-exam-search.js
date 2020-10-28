let examSearch;
examSearch = examSearch || {};

(function() {

    examSearch.Search = function() {
        "use strict";
        this.init();
    };

    examSearch.Search.prototype = {
        resultsBox: null,
        searching: `<p class="searching loader text slow" style="">searching...</p>`,
        urlQuery: null,
        searchQuery: null,
        resList: [],
        api: "./?a=1785326",
        start: 1,
        range: 6,
        end: 6,
        heading: Object.assign(document.createElement("h3"),{innerHTML: "Past exam papers"}),
        showHeading: false,
        intro: Object.assign(document.createElement("p"),{innerHTML: `Past exam papers for your course are available for viewing online.`}),
        showIntro: true,
        error: false,

        sendHeight: function(trigger) {
            //Tell iframe host how tall to make iframe
            if (parent.postMessage) {
                const height = document.getElementById("bb-results-container").offsetHeight;
                parent.postMessage({"examheight": height, "trigger": trigger}, "*");
            }
        },

        bindButtons: function() {
            //Add click functionality to prev and next buttons if not disabled
            const backBtn = document.querySelector(".previous:not(.disabled)");
            if (backBtn) {
                backBtn.onclick = () => {
                    this.start -= this.range;
                    this.end = this.start + this.range - 1;
                    this.render(this.resList);
                };
            }
            const nextBtn = document.querySelector(".next:not(.disabled)");
            if (nextBtn) {
                nextBtn.onclick = () => {
                    this.start += this.range;
                    (this.end + this.range < this.resList.length) ? this.end += this.range : this.end = this.resList.length;
                    this.render(this.resList);
                };
            }
        },

        fadeInResults: function(results){
            const fadeOutAn = () => {
                this.resultsBox.style.opacity -= 0.04;
                if (this.resultsBox.style.opacity <= 0) {
                    this.resultsBox.style.opacity = 0;
                    window.cancelAnimationFrame(request);
                    fadeIn();
                }
            };
            
            const fadeOut = () => {
                request = window.requestAnimationFrame(fadeOut);
                fadeOutAn();
            }
              
            const fadeIn = () => {
                this.resultsBox.innerHTML = "";
                if (this.showHeading) {this.resultsBox.appendChild(this.heading);}
                if (this.showIntro && !this.error) {this.resultsBox.appendChild(this.intro);}
                this.resultsBox.appendChild(results);
                this.resultsBox.style.opacity = 1;
                this.bindButtons();
                this.sendHeight("render");
                window.onresize = () => {this.sendHeight("resize")};
            };

            //Ensure box has opacity value set
            this.resultsBox.style.opacity = 1;
            fadeOut();
        },

        renderError: function(e) {
            const message = document.createElement("div");
            if (e ==="empty") {
                message.innerHTML = "<p>The library does not hold copies of any past exams for your course.</p>";
            } else {
                message.innerHTML = "<p>Sorry, your search could not be completed. Please try again later.</p>";
            }
            this.fadeInResults(message);
        },

        createLinkToPrimo: function() {
            const message = `<span><a href="https://tewaharoa.victoria.ac.nz/discovery/search?query=any,contains,${this.searchQuery}&tab=course_exams&search_scope=Exams&sortby=date_d&vid=64VUW_INST:VUWNUI&lang=en&offset=0" target="_blank"><i class="icon-external"></i>View search in Te Waharoa</a></span>`;
            return message;
        },
        
        renderPagination: function(results) {
            //Only add pagination buttons if there are more items than can fit on one page
            if (this.resList.length > this.range) {
                const pagination = document.createElement("div");
                pagination.classList.add("pagination");
                let back, next;
                (this.start > 1) ? back = "<button class='no-icon previous'>Back</button>" : back = "<button class='no-icon previous disabled'>Back</button>";
                (this.end < this.resList.length) ? next = "<button class='no-icon next'>Next</button>": next = "<button class='no-icon next disabled'>Next</button>";
                pagination.innerHTML = back + next;
                results.appendChild(pagination);
            }
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

        renderList: function(list) {
            for (let i = this.start-1; i < this.end; i++ ){
                const item = this.resList[i];
                const li = document.createElement("li");
                const itemTitle = document.createElement("div");
                itemTitle.classList.add("result-title");
                itemTitle.innerHTML = `<span>${item.date}</span>, ${item.author}`;
                li.appendChild(itemTitle);
                const itemAuthor = document.createElement("div");
                const itemLinks = document.createElement("div");
                itemLinks.classList.add("result-links");
                item.url = item.url.replace("exams.victoria.ac.nz", "exams.victoria.ac.nz.helicon.vuw.ac.nz");
                itemLinks.innerHTML = `<a href="${item.url}" target="_blank"><i class="icon-external"></i>View/open</a></div>`;
                li.appendChild(itemLinks);
                list.appendChild(li);
            };
        },

        render: function() {
            if (this.resList) {
                const total = this.resList.length;
                if (total > 0) {
                    const results = document.createElement("div");
                    results.classList.add("results");
                    const resultsDets = document.createElement("div");
                    resultsDets.id = "results-details";
                    resultsDets.classList.add("results-details");
                    const primoLink = this.createLinkToPrimo();
                    resultsDets.innerHTML = `<div class="number-results">
                            Displaying ${this.start}–${this.end} of ${total}
                        </div>
                        <div class="primo-link">
                            ${primoLink}
                        </div>`;
                    results.appendChild(resultsDets);
                    const ul = document.createElement("ul");
                    ul.classList.add("result-list");
                    this.renderList(ul);
                    results.appendChild(ul);
                    this.renderPagination(results);
                    this.fadeInResults(results);
                } else {
                    this.error = true;
                    this.renderError("empty");
                }
            } else {
                this.error = true;
                this.renderError("fail");
            }
        },

        processData: function(data) {
            // Fill resList with results
            let items = [];
            if (!data.info) {
                this.resList = [];
            } else if (data.info.total && data.info.total > 0) {
                data.docs.forEach(function(doc) {
                    const item = {};
                    item.title = doc.pnx.display.title;
                    item.author = doc.pnx.display.creator;
                    item.url = doc.delivery.availabilityLinksUrl[0];
                    item.date = doc.pnx.display.creationdate;
                    item.recordid = doc.pnx.control.sourcerecordid;
                    items.push(item);
                });
                this.resList = items;
            } else {
                this.resList = [];
            }
        },

        sendQuery: function(subjects) {
            const url = `${this.api}?course=${this.searchQuery}&offset=0&limit=99`;
            fetch(url)
                .then(resp => resp.json())
                .then(data => {
                    this.processData(data);
                    this.render();
            });
        },

        trimBBCode: function(bbCode) {
            // Get course code, e.g. LIBR101, from Blackboard code, e.g. 202001.LIBR101.1000000
            const bbRegex = new RegExp(/.*\.(.*)\..*/);
            const courseCode = bbRegex.exec(bbCode);
            return courseCode[1];
        },

        init: function() {
            this.resultsBox = document.querySelector(".result-box");
            const pageUrl = window.location.href;
            const urlQuery = this.getAllUrlParams(pageUrl);
            this.showHeading = urlQuery["heading"] === "show";
            this.showIntro = !(urlQuery["intro"] === "hide");
            this.searchQuery = this.trimBBCode(decodeURIComponent(urlQuery["course"]));
            this.sendQuery();
        }
    }

    document.addEventListener('DOMContentLoaded', (event) => {
        (new examSearch.Search());
    });

})();