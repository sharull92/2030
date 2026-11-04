// =====================================================================
// Pelan 2030 — Auto catat duit masuk dari e-mel bank (Google Apps Script)
// App menjana salinan fail ini dengan SUPABASE_URL, SUPABASE_KEY dan TOKEN
// sudah diisi: Tetapan → Auto catat duit masuk → "Salin skrip".
// Cara pasang: script.google.com → Projek baharu → tampal → Simpan →
// pilih fungsi `pasang` → Jalankan → Benarkan akses Gmail.
// =====================================================================
const SUPABASE_URL = "__URL__";
const SUPABASE_KEY = "__KEY__";   // kunci AWAM (publishable/anon) — selamat
const TOKEN = "__TOKEN__";        // kod sambungan pelan anda — jangan kongsi

// Hanya e-mel daripada pengirim ini disemak. Kosongkan ("") untuk semak semua e-mel.
const PENGIRIM = "maybank OR cimb OR rhb OR publicbank OR pbebank OR hlb OR hongleong OR ambank OR bankislam OR bsn OR bankrakyat OR affin OR alliance OR muamalat OR ocbc OR uob OR hsbc OR sc.com OR standardchartered OR agrobank OR touchngo OR tngdigital OR boost OR grab OR shopee OR gxbank OR aeonbank OR kaf";

const MASUK = /(you(?:'ve| have)? received|received (?:a |an )?(?:payment|transfer|fund|duitnow)|has been credited|been credited|credited (?:to|into)|incoming (?:fund|transfer|payment)|fund transfer to you|transferred to you|deposited|diterima|dikreditkan|wang masuk|duit masuk|pindahan masuk|terima(?:an)? (?:wang|duit|pindahan|bayaran))/i;
const KELUAR = /(debited|didebitkan|you(?:'ve| have)? (?:paid|sent|transferred)|payment to|bayaran kepada|pindahan keluar|purchase|pembelian|withdrawal|pengeluaran|\bOTP\b|\bTAC\b|statement|penyata)/i;

// Pulangkan jumlah (RM) jika e-mel ialah notifikasi duit masuk; jika bukan, null.
function kesanDuitMasuk(subjek, badan) {
  const teks = (subjek + " \n " + badan).replace(/\s+/g, " ");
  if (!MASUK.test(teks) || KELUAR.test(subjek)) return null;
  const re = /(?:RM|MYR)\s?([0-9]{1,3}(?:,[0-9]{3})+(?:\.[0-9]{1,2})?|[0-9]+(?:\.[0-9]{1,2})?)/gi;
  const calon = []; let m;
  while ((m = re.exec(teks))) calon.push({ nilai: parseFloat(m[1].replace(/,/g, "")), sebelum: teks.slice(Math.max(0, m.index - 40), m.index) });
  const elak = /(balance|baki|available|limit|had|minimum)[^.]{0,15}$/i;
  const baik = calon.filter(c => c.nilai > 0 && !elak.test(c.sebelum));
  const kunci = /(amount|jumlah|sebanyak|received|credited|diterima|dikreditkan|of|for)\s*[:\-]?\s*$/i;
  const pilih = baik.find(c => kunci.test(c.sebelum)) || baik[0];
  return pilih ? Math.round(pilih.nilai * 100) / 100 : null;
}

function semakDuitMasuk() {
  const props = PropertiesService.getScriptProperties();
  const sudah = JSON.parse(props.getProperty("diproses") || "[]");
  const carian = "newer_than:2d (RM OR MYR) -in:spam -in:trash" + (PENGIRIM ? " from:(" + PENGIRIM + ")" : "");
  const threads = GmailApp.search(carian, 0, 40);
  for (const th of threads) for (const msg of th.getMessages()) {
    const id = msg.getId();
    if (sudah.indexOf(id) >= 0) continue;
    const jumlah = kesanDuitMasuk(msg.getSubject(), msg.getPlainBody().slice(0, 4000));
    if (jumlah) {
      const res = hantar_("add_incoming", {
        p_token: TOKEN, p_amount: jumlah,
        p_date: Utilities.formatDate(msg.getDate(), "Asia/Kuala_Lumpur", "yyyy-MM-dd"),
        p_desc: msg.getSubject().slice(0, 200), p_source: msg.getFrom().slice(0, 140), p_msg_id: id
      });
      if (res.getResponseCode() >= 300) { Logger.log("Gagal hantar: " + res.getContentText()); continue; }
      Logger.log("Dicatat: RM " + jumlah.toFixed(2) + " — " + msg.getSubject());
    }
    sudah.push(id);
  }
  props.setProperty("diproses", JSON.stringify(sudah.slice(-400)));
}

function hantar_(fn, body) {
  const h = { apikey: SUPABASE_KEY };
  if (/^eyJ/.test(SUPABASE_KEY)) h.Authorization = "Bearer " + SUPABASE_KEY;
  return UrlFetchApp.fetch(SUPABASE_URL + "/rest/v1/rpc/" + fn, { method: "post", contentType: "application/json", headers: h, payload: JSON.stringify(body), muteHttpExceptions: true });
}

// Jalankan SEKALI: semak sambungan, kemudian semak e-mel setiap 5 minit.
function pasang() {
  const res = hantar_("check_token", { p_token: TOKEN });
  if (res.getContentText().trim() !== "true") throw new Error("Kod sambungan tidak sah / sudah dibatalkan. Salin skrip baru dari app. (" + res.getContentText() + ")");
  ScriptApp.getProjectTriggers().forEach(t => ScriptApp.deleteTrigger(t));
  ScriptApp.newTrigger("semakDuitMasuk").timeBased().everyMinutes(5).create();
  semakDuitMasuk();
  Logger.log("Siap ✓ — e-mel duit masuk akan disemak setiap 5 minit.");
}

// Untuk berhenti: jalankan fungsi ini.
function berhenti() { ScriptApp.getProjectTriggers().forEach(t => ScriptApp.deleteTrigger(t)); Logger.log("Dihentikan."); }
