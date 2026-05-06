export const config = {
  api: {
    bodyParser: false
  }
};

function sanitizeName(value) {
  return String(value || "")
    .trim()
    .replace(/[^a-zA-Z0-9_-]/g, "_")
    .replace(/_+/g, "_")
    .slice(0, 60);
}

async function readMultipartForm(req) {
  const chunks = [];
  for await (const chunk of req) {
    chunks.push(chunk);
  }

  const buffer = Buffer.concat(chunks);
  const contentType = req.headers["content-type"] || "";
  const boundaryMatch = contentType.match(/boundary=(.+)$/);

  if (!boundaryMatch) {
    throw new Error("Form upload tidak valid.");
  }

  const boundary = "--" + boundaryMatch[1];
  const parts = buffer.toString("binary").split(boundary).slice(1, -1);
  const fields = {};
  let uploadedFile = null;

  for (const part of parts) {
    const [rawHeaders, rawBody] = part.split("\r\n\r\n");
    if (!rawHeaders || !rawBody) continue;

    const nameMatch = rawHeaders.match(/name="([^"]+)"/);
    if (!nameMatch) continue;

    const fieldName = nameMatch[1];
    let bodyBinary = rawBody;

    if (bodyBinary.endsWith("\r\n")) {
      bodyBinary = bodyBinary.slice(0, -2);
    }

    const filenameMatch = rawHeaders.match(/filename="([^"]*)"/);

    if (filenameMatch && filenameMatch[1]) {
      uploadedFile = {
        fieldName,
        filename: filenameMatch[1],
        buffer: Buffer.from(bodyBinary, "binary")
      };
    } else {
      fields[fieldName] = Buffer.from(bodyBinary, "binary").toString("utf8");
    }
  }

  return { fields, file: uploadedFile };
}

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ message: "Method tidak diizinkan." });
  }

  try {
    const {
      GITHUB_TOKEN,
      GITHUB_OWNER,
      GITHUB_REPO,
      GITHUB_BRANCH = "main",
      UPLOAD_CODE = ""
    } = process.env;

    if (!GITHUB_TOKEN || !GITHUB_OWNER || !GITHUB_REPO) {
      return res.status(500).json({
        message: "Environment variable GitHub belum lengkap."
      });
    }

    const { fields, file } = await readMultipartForm(req);

    if (UPLOAD_CODE && fields.kode !== UPLOAD_CODE) {
      return res.status(403).json({ message: "Kode upload salah." });
    }

    if (!file) {
      return res.status(400).json({ message: "File belum dipilih." });
    }

    const originalName = file.filename.toLowerCase();
    const isXls = originalName.endsWith(".xls");
    const isXlsx = originalName.endsWith(".xlsx");

    if (!isXls && !isXlsx) {
      return res.status(400).json({
        message: "Hanya file .xls dan .xlsx yang diperbolehkan."
      });
    }

    const maxSizeMb = 10;
    if (file.buffer.length > maxSizeMb * 1024 * 1024) {
      return res.status(400).json({
        message: `Ukuran file maksimal ${maxSizeMb} MB.`
      });
    }

    const allowedClasses = [
      "X KULINER 1",
      "X KULINER 2",
      "X KULINER 3",
      "X DPB 1",
      "X DPB 2",
      "X DPB 3"
    ];

    if (!allowedClasses.includes(fields.kelas)) {
      return res.status(400).json({ message: "Kelas tidak valid." });
    }

    const nisnRaw = String(fields.nisn || "").trim();

    if (!/^\d{6,20}$/.test(nisnRaw)) {
      return res.status(400).json({
        message: "NISN harus berupa angka, minimal 6 digit."
      });
    }

    const nama = sanitizeName(fields.nama);
    const nisn = sanitizeName(nisnRaw);
    const kelas = sanitizeName(fields.kelas);
    const mapel = sanitizeName(fields.mapel);
    const ext = isXlsx ? "xlsx" : "xls";
    const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
    const path = `uploads/${kelas || "tanpa_kelas"}/${nisn}_${nama || "siswa"}_${mapel || "tugas"}_${timestamp}.${ext}`;

    const githubUrl = `https://api.github.com/repos/${GITHUB_OWNER}/${GITHUB_REPO}/contents/${path}`;

    const githubResponse = await fetch(githubUrl, {
      method: "PUT",
      headers: {
        Authorization: `Bearer ${GITHUB_TOKEN}`,
        Accept: "application/vnd.github+json",
        "X-GitHub-Api-Version": "2022-11-28",
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        message: `Upload tugas ${nama || "siswa"} - ${nisn} - ${mapel || "tugas"}`,
        content: file.buffer.toString("base64"),
        branch: GITHUB_BRANCH
      })
    });

    const githubData = await githubResponse.json();

    if (!githubResponse.ok) {
      return res.status(500).json({
        message: githubData.message || "Gagal menyimpan ke GitHub."
      });
    }

    return res.status(200).json({
      message: "Upload berhasil.",
      path,
      url: githubData.content?.html_url
    });
  } catch (error) {
    return res.status(500).json({
      message: error.message || "Terjadi kesalahan server."
    });
  }
}
