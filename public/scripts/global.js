console.log("Login script loaded");

export function formJson(formElement) {
  const formData = new FormData(formElement);
  const data = Object.fromEntries(formData.entries());

  return data;
}

export async function fetchData(url, data) {
  try {
    const response = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      credentials: "include", // CRÍTICO: incluir cookies en las peticiones
      body: JSON.stringify(data),
    });
    let json;
    try {
      json = await response.json();
    } catch {
      json = {};
    }
    return {
      ok: response.ok,
      status: response.status,
      body: json,
    };
  } catch (error) {
    console.error("Fetch error:", error);
    return {
      ok: false,
      status: 0,
      body: { error: "Fetch error" },
    };
  }
}
