import 'package:flutter/material.dart';
import '../../data/models.dart';
import '../../theme/colors.dart';
import '../../widgets/avatar.dart';

class LeaderboardTab extends StatelessWidget {
  const LeaderboardTab({super.key});

  @override
  Widget build(BuildContext context) {
    final medals = ['🥇', '🥈', '🥉', '4️⃣', '5️⃣'];

    return SafeArea(
      child: ListView(
        padding: const EdgeInsets.all(16),
        children: [
          const Text('GLOBAL LEADERBOARD', style: TextStyle(fontSize: 11, fontWeight: FontWeight.w700, color: AppColors.muted, letterSpacing: 1)),
          const SizedBox(height: 12),
          ...List.generate(leaderboard.length, (i) {
            final p = leaderboard[i];
            final isFirst = i == 0;
            return Container(
              margin: const EdgeInsets.only(bottom: 10),
              padding: const EdgeInsets.all(14),
              decoration: BoxDecoration(
                color: isFirst ? AppColors.purpleLight : AppColors.card,
                borderRadius: BorderRadius.circular(12),
                border: Border.all(color: isFirst ? AppColors.purple.withValues(alpha: 0.25) : AppColors.border),
              ),
              child: Row(
                children: [
                  Text(medals[i], style: const TextStyle(fontSize: 22)),
                  const SizedBox(width: 10),
                  AvatarWidget(initials: p.avatar, size: 36, color: p.color, textColor: p.textColor),
                  const SizedBox(width: 12),
                  Expanded(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text(p.name, style: const TextStyle(fontWeight: FontWeight.w700, fontSize: 14, color: AppColors.textDark)),
                        Text('🔥 ${p.streak} day streak', style: const TextStyle(fontSize: 12, color: AppColors.muted)),
                      ],
                    ),
                  ),
                  Text(
                    '🪙 ${_fmt(p.coins)}',
                    style: const TextStyle(fontWeight: FontWeight.w700, color: AppColors.purple, fontSize: 15),
                  ),
                ],
              ),
            );
          }),
        ],
      ),
    );
  }

  String _fmt(int n) => n.toString().replaceAllMapped(RegExp(r'(\d{1,3})(?=(\d{3})+(?!\d))'), (m) => '${m[1]},');
}
