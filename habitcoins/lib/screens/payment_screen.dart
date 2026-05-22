import 'package:flutter/material.dart';
import '../services/payment_service.dart';
import '../theme/colors.dart';

class PaymentScreen extends StatefulWidget {
  final Map<String, dynamic> user;
  final void Function(int coins, bool isPro) onPaymentSuccess;

  const PaymentScreen({
    super.key,
    required this.user,
    required this.onPaymentSuccess,
  });

  @override
  State<PaymentScreen> createState() => _PaymentScreenState();
}

class _PaymentScreenState extends State<PaymentScreen>
    with SingleTickerProviderStateMixin {
  late TabController _tabCtrl;
  final _svc = PaymentService();

  List<CoinPack> _packs = [];
  ProInfo? _pro;
  bool _loading = true;
  bool _paying = false;

  @override
  void initState() {
    super.initState();
    _tabCtrl = TabController(length: 2, vsync: this);
    _loadPacks();
    _svc.onSuccess = _onSuccess;
    _svc.onError   = _onError;
  }

  @override
  void dispose() {
    _tabCtrl.dispose();
    _svc.dispose();
    super.dispose();
  }

  Future<void> _loadPacks() async {
    try {
      final result = await _svc.fetchPacks();
      if (mounted) setState(() { _packs = result.packs; _pro = result.pro; _loading = false; });
    } catch (_) {
      if (mounted) setState(() => _loading = false);
    }
  }

  void _onSuccess(int coinsAdded, int totalCoins, bool isPro) {
    setState(() => _paying = false);
    widget.onPaymentSuccess(totalCoins, isPro);
    _loadPacks(); // refresh pro status
    _showSnack(
      isPro && coinsAdded == 0
          ? '⭐ Pro activated! You now earn 2× coins.'
          : '🪙 +$coinsAdded coins added to your wallet!',
      AppColors.green,
    );
  }

  void _onError(String msg) {
    setState(() => _paying = false);
    _showSnack('❌ $msg', AppColors.red);
  }

  void _showSnack(String msg, Color color) {
    if (!mounted) return;
    ScaffoldMessenger.of(context).showSnackBar(SnackBar(
      content: Text(msg, style: const TextStyle(fontWeight: FontWeight.w600)),
      backgroundColor: color,
      behavior: SnackBarBehavior.floating,
      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
    ));
  }

  Future<void> _buyCoins(CoinPack pack) async {
    setState(() => _paying = true);
    await _svc.startCoinPurchase(
      pack,
      widget.user['email'] ?? '',
      widget.user['name'] ?? '',
    );
  }

  Future<void> _buyPro() async {
    if (_pro == null) return;
    setState(() => _paying = true);
    await _svc.startProSubscription(
      _pro!.priceInr,
      widget.user['email'] ?? '',
      widget.user['name'] ?? '',
    );
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: AppColors.bg,
      appBar: AppBar(
        backgroundColor: AppColors.card,
        elevation: 0,
        title: const Text('Store', style: TextStyle(fontWeight: FontWeight.w800, color: AppColors.textDark)),
        bottom: TabBar(
          controller: _tabCtrl,
          labelColor: AppColors.purple,
          unselectedLabelColor: AppColors.muted,
          indicatorColor: AppColors.purple,
          tabs: const [
            Tab(text: '🪙  Coin Packs'),
            Tab(text: '⭐  Pro Plan'),
          ],
        ),
      ),
      body: _loading
          ? const Center(child: CircularProgressIndicator(color: AppColors.purple))
          : Stack(
              children: [
                TabBarView(
                  controller: _tabCtrl,
                  children: [_coinPacksTab(), _proTab()],
                ),
                if (_paying)
                  Container(
                    color: Colors.black38,
                    child: const Center(child: CircularProgressIndicator(color: AppColors.purple)),
                  ),
              ],
            ),
    );
  }

  // ── Coin Packs Tab ──────────────────────────────────────────────────────────
  Widget _coinPacksTab() {
    return ListView(
      padding: const EdgeInsets.all(16),
      children: [
        _infoCard(
          '🪙 Buy Coins',
          'Use coins to redeem brand rewards — Zomato, Amazon, Swiggy and more.',
          AppColors.amberLight,
          AppColors.amberText,
        ),
        const SizedBox(height: 16),
        ..._packs.map(_packCard),
        const SizedBox(height: 16),
        _historyButton(),
      ],
    );
  }

  Widget _packCard(CoinPack pack) {
    final isPopular    = pack.tag == 'Popular';
    final isBestValue  = pack.tag == 'Best Value';
    final highlight    = isPopular || isBestValue;

    return Container(
      margin: const EdgeInsets.only(bottom: 12),
      decoration: BoxDecoration(
        color: highlight ? AppColors.purpleLight : AppColors.card,
        borderRadius: BorderRadius.circular(16),
        border: Border.all(color: highlight ? AppColors.purple.withValues(alpha: 0.4) : AppColors.border, width: highlight ? 1.5 : 1),
      ),
      child: Padding(
        padding: const EdgeInsets.all(16),
        child: Row(
          children: [
            // Coin icon + amount
            Container(
              width: 56, height: 56,
              decoration: BoxDecoration(color: AppColors.amberLight, borderRadius: BorderRadius.circular(14)),
              child: Column(
                mainAxisAlignment: MainAxisAlignment.center,
                children: [
                  const Text('🪙', style: TextStyle(fontSize: 22)),
                  Text('${pack.coins}', style: const TextStyle(fontSize: 10, fontWeight: FontWeight.w700, color: AppColors.amberText)),
                ],
              ),
            ),
            const SizedBox(width: 14),
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Row(children: [
                    Text(pack.label, style: const TextStyle(fontWeight: FontWeight.w700, fontSize: 15, color: AppColors.textDark)),
                    if (pack.tag.isNotEmpty) ...[
                      const SizedBox(width: 8),
                      Container(
                        padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 2),
                        decoration: BoxDecoration(
                          color: isPopular ? AppColors.purple : AppColors.green,
                          borderRadius: BorderRadius.circular(99),
                        ),
                        child: Text(pack.tag, style: const TextStyle(color: Colors.white, fontSize: 10, fontWeight: FontWeight.w700)),
                      ),
                    ],
                  ]),
                  const SizedBox(height: 2),
                  Text('₹${pack.priceInr.toStringAsFixed(0)}', style: const TextStyle(fontSize: 13, color: AppColors.muted)),
                ],
              ),
            ),
            ElevatedButton(
              onPressed: _paying ? null : () => _buyCoins(pack),
              style: ElevatedButton.styleFrom(
                backgroundColor: AppColors.purple,
                foregroundColor: Colors.white,
                padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 10),
                shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(10)),
                elevation: 0,
              ),
              child: Text('Buy', style: const TextStyle(fontWeight: FontWeight.w700)),
            ),
          ],
        ),
      ),
    );
  }

  // ── Pro Tab ─────────────────────────────────────────────────────────────────
  Widget _proTab() {
    if (_pro == null) return const Center(child: Text('Could not load plan info'));

    return ListView(
      padding: const EdgeInsets.all(16),
      children: [
        // Hero card
        Container(
          padding: const EdgeInsets.all(24),
          decoration: BoxDecoration(
            gradient: const LinearGradient(
              colors: [AppColors.purple, AppColors.purpleDark],
              begin: Alignment.topLeft,
              end: Alignment.bottomRight,
            ),
            borderRadius: BorderRadius.circular(20),
          ),
          child: Column(
            children: [
              const Text('⭐', style: TextStyle(fontSize: 48)),
              const SizedBox(height: 8),
              const Text('KarmaCoins Pro', style: TextStyle(fontSize: 22, fontWeight: FontWeight.w800, color: Colors.white)),
              const SizedBox(height: 4),
              Text(
                _pro!.isActive ? 'Active — expires ${_pro!.expiresAt?.substring(0, 10) ?? ''}' : 'Unlock the full experience',
                style: const TextStyle(color: Colors.white70, fontSize: 13),
              ),
              const SizedBox(height: 20),
              if (!_pro!.isActive)
                Text(
                  '₹${_pro!.priceInr.toStringAsFixed(0)}/month',
                  style: const TextStyle(fontSize: 28, fontWeight: FontWeight.w800, color: Colors.white),
                ),
            ],
          ),
        ),
        const SizedBox(height: 20),

        // Perks list
        const Text('WHAT YOU GET', style: TextStyle(fontSize: 11, fontWeight: FontWeight.w700, color: AppColors.muted, letterSpacing: 1)),
        const SizedBox(height: 10),
        ..._pro!.perks.map((perk) => Container(
          margin: const EdgeInsets.only(bottom: 8),
          padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 12),
          decoration: BoxDecoration(
            color: AppColors.card,
            borderRadius: BorderRadius.circular(12),
            border: Border.all(color: AppColors.border),
          ),
          child: Row(
            children: [
              const Icon(Icons.check_circle_rounded, color: AppColors.green, size: 20),
              const SizedBox(width: 10),
              Text(perk, style: const TextStyle(fontSize: 14, fontWeight: FontWeight.w500, color: AppColors.textDark)),
            ],
          ),
        )),
        const SizedBox(height: 20),

        if (_pro!.isActive)
          Container(
            padding: const EdgeInsets.all(14),
            decoration: BoxDecoration(color: AppColors.greenLight, borderRadius: BorderRadius.circular(12)),
            child: const Row(
              children: [
                Icon(Icons.verified_rounded, color: AppColors.green),
                SizedBox(width: 10),
                Text('Pro is active on your account', style: TextStyle(fontWeight: FontWeight.w600, color: AppColors.greenText)),
              ],
            ),
          )
        else
          SizedBox(
            width: double.infinity,
            child: ElevatedButton(
              onPressed: _paying ? null : _buyPro,
              style: ElevatedButton.styleFrom(
                backgroundColor: AppColors.purple,
                foregroundColor: Colors.white,
                padding: const EdgeInsets.symmetric(vertical: 16),
                shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(14)),
                elevation: 0,
              ),
              child: Text(
                'Subscribe for ₹${_pro!.priceInr.toStringAsFixed(0)}/month',
                style: const TextStyle(fontSize: 15, fontWeight: FontWeight.w700),
              ),
            ),
          ),
        const SizedBox(height: 12),
        const Center(
          child: Text(
            'Secure payment via Razorpay • Cancel anytime',
            style: TextStyle(fontSize: 11, color: AppColors.muted),
          ),
        ),
        const SizedBox(height: 16),
        _historyButton(),
      ],
    );
  }

  // ── Shared widgets ──────────────────────────────────────────────────────────
  Widget _infoCard(String title, String body, Color bg, Color fg) => Container(
    padding: const EdgeInsets.all(14),
    decoration: BoxDecoration(color: bg, borderRadius: BorderRadius.circular(12)),
    child: Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text(title, style: TextStyle(fontWeight: FontWeight.w700, fontSize: 14, color: fg)),
        const SizedBox(height: 4),
        Text(body, style: TextStyle(fontSize: 12, color: fg.withValues(alpha: 0.8))),
      ],
    ),
  );

  Widget _historyButton() => OutlinedButton.icon(
    onPressed: () => Navigator.push(context, MaterialPageRoute(builder: (_) => const PaymentHistoryScreen())),
    icon: const Icon(Icons.receipt_long_rounded, size: 18),
    label: const Text('View payment history'),
    style: OutlinedButton.styleFrom(
      foregroundColor: AppColors.purple,
      side: const BorderSide(color: AppColors.border),
      padding: const EdgeInsets.symmetric(vertical: 12),
      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
    ),
  );
}

