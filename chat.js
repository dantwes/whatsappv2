(function () {
  var btn = document.getElementById("waChatBtn");
  var panel = document.getElementById("waPanel");
  var closeBtn = document.getElementById("waClose");
  var form = document.getElementById("waForm");
  var input = document.getElementById("waInput");
  var messages = document.getElementById("waMessages");

  var history = []; // memoria: {role: "user"|"assistant", content: "..."}

  var GREETING = "¡Hola! Soy el asistente de La Barbería. Puedo darte precios, horarios o agendar un turno. ¿En qué te ayudo?";

  function addMsg(text, who) {
    var div = document.createElement("div");
    div.className = "wa-msg " + who;
    div.textContent = text;
    messages.appendChild(div);
    messages.scrollTop = messages.scrollHeight;
  }

  function addTyping() {
    var typing = document.createElement("div");
    typing.className = "wa-msg bot typing";
    typing.innerHTML = "<span></span><span></span><span></span>";
    messages.appendChild(typing);
    messages.scrollTop = messages.scrollHeight;
    return typing;
  }

  btn.addEventListener("click", function () {
    panel.classList.toggle("open");
  });

  closeBtn.addEventListener("click", function () {
    panel.classList.remove("open");
  });

  form.addEventListener("submit", function (e) {
    e.preventDefault();
    var text = input.value.trim();
    if (!text) return;

    addMsg(text, "user");
    history.push({ role: "user", content: text });
    input.value = "";
    var typing = addTyping();

    fetch("/api/chat", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ message: text, history: history.slice(-10) })
    })
      .then(function (res) {
        if (!res.ok) throw new Error("HTTP " + res.status);
        return res.json();
      })
      .then(function (data) {
        typing.remove();
        var reply = data.reply || "Perdón, no pude responder. ¿Quieres ver precios o agendar un turno?";
        addMsg(reply, "bot");
        history.push({ role: "assistant", content: reply });
      })
      .catch(function () {
        typing.remove();
        addMsg("Error de conexión. Inténtalo de nuevo en unos segundos.", "bot");
      });
  });

  addMsg(GREETING, "bot");
  history.push({ role: "assistant", content: GREETING });
})();
