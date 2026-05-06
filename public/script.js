const form = document.getElementById("uploadForm");
const statusText = document.getElementById("status");

form.addEventListener("submit", async (event) => {
  event.preventDefault();

  const submitButton = form.querySelector("button");
  const formData = new FormData(form);
  const file = formData.get("file");
  const nisn = String(formData.get("nisn") || "").trim();

  if (!/^\d{6,20}$/.test(nisn)) {
    statusText.textContent = "NISN harus berupa angka, minimal 6 digit.";
    return;
  }

  if (!file) {
    statusText.textContent = "Pilih file terlebih dahulu.";
    return;
  }

  const allowedExtensions = [".xls", ".xlsx"];
  const lowerName = file.name.toLowerCase();
  const isAllowed = allowedExtensions.some((ext) => lowerName.endsWith(ext));

  if (!isAllowed) {
    statusText.textContent = "File harus berformat .xls atau .xlsx.";
    return;
  }

  submitButton.disabled = true;
  statusText.textContent = "Mengupload...";

  try {
    const response = await fetch("/api/upload", {
      method: "POST",
      body: formData
    });

    const result = await response.json();

    if (!response.ok) {
      throw new Error(result.message || "Upload gagal.");
    }

    statusText.textContent = "Berhasil upload. File tersimpan di GitHub.";
    form.reset();
  } catch (error) {
    statusText.textContent = error.message;
  } finally {
    submitButton.disabled = false;
  }
});
