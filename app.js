const $ = (id) => document.getElementById(id);
let selectedSize = "صغير";
let currentStep = "";
let stepNo = 1;
let busy = false;

document.querySelectorAll(".size").forEach(btn => btn.addEventListener("click", () => {
  document.querySelectorAll(".size").forEach(x => x.classList.remove("active"));
  btn.classList.add("active");
  selectedSize = btn.dataset.size;
}));

async function callAI(action, extra = {}) {
  if (busy) return;
  busy = true;
  $("notice").textContent = "";
  const buttons = [...document.querySelectorAll("button")];
  buttons.forEach(b => b.disabled = true);
  $("answer").textContent = "🤖 الذكاء الاصطناعي بيفكر...";
  try {
    const response = await fetch("/api/lego", {
      method: "POST", headers: {"Content-Type":"application/json"},
      body: JSON.stringify({
        action, size: selectedSize, idea: $("idea").value.trim(),
        inventory: $("inventory").value.trim(), currentStep, ...extra
      })
    });
    const data = await response.json();
    if (!response.ok) throw new Error(data.error || "تعذر تنفيذ الطلب.");
    $("answer").textContent = data.answer;
    if (action === "start") {
      $("setup").classList.add("hidden");
      $("work").classList.remove("hidden");
      $("projectTitle").textContent = $("idea").value.trim() || "مشروع ليجو جديد";
      stepNo = 1;
    } else if (action === "next") stepNo++;
    $("stepNumber").textContent = stepNo;
    currentStep = data.answer;
  } catch (err) {
    $("answer").textContent = "لم تكتمل العملية.";
    $("notice").textContent = err.message;
  } finally {
    busy = false;
    buttons.forEach(b => b.disabled = false);
  }
}

$("start").addEventListener("click", () => callAI("start"));
$("done").addEventListener("click", () => callAI("next"));
$("piece").addEventListener("click", () => {
  const missingPiece = prompt("اكتب وصف القطعة اللي مش معاك (مثلاً: طوبة 2×4 حمراء):");
  if (missingPiece && missingPiece.trim()) callAI("piece", {currentStep: missingPiece.trim()});
});
$("color").addEventListener("click", async () => {
  const color = prompt("إيه اللون اللي مش معاك؟");
  if (color) await callAI("color", {color});
});
$("explain").addEventListener("click", () => callAI("explain"));
$("review").addEventListener("click", async () => {
  const file = $("photo").files[0];
  if (!file) { $("notice").textContent = "اختار صورة الأول."; return; }
  if (file.size > 7 * 1024 * 1024) { $("notice").textContent = "حجم الصورة كبير. اختار صورة أقل من 7 ميجابايت."; return; }
  const reader = new FileReader();
  reader.onload = () => callAI("photo", {image: reader.result});
  reader.readAsDataURL(file);
});
$("newProject").addEventListener("click", () => {
  currentStep = ""; stepNo = 1;
  $("work").classList.add("hidden"); $("setup").classList.remove("hidden");
  $("answer").textContent = ""; $("photo").value = "";
});
fetch("/api/health").then(r => r.json()).then(data => {
  $("status").textContent = data.aiConfigured ? "● الذكاء الاصطناعي متصل" : "● يحتاج إعداد مفتاح API";
  $("status").className = "status " + (data.aiConfigured ? "ok" : "bad");
}).catch(() => {
  $("status").textContent = "● الخادم غير متصل"; $("status").className = "status bad";
});
