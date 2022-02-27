// Globals
const BODY = document.getElementsByTagName("body")[0];

// Settings and Courses Buttons
let settingsOpen = false;
function backdropButtonHandler(name) {
  document
    .getElementsByClassName(name + "-button")[0]
    .addEventListener("click", () => {
      document.getElementById(name).classList.toggle("hidden");
      settingsOpen = !settingsOpen;
    });

  document.getElementById(name).addEventListener("click", (e) => {
    if (e.target.classList.contains("backdrop")) {
      document.getElementById(name).classList.add("hidden");
      settingsOpen = false;
    }
  });

  document.getElementById("close-" + name).addEventListener("click", () => {
    document.getElementById(name).classList.add("hidden");
    settingsOpen = false;
  });
}

backdropButtonHandler("settings");
backdropButtonHandler("courses");

// Switch Inputs
const switches = document.getElementsByClassName("switch");
Array.from(switches).forEach((element) =>
  element.addEventListener("click", () => {
    element.setAttribute(
      "data-checked",
      element.getAttribute("data-checked") == "true" ? "false" : "true"
    );
  })
);

// Text Inputs
const inputs = document.getElementsByClassName("reset");
Array.from(inputs).forEach((element) => {
  element.addEventListener("click", () => {
    const input = element.parentElement.getElementsByTagName("input")[0];
    input.value = "";
    input.dispatchEvent(new Event("change"));
  });
});

// Tasks View Handler
BODY.addEventListener("mousewheel", (e) => {
  if (!settingsOpen) {
    if (e.wheelDelta > 0) {
      document.getElementById("links").classList.remove("hidden");
      document.getElementById("tasks").classList.add("hidden");
    } else {
      document.getElementById("links").classList.add("hidden");
      document.getElementById("tasks").classList.remove("hidden");
    }
  }
});

// Theme Toggle
document.getElementById("theme-toggle").addEventListener("click", () => {
  const html = document.getElementsByTagName("html")[0];
  html.classList.toggle("dark");
  chrome.storage.sync.set({ darkMode: html.classList.contains("dark") });
});

chrome.storage.sync.get(["darkMode"], (result) => {
  if (!result.darkMode) {
    document.getElementsByTagName("html")[0].classList.remove("dark");
    document.getElementById("theme-toggle").setAttribute("data-checked", true);
  }
});

// Highlight Colour Select
const highlightColors = [
  "#4A91FC",
  "#44B061",
  "#C172CE",
  "#EB5C50",
  "#3F4B8A",
  "#E0824E",
];

chrome.storage.sync.get(["highlightColor"], (result) => {
  const setSelected = (element, color) => {
    document
      .getElementById("highlight-select")
      .querySelectorAll("div")
      .forEach((e) => e.classList.remove("selected"));
    element.classList.add("selected");
    document.documentElement.style.setProperty("--theme-accent", color);
    document.documentElement.style.setProperty("--theme-highlight", color);
  };

  const index = highlightColors.indexOf(result.highlightColor);
  highlightColors.forEach((c, i) => {
    const div = document.createElement("div");
    div.style.backgroundColor = c;
    div.setAttribute("data-color", c);
    div.onclick = () => {
      chrome.storage.sync.set({ highlightColor: c });
      setSelected(div, c);
    };

    if (index == -1 && i == 0) setSelected(div, c);
    else if (index == i) setSelected(div, c);

    document.getElementById("highlight-select").append(div);
  });
});

// Custom Wallpaper
chrome.storage.sync.get(["customWallpaper"], (result) => {
  document.getElementById("wallpaper-input").value = result.customWallpaper;
  BODY.style.backgroundImage = `url("${
    result.customWallpaper ?? "assets/img/default.jpg"
  }")`;
});

document.getElementById("wallpaper-input").addEventListener("change", (e) => {
  const value = e.target.value == "" ? null : e.target.value;
  chrome.storage.sync.set({
    customWallpaper: value,
  });
  BODY.style.backgroundImage = `url("${value ?? "assets/img/default.jpg"}")`;
});

