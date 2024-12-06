import { GoogleGenerativeAI, HarmBlockThreshold, HarmCategory } from "@google/generative-ai";
import MarkdownIt from 'markdown-it';

let API_KEY = 'AIzaSyA5pN8XuDRSsX-PfWWxuGdD91KzGsHWx3I'; // Ganti dengan API key Anda.
let video = document.querySelector('video');
let canvas = document.querySelector('canvas');
let captureButton = document.getElementById('capture');
let output = document.querySelector('.output');

// Inisialisasi Kamera
async function initializeCamera() {
  try {
    const stream = await navigator.mediaDevices.getUserMedia({ video: true });
    video.srcObject = stream;
  } catch (e) {
    output.textContent = 'Gagal mengakses kamera. Mohon periksa izin.';
    console.error(e);
  }
}

captureButton.onclick = () => {
  let context = canvas.getContext('2d');
  canvas.width = video.videoWidth;
  canvas.height = video.videoHeight;

  // Gambar frame dari video ke canvas
  context.drawImage(video, 0, 0, canvas.width, canvas.height);

  // Konversi ke base64
  let imageBase64 = canvas.toDataURL('image/jpeg').split(',')[1];

  // Validasi Base64
  if (!imageBase64 || imageBase64.length === 0) {
    output.textContent = 'Gagal menangkap gambar. Mohon coba lagi.';
    return;
  }

  // Mulai analisis
  analyzeImage(imageBase64);
};

async function analyzeImage(imageBase64) {
  output.textContent = 'Sedang menganalisis...';

  try {
    const analisisPrompt = 
      "Analisis hanya tingkat kekotoran sepatu dalam gambar ini. " +
      "Berikan nilai tingkat kekotoran dari skala 1-10: jika 1, maka kotornya sedikit. jika 10, maka sangat kotor. " +
      "Tolong jelaskan secara spesifik seperti: Upper berapa persen kotornya, Midsole berapa persen kotornya, Outsole berapa persen kotornya. " +
      "Berdasarkan kondisi tersebut, rekomendasikan salah satu dari layanan berikut: **Standar Treatment** (IDR 50.000): Untuk kotoran ringan seperti debu atau lumpur. " +
      "**Extra Treatment** (IDR 60.000-100.000): Untuk noda membandel, bahan khusus seperti suede atau kulit, atau masalah jamur dan bau. " +
      "**Express Treatment** (IDR 65.000): Untuk pembersihan cepat, terbatas pada pembersihan standar. " +
      "**Unyellowing Treatment** (IDR 75.000): Untuk mengembalikan warna putih pada sepatu yang menguning.";

    let contents = [
      {
        role: 'user',
        parts: [
          { inline_data: { mime_type: 'image/jpeg', data: imageBase64 } },
          { text: analisisPrompt }
        ]
      }
    ];

    const genAI = new GoogleGenerativeAI(API_KEY);
    const model = genAI.getGenerativeModel({
      model: "gemini-1.5-flash",
      safetySettings: [
        {
          category: HarmCategory.HARM_CATEGORY_HARASSMENT,
          threshold: HarmBlockThreshold.BLOCK_ONLY_HIGH,
        },
      ],
    });

    const result = await model.generateContentStream({ contents });

    let buffer = [];
    let md = new MarkdownIt();
    for await (let response of result.stream) {
      buffer.push(response.text());
      output.innerHTML = md.render(buffer.join(''));
    }
  } catch (e) {
    output.innerHTML = `Terjadi kesalahan: ${e.message}`;
    console.error(e);
  }
}

// Inisialisasi kamera saat halaman dimuat
initializeCamera();
