import { formJson, fetchData } from "./global.js";

$("#login").on("submit", async function (event) {
  event.preventDefault();
  const data = formJson(this);
  console.log("Form data:", data);

  const response = await fetchData("/oauth/v1/login", data);
  console.log("Response status:", response.status);
  console.log("Response body:", response.body);
  console.log(response.body.errors);
  if (response.status === 422) {
    response.body.errors.forEach((error) => {
      if (error.path === "email") {
        $("#email-error").text(error.msg);
      } else if (error.path === "password") {
        $("#password-error").text(error.msg);
      }
    });
    setTimeout(() => {
      $("#email-error").text("");
      $("#password-error").text("");
    }, 2000);
    return;
  }
  if (response.status === 401) {
    console.log("Unauthorized error:", response.body.error);
    $("#unauthorized-error").text(response.body.error);
    setTimeout(() => {
      $("#unauthorized-error").text("");
    }, 2000);
    return;
  }

  if (response.status === 200) {
    console.log("Login successful, redirecting...");
    window.location.href = response.body.redirect;
    return;
  }
});