// ── Payment History Screen ────────────────────────────────────────────────────
class PaymentHistoryScreen extends StatefulWidget {
  const PaymentHistoryScreen({super.key});

  @override
  State<PaymentHistoryScreen> createState() => _PaymentHistoryScreenState();
}

class _PaymentHistoryScreenState extends State<PaymentHistoryScreen> {
  final _svc = PaymentService();
  List<Map<String, dynamic>> _history = [];
  bool _loading = true;

  @override
  void initState() {
    super.initState();
    _load();
  }

  Future<void> _load() async {
    try {
      final h = await _svc.fetchHistory();
      if (mounted) setState(() { _history = h; _loading = false; });
    } catch (_) {
      if (mounted) setState(() => _loading = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: AppColors.bg,
      appBar: AppBar(
        backgroundColor: AppColors.card,
        elevation: 0,
        title: const Text('Payment History', style: TextStyle(fontWeight: FontWeight.w800, color: AppColors.textDark)),
      ),
      body: _loading
          ? const Center(child: CircularProgressIndicator(color: AppColors.purple))
          : _history.isEmpty
              ? const Center(child: Text('No payments yet', style: TextStyle(color: AppColors.muted)))
              : ListView.builder(
                  padding: const EdgeInsets.all(16),
                  itemCount: _history.length,
                  itemBuilder: (_, i) {
                    final p = _history[i];
                    final isPaid   = p['status'] == 'paid';
                    final isCoins  = p['type'] == 'coins';
                    return Container(
                      margin: const EdgeInsets.only(bottom: 10),
                      padding: const EdgeInsets.all(14),
                      decoration: BoxDecoration(
                        color: AppColors.card,
                        borderRadius: BorderRadius.circular(12),
                        border: Border.all(color: AppColors.border),
                      ),
                      child: Row(
                        children: [
                          Container(
                            width: 40, height: 40,
                            decoration: BoxDecoration(
                              color: isCoins ? AppColors.amberLight : AppColors.purpleLight,
                              borderRadius: BorderRadius.circular(10),
                            ),
                            child: Center(child: Text(isCoins ? '🪙' : '⭐', style: const TextStyle(fontSize: 20))),
                          ),
                          const SizedBox(width: 12),
                          Expanded(
                            child: Column(
                              crossAxisAlignment: CrossAxisAlignment.start,
                              children: [
                                Text(
                                  isCoins ? '+${p['coins_granted']} Coins' : 'Pro Subscription',
                                  style: const TextStyle(fontWeight: FontWeight.w700, fontSize: 14, color: AppColors.textDark),
                                ),
                                Text(
                                  p['created_at'].toString().substring(0, 10),
                                  style: const TextStyle(fontSize: 12, color: AppColors.muted),
                                ),
                              ],
                            ),
                          ),
                          Column(
                            crossAxisAlignment: CrossAxisAlignment.end,
                            children: [
                              Text(
                                '₹${p['amount_inr'].toStringAsFixed(0)}',
                                style: const TextStyle(fontWeight: FontWeight.w700, fontSize: 14, color: AppColors.textDark),
                              ),
                              Container(
                                padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 2),
                                decoration: BoxDecoration(
                                  color: isPaid ? AppColors.greenLight : AppColors.redLight,
                                  borderRadius: BorderRadius.circular(99),
                                ),
                                child: Text(
                                  isPaid ? 'Paid' : p['status'].toString(),
                                  style: TextStyle(fontSize: 10, fontWeight: FontWeight.w600, color: isPaid ? AppColors.green : AppColors.red),
                                ),
                              ),
                            ],
                          ),
                        ],
                      ),
                    );
                  },
                ),
    );
  }
}