// Quick Access Manager
const runQuickAccess = (links) => {
  links.forEach((u, i) => {
    if (i == 0) window.location.replace(u);
    else window.open(u);
  });
};

let doubleTabPress = false;
let quickAccessData = [];
document.addEventListener("keydown", (e) => {
  if (e.key == "Tab") {
    e.preventDefault();
    e.stopPropagation();
    if (doubleTabPress) runQuickAccess(quickAccessData);
    else {
      doubleTabPress = true;
      setTimeout(() => (doubleTabPress = false), 500);
    }
  } else doubleTabPress = false;
});

chrome.storage.sync.get(["quickAccess"], (result) => {
  document.getElementById("quick-access-input").value =
    result.quickAccess.join(", ");
  quickAccessData = result.quickAccess;
});

document
  .getElementById("quick-access-input")
  .addEventListener("change", (e) => {
    const data = e.target.value.replace(" ", "").split(",");
    chrome.storage.sync.set({
      quickAccess: data,
    });
  });

// Canvas URL
chrome.storage.sync.get(["canvasURL"], (result) => {
  document.getElementById("url-input").value = result.canvasURL ?? "";
  document.getElementById("canvas-link").setAttribute("href", result.canvasURL);
  document
    .getElementById("canvas-courses-link")
    .setAttribute("href", `${result.canvasURL}/courses`);
});

document.getElementById("url-input").addEventListener("change", (e) => {
  chrome.storage.sync.set({
    canvasURL: e.target.value,
  });
  document.getElementById("canvas-link").setAttribute("href", e.target.value);
  document
    .getElementById("canvas-courses-link")
    .setAttribute("href", `${e.target.value}/courses`);
});

// Canvas Dark Mode
document.getElementById("canvas-theme-toggle").addEventListener("click", (e) => {
  chrome.storage.sync.set({ canvasDarkMode: e.target.getAttribute("data-checked") == "true" });
});

chrome.storage.sync.get(["canvasDarkMode"], (result) => {
  if (result.canvasDarkMode) {
    document.getElementById("canvas-theme-toggle").setAttribute("data-checked", true);
  }
});

// Canvas API
let TOKEN = null;
let URL = null;
chrome.storage.sync.get(["canvasToken", "canvasURL"], (result) => {
  document.getElementById("token-input").value = result.canvasToken ?? "";
  if (result.canvasToken?.length > 0 && result.canvasURL?.length > 0) {
    TOKEN = result.canvasToken;
    URL = result.canvasURL;
    fetch(
      `${URL}/api/v1/users/self/favorites/courses?access_token=${TOKEN}&per_page=100`
    )
      .then((response) => response.json())
      .then((data) =>
        data.forEach((d) =>
          document.getElementsByClassName("courses")[0].insertAdjacentHTML(
            "beforeend",
            `<a href="${URL}/courses/${d.id}">
              <div class="item">${d.name}</div>
            </a>`
          )
        )
      );
    fetchTasks(TOKEN);
  }
});

document.getElementById("token-input").addEventListener("change", (e) => {
  chrome.storage.sync.set({
    canvasToken: e.target.value,
  });
});

