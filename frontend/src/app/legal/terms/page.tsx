export default function TermsPage() {
  return (
    <main className="min-h-screen bg-offwhite text-charcoal-900 py-16 px-4">
      <div className="max-w-2xl mx-auto bg-white border border-cloud rounded-lg p-8 md:p-10 shadow-soft space-y-4">
        <h1 className="h2-text text-charcoal-900">Syarat & Ketentuan</h1>
        <p className="body-text text-sm">
          Dengan menggunakan platform ALURELAB, Anda setuju untuk menggunakan layanan sesuai
          ketentuan yang berlaku. Penjual bertanggung jawab atas keaslian produk, keakuratan
          informasi toko, dan pemenuhan pesanan pembeli.
        </p>
        <p className="body-text text-sm">
          Pembayaran diproses melalui penyedia resmi (Xendit) dengan skema escrow, dan pengiriman
          dilakukan melalui mitra logistik terintegrasi (Biteship). ALURELAB berhak menangguhkan
          akun yang melanggar ketentuan platform.
        </p>
        <p className="text-xs text-mediumgray">Terakhir diperbarui: September 2026</p>
      </div>
    </main>
  );
}
