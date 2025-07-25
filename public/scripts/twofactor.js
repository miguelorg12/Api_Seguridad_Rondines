import { formJson, fetchData } from "./global.js";
$(document).ready(function () {
  const $inputs = $(".ts-input");
  const $resendTimerDisplay = $(".ts-p4 span");
  const $resendTextElement = $(".ts-p4");
  const $resendLinkElement = $(".ts-p3"); // "¿No has recibido el código?"
  const $verifyButton = $(".ts-btn");

  let countdownInterval;
  const initialTime = 59; // Segundos

  /**
   * Inicia o reinicia la cuenta regresiva para reenviar el código.
   */
  function startCountdown() {
    let timeLeft = initialTime;
    $resendTimerDisplay.text(`00:${timeLeft < 10 ? "0" : ""}${timeLeft}`);
    $resendTextElement.css({
      color: "#1e2a38", // Color normal durante la cuenta regresiva
      cursor: "default",
      "text-decoration": "none",
    });
    $resendLinkElement.css({
      "pointer-events": "none", // Deshabilita el enlace de "No has recibido?"
      cursor: "default",
      "text-decoration": "none",
    });

    if (countdownInterval) {
      clearInterval(countdownInterval);
    }

    countdownInterval = setInterval(() => {
      timeLeft--;
      if (timeLeft >= 0) {
        $resendTimerDisplay.text(`00:${timeLeft < 10 ? "0" : ""}${timeLeft}`);
      } else {
        clearInterval(countdownInterval);
        $resendTextElement.text("Reenviar código");
        $resendTextElement.css({
          color: "#007bff", // Cambia a color de enlace
          cursor: "pointer",
          "text-decoration": "underline",
        });
        $resendLinkElement.css({
          "pointer-events": "auto", // Habilita el enlace
          cursor: "pointer",
          "text-decoration": "underline",
        });
      }
    }, 1000);
  }

  /**
   * Maneja el input de los dígitos del código.
   * Mueve el foco al siguiente/anterior input y limita a un solo dígito.
   */
  $inputs.on("input", function (e) {
    const $this = $(this);
    const index = $inputs.index($this);

    // Limitar a un solo dígito numérico
    let value = $this.val();
    $this.val(value.replace(/[^0-9]/g, "").slice(0, 1));

    if ($this.val() && index < $inputs.length - 1) {
      $inputs.eq(index + 1).focus();
    }
    // Si es el último input y tiene valor, enfocar el botón de verificar
    if (index === $inputs.length - 1 && $this.val()) {
      $verifyButton.focus();
    }
  });

  $inputs.on("keydown", function (e) {
    const $this = $(this);
    const index = $inputs.index($this);
    if (e.key === "Backspace" && $this.val() === "" && index > 0) {
      $inputs.eq(index - 1).focus();
    }
  });

  // Asegurarse de que solo haya un dígito pegado si se pega un valor más largo
  $inputs.on("paste", function (e) {
    e.preventDefault(); // Evita el pegado predeterminado
    const pasteData = e.originalEvent.clipboardData.getData("text").trim(); // Acceder a clipboardData

    if (pasteData.length === $inputs.length && /^\d+$/.test(pasteData)) {
      // Si el pegado es un código completo de 6 dígitos
      pasteData.split("").forEach((char, i) => {
        if ($inputs.eq(i).length) {
          // Verifica si el elemento existe
          $inputs.eq(i).val(char);
        }
      });
      $inputs.eq($inputs.length - 1).focus(); // Enfoca el último input
      $verifyButton.focus(); // Enfoca el botón de verificar
    } else if (pasteData.length > 0) {
      // Si se pega un solo carácter o un conjunto no válido, solo toma el primero
      const $this = $(this);
      const index = $inputs.index($this);

      $this.val(pasteData.replace(/[^0-9]/g, "").slice(0, 1));

      if ($this.val() && index < $inputs.length - 1) {
        $inputs.eq(index + 1).focus();
      } else if (index === $inputs.length - 1 && $this.val()) {
        $verifyButton.focus();
      }
    }
  });

  /**
   * Maneja el clic en "Reenviar código"
   */
  $resendTextElement.on("click", function () {
    // Solo si la cuenta regresiva ha terminado
    if ($resendTextElement.text() === "Reenviar código") {
      // Aquí puedes añadir la lógica para reenviar el código (por ejemplo, una llamada AJAX)
      console.log("Solicitando reenvío de código...");
      // Una vez que se solicita el reenvío, se reinicia la cuenta regresiva
      startCountdown();
      // Limpiar los inputs después de reenviar el código
      $inputs.val("");
      $inputs.eq(0).focus(); // Poner el foco en el primer input
    }
  });

  /**
   * Maneja el clic en el botón "Verificar".
   */
  $verifyButton.on("click", async function () {
    const code = $inputs
      .map(function () {
        return $(this).val();
      })
      .get()
      .join("");

    if (code.length === $inputs.length && /^\d+$/.test(code)) {
      console.log("Código introducido:", code);
      const data = { code };
      const response = await fetchData("/oauth/v1/2fa/confirm", data);
      console.log("Response status:", response.status);
      if (response.status === 422) {
        response.body.errors.forEach((error) => {
          if (error.path === "code") {
            $("#code-error").text(error.msg);
          }
        });
        setTimeout(() => {
          $("#code-error").text("");
        }, 2000);
      }
      if (response.status === 200) {
        console.log("Código verificado, redirigiendo...");
        window.location.href = response.body.redirect;
      }
      if (response.status === 401) {
        console.log("Error de autorización:", response.body.error);
        $("#unauthorized-error").text(response.body.error);
        setTimeout(() => {
          $("#unauthorized-error").text("");
        }, 2000);
      }
    } else {
      $inputs.eq(0).focus(); // Regresar el foco al primer input para corrección
    }
  });

  // Iniciar la cuenta regresiva cuando la página carga
  startCountdown();
});
