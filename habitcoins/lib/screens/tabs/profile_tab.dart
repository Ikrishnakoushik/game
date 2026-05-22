import 'package:flutter/material.dart';
import '../../data/models.dart';
import '../../theme/colors.dart';
import '../../widgets/avatar.dart';

class ProfileTab extends StatelessWidget {
  final Map<String, dynamic> user;
  final int coins;
  final bool isPro;
  final List<Habit> habits;
  final VoidCallback onLogout;
  final VoidCallback onOpenStore;

  const ProfileTab({
    super.key,
    required this.user,
    required this.coins,
    required this.isPro,
    required this.habits,
    required this.onLogout,
    required this.onOpenStore,
  });

  @override
  Widget build(BuildContext context) {
    final completedHabits = habits.where((h) => h.done == h.days).length;

    return SafeArea(
      child: ListView(
        padding: const EdgeInsets.all(16),
        children: [
          // Profile header
          Container(
            padding: const EdgeInsets.all(24),
            decoration: BoxDecoration(
              gradient: const LinearGradient(
                colors: [AppColors.purple, AppColors.purpleDark],
                begin: Alignment.topLeft,
                end: Alignment.bottomRight,
              ),
              borderRadius: BorderRadius.circular(16),
            ),
            child: Column(
              children: [
                AvatarWidget(initials: user['avatar'] ?? 'U', size: 64, color: Colors.white, textColor: AppColors.purple),
                const SizedBox(height: 12),
                Text(user['name'] ?? '', style: const TextStyle(fontSize: 20, fontWeight: FontWeight.w800, color: Colors.white)),
                const SizedBox(height: 4),
                Text(user['email'] ?? '', style: const TextStyle(fontSize: 13, color: Colors.white70)),
                if (isPro) ...[
                  const SizedBox(height: 10),
                  Container(
                    padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 5),
                    decoration: BoxDecoration(color: Colors.white24, borderRadius: BorderRadius.circular(99)),
                    child: const Text('⭐ Pro member', style: TextStyle(fontSize: 12, fontWeight: FontWeight.w700, color: Colors.white)),
                  ),
                ],
              ],
            ),
          ),
          const SizedBox(height: 16),
          // Stats row
          Row(
            children: [
              _statCard('🪙', _fmt(coins)),
              const SizedBox(width: 10),
              _statCard('✅', '$completedHabits'),
              const SizedBox(width: 10),
              _statCard('🔥', '15d'),
            ],
          ),
          const SizedBox(height: 20),
          const Text('ACCOUNT SETTINGS', style: TextStyle(fontSize: 11, fontWeight: FontWeight.w700, color: AppColors.muted, letterSpacing: 1)),
          const SizedBox(height: 10),
          ...[
            ('📝 Edit profile', 'Update name, photo'),
            ('🔐 Privacy & security', 'Manage permissions'),
            ('🔔 Notifications', 'Customize alerts'),
            ('📊 Data & analytics', 'View your stats'),
          ].map((item) => Container(
            margin: const EdgeInsets.only(bottom: 8),
            padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 12),
            decoration: BoxDecoration(
              color: AppColors.card,
              borderRadius: BorderRadius.circular(12),
              border: Border.all(color: AppColors.border),
            ),
            child: Row(
              children: [
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(item.$1, style: const TextStyle(fontWeight: FontWeight.w600, fontSize: 14, color: AppColors.textDark)),
                      Text(item.$2, style: const TextStyle(fontSize: 12, color: AppColors.muted)),
                    ],
                  ),
                ),
                const Icon(Icons.chevron_right, color: AppColors.muted, size: 20),
              ],
            ),
          )),
          const SizedBox(height: 16),
          // Store button
          SizedBox(
            width: double.infinity,
            child: ElevatedButton.icon(
              onPressed: onOpenStore,
              icon: const Text('🪙', style: TextStyle(fontSize: 18)),
              label: Text(
                isPro ? 'Store — Buy Coins' : 'Store — Coins & Pro ⭐',
                style: const TextStyle(fontSize: 14, fontWeight: FontWeight.w700),
              ),
              style: ElevatedButton.styleFrom(
                backgroundColor: AppColors.purple,
                foregroundColor: Colors.white,
                padding: const EdgeInsets.symmetric(vertical: 14),
                shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
                elevation: 0,
              ),
            ),
          ),
          const SizedBox(height: 10),
          SizedBox(
            width: double.infinity,
            child: OutlinedButton(
              onPressed: onLogout,
              style: OutlinedButton.styleFrom(
                foregroundColor: AppColors.red,
                side: BorderSide(color: AppColors.red.withValues(alpha: 0.4)),
                backgroundColor: AppColors.redLight,
                padding: const EdgeInsets.symmetric(vertical: 14),
                shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
              ),
              child: const Text('Sign out', style: TextStyle(fontSize: 14, fontWeight: FontWeight.w700)),
            ),
          ),
        ],
      ),
    );
  }

  Widget _statCard(String icon, String value) => Expanded(
    child: Container(
      padding: const EdgeInsets.symmetric(vertical: 12),
      decoration: BoxDecoration(
        color: AppColors.card,
        borderRadius: BorderRadius.circular(12),
        border: Border.all(color: AppColors.border),
      ),
      child: Column(
        children: [
          Text(icon, style: const TextStyle(fontSize: 20)),
          const SizedBox(height: 4),
          Text(value, style: const TextStyle(fontSize: 15, fontWeight: FontWeight.w800, color: AppColors.textDark)),
        ],
      ),
    ),
  );

  String _fmt(int n) => n.toString().replaceAllMapped(RegExp(r'(\d{1,3})(?=(\d{3})+(?!\d))'), (m) => '${m[1]},');
}
