import { formJson, fetchData } from "./global.js";

$("#authorize-form-confirm").on("submit", async function (event) {
  event.preventDefault();
  const data = formJson(this);
  console.log(data);
  // Detecta si fue approve o deny
  data.action = document.activeElement.value;

  const response = await fetchData("/oauth/v1/authorize/confirm", data);
  if (response.status === 200 && response.body.success) {
    window.location.href = response.body.redirect;
    return;
  }
});
