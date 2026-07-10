// === 何志勇 官方網站 custom.js ===

function scrollToSection(id) {
  var target = document.getElementById(id);
  if (target) target.scrollIntoView({ behavior: "smooth" });
  var mobileMenu = document.getElementById("mobileMenu");
  var menuBtn = document.getElementById("menuBtn");
  if (mobileMenu) mobileMenu.classList.remove("open");
  if (menuBtn) menuBtn.setAttribute("aria-expanded", "false");
}

document.addEventListener("click", function(event) {
  var scrollTarget = event.target.closest("[data-scroll]");
  if (scrollTarget) {
    scrollToSection(scrollTarget.dataset.scroll);
  }

  var policyHead = event.target.closest(".policy-head");
  if (policyHead) {
    var row = policyHead.closest(".policy-row");
    var body = row.querySelector(".policy-body");
    var toggle = row.querySelector(".policy-toggle");
    var isOpen = row.classList.contains("open");

    document.querySelectorAll(".policy-row").forEach(function(item) {
      item.classList.remove("open");
      var itemBody = item.querySelector(".policy-body");
      var itemHead = item.querySelector(".policy-head");
      var itemToggle = item.querySelector(".policy-toggle");
      if (itemBody) itemBody.style.maxHeight = "0px";
      if (itemHead) itemHead.setAttribute("aria-expanded", "false");
      if (itemToggle) itemToggle.textContent = "展開 ▼";
    });

    if (!isOpen) {
      row.classList.add("open");
      if (body) body.style.maxHeight = body.scrollHeight + "px";
      if (policyHead) policyHead.setAttribute("aria-expanded", "true");
      if (toggle) toggle.textContent = "收合 ▲";
    }
  }
});

var menuBtn = document.getElementById("menuBtn");
var mobileMenu = document.getElementById("mobileMenu");
if (menuBtn && mobileMenu) {
  menuBtn.addEventListener("click", function() {
    var open = mobileMenu.classList.toggle("open");
    menuBtn.setAttribute("aria-expanded", String(open));
  });
}

var nav = document.getElementById("topNav");
window.addEventListener("scroll", function() {
  if (nav) nav.classList.toggle("scrolled", window.scrollY > 60);
});

var observer = new IntersectionObserver(function(entries) {
  entries.forEach(function(entry) {
    if (entry.isIntersecting) {
      entry.target.classList.add("visible");
    }
  });
}, { threshold: 0.08 });

document.querySelectorAll(".fade-in").forEach(function(el) {
  observer.observe(el);
});

// === Photo Carousel ===
document.addEventListener("click", function(e) {
  var slide = e.target.closest(".carousel-slide");
  if (!slide) return;
  var track = slide.closest(".carousel-track");
  var slides = track.querySelectorAll(".carousel-slide");
  for (var i = 0; i < slides.length; i++) slides[i].classList.remove("active");
  slide.classList.add("active");
  _centerSlide(track);
});

function _centerSlide(track) {
  var box = track.closest(".photo-carousel");
  if (!box) return;
  var active = track.querySelector(".carousel-slide.active");
  if (!active) return;
  var off = box.offsetWidth / 2 - active.offsetLeft - active.offsetWidth / 2;
  track.style.transform = "translateX(" + off + "px)";
}

function _initCarousels() {
  var t = document.querySelectorAll(".carousel-track");
  for (var i = 0; i < t.length; i++) _centerSlide(t[i]);
}

window.addEventListener("load", _initCarousels);
window.addEventListener("resize", function() {
  clearTimeout(window._crT);
  window._crT = setTimeout(_initCarousels, 150);
});

// === Copy Button ===
document.addEventListener("click", function(e) {
  var btn = e.target.closest(".copy-btn");
  if (!btn) return;
  var text = btn.getAttribute("data-copy");
  if (!text) return;
  if (navigator.clipboard) {
    navigator.clipboard.writeText(text).then(function() {
      var orig = btn.textContent;
      btn.textContent = "✅ 已複製！";
      setTimeout(function() { btn.textContent = orig; }, 1800);
    });
  } else {
    var ta = document.createElement("textarea");
    ta.value = text;
    ta.style.position = "fixed";
    ta.style.opacity = "0";
    document.body.appendChild(ta);
    ta.select();
    document.execCommand("copy");
    document.body.removeChild(ta);
    var orig = btn.textContent;
    btn.textContent = "✅ 已複製！";
    setTimeout(function() { btn.textContent = orig; }, 1800);
  }
});
