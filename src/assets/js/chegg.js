// Removes "do you want to register this device?" popup
setTimeout(() => {
  const str = "cs-dm-add";
  document.getElementById(str).remove();
  document.documentElement.classList.remove(str);
  document.getElementsByTagName("body")[0].classList.remove(str);
}, 200);
