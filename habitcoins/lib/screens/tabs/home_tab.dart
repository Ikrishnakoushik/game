import 'package:flutter/material.dart';
import '../../data/models.dart';
import '../../theme/colors.dart';
import '../../widgets/avatar.dart';

class HomeTab extends StatelessWidget {
  final List<Karma> karmas;
  final int coins;
  final void Function(int id) onCheckin;

  const HomeTab({super.key, required this.karmas, required this.coins, required this.onCheckin});

  @override
  Widget build(BuildContext context) {
    return SafeArea(
      child: ListView(
        padding: const EdgeInsets.all(16),
        children: [
          // Coin balance card
          Container(
            padding: const EdgeInsets.all(20),
            decoration: BoxDecoration(
              gradient: const LinearGradient(
                colors: [AppColors.purple, AppColors.purpleDark],
                begin: Alignment.topLeft,
                end: Alignment.bottomRight,
              ),
              borderRadius: BorderRadius.circular(16),
            ),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                const Text('Your coins balance', style: TextStyle(color: Colors.white70, fontSize: 13)),
                const SizedBox(height: 6),
                Text(
                  '🪙 ${_fmt(coins)}',
                  style: const TextStyle(color: Colors.white, fontSize: 32, fontWeight: FontWeight.w800),
                ),
              ],
            ),
          ),
          const SizedBox(height: 20),
          const Text('ACTIVE CHALLENGES', style: TextStyle(fontSize: 11, fontWeight: FontWeight.w700, color: AppColors.muted, letterSpacing: 1)),
          const SizedBox(height: 10),
          ...karmas.map((h) => _KarmaCard(karma: h, onCheckin: onCheckin)),
        ],
      ),
    );
  }

  String _fmt(int n) => n.toString().replaceAllMapped(RegExp(r'(\d{1,3})(?=(\d{3})+(?!\d))'), (m) => '${m[1]},');
}

class _KarmaCard extends StatelessWidget {
  final Karma karma;
  final void Function(int) onCheckin;

  const _KarmaCard({required this.karma, required this.onCheckin});

  @override
  Widget build(BuildContext context) {
    final pct = karma.done / karma.days;
    final mode = karma.mode;

    final modeColor = mode == 'coins' ? AppColors.amberDark : mode == 'donate' ? AppColors.greenText : AppColors.purple;
    final modeBg = mode == 'coins' ? AppColors.amberLight : mode == 'donate' ? AppColors.greenLight : AppColors.purpleLight;
    final modeLabel = mode == 'coins' ? '🪙 Coins' : mode == 'donate' ? '💚 Donate' : '⭐ Pro';
    final barColor = mode == 'coins' ? AppColors.amber : mode == 'donate' ? AppColors.green : AppColors.purple;
    final rateLabel = mode == 'donate' ? '₹${karma.donateAmount}' : '+${karma.coinRate}';

    final avatarColors = [
      (bg: AppColors.purpleLight, text: AppColors.purple),
      (bg: AppColors.greenLight, text: AppColors.green),
      (bg: AppColors.amberLight, text: AppColors.amberDark),
      (bg: AppColors.tealLight, text: AppColors.teal),
    ];

    return Container(
      margin: const EdgeInsets.only(bottom: 12),
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: AppColors.card,
        borderRadius: BorderRadius.circular(16),
        border: Border.all(color: AppColors.border),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          // Mode pill
          Container(
            padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 3),
            decoration: BoxDecoration(color: modeBg, borderRadius: BorderRadius.circular(99)),
            child: Text(modeLabel, style: TextStyle(fontSize: 11, fontWeight: FontWeight.w600, color: modeColor)),
          ),
          const SizedBox(height: 10),
          Row(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(karma.name, style: const TextStyle(fontSize: 15, fontWeight: FontWeight.w700, color: AppColors.textDark)),
                    const SizedBox(height: 2),
                    Text('${karma.days}-day • ${karma.members.length} members', style: const TextStyle(fontSize: 12, color: AppColors.muted)),
                  ],
                ),
              ),
              Container(
                padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 3),
                decoration: BoxDecoration(color: modeBg, borderRadius: BorderRadius.circular(99)),
                child: Text(rateLabel, style: TextStyle(fontSize: 12, fontWeight: FontWeight.w600, color: modeColor)),
              ),
            ],
          ),
          const SizedBox(height: 12),
          // Progress bar
          ClipRRect(
            borderRadius: BorderRadius.circular(99),
            child: LinearProgressIndicator(
              value: pct,
              minHeight: 6,
              backgroundColor: AppColors.bg,
              valueColor: AlwaysStoppedAnimation<Color>(barColor),
            ),
          ),
          const SizedBox(height: 12),
          Row(
            children: [
              // Member avatars
              SizedBox(
                height: 22,
                child: Stack(
                  children: List.generate(
                    karma.members.length.clamp(0, 4),
                    (i) => Positioned(
                      left: i * 14.0,
                      child: Container(
                        decoration: BoxDecoration(shape: BoxShape.circle, border: Border.all(color: Colors.white, width: 1.5)),
                        child: AvatarWidget(
                          initials: karma.members[i].substring(0, 2).toUpperCase(),
                          size: 20,
                          color: avatarColors[i % 4].bg,
                          textColor: avatarColors[i % 4].text,
                        ),
                      ),
                    ),
                  ),
                ),
              ),
              SizedBox(width: karma.members.length.clamp(0, 4) * 14.0 + 8),
              Text('${karma.done}/${karma.days}', style: const TextStyle(fontSize: 12, color: AppColors.muted)),
              const Spacer(),
              // Check-in button
              GestureDetector(
                onTap: () => onCheckin(karma.id),
                child: Container(
                  padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
                  decoration: BoxDecoration(
                    color: karma.checkedToday ? AppColors.greenLight : AppColors.bg,
                    borderRadius: BorderRadius.circular(8),
                  ),
                  child: Text(
                    karma.checkedToday ? '✓ Done' : 'Check in',
                    style: TextStyle(
                      fontSize: 12,
                      fontWeight: FontWeight.w600,
                      color: karma.checkedToday ? AppColors.green : AppColors.textDark,
                    ),
                  ),
                ),
              ),
            ],
          ),
        ],
      ),
    );
  }
}
