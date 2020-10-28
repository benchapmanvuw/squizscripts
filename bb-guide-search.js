let glSearch;
glSearch = glSearch || {};

(function() {

    glSearch.Search = function() {
        "use strict";
        this.init();
    };

    glSearch.Search.prototype = {
        resultsBox: null,
        searching: `<p class="searching loader text slow" style="">searching...</p>`,
        urlQuery: null,
        searchQuery: null,
        subs: [],
        resList: [],
        subapi: "./?a=1879252",
        libapi: "./?a=1801898",
        subject: null,
        start: 1,
        range: 6,
        end: 6,
        heading: Object.assign(document.createElement("h3"),{innerHTML: "Subject guides and librarians"}),
        showHeading: false,
        intro: Object.assign(document.createElement("p"),{innerHTML: `Subject guides provide information on online resources and advice useful for your study and research. You can also contact your subject librarian directly for personal in-depth help with your research.`}),
        showIntro: true,
        error: false,

        sendHeight: function(trigger) {
            //Tell iframe host how tall to make iframe
            if (parent.postMessage) {
                const height = document.getElementById("bb-results-container").offsetHeight;
                parent.postMessage({"glheight": height, "trigger": trigger}, "*");
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
                message.innerHTML = "<p>Sorry, no subject guides could be found for your course.</p>";
            } else {
                message.innerHTML = "<p>Sorry, your search could not be completed. Please try again later.</p>";
            }
            this.fadeInResults(message);
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

        renderLibList: function(list) {
            for (let i = this.start-1; i < this.end; i++ ){
                const item = this.dbList[i];
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

        renderGuiList: function(list) {
            for (let i = this.start-1; i < this.end; i++ ){
                const item = this.dbList[i];
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
            if (this.resList.guides.length != 0) {
                const results = document.createElement("div");
                results.classList.add("results");
                
                let guideArt = document.createElement("section");
                guideArt.classList.add("guides");
                let guideHead = document.createElement("h3");
                guideHead.innerHTML = "Subject guides";
                guideArt.appendChild(guideHead);
                let guideul = document.createElement("ul");
                guideul.classList.add("result-list");
                this.resList.guides.forEach(guide => {
                    let li = document.createElement("li");
                    let link = `<a href="${guide.url}" class="button large no-icon flat" target="_blank"><i class="icon-book"></i>${guide.subject}</a>`;
                    li.innerHTML = link;
                    guideul.appendChild(li);
                });
                guideArt.appendChild(guideul);
                results.appendChild(guideArt);

                const libArt = document.createElement("section");
                libArt.classList.add("librarians");
                let libHead = document.createElement("h3");
                libHead.innerHTML = "Subject librarians";
                libArt.appendChild(libHead);
                let libul = document.createElement("ul");
                libul.classList.add("result-list");
                this.resList.libs.forEach(lib => {
                    let li = document.createElement("li");
                    li.innerHTML = `<img class="profile-picture" src="${lib.photo}" alt="${lib.name} profile-picture photograph">
                        <section class="librarian-details">
                            <h4>${lib.name}</h4>
                            <!-- Quick contact info -->
                            <ul class="meta">
                                <li class="highlight">
                                    <a href="mailto:${lib.email}" title="Send an email to${lib.name}">
                                        <i class="icon-mail"></i>${lib.email}
                                    </a>
                                </li>${(lib.ophone) ? `<li class="highlight">
                                    <a href="tel:${lib.ophone} title="Call ${lib.name} work phone">
                                        <i class="icon-phone"></i>${lib.ophone}
                                    </a>
                                </li>` : ""}
                            </ul>
                            <p class="librarian-subjects"><strong>Subjects:</strong> ${lib.subjects.map(subject => subject.name).join(", ")}</p>`
                    libul.appendChild(li);
                });
                libArt.appendChild(libul);
                results.appendChild(libArt);
                this.fadeInResults(results);      
            } else {
                this.error = true;
                this.renderError("empty");
            }
        },

        processData: function(subData,libsData) {
            this.resList.guides = [];
            if (subData) {
                this.resList.guides = subData;
            }
            if (libsData) {
                this.resList.libs = [];
                libsData.forEach(libArray => {
                    lib = libArray[0];
                    const librarian = {};
                    librarian.photo = `https://www.wgtn.ac.nz/images/staffpics/${lib.first_name.trim().toLowerCase()}-${lib.last_name.trim().toLowerCase()}.jpg`;
                    librarian.name = `${lib.first_name.trim()} ${lib.last_name.trim()}`;
                    librarian.email = lib.email;
                    librarian.ophone = lib.Office_Phone;
                    librarian.subjectAreas = lib.subject_area;
                    librarian.subjects = lib.subjects;
                    // Only add if not already in list
                    if (this.resList.libs.length === 0 || !this.resList.libs.map(lib => lib.name).includes(librarian.name)) {
                        this.resList.libs.push(librarian);
                    }
                });
            }
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
                const url = `${this.libapi}?name=${s.lib}`;
                urls.push(url);
            });
            Promise.all(urls.map(url => fetch(url)))
                .then(resp => Promise.all(resp.map(r => r.json())))
                .then(libs => {
                    this.processData(subjects,libs);
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
        (new glSearch.Search());
    });

})()