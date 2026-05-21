import 'package:flutter/material.dart';
import '../../data/models.dart';
import '../../theme/colors.dart';

class RewardsTab extends StatelessWidget {
  final int coins;

  const RewardsTab({super.key, required this.coins});

  @override
  Widget build(BuildContext context) {
    return SafeArea(
      child: ListView(
        padding: const EdgeInsets.all(16),
        children: [
          // Balance card
          Container(
            padding: const EdgeInsets.all(16),
            decoration: BoxDecoration(
              color: AppColors.amberLight,
              borderRadius: BorderRadius.circular(12),
            ),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                const Text('Your balance', style: TextStyle(fontSize: 12, fontWeight: FontWeight.w600, color: AppColors.amberText)),
                const SizedBox(height: 4),
                Text('🪙 ${_fmt(coins)}', style: const TextStyle(fontSize: 26, fontWeight: FontWeight.w800, color: AppColors.amberText)),
              ],
            ),
          ),
          const SizedBox(height: 20),
          const Text('REDEEM REWARDS', style: TextStyle(fontSize: 11, fontWeight: FontWeight.w700, color: AppColors.muted, letterSpacing: 1)),
          const SizedBox(height: 10),
          ...rewards.map((r) {
            final canAfford = coins >= r.cost;
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
                  Text(r.icon, style: const TextStyle(fontSize: 28)),
                  const SizedBox(width: 12),
                  Expanded(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text(r.name, style: const TextStyle(fontWeight: FontWeight.w700, fontSize: 14, color: AppColors.textDark)),
                        Text(r.category, style: const TextStyle(fontSize: 12, color: AppColors.muted)),
                      ],
                    ),
                  ),
                  Container(
                    padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
                    decoration: BoxDecoration(
                      color: canAfford ? AppColors.purpleLight : AppColors.bg,
                      borderRadius: BorderRadius.circular(8),
                    ),
                    child: Text(
                      '🪙 ${r.cost}',
                      style: TextStyle(fontSize: 11, fontWeight: FontWeight.w600, color: canAfford ? AppColors.purple : AppColors.muted),
                    ),
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
