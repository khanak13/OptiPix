import formidable from "formidable";
import fs from "fs";
import sharp from "sharp";

export const config = {
  api: {
    bodyParser: false,
  },
};

export default function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method Not Allowed" });
  }

  const form = formidable({ multiples: false });

  form.parse(req, async (err, fields, files) => {
    if (err) {
      return res.status(500).json({ error: "Error parsing form data" });
    }

    const file = files.file;
    const width = Number(fields.width);
    const height = Number(fields.height);
    const quality = Number(fields.quality);

    const buffer = fs.readFileSync(file.filepath);
    const originalSize = buffer.length;

    try {
      const resultBuffer = await sharp(buffer)
        .resize({
          width: width,
          height: height,
          fit: "inside",          // ✅ no cropping
          withoutEnlargement: true
        })
        .jpeg({ quality })
        .toBuffer();

      const newSize = resultBuffer.length;

      res.setHeader("x-metrics", JSON.stringify({ originalSize, newSize }));
      res.status(200).send(resultBuffer);

    } catch (error) {
      console.log(error);
      res.status(500).json({ error: "Image processing failed." });
    }
  });
}
