// ==UserScript==
// @name         KiitConnect Unlocker
// @namespace    https://www.kiitconnect.com/
// @version      2.2
// @license      MIT
// @description  Free as in beer.
// @author       erucix
// @match        https://www.kiitconnect.com/*
// @icon         https://www.google.com/s2/favicons?sz=64&domain=kiitconnect.com
// @downloadURL https://update.greasyfork.org/scripts/494079/KiitConnect%20Unlocker.user.js
// @updateURL https://update.greasyfork.org/scripts/494079/KiitConnect%20Unlocker.meta.js
// ==/UserScript==

(function () {
  "use strict";
  // TODO: Make it false in production build or else code won't worlk.

  let devModeFlag = true;

  // If you find this flag as true please make it false.

  // It is only for dev for debugging purpose and won't give you any
  // super powers

  window.onload = function () {
    if (devModeFlag) {
      console.clear();
      console.log("[+] Unlocker Initiated.");
    }

    // Removes a node and replaces with its clone and helps in removing all event listeners.
    function remove(node) {
      node.classList.remove("text-yellow-500", "cursor-not-allowed");
      let cursorNotAllowedList = [
        ...node.querySelectorAll(".cursor-not-allowed"),
      ];

      cursorNotAllowedList.forEach((element) => {
        element.classList.add("text-cyan-500");
        element.classList.remove("text-yellow-500", "cursor-not-allowed");
      });

      if (node.innerText == "Not Available") {
        node.classList.add("whitespace-nowrap", "font-bold", "text-gray-400");
      } else {
        node.classList.add("text-cyan-500");
      }

      var clonedNode = node.cloneNode(true);
      node.parentNode.replaceChild(clonedNode, node);
    }

    // Its a single paged application so continuously check for change in URL instead of onload.
    setInterval(function () {
      // Check if the script has already been loaded for given semester.
      if (!document.head.classList.contains(location.pathname)) {
        // Clear all the previous class list.
        document.head.classList = "";

        // Add a class value indicating the script has been loaded for this semester.
        document.head.classList.add(location.pathname);

        let docRequired; // Type of document required. Can be: notes, pyqs
        let branchName; // Name of choosen branch. Can be: cse, csse, csce, it
        let semesterId; // Semester representation in number. Can be any between 1 to 6

        let finalPath = location.pathname;

        // Assign values only if we have sufficient information in URL.

        if (
          finalPath.includes("/academic/PYQS") &&
          finalPath != "/academic/PYQS"
        ) {
          finalPath = finalPath.substring(finalPath.lastIndexOf("/") + 1);
          finalPath = finalPath.split("-");

          docRequired = location.search.substring(
            location.search.lastIndexOf("=") + 1
          );
          branchName = finalPath[1].toLowerCase();
          semesterId = Number(finalPath[2]);

          // Fetching original source code so that we could get pdf links
          try {
            fetch(location.href)
              .then((data) => data.text())
              .then((data) => {
                console.log(data);

                // Making some adjustments to successfully parse it as JSON
                // Last issue was we replaced " with " because of data.replaceAll(`\"`, ``);
                // nice rookie mistake

                data = data.replaceAll(`\\"`, `"`);
                data = data.replaceAll(`\\n`, ``);

                data = data.substring(
                  data.lastIndexOf(`self.__next_f.push([1,"1e:`) + 26,
                  data.lastIndexOf(`"])</script`)
                );

                data = JSON.parse(data);

                console.log(data);

                data = data[3].children[3].data.semesters[0].subjects;

                let finalRefined = data;

                if (devModeFlag) {
                  console.log(finalRefined);
                }

                if (docRequired == "pyqs") {
                  // Sort the list according to year
                  finalRefined.forEach((element) => {
                    element.pyqs.sort((a, b) => {
                      return Number(a.year) - Number(b.year);
                    });
                  });

                  if (devModeFlag) {
                    console.log(finalRefined);
                  }

                  let containerTables = document.querySelectorAll("table");

                  // Used for storing loaded table indexes. SO don't touch the table
                  // again later.
                  let storedIndexArray = [];

                  containerTables.forEach((element) => {
                    let tableRowItems = [...element.querySelectorAll("tr")];

                    // Since the first 'tr' is table header

                    tableRowItems.shift();

                    // Find a table such that the [numbers of paper we have] = [number of rows in table]
                    // This reduces hassle of creating a new table

                    let index = 0;

                    for (let i = 0; i < finalRefined.length; i++) {
                      //           Here we dont touch the loaded table
                      if (
                        finalRefined[i].pyqs.length == tableRowItems.length &&
                        !storedIndexArray.includes(i)
                      ) {
                        index = i;
                        storedIndexArray.push(i);
                        break;
                      }
                    }

                    let choosenSubject = finalRefined[index].pyqs;

                    // Overwrite the 'td' values by our better sorted list
                    tableRowItems.forEach((item, index1) => {
                      let tdList = item.querySelectorAll("td");

                      tdList[0].innerText = choosenSubject[index1].year;
                      tdList[1].innerText = choosenSubject[index1].type;

                      let anchor1 = tdList[2].querySelector("a");
                      anchor1.innerText = choosenSubject[index1].name;
                      anchor1.href =
                        "https://drive.google.com/file/d/" +
                        choosenSubject[index1].Question;

                      // Replace the anchor
                      remove(anchor1);

                      let anchor2 = tdList[3].querySelector("a");

                      if (choosenSubject[index1].solution != null) {
                        if (anchor2 == null) {
                          anchor2 = document.createElement("a");
                          anchor2.target = "_blank";

                          tdList[3].innerText = "";
                          tdList[3].appendChild(anchor2);
                        }

                        anchor2.innerText = "Solution";
                        anchor2.href =
                          "https://drive.google.com/file/d/" +
                          choosenSubject[index1].solution;
                      } else {
                        if (anchor2 != null) {
                          anchor2.innerHTML = "Not Available";
                        }
                      }

                      if (anchor2 != null) {
                        remove(anchor2);
                      }
                    });
                  });
                } else if (docRequired == "notes") {
                  let subjectNoteContainer = [
                    ...document
                      .querySelector("main")
                      .querySelector("div")
                      .querySelector("div").childNodes,
                  ];

                  // Since first one is unwanted jargon div.
                  subjectNoteContainer.shift();

                  // Store manipulated div that should not be re-touched.

                  let storedIndexArray = [];

                  subjectNoteContainer.forEach((element) => {
                    let allHeadings = [...element.querySelectorAll("h1")];

                    let index = 0;

                    for (let i = 0; i < finalRefined.length; i++) {
                      if (
                        finalRefined[i].notes.length == allHeadings.length &&
                        !storedIndexArray.includes(i)
                      ) {
                        index = i;
                        storedIndexArray.push(i);
                        break;
                      }
                    }

                    let currentSubject = finalRefined[index].notes;

                    allHeadings.forEach((element, index1) => {
                      element.parentElement.parentElement.href =
                        "https://drive.google.com/file/d/" +
                        currentSubject[index1].Notes;
                      element.innerText = currentSubject[index1].name;

                      remove(element.parentElement.parentElement);
                    });
                  });
                }
              });
          } catch (e) {
            console.log(e);
          }
        }

        // Remove all get premium buttons from site.
        setTimeout(function () {
          let premiumButtons = document.querySelectorAll(
            "a[href='/premiuminfo']"
          );
          premiumButtons.forEach((item) => item.remove());
        }, 1000);
      }
    }, 500);
  };
})();
