for (var i = 0; i < document.querySelectorAll(".arrow").length; i++) {
  document.querySelectorAll(".arrow")[i].addEventListener("click", (e)=>{
 let arrowParent = e.target.parentElement.parentElement;
 arrowParent.classList.toggle("showMenu");
  });
}
console.log(document.querySelector(".logo"));
document.querySelector(".logo").addEventListener("click", ()=>{
  document.querySelector(".sidebar").classList.toggle("close");
});