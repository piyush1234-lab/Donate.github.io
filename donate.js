/*=====================================
        MOBILE HEARTS
=====================================*/

const hearts = document.querySelector(".hearts");

for(let i=0;i<18;i++){

let heart=document.createElement("div");

heart.className="heart";

heart.innerHTML="❤";

heart.style.left=Math.random()*100+"vw";

heart.style.fontSize=(12+Math.random()*18)+"px";

heart.style.animationDuration=(8+Math.random()*8)+"s";

heart.style.animationDelay=(Math.random()*5)+"s";

hearts.appendChild(heart);

}

/*=====================================
        BACK BUTTON
=====================================*/

document.querySelector(".back-btn").onclick=()=>{

history.back();

};

/*=====================================
        LOAD CAMPAIGN
=====================================*/

const campaigns=
JSON.parse(localStorage.getItem("myCampaigns"))||[];

const selected=
localStorage.getItem("selectedCampaign");

if(selected!==null && campaigns[selected]){

const campaign=campaigns[selected];

document.getElementById("campaignName").textContent=
campaign.giftName || "Gift";

document.getElementById("campaignReceiver").textContent=
"For "+campaign.receiverName+" ❤️";

document.getElementById("campaignImage").src=
campaign.image || "images/default.jpg";

}

/*=====================================
        DONATION AMOUNT
=====================================*/

let selectedAmount=0;

const amountBtns=
document.querySelectorAll(".amount-btn");

amountBtns.forEach(btn=>{

btn.onclick=()=>{

amountBtns.forEach(b=>b.classList.remove("active"));

btn.classList.add("active");

selectedAmount=
parseInt(btn.innerText.replace("₹",""));

document.getElementById("customAmount").value="";

};

});

document.getElementById("customAmount")
.addEventListener("input",()=>{

amountBtns.forEach(b=>b.classList.remove("active"));

selectedAmount=
Number(document.getElementById("customAmount").value);

});

/*=====================================
        COPY UPI
=====================================*/

document.getElementById("copyUpi").onclick=()=>{

const upi=
document.getElementById("upiId");

navigator.clipboard.writeText(upi.value);

const btn=
document.getElementById("copyUpi");

btn.innerHTML="✅ Copied";

setTimeout(()=>{

btn.innerHTML="📋 Copy";

},2000);

};

/*=====================================
        DONATION SUBMIT
=====================================*/

document.getElementById("submitDonation")
.onclick=()=>{

const name=
document.getElementById("donorName").value.trim();

const email=
document.getElementById("donorEmail").value.trim();

const message=
document.getElementById("donorMessage").value.trim();

const anonymous=
document.getElementById("anonymous").checked;

const paid=
document.getElementById("paymentDone").checked;

if(selectedAmount<=0){

alert("Please select donation amount.");

return;

}

if(name===""){

alert("Enter your name.");

return;

}

if(email===""){

alert("Enter your email.");

return;

}

if(!paid){

alert("Please confirm payment.");

return;

}

/* Temporary Donation ID */

const donationId=
"GBD"+
Date.now().toString().slice(-8);

/* Save Temporary */

const donations=
JSON.parse(localStorage.getItem("donations"))||[];

donations.push({

id:donationId,

campaign:selected,

amount:selectedAmount,

name,

email,

message,

anonymous,

status:"Pending",

date:new Date().toLocaleString()

});

localStorage.setItem(

"donations",

JSON.stringify(donations)

);

/* Show Success */

document.querySelector(".payment-box").style.display="none";

document.getElementById("submitDonation").style.display="none";

document.querySelector(".payment-check").style.display="none";

document.getElementById("successCard")
.classList.remove("hidden");

document.getElementById("donationId")
.innerText=donationId;

};

/*=====================================
        RETURN
=====================================*/

document.getElementById("backCampaign")
.onclick=()=>{

history.back();

};


document.getElementById("goDashboard").onclick = () => {

window.location.href = "dashboard(combined).html";

};