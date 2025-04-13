
  function toggleDropdown() {
    const menu = document.getElementById("dropdown-menu");
    menu.style.display = (menu.style.display === "flex") ? "none" : "flex";
  }

  // Optional: Hide dropdown when clicking outside
  document.addEventListener("click", function (e) {
    const dropdown = document.getElementById("dropdown-menu");
    const trigger = document.querySelector(".user-dropdown");
    if (!trigger.contains(e.target)) {
      dropdown.style.display = "none";
    }
  });