// Tasks Manager
const updateDateTitle = (d) => {
  const now = new Date();
  now.setHours(0, 0, 0, 0);

  const dayTitle = () => {
    const days = [
      "Sunday",
      "Monday",
      "Tuesday",
      "Wednesday",
      "Thursday",
      "Friday",
      "Saturday",
    ];
    if (d.getTime() == now.getTime()) return "Today";
    else if (d.getTime() == now.getTime() + 86400000) return "Tomorrow";
    else if (d.getTime() == now.getTime() - 86400000) return "Yesterday";
    else return days[d.getDay()];
  };

  function ordinalNumber(n) {
    return (
      n +
      (n > 0
        ? ["th", "st", "nd", "rd"][(n > 3 && n < 21) || n % 10 > 3 ? 0 : n % 10]
        : "")
    );
  }

  const dateTitle = () => {
    const months = [
      "January",
      "February",
      "March",
      "April",
      "May",
      "June",
      "July",
      "August",
      "September",
      "October",
      "November",
      "December",
    ];
    return `${ordinalNumber(d.getDate())} ${
      months[d.getMonth()]
    } ${d.getFullYear()}`;
  };

  document.querySelectorAll(".date > h1")[0].innerHTML = dayTitle();
  document.querySelectorAll(".date > h2")[0].innerHTML = dateTitle();
};

let date = new Date();
date.setHours(0, 0, 0, 0);
updateDateTitle(date);

document.getElementById("left-button").addEventListener("click", () => {
  date = new Date(date.getTime() - 86400000);
  updateDateTitle(date);
  fetchTasks();
});

document.getElementById("right-button").addEventListener("click", () => {
  date = new Date(date.getTime() + 86400000);
  updateDateTitle(date);
  if (TOKEN != null) fetchTasks(TOKEN);
});

function fetchTasks() {
  function formatDate(date) {
    var d = new Date(date),
      month = "" + (d.getMonth() + 1),
      day = "" + d.getDate(),
      year = d.getFullYear();

    if (month.length < 2) month = "0" + month;
    if (day.length < 2) day = "0" + day;

    return [year, month, day].join("-");
  }
  fetch(
    `${URL}/api/v1/planner/items?access_token=${TOKEN}&start_date=${formatDate(
      date
    )}&end_date=${formatDate(new Date(date.getTime() + 86400000))}`
  )
    .then((response) => response.json())
    .then((data) => data.filter((t) => t.plannable_type == "assignment"))
    .then((data) => {
      document.getElementById("task-data").innerHTML = "";
      if (data.length == 0)
        document.getElementById("empty").style.display = "block";
      else {
        document.getElementById("empty").style.display = "none";
        data.forEach((t) =>
          document.getElementById("task-data").insertAdjacentHTML(
            "beforeend",
            `<div class="task">
              <div class="task-info">
                <div data-plannable="${
                  t?.planner_override?.id ?? ""
                }" data-id="${t.plannable_id}"
                class="mark ${
                  t?.planner_override?.marked_complete ? "checked" : ""
                }">
                  <svg viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                    <path
                      d="M9.00002 16.2L4.80002 12L3.40002 13.4L9.00002 19L21 6.99998L19.6 5.59998L9.00002 16.2Z"
                      fill="currentColor"
                    />
                  </svg>
                </div>
                <div class="text">
                  <h2>${t.context_name}</h2>
                  <a href="${URL}/courses/${t.course_id}/assignments/${
              t.plannable_id
            }"><h1>${t.plannable.title}</h1></a>
                </div>
              </div>
            </div>`
          )
        );
      }
    });
}

document.addEventListener("click", (e) => {
  if (
    e.target.classList.contains("mark") ||
    e.target.parentElement.classList.contains("mark")
  ) {
    const mark = e.target.classList.contains("mark")
      ? e.target
      : e.target.parentElement;

    if (mark.getAttribute("data-plannable")?.length > 0) {
      fetch(
        `${URL}/api/v1/planner/overrides/${mark.getAttribute(
          "data-plannable"
        )}`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${TOKEN}`,
          },
          body: JSON.stringify({
            marked_complete: !mark.classList.contains("checked"),
          }),
        }
      ).then(() => mark.classList.toggle("checked"));
    } else {
      fetch(`${URL}/api/v1/planner/overrides`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${TOKEN}`,
        },
        body: JSON.stringify({
          plannable_type: "assignment",
          marked_complete: "true",
          plannable_id: mark.getAttribute("data-id"),
        }),
      }).then(() => mark.classList.toggle("checked"));
    }
  }
});
