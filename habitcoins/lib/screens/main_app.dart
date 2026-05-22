import 'package:flutter/material.dart';
import '../data/models.dart';
import '../theme/colors.dart';
import 'tabs/home_tab.dart';
import 'tabs/search_tab.dart';
import 'tabs/friends_tab.dart';
import 'tabs/leaderboard_tab.dart';
import 'tabs/rewards_tab.dart';
import 'tabs/settings_tab.dart';
import 'tabs/profile_tab.dart';
import 'payment_screen.dart';

class MainApp extends StatefulWidget {
  final Map<String, dynamic> user;
  final VoidCallback onLogout;

  const MainApp({super.key, required this.user, required this.onLogout});

  @override
  State<MainApp> createState() => _MainAppState();
}

class _MainAppState extends State<MainApp> {
  int _tabIndex = 0;
  late List<Habit> _habits;
  int _coins = 1240;
  bool _isPro = false;
  OverlayEntry? _toastEntry;

  @override
  void initState() {
    super.initState();
    _habits = buildInitialHabits();
  }

  void _showToast(String msg) {
    _toastEntry?.remove();
    _toastEntry = OverlayEntry(
      builder: (_) => Positioned(
        top: MediaQuery.of(context).padding.top + 16,
        left: 0, right: 0,
        child: Center(
          child: Material(
            color: Colors.transparent,
            child: Container(
              padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 10),
              decoration: BoxDecoration(color: AppColors.textDark, borderRadius: BorderRadius.circular(99)),
              child: Text(msg, style: const TextStyle(color: Colors.white, fontSize: 13, fontWeight: FontWeight.w600)),
            ),
          ),
        ),
      ),
    );
    Overlay.of(context).insert(_toastEntry!);
    Future.delayed(const Duration(milliseconds: 2500), () {
      _toastEntry?.remove();
      _toastEntry = null;
    });
  }

  void _handleCheckin(int id) {
    setState(() {
      _habits = _habits.map((h) {
        if (h.id != id || h.checkedToday) return h;
        final earned = _isPro ? h.coinRate * 2 : h.coinRate;
        _coins += earned;
        _showToast('+$earned coins earned! 🪙');
        return h.copyWith(checkedToday: true, done: (h.done + 1).clamp(0, h.days));
      }).toList();
    });
  }

  void _onPaymentSuccess(int newCoins, bool isPro) {
    setState(() {
      _coins = newCoins;
      if (isPro) _isPro = true;
    });
  }

  void _openStore() {
    Navigator.push(
      context,
      MaterialPageRoute(
        builder: (_) => PaymentScreen(
          user: widget.user,
          onPaymentSuccess: _onPaymentSuccess,
        ),
      ),
    );
  }

  static const _tabs = [
    (icon: Icons.home_rounded,          label: 'Home'),
    (icon: Icons.person_add_rounded,    label: 'Friends'),
    (icon: Icons.chat_bubble_rounded,   label: 'Chat'),
    (icon: Icons.emoji_events_rounded,  label: 'Ranks'),
    (icon: Icons.card_giftcard_rounded, label: 'Rewards'),
    (icon: Icons.settings_rounded,      label: 'Settings'),
    (icon: Icons.account_circle_rounded,label: 'Profile'),
  ];

  @override
  Widget build(BuildContext context) {
    final screens = [
      HomeTab(habits: _habits, coins: _coins, onCheckin: _handleCheckin),
      const SearchTab(),
      const FriendsTab(),
      const LeaderboardTab(),
      RewardsTab(coins: _coins),
      const SettingsTab(),
      ProfileTab(
        user: widget.user,
        coins: _coins,
        isPro: _isPro,
        habits: _habits,
        onLogout: widget.onLogout,
        onOpenStore: _openStore,
      ),
    ];

    return Scaffold(
      backgroundColor: AppColors.bg,
      // Store FAB — always accessible
      floatingActionButton: FloatingActionButton.extended(
        onPressed: _openStore,
        backgroundColor: AppColors.purple,
        icon: const Text('🪙', style: TextStyle(fontSize: 18)),
        label: const Text('Store', style: TextStyle(fontWeight: FontWeight.w700, color: Colors.white)),
      ),
      body: screens[_tabIndex],
      bottomNavigationBar: Container(
        decoration: const BoxDecoration(
          color: AppColors.card,
          border: Border(top: BorderSide(color: AppColors.border)),
        ),
        child: SafeArea(
          child: SizedBox(
            height: 60,
            child: Row(
              children: List.generate(_tabs.length, (i) {
                final selected = i == _tabIndex;
                return Expanded(
                  child: GestureDetector(
                    onTap: () => setState(() => _tabIndex = i),
                    behavior: HitTestBehavior.opaque,
                    child: Column(
                      mainAxisAlignment: MainAxisAlignment.center,
                      children: [
                        Icon(_tabs[i].icon, size: 22, color: selected ? AppColors.purple : AppColors.muted),
                        const SizedBox(height: 2),
                        Text(
                          _tabs[i].label,
                          style: TextStyle(
                            fontSize: 9,
                            fontWeight: selected ? FontWeight.w700 : FontWeight.w400,
                            color: selected ? AppColors.purple : AppColors.muted,
                          ),
                          overflow: TextOverflow.ellipsis,
                        ),
                      ],
                    ),
                  ),
                );
              }),
            ),
          ),
        ),
      ),
    );
  }
}
