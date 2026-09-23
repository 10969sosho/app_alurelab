export default function PrivacyPage() {
  return (
    <main className="min-h-screen bg-offwhite text-charcoal-900 py-16 px-4">
      <div className="max-w-2xl mx-auto bg-white border border-cloud rounded-lg p-8 md:p-10 shadow-soft space-y-4">
        <h1 className="h2-text text-charcoal-900">Kebijakan Privasi</h1>
        <p className="body-text text-sm">
          ALURELAB mengumpulkan data yang diperlukan untuk menjalankan transaksi: identitas akun,
          alamat pengiriman, dan riwayat pesanan. Data setiap penjual dan pembeli hanya diproses
          dalam lingkup tokonya masing-masing dengan isolasi tingkat basis data.
        </p>
        <p className="body-text text-sm">
          Kami tidak menjual data pribadi Anda kepada pihak ketiga. Informasi pembayaran diproses
          oleh penyedia pembayaran berlisensi dan tidak disimpan di server ALURELAB.
        </p>
        <p className="text-xs text-mediumgray">Terakhir diperbarui: September 2026</p>
      </div>
    </main>
  );
}
