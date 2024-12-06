import { GoogleGenerativeAI, HarmBlockThreshold, HarmCategory } from "@google/generative-ai";
import Base64 from 'base64-js';
import MarkdownIt from 'markdown-it';
import { maybeShowApiKeyBanner } from './gemini-api-banner';
import './style.css';

let API_KEY = 'AIzaSyA5pN8XuDRSsX-PfWWxuGdD91KzGsHWx3I';

let form = document.querySelector('form');
let promptInput = document.querySelector('input[name="prompt"]');
let output = document.querySelector('.output');

form.onsubmit = async (ev) => {
  ev.preventDefault();
  output.textContent = 'Sedang menganalisis...';

  try {
    let imageUrl = form.elements.namedItem('chosen-image').value;
    let imageBase64 = await fetch(imageUrl)
      .then(r => r.arrayBuffer())
      .then(a => Base64.fromByteArray(new Uint8Array(a)));

    // Prompt dalam Bahasa Indonesia
    const analisisPrompt = 
      "Analisis hanya tingkat kekotoan sepatu dalam gambar ini. " + 
      "Berikan nilai tingkat kekotoran dari skala 1-10: jika 1, maka kotornya sedikit. jika 10, maka sangat kotor" +
      "Tolong jelaskan secara spesifik seperti: Upper berapa persen kotornya, Midsole berapa persen kotornya, Outsole berapa persen kotornya" +
      "Berdasarkan kondisi tersebut, rekomendasikan salah satu dari layanan berikut: **Standar Treatment** (IDR 50.000): Untuk kotoran ringan seperti debu atau lumpur. Fokus pada pembersihan bagian luar sepatu (upper, midsole, outsole). **Extra Treatment** (IDR 60.000-100.000): Untuk noda membandel, bahan khusus seperti suede atau kulit, atau masalah jamur dan bau. Sesuaikan harga berdasarkan tingkat kekotoran. *Express Treatment** (IDR 65.000): Untuk pembersihan cepat, terbatas pada pembersihan standar. **Unyellowing Treatment** (IDR 75.000): Untuk mengembalikan warna putih pada sepatu yang menguning. Menggunakan teknik seperti bleaching atau UV treatment." +
      "Jika sepatu tidak cocok untuk salah satu layanan di atas, nyatakan alasannya. "+
      "Fokus hanya pada rekomendasi layanan GianShoemaker, dan jangan menyebutkan hal di luar ruang lingkup layanan laundry sepatu ini.";
      // "Beri nilai tingkat kekotoran dari skala 1-10 jika 1 maka kotornya sedikit jika 10 sangat kotor dan jelaskan secara spesifik seperti kotornya pada bagian upper berapa persen midsole berapa persen dan outsole berapa persen " +
      // "di mana kotoran atau keausan terlihat. Fokus hanya pada aspek kebersihan."
      // "tolong rekomendasikan treatment yang cocok untuk sepatunya apakah reguler treatment, express treatment, extra treatment";

    let contents = [
      {
        role: 'user',
        parts: [
          { inline_data: { mime_type: 'image/jpeg', data: imageBase64, } },
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
    output.innerHTML += '<hr>' + e;
  }
};

maybeShowApiKeyBanner(API_KEY);
