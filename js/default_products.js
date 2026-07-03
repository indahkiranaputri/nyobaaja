/* ============================================================
   default_products.js — Shared default product dataset
   Digunakan oleh halaman toko dan admin untuk memastikan produk default
   tersedia saat website baru diakses setelah upload GitHub.
   ============================================================ */

const defaultProducts = [
  {
    id: 1,
    name: "Luminous Silk Velvet Liptint",
    price: 490000,
    category: "makeup",
    emoji: "💄",
    image: "./image/liptint.jpg.jpeg",
    stock: 42,
    desc: "An ultra-refined fluid liptint crafted with premium French Rose Extract and nourishing Squalane.",
    hot: true
  },
  {
    id: 2,
    name: "Couture Celestial Quad Eyeshadow",
    price: 980000,
    category: "makeup",
    emoji: "✨",
    image: "./image/eyshadow.jpg.jpeg",
    stock: 19,
    desc: "Koleksi memukau yang terdiri dari empat eyeshadow berpigmen tinggi dengan micro-shimmer.",
    hot: true
  },
  {
    id: 3,
    name: "Satin Petal Infusion Blush On",
    price: 540000,
    category: "makeup",
    emoji: "🌸",
    image: "./image/blushon.jpg.jpeg",
    stock: 28,
    desc: "Diperkaya dengan micronized silk polymers dan bubuk mutiara asli untuk rona segar alami.",
    hot: true
  },
  {
    id: 4,
    name: "Perfecting Silk Veil Two Way Cake",
    price: 790000,
    category: "makeup",
    emoji: "🪞",
    image: "./image/two way cake.jpg.jpeg",
    stock: 31,
    desc: "Powder foundation dual-action dengan Hyaluronic Acid Spheres dan SPF 30 untuk coverage halus.",
    hot: false
  },
  {
    id: 5,
    name: "Soft Cashmere Matte Lipcream",
    price: 460000,
    category: "makeup",
    emoji: "💋",
    image: "./image/lipcream.jpg.jpeg",
    stock: 55,
    desc: "Diformulasikan dengan pure botanic oils dan Shea Butter Comfort Blend untuk hasil lip blur.",
    hot: false
  },
  {
    id: 6,
    name: "Rouge Supreme Satin Lipstik",
    price: 520000,
    category: "makeup",
    emoji: "💄",
    image: "./image/lipstik.jpg.jpeg",
    stock: 22,
    desc: "Lipstik couture ikonik dengan Camellia Seed Oil untuk hasil satin intens yang mewah.",
    hot: false
  },
  {
    id: 7,
    name: "Liquid Gold Strobing Highlighter",
    price: 610000,
    category: "makeup",
    emoji: "✨",
    image: "./image/highlighter baru.jpeg",
    stock: 14,
    desc: "Fluid illuminator dengan prismatic gold crystals dalam organic botanical squalane matrix.",
    hot: true
  },
  {
    id: 8,
    name: "Majesty Imperial Extrait de Parfum",
    price: 3200000,
    category: "parfum",
    emoji: "🔮",
    image: "./image/parfum baru 1.jpeg",
    stock: 8,
    desc: "Konsentrasi wewangian tertinggi dengan Jasmine Sambac Absolue, White Oud Amber, dan Vanilla.",
    hot: true
  },
  {
    id: 9,
    name: "Opulence Bloom Eau de Parfum",
    price: 2450000,
    category: "parfum",
    emoji: "🌺",
    image: "./image/parfum baru 2.jpeg",
    stock: 12,
    desc: "Aroma romantis bunga peony, bergamot segar, dan musk sutra yang sensual.",
    hot: false
  },
  {
    id: 10,
    name: "Gilded Citrus Eau de Toilette",
    price: 1850000,
    category: "parfum",
    emoji: "🍋",
    image: "./image/parfum baru 3.jpeg",
    stock: 25,
    desc: "Wewangian mediterania dengan jeruk nipis dan kayu amber yang disalut.",
    hot: false
  },
  {
    id: 11,
    name: "Verdant Breeze Eau de Cologne",
    price: 1400000,
    category: "parfum",
    emoji: "🌿",
    image: "./image/parfum 4.jpg.jpeg",
    stock: 40,
    desc: "Aroma dedaunan mint, teh putih premium, dan cedarwood segar yang menyegarkan.",
    hot: false
  },
  {
    id: 12,
    name: "Aqueous Mist Eau Fraîche",
    price: 1250000,
    category: "parfum",
    emoji: "💧",
    image: "./image/parfum 5.jpg.jpeg",
    stock: 35,
    desc: "Wewangian ringan dengan aroma air tawar, lotus, dan musk transparan.",
    hot: false
  },
  {
    id: 13,
    name: "Bio-Cellular Advanced Gel Cream",
    price: 1350000,
    category: "skincare",
    emoji: "🧴",
    image: "./image/gel cream.jpg.jpeg",
    stock: 18,
    desc: "Pelembap dingin dengan Squalane, centella, dan ceramides untuk barrier defense.",
    hot: false
  },
  {
    id: 14,
    name: "Purifying French Rose Clay Mask",
    price: 850000,
    category: "skincare",
    emoji: "🌹",
    image: "./image/claymask baru.jpeg",
    stock: 22,
    desc: "Pink clay dengan French Rose hydrosol dan enzim eksfoliasi untuk kulit halus.",
    hot: false
  },
  {
    id: 15,
    name: "Supreme Golden Elixir Ampoule",
    price: 2100000,
    category: "skincare",
    emoji: "✨",
    image: "./image/ampoule baru.jpeg",
    stock: 11,
    desc: "Treatment malam mewah dengan Marine Collagen, Peptide Complex, dan serpihan emas.",
    hot: false
  },
  {
    id: 16,
    name: "Amino Rich Velvet Cleansing Foam",
    price: 580000,
    category: "skincare",
    emoji: "🧼",
    image: "./image/cleansing foam.jpg.jpeg",
    stock: 30,
    desc: "Pembersih soap-free dengan amino acids dan thermal water yang lembut.",
    hot: true
  },
  {
    id: 17,
    name: "Hydra Replenish Botanical Lotion",
    price: 690000,
    category: "bodycare",
    emoji: "🌿",
    image: "./image/lotion baru.jpeg",
    stock: 26,
    desc: "Fluid prepping yang melembapkan dengan Hyaluronic Acid dan polifenol teh hijau.",
    hot: false
  },
  {
    id: 18,
    name: "Ceramide Barrier Defense Moisturizer",
    price: 1150000,
    category: "skincare",
    emoji: "🛡️",
    image: "./image/mois.jpg.jpeg",
    stock: 15,
    desc: "Krim menenangkan dengan 5 Ceramides, fatty acids, dan kompleks kolesterol.",
    hot: false
  },
  {
    id: 19,
    name: "Satin Cocoon Hydrating Body Wash",
    price: 490000,
    category: "bodycare",
    emoji: "🛁",
    image: "./image/body wash.jpg.jpeg",
    stock: 45,
    desc: "Body cleanser gel kaya Sweet Almond Oil dan amber essential distillates.",
    hot: false
  },
  {
    id: 20,
    name: "Crushed Pearl Smoothing Body Scrub",
    price: 550000,
    category: "bodycare",
    emoji: "🧖",
    image: "./image/scrub.jpg.jpeg",
    stock: 33,
    desc: "Scrub mewah dengan Mother of Pearl dan Rice Bran oil untuk kulit halus.",
    hot: false
  },
  {
    id: 21,
    name: "Marula Infusion Intense Hair Oil",
    price: 680000,
    category: "haircare",
    emoji: "🌰",
    image: "./image/hair oil.jpg.jpeg",
    stock: 20,
    desc: "Cold-pressed Marula Oil dengan Vitamin E dan Argan untuk rambut berkilau.",
    hot: true
  },
  {
    id: 22,
    name: "Resveratrol Scalp Serum Oil",
    price: 890000,
    category: "haircare",
    emoji: "🌿",
    image: "./image/serum oil.jpg.jpeg",
    stock: 16,
    desc: "Serum kulit kepala canggih dengan antioksidan Resveratrol dan Rosemary.",
    hot: false
  },
  {
    id: 23,
    name: "Silk Protein Weightless Conditioner",
    price: 520000,
    category: "haircare",
    emoji: "💧",
    image: "./image/conditioner.jpg.jpeg",
    stock: 38,
    desc: "Conditioner dengan protein silk hidrolik untuk rambut halus dan ringan.",
    hot: false
  },
  {
    id: 24,
    name: "Botanical Caviar Fortifying Shampoo",
    price: 550000,
    category: "haircare",
    emoji: "🧴",
    image: "./image/shampo.jpg.jpeg",
    stock: 40,
    desc: "Shampoo dengan ekstrak Green Caviar yang membersihkan lembut dan menutrisi.",
    hot: true
  }
];
