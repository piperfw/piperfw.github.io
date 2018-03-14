// Modal 1
// Get the modal
var modal = document.getElementById('modal1');
// Get the image and insert it inside the modal
var img = document.getElementById('img_Frank_Wilczek_07');
var modalImg = document.getElementById("img01");
img.onclick = function(){
    modal.style.display = "block";
    modalImg.src = this.src;
}
// span containing a familiar cross for user to close the modal
var span1 = document.getElementById("span1"); //Had Element's' here and everything broke!
// When the user clicks on <span> (x), close the modal
span1.onclick = function() { 
  modal.style.display = "none";
}
// Also close if user clicks anywhere!
modal.onclick = function() { 
  modal.style.display = "none";
}

// Modal 2 functionality - identical to Modal 1
var modal2 = document.getElementById("modal2");
var modalImg2 = document.getElementById("modal_img2");
document.getElementById("img_fig2").onclick = function() {
	modal2.style.display = "block";
    modalImg2.src = this.src;
}
document.getElementById("span2").onclick = function() {
	modal2.style.display = "none";
}
document.getElementById("modal2").onclick = function() {
	modal2.style.display = "none";
}

// Modal 3 functionality
var modal3 = document.getElementById("modal3");
var modalImg3 = document.getElementById("modal_img3");
document.getElementById("img_fig3").onclick = function() {
	modal3.style.display = "block";
    modalImg3.src = this.src;
}
document.getElementById("span3").onclick = function() {
	modal3.style.display = "none";
}
modal3.onclick = function() {
	modal3.style.display = "none";
}