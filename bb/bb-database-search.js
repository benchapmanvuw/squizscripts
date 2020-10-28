let dbSearch;
dbSearch = dbSearch || {};

(function() {

    dbSearch.Search = function() {
        "use strict";
        this.init();
    };

    dbSearch.Search.prototype = {
        resultsBox: null,
        searching: `<p class="searching loader text slow" style="">searching...</p>`,
        urlQuery: null,
        searchQuery: null,
        subs: [],
        resList: [],
        subapi: "./?a=1879252",
        dbapi: "./?a=1791159",
        tab: "jsearch_slot",
        sort: "title",
        q: "contains,dbcategory,",
        subject: null,
        start: 1,
        range: 6,
        end: 6,
        heading: Object.assign(document.createElement("h3"),{innerHTML: "Databases"}),
        showHeading: false,
        intro: Object.assign(document.createElement("p"),{innerHTML: `Below are listed databases and other online resources that are relevant to the subject fields of your course.`}),
        showIntro: true,
        error: false,

        sendHeight: function(trigger) {
            //Tell iframe host how tall to make iframe
            if (parent.postMessage) {
                const height = document.getElementById("bb-results-container").offsetHeight;
                parent.postMessage({"dbheight": height, "trigger": trigger}, "*");
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
                message.innerHTML = "<p>Sorry, no databases could be found related to your course.</p>";
            } else {
                message.innerHTML = "<p>Sorry, your search could not be completed. Please try again later.</p>";
            }
            this.fadeInResults(message);
        },

        createLinkToPrimo: function() {
            if (this.subs && this.subs.length > 0) {
                const links = this.subs.map(sub => `<li><a href="https://tewaharoa.victoria.ac.nz/discovery/dbsearch?query=${this.q}&tab=${this.tab}&sortby=${this.sort}&search_scope=MyInst_and_CI&vid=64VUW_INST:VUWNUI&databases=category,${sub.subCat.replace(/&/g,"")}─${sub.subject}" target="_blank"><i class='icon-external'></i>${sub.subject}</a></li>`)
                    .join(" ");
                const message = `<span>View search in Te Waharoa:</span>
                    <ul class="tw-links-list">
                        ${links}
                    </ul>`;
                return message;
            }
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
                const linkTitle = document.createElement("div");
                linkTitle.classList.add("result-title");
                linkTitle.innerHTML = `${item.title}`;
                li.appendChild(linkTitle);
                const resLinks = document.createElement("div");
                resLinks.classList.add("result-links");
                resLinks.innerHTML = `<a href="${item.link}" target="_blank" class="view-open"><i class="icon-external"></i>Go to database</a> <a href="${item.twlink}" target="_blank" class="view-open"><i class="icon-external"></i>View record in Te Waharoa</a>`;
                li.appendChild(resLinks);
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
                    const subjects = this.subs.map(i => i.subject).join(", ");
                    const primoLink = this.createLinkToPrimo();
                    resultsDets.innerHTML = `<div class="result-subjects">
                            <strong>Subject:</strong> ${subjects}
                        </div>
                        <div class="number-results">
                            Displaying ${this.start}–${this.end} of ${total}
                        </div>
                        <div class="primo-link">
                            ${primoLink}
                        </div>`;
                    resultsDets.textContent.replace(/&amp;/g,"&");
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
            // Fill resList with all the results, combined and alphabetised
            data.forEach(subResults => this.resList.push(subResults.results));
            this.resList = this.resList.flat();
            this.resList = this.resList.filter((item, index, self) =>
                // Remove duplicates
                index === self.findIndex((alt) => (
                    alt.title === item.title
                ))
            )
            this.resList.sort((a,b) =>
                a.title.localeCompare(b.title));
        },

        getSub: function() {
            // Request all subjects associated with course code from subject guides
            fetch(this.subapi + "?sub=" + this.searchQuery)
                .then(response => response.json())
                .then(subs => {
                    this.subs = subs;
                    this.sendQuery(subs);
                });
        },

        sendQuery: function(subjects) {
            const urls = [];
            subjects.forEach(s => {
                const cleanCat = s.subCat.replace(/&/,"");
                const url = `${this.dbapi}?tab=${this.tab}&q=${this.q}&sort=${this.sort}&offset=0&limit=99&databases=category,${cleanCat}─${s.subject}`;
                urls.push(url);
            });
            Promise.all(urls.map(url => fetch(url)))
                .then(resp => Promise.all(resp.map(r => r.json())))
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
            this.getSub();
        }
    }

    document.addEventListener('DOMContentLoaded', (event) => {
        (new dbSearch.Search());
    });

})();